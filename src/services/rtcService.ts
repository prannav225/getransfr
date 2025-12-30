import { FileProgress } from "./p2pService";
import { socket } from "./socket";
import RTCConnectionManager from "./rtc/RTCConnectionManager";
import RTCDataChannelManager from "./rtc/RTCDataChannelManager";
import RTCFileTransferManager from "./rtc/RTCFileTransferManager";
import { eventBus, EVENTS } from "@/utils/events";

export class RTCService {
    private connectionManager: RTCConnectionManager;
    private dataChannelManager: RTCDataChannelManager;
    private fileTransferManager: RTCFileTransferManager;
    private transferRequests: Map<string, { files: any[], callbacks: FileProgress }> = new Map();
    private candidateBuffer: Map<string, RTCIceCandidateInit[]> = new Map();

    constructor() {
        this.connectionManager = new RTCConnectionManager(socket);
        this.dataChannelManager = new RTCDataChannelManager();
        this.fileTransferManager = new RTCFileTransferManager();

        this.setupSocketListeners();
        this.setupEventBusListeners();
    }

    private setupSocketListeners(): void {
        socket.on('rtc-offer', async ({ from, offer }) => {
            console.log(`[RTCService] Received rtc-offer from: ${from}`);
            try {
                // If we already have a connection that is stable, we should allow the new offer to restart it
                // If we are in the middle of a handshake, creating a new peer connection will close the old one via ConnectionManager
                const peerConnection = this.connectionManager.createPeerConnection(from);

                peerConnection.ondatachannel = (event) => {
                    console.log(`[RTCService] Received data channel from peer: ${from}`);
                    const dataChannel = event.channel;
                    this.setupDataChannel(from, dataChannel);
                };

                // A new PeerConnection is always in 'stable' state. 
                // We should proceed with setRemoteDescription if state is 'stable' or if it's a valid re-negotiation state.
                if (peerConnection.signalingState === 'stable') {
                    await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
                    await this.applyBufferedCandidates(from);

                    const answer = await peerConnection.createAnswer();
                    await peerConnection.setLocalDescription(answer);

                    socket.emit('rtc-answer', { to: from, answer });
                } else {
                    console.warn(`[RTC] Offer ignored: state is ${peerConnection.signalingState} for ${from}`);
                }
            } catch (error) {
                console.error('[RTCService] Error handling RTC offer:', error);
            }
        });

        socket.on('rtc-answer', async ({ from, answer }) => {
            console.log(`[RTCService] Received rtc-answer from: ${from}`);
            try {
                const peerConnection = this.connectionManager.getPeerConnection(from);
                if (peerConnection) {
                    if (peerConnection.signalingState === 'have-local-offer') {
                        await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
                        await this.applyBufferedCandidates(from);
                    }
                }
            } catch (error) {
                console.error('[RTCService] Error handling RTC answer:', error);
            }
        });

        socket.on('rtc-ice-candidate', async ({ from, candidate }) => {
            try {
                const peerConnection = this.connectionManager.getPeerConnection(from);
                // ICE candidates can only be added AFTER setRemoteDescription
                if (peerConnection && peerConnection.remoteDescription) {
                    await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
                } else {
                    console.log(`[RTCService] Buffering ICE candidate for peer: ${from}`);
                    if (!this.candidateBuffer.has(from)) {
                        this.candidateBuffer.set(from, []);
                    }
                    this.candidateBuffer.get(from)!.push(candidate);
                }
            } catch (error) {
                console.error('[RTCService] Error adding ICE candidate:', error);
            }
        });
    }

    private async applyBufferedCandidates(peerId: string): Promise<void> {
        const candidates = this.candidateBuffer.get(peerId);
        if (candidates) {
            console.log(`[RTCService] Applying ${candidates.length} buffered candidates for peer: ${peerId}`);
            const peerConnection = this.connectionManager.getPeerConnection(peerId);
            if (peerConnection) {
                for (const candidate of candidates) {
                    try {
                        await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
                    } catch (e) {
                        console.error('[RTCService] Error applying buffered candidate:', e);
                    }
                }
            }
            this.candidateBuffer.delete(peerId);
        }
    }

