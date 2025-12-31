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
    private meshSessions: Map<string, {
        peerIds: string[];
        readyPeers: Set<string>;
        files: File[];
        callbacks: FileProgress;
        channels: Record<string, RTCDataChannel>;
    }> = new Map();

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
                // Try to reuse existing connection for ICE Restart / Re-negotiation
                let peerConnection = this.connectionManager.getPeerConnection(from);
                
                if (!peerConnection) {
                     console.log('[RTCService] New session, creating PeerConnection');
                     peerConnection = this.connectionManager.createPeerConnection(from);
                     
                     peerConnection.ondatachannel = (event) => {
                        console.log(`[RTCService] Received data channel from peer: ${from}`);
                        const dataChannel = event.channel;
                        this.setupDataChannel(from, dataChannel);
                    };
                } else {
                    console.log('[RTCService] Reusing existing PeerConnection for offer (Restart/Renegotiation)');
                }

                // Glare Handling / Perfect Negotiation Pattern
                const isStable = !peerConnection || peerConnection.signalingState === 'stable' || (peerConnection.signalingState === 'have-local-offer' && !peerConnection.remoteDescription);
                const offerCollision = (offer.type === 'offer') && !isStable;

                const ignoreOffer =  offerCollision && socket.id && (socket.id > from);
                if (ignoreOffer) {
                    console.log(`[RTCService] Glare detected. I am the impolite peer (${socket.id} > ${from}). Ignoring their offer.`);
                    return;
                }

                if (offerCollision) {
                     console.log(`[RTCService] Glare detected. I am the polite peer. Rolling back.`);
                     // If we are "have-local-offer", we need to rollback to accept theirs
                     // Note: 'rollback' support varies, but this is the standard pattern
                     if (peerConnection.signalingState !== 'stable') {
                        try {
                            await peerConnection.setLocalDescription({ type: 'rollback' });
                        } catch(e) { console.warn("Rollback failed, might need renegotiation restart", e); }
                    }
                }
                
                // If we don't have a PC yet (race condition?), check again? 
                // We created it above, so we are good.

                await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
                await this.applyBufferedCandidates(from);

                // Only answer if we are stable now (which we should be after SRD)
                if (peerConnection.signalingState === 'have-remote-offer') {
                    const answer = await peerConnection.createAnswer();
                    await peerConnection.setLocalDescription(answer);
                    socket.emit('rtc-answer', { to: from, answer });
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
                        this.fileTransferManager.saveFile(peerId, message.name, message.fileId);
                        break;

                    case 'accept':
                        this.handleTransferAccepted(peerId, message.offset);
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
        // Define result type locally for clarity
        type AcceptanceResult = { accepted: boolean, handle?: any };

        const result = await new Promise<AcceptanceResult>(resolve => {
            eventBus.emit(EVENTS.FILE_TRANSFER_REQUEST, {
                peerId,
                files,
                handleAccept: (handle?: any) => {
                    if (handled) return;
                    handled = true;
                    resolve({ accepted: true, handle });
                },
                handleDecline: () => {
                    if (handled) return;
                    handled = true;
                    resolve({ accepted: false });
                }
            });

            // Extended timeout for user response (2 minutes)
            setTimeout(() => {
                if (!handled) {
                    console.log('[RTCService] Transfer request timed out');
                    handled = true;
                    resolve({ accepted: false });
                }
            }, 120000);
        });

        const dataChannel = this.dataChannelManager.getDataChannel(peerId);
        if (!dataChannel || dataChannel.readyState !== 'open') {
            console.error('[RTCService] Connection dropped before user selection for:', peerId);
            return;
        }

        if (result.accepted) {
            console.log('[RTCService] User accepted. Initializing transmission...');
            await this.fileTransferManager.initializeReceiver(peerId, files, result.handle);
            const currentOffset = this.fileTransferManager.getTransferProgress(peerId);
            dataChannel.send(JSON.stringify({ type: 'accept', offset: currentOffset }));
        } else {
            console.log('[RTCService] User declined or timeout.');
            dataChannel.send(JSON.stringify({ type: 'decline' }));
            this.cleanupPeer(peerId);
        }
    }

    private handleTransferAccepted(peerId: string, offset: number = 0): void {
        console.log('[RTCService] Sender: Remote peer accepted transfer:', peerId, 'Resume Offset:', offset);
        
        // Find if this is part of a mesh session
        let sessionToStart: any = null;
        for (const [sessionId, session] of this.meshSessions.entries()) {
            // ... Mesh logic ...
            if (session.peerIds.includes(peerId)) {
                session.readyPeers.add(peerId);
                const dc = this.dataChannelManager.getDataChannel(peerId);
                if (dc) session.channels[peerId] = dc;

                if (session.readyPeers.size === session.peerIds.length) {
                    sessionToStart = { ...session, sessionId };
                }
                break;
            }
        }

        if (sessionToStart) {
            this.meshSessions.delete(sessionToStart.sessionId);
            // Mesh doesn't support individual offsets efficiently yet, so we default to 0
            this.startMeshTransfer(sessionToStart.peerIds, sessionToStart.files, sessionToStart.callbacks, sessionToStart.channels);
        } else {
            // Check legacy single transfer
            const pendingTransfer = this.transferRequests.get(peerId);
            if (pendingTransfer) {
                this.startFileTransfer(peerId, pendingTransfer.files, pendingTransfer.callbacks, offset);
                this.transferRequests.delete(peerId);
            }
        }
    }

    private async startMeshTransfer(peerIds: string[], files: File[], callbacks: FileProgress, channels: Record<string, RTCDataChannel>): Promise<void> {
        try {
            console.log(`[RTCService] Coordinated Mesh Start for: ${peerIds.join(', ')}`);
            
            // Initialize all senders
            peerIds.forEach(pid => this.fileTransferManager.initializeSender(pid, files, callbacks));

            for (const file of files) {
                await this.fileTransferManager.sendMesh(peerIds, file, channels);
            }

            console.log('[RTCService] Mesh transmit complete');
            callbacks.onComplete();
        } catch (error) {
            console.error('[RTCService] Mesh transfer failed:', error);
            callbacks.onError(error as Error);
            peerIds.forEach(pid => this.cleanupPeer(pid));
        }
    }

    private handleTransferDeclined(peerId: string): void {
        console.log('[RTCService] Sender: Remote peer declined transfer:', peerId);
        
        // Remove from any mesh sessions
        this.removeFromMeshSessions(peerId);

        const pendingTransfer = this.transferRequests.get(peerId);
        if (pendingTransfer) {
            pendingTransfer.callbacks.onCancel();
            this.transferRequests.delete(peerId);
        }
        this.cleanupPeer(peerId);
    }

    private removeFromMeshSessions(peerId: string): void {
        for (const [sessionId, session] of this.meshSessions.entries()) {
            if (session.peerIds.includes(peerId)) {
                session.peerIds = session.peerIds.filter(id => id !== peerId);
                
                // If the remaining peers are all ready, start it
                if (session.peerIds.length > 0 && session.readyPeers.size === session.peerIds.length) {
                    this.meshSessions.delete(sessionId);
                    this.startMeshTransfer(session.peerIds, session.files, session.callbacks, session.channels);
                } else if (session.peerIds.length === 0) {
                    this.meshSessions.delete(sessionId);
                }
                break;
            }
        }
    }

    private handleTransferCancelled(peerId: string): void {
        console.log('[RTCService] Transfer cancelled by peer:', peerId);
        this.removeFromMeshSessions(peerId);
        const pendingTransfer = this.transferRequests.get(peerId);
        if (pendingTransfer) {
            pendingTransfer.callbacks.onCancel();
            this.transferRequests.delete(peerId);
        }
        this.cleanupPeer(peerId);
    }

    private async startFileTransfer(peerId: string, files: File[], callbacks: FileProgress, startingOffset: number = 0): Promise<void> {
        try {
            const dataChannel = this.dataChannelManager.getDataChannel(peerId);
            if (!dataChannel) {
                throw new Error('No data channel available');
            }

            console.log('[RTCService] Sender: Beginning transmission to:', peerId);
            this.fileTransferManager.initializeSender(peerId, files, callbacks);

            let currentOffset = startingOffset;
            let index = 0;

            for (const file of files) {
                if (currentOffset >= file.size) {
                    console.log(`[RTCService] Skipping ${file.name} (already sent)`);
                    currentOffset -= file.size;
                    index++;
                    continue;
                }
                
                // Pass the index to ensure robust progress calculation
                await this.fileTransferManager.sendFile(peerId, file, dataChannel, currentOffset, index);
                
                currentOffset = 0; // Reset offset for subsequent files
                index++;
            }

            console.log('[RTCService] Sender: Transmission complete for:', peerId);
            callbacks.onComplete();
        } catch (error) {
            console.error('[RTCService] Error during file transfer:', error);
            callbacks.onError(error as Error);
            this.cleanupPeer(peerId);
        }
    }

    async sendFiles(peerIds: string[], files: File[], callbacks: FileProgress): Promise<() => void> {
        console.log(`[RTCService] Initiating mesh request to peers: ${peerIds.join(', ')}`);
        const cancels: (() => void)[] = [];
        const sessionId = Math.random().toString(36).substring(7);

        // Track the mesh session
        this.meshSessions.set(sessionId, {
            peerIds,
            readyPeers: new Set(),
            files,
            callbacks,
            channels: {}
        });

        for (const peerId of peerIds) {
            try {
                const peerConnection = this.connectionManager.createPeerConnection(peerId);
                const dataChannel = peerConnection.createDataChannel('fileTransfer', {
                    ordered: true,
                    maxRetransmits: 30
                });

                this.setupDataChannel(peerId, dataChannel);

                // Negotiation is handled automatically via onnegotiationneeded in ConnectionManager
                
                // For direct file-transfer requests we still need to know what files were asked
                this.transferRequests.set(peerId, { files, callbacks });
                cancels.push(() => this.cancelTransfer(peerId));
            } catch (error) {
                console.error(`[RTCService] Error initiating transfer to ${peerId}:`, error);
                // Remove from mesh if failed to even start
                const session = this.meshSessions.get(sessionId);
                if (session) {
                    session.peerIds = session.peerIds.filter(id => id !== peerId);
                }
            }
        }

        return () => cancels.forEach(cancel => cancel());
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