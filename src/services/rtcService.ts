/* eslint-disable @typescript-eslint/no-explicit-any */
import { FileProgress } from "./p2pService";
import { socket } from "./socket";
import RTCConnectionManager from "./rtc/RTCConnectionManager";
import RTCDataChannelManager from "./rtc/RTCDataChannelManager";
import RTCFileTransferManager from "./rtc/RTCFileTransferManager";

export class RTCService {
    private connectionManager: RTCConnectionManager;
    private dataChannelManager: RTCDataChannelManager;
    private fileTransferManager: RTCFileTransferManager;
    private transferRequests: Map<string, { files: any[], callbacks: FileProgress }> = new Map();

    constructor() {
        this.connectionManager = new RTCConnectionManager(socket);
        this.dataChannelManager = new RTCDataChannelManager();
        this.fileTransferManager = new RTCFileTransferManager();

        this.setupSocketListeners();
        this.setupWindowListeners();
    }

    private setupSocketListeners(): void {
        socket.on('rtc-offer', async ({ from, offer }) => {
            try {
                const peerConnection = this.connectionManager.createPeerConnection(from);

                peerConnection.ondatachannel = (event) => {
                    const dataChannel = event.channel;
                    this.setupDataChannel(from, dataChannel);
                };

                await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
                const answer = await peerConnection.createAnswer();
                await peerConnection.setLocalDescription(answer);

                socket.emit('rtc-answer', { to: from, answer });
            } catch (error) {
                console.error('Error handling RTC offer:', error);
            }
        });

        socket.on('rtc-answer', async ({ from, answer }) => {
            try {
                const peerConnection = this.connectionManager.getPeerConnection(from);
                if (peerConnection) {
                    await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
                }
            } catch (error) {
                console.error('Error handling RTC answer:', error);
            }
        });

        socket.on('rtc-ice-candidate', async ({ from, candidate }) => {
            try {
                const peerConnection = this.connectionManager.getPeerConnection(from);
                if (peerConnection) {
                    await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
                }
            } catch (error) {
                console.error('Error adding ICE candidate:', error);
            }
        });
    }

    private setupWindowListeners(): void {
        window.addEventListener('file-transfer-cancel', ((event: CustomEvent) => {
            const { peerId } = event.detail;
            this.cancelTransfer(peerId);
        }) as EventListener);
    }

    private setupDataChannel(peerId: string, dataChannel: RTCDataChannel): void {
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
                    console.error('Failed to send metadata:', err);
                }
            }
        };

        dataChannel.onclose = () => {
            this.cleanupPeer(peerId);
        };

        dataChannel.onerror = (error) => {
            console.error('Data channel error:', error);
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
                console.error('Error parsing message:', error);
            }
        } else {
            this.fileTransferManager.addChunk(peerId, event.data);
        }
    }

    private async handleMetadataMessage(peerId: string, files: any[]): Promise<void> {
        const accepted = await new Promise<boolean>(resolve => {
            const event = new CustomEvent('file-transfer-request', {
                detail: {
                    peerId,
                    files,
                    accept: () => resolve(true),
                    decline: () => resolve(false)
                }
            });
            window.dispatchEvent(event);
        });

        const dataChannel = this.dataChannelManager.getDataChannel(peerId);
        if (!dataChannel) {
            return;
        }

        if (accepted) {
            await this.fileTransferManager.initializeReceiver(peerId, files);
            dataChannel.send(JSON.stringify({ type: 'accept' }));
        } else {
            dataChannel.send(JSON.stringify({ type: 'decline' }));
            this.cleanupPeer(peerId);
        }
    }

    private handleTransferAccepted(peerId: string): void {
        const pendingTransfer = this.transferRequests.get(peerId);
        if (pendingTransfer) {
            this.startFileTransfer(peerId, pendingTransfer.files, pendingTransfer.callbacks);
            this.transferRequests.delete(peerId);
        }
    }

    private handleTransferDeclined(peerId: string): void {
        const pendingTransfer = this.transferRequests.get(peerId);
        if (pendingTransfer) {
            pendingTransfer.callbacks.onCancel();
            this.transferRequests.delete(peerId);
        }
        this.cleanupPeer(peerId);
    }

    private handleTransferCancelled(peerId: string): void {
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

            this.fileTransferManager.initializeSender(peerId, files, callbacks);

            for (const file of files) {
                await this.fileTransferManager.sendFile(peerId, file, dataChannel);
            }

            callbacks.onComplete();
        } catch (error) {
            console.error('Error during file transfer:', error);
            callbacks.onError(error as Error);
            this.cleanupPeer(peerId);
        }
    }

    async sendFiles(peerId: string, files: File[], callbacks: FileProgress): Promise<() => void> {
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
            console.error('Error initiating file transfer:', error);
            callbacks.onError(error as Error);
            return () => { };
        }
    }

    private cancelTransfer(peerId: string): void {
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