    private setupEventBusListeners(): void {
        eventBus.on(EVENTS.TRANSFER_CANCEL, ({ peerId }) => {
            this.cancelTransfer(peerId);
        });
    }

    private setupDataChannel(peerId: string, dataChannel: RTCDataChannel): void {
        console.log(`[RTCService] Setting up data channel for peer: ${peerId}`);
        dataChannel.binaryType = 'arraybuffer';
        this.dataChannelManager.addDataChannel(peerId, dataChannel);

        dataChannel.onopen = () => {
            const pendingTransfer = this.transferRequests.get(peerId);
            if (pendingTransfer) {
                try {
                    dataChannel.send(JSON.stringify({
                        type: 'metadata',
                        files: pendingTransfer.files.map(f => ({ name: f.name, size: f.size, type: f.type }))
                    }));
                } catch (err) {
                    console.error('[RTC] Failed to send metadata:', err);
                }
            }
        };

        dataChannel.onclose = () => {
            console.log(`[RTCService] Data channel CLOSED for peer: ${peerId}`);
            this.cleanupPeer(peerId);
        };

        dataChannel.onerror = (error) => {
            console.error(`[RTCService] Data channel ERROR for peer: ${peerId}`, error);
            this.cleanupPeer(peerId);
        };

        dataChannel.onmessage = (event) => {
            this.handleDataChannelMessage(peerId, event);
        };
    }

    private handleDataChannelMessage(peerId: string, event: MessageEvent): void {
        if (typeof event.data === 'string') {
            try {
                const message = JSON.parse(event.data);
                console.log('[RTCService] Received data channel msg:', message.type, 'from:', peerId);

                switch (message.type) {
                    case 'metadata':
                        this.handleMetadataMessage(peerId, message.files);
                        break;
                    case 'file-complete':
                        this.fileTransferManager.saveFile(peerId, message.name);
                        break;
                    case 'accept':
                        this.handleTransferAccepted(peerId);
                        break;
                    case 'decline':
                        this.handleTransferDeclined(peerId);
                        break;
                    case 'cancel':
                        this.handleTransferCancelled(peerId);
                        break;
                }
            } catch (error) {
                console.error('[RTCService] Error parsing message from peer:', peerId, error);
            }
        } else {
            this.fileTransferManager.addChunk(peerId, event.data);
        }
    }

    private async handleMetadataMessage(peerId: string, files: any[]): Promise<void> {
        console.log(`[RTCService] Receiver: Received metadata from ${peerId}`, files);
        
        // Stabilization delay to ensure UI is ready and animations are done
        await new Promise(resolve => setTimeout(resolve, 300));

        let handled = false;
        const accepted = await new Promise<boolean>(resolve => {
            eventBus.emit(EVENTS.FILE_TRANSFER_REQUEST, {
                peerId,
                files,
                handleAccept: () => {
                    if (handled) return;
                    handled = true;
                    resolve(true);
                },
                handleDecline: () => {
                    if (handled) return;
                    handled = true;
                    resolve(false);
                }
            });

            // Extended timeout for user response (2 minutes)
            setTimeout(() => {
                if (!handled) {
                    console.log('[RTCService] Transfer request timed out');
                    handled = true;
                    resolve(false);
                }
            }, 120000);
        });

        const dataChannel = this.dataChannelManager.getDataChannel(peerId);
        if (!dataChannel || dataChannel.readyState !== 'open') {
            console.error('[RTCService] Connection dropped before user selection for:', peerId);
            return;
        }

        if (accepted) {
            console.log('[RTCService] User accepted. Initializing transmission...');
            await this.fileTransferManager.initializeReceiver(peerId, files);
            dataChannel.send(JSON.stringify({ type: 'accept' }));
        } else {
            console.log('[RTCService] User declined or timeout.');
            dataChannel.send(JSON.stringify({ type: 'decline' }));
            this.cleanupPeer(peerId);
        }
    }

    private handleTransferAccepted(peerId: string): void {
        console.log('[RTCService] Sender: Remote peer accepted transfer:', peerId);
        const pendingTransfer = this.transferRequests.get(peerId);
        if (pendingTransfer) {
            this.startFileTransfer(peerId, pendingTransfer.files, pendingTransfer.callbacks);
            this.transferRequests.delete(peerId);
        }
    }

    private handleTransferDeclined(peerId: string): void {
        console.log('[RTCService] Sender: Remote peer declined transfer:', peerId);
        const pendingTransfer = this.transferRequests.get(peerId);
        if (pendingTransfer) {
            pendingTransfer.callbacks.onCancel();
            this.transferRequests.delete(peerId);
        }
        this.cleanupPeer(peerId);
    }

    private handleTransferCancelled(peerId: string): void {
        console.log('[RTCService] Transfer cancelled by peer:', peerId);
        const pendingTransfer = this.transferRequests.get(peerId);
        if (pendingTransfer) {
            pendingTransfer.callbacks.onCancel();
            this.transferRequests.delete(peerId);
        }
        this.cleanupPeer(peerId);
    }

    private async startFileTransfer(peerId: string, files: File[], callbacks: FileProgress): Promise<void> {
        try {
            const dataChannel = this.dataChannelManager.getDataChannel(peerId);
            if (!dataChannel) {
                throw new Error('No data channel available');
            }

            console.log('[RTCService] Sender: Beginning transmission to:', peerId);
            this.fileTransferManager.initializeSender(peerId, files, callbacks);

            for (const file of files) {
                await this.fileTransferManager.sendFile(peerId, file, dataChannel);
            }

            console.log('[RTCService] Sender: Transmission complete for:', peerId);
            callbacks.onComplete();
        } catch (error) {
            console.error('[RTCService] Error during file transfer:', error);
            callbacks.onError(error as Error);
            this.cleanupPeer(peerId);
        }
    }

    async sendFiles(peerId: string, files: File[], callbacks: FileProgress): Promise<() => void> {
        console.log(`[RTCService] Initiating transfer to peer: ${peerId}`);
        try {
            const peerConnection = this.connectionManager.createPeerConnection(peerId);

            const dataChannel = peerConnection.createDataChannel('fileTransfer', {
                ordered: true,
                maxRetransmits: 30
            });

            this.setupDataChannel(peerId, dataChannel);

            const offer = await peerConnection.createOffer();
            await peerConnection.setLocalDescription(offer);

            socket.emit('rtc-offer', { to: peerId, offer });

            this.transferRequests.set(peerId, { files, callbacks });

            return () => this.cancelTransfer(peerId);
        } catch (error) {
            console.error('[RTCService] Error initiating transfer:', error);
            callbacks.onError(error as Error);
            return () => { };
        }
    }

    private cancelTransfer(peerId: string): void {
        console.log(`[RTCService] Explicit cancel to peer: ${peerId}`);
        const dataChannel = this.dataChannelManager.getDataChannel(peerId);
        if (dataChannel && dataChannel.readyState === 'open') {
            dataChannel.send(JSON.stringify({ type: 'cancel' }));
        }

        const pendingTransfer = this.transferRequests.get(peerId);
        if (pendingTransfer) {
            pendingTransfer.callbacks.onCancel();
            this.transferRequests.delete(peerId);
        }

        this.cleanupPeer(peerId);
    }

    private cleanupPeer(peerId: string): void {
        this.connectionManager.closePeerConnection(peerId);
        this.dataChannelManager.closeDataChannel(peerId);
        this.fileTransferManager.cleanup(peerId);
    }
}

export default new RTCService();