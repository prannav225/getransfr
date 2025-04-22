/* eslint-disable @typescript-eslint/no-explicit-any */
import { FileProgress } from "./p2pService";
import { socket } from "./socket";

export class RTCService {
    private peerConnections: Map<string, RTCPeerConnection> = new Map();
    private dataChannels: Map<string, RTCDataChannel> = new Map();
    private chunks: Map<string, Uint8Array[]> = new Map();
    private metadata: Map<string, any> = new Map();

    constructor() {
        socket.on('rtc-offer', async ({ from, offer }) => {
            const peerConnection = this.createPeerConnection(from);
            await peerConnection.setRemoteDescription(offer);
            const answer = await peerConnection.createAnswer();
            await peerConnection.setLocalDescription(answer);
            socket.emit('rtc-answer', { to: from, answer });
        });

        socket.on('rtc-answer', async ({ from, answer }) => {
            const peerConnection = this.peerConnections.get(from);
            if (peerConnection) {
                await peerConnection.setRemoteDescription(answer);
            }
        });

        socket.on('rtc-ice-candidate', async ({ from, candidate }) => {
            const peerConnection = this.peerConnections.get(from);
            if (peerConnection) {
                await peerConnection.addIceCandidate(candidate);
            }
        });
        window.addEventListener('file-transfer-cancel', ((e: CustomEvent) => {
            const { peerId } = e.detail;
            const dataChannel = this.dataChannels.get(peerId);
            if (dataChannel) {
                dataChannel.send(JSON.stringify({ type: 'cancel' }));
                this.destroy(peerId);
            }
        }) as EventListener);
    }

    private createPeerConnection(peerId: string): RTCPeerConnection {
        const peerConnection = new RTCPeerConnection({
            iceServers: [
                { urls: 'stun:stun.l.google.com:19302' },
                { urls: 'stun:global.stun.twilio.com:3478' }
            ]
        });

        peerConnection.onicecandidate = (event) => {
            if (event.candidate) {
                socket.emit('rtc-ice-candidate', {
                    to: peerId,
                    candidate: event.candidate
                });
            }
        };

        peerConnection.ondatachannel = (event) => {
            const dataChannel = event.channel;
            this.setupDataChannel(peerId, dataChannel);
            this.dataChannels.set(peerId, dataChannel);
        };

        this.peerConnections.set(peerId, peerConnection);
        return peerConnection;
    }

    private setupDataChannel(peerId: string, dataChannel: RTCDataChannel) {
        dataChannel.binaryType = 'arraybuffer';
        let totalSize = 0;
        let receivedSize = 0;
        let currentProgress = 0;

        dataChannel.onmessage = async (event) => {
            if (typeof event.data === 'string') {
                const message = JSON.parse(event.data);
                if (message.type === 'metadata') {
                    // Dispatch event for transfer request
                    const accepted = await new Promise<boolean>(resolve => {
                        window.dispatchEvent(new CustomEvent('file-transfer-request', {
                            detail: {
                                peerId,
                                files: message.files,
                                accept: () => resolve(true),
                                decline: () => resolve(false)
                            }
                        }));
                    });

                    if (accepted) {
                        this.metadata.set(peerId, message.files);
                        this.chunks.set(peerId, []);
                        totalSize = message.files.reduce((acc: number, file: any) => acc + file.size, 0);
                        window.dispatchEvent(new CustomEvent('file-transfer-start', {
                            detail: { peerId, totalSize }
                        }));
                        // Send acceptance
                        dataChannel.send(JSON.stringify({ type: 'accept' }));
                    } else {
                        dataChannel.send(JSON.stringify({ type: 'decline' }));
                        this.destroy(peerId);
                        return;
                    }
                } else if (message.type === 'file-complete') {
                    this.saveReceivedFile(peerId, message.name);
                } else if (message.type === 'cancel') {
                    // Notify UI about cancellation
                    window.dispatchEvent(new CustomEvent('file-transfer-cancelled', {
                        detail: { peerId }
                    }));
                    // Clean up connection
                    this.destroy(peerId);
                }
            } else {
                const chunks = this.chunks.get(peerId);
                if (chunks) {
                    const chunk = new Uint8Array(event.data);
                    chunks.push(chunk);
                    receivedSize += chunk.byteLength;

                    // Update progress
                    const newProgress = Math.round((receivedSize / totalSize) * 100);
                    if (newProgress !== currentProgress) {
                        currentProgress = newProgress;
                        window.dispatchEvent(new CustomEvent('file-transfer-progress', {
                            detail: { peerId, progress: currentProgress }
                        }));
                    }
                }
            }
        };

        // Add error and close handlers
        dataChannel.onerror = () => {
            window.dispatchEvent(new CustomEvent('file-transfer-cancelled', {
                detail: { peerId }
            }));
            this.destroy(peerId);
        };

        dataChannel.onclose = () => {
            window.dispatchEvent(new CustomEvent('file-transfer-cancelled', {
                detail: { peerId }
            }));
            this.destroy(peerId);
        };
    }

    async sendFiles(peerId: string, files: File[], callbacks: FileProgress): Promise<() => void> {
        await this.initiateTransfer(peerId);
        const dataChannel = this.dataChannels.get(peerId);
        if (!dataChannel) throw new Error('No data channel established');

        // Wait for data channel to open
        if (dataChannel.readyState !== 'open') {
            await new Promise<void>((resolve, reject) => {
                const timeout = setTimeout(() => reject(new Error('Connection timeout')), 10000);
                dataChannel.onopen = () => {
                    clearTimeout(timeout);
                    resolve();
                };
            });
        }

        const cancel = () => {
            try {
                dataChannel.send(JSON.stringify({ type: 'cancel' }));
            } catch (e) {
                console.error('Error sending cancel message:', e);
            }
            this.destroy(peerId);
            callbacks.onCancel();
        };

        const totalSize = files.reduce((acc, file) => acc + file.size, 0);
        let sentSize = 0;

        try {
            // Send metadata and wait for acceptance
            dataChannel.send(JSON.stringify({
                type: 'metadata',
                files: files.map(f => ({ name: f.name, size: f.size, type: f.type }))
            }));

            const accepted = await new Promise<boolean>((resolve, reject) => {
                const timeout = setTimeout(() => reject(new Error('Request timeout')), 30000);

                const handler = (event: MessageEvent) => {
                    const message = JSON.parse(event.data);
                    if (message.type === 'accept') {
                        clearTimeout(timeout);
                        resolve(true);
                    } else if (message.type === 'decline') {
                        clearTimeout(timeout);
                        resolve(false);
                    }
                };

                dataChannel.addEventListener('message', handler);
            });

            if (!accepted) {
                throw new Error('Transfer declined');
            }

            for (const file of files) {
                const buffer = await file.arrayBuffer();
                const chunkSize = 16384;
                const chunks = Math.ceil(buffer.byteLength / chunkSize);

                for (let i = 0; i < chunks; i++) {
                    const chunk = buffer.slice(i * chunkSize, (i + 1) * chunkSize);
                    dataChannel.send(chunk);

                    sentSize += chunk.byteLength;
                    callbacks.onProgress(Math.round((sentSize / totalSize) * 100));
                    await new Promise(resolve => setTimeout(resolve, 50));
                }

                dataChannel.send(JSON.stringify({
                    type: 'file-complete',
                    name: file.name
                }));
            }

            callbacks.onComplete();
        } catch (error) {
            window.dispatchEvent(new CustomEvent('file-transfer-error', {
                detail: { message: 'File transfer failed. Please try again.' }
            }));
            callbacks.onError(error as Error);
            this.destroy(peerId);
            return () => { };
        }

        return cancel; // Return the cancel function instead of destroy
    }

    private saveReceivedFile(peerId: string, fileName: string) {
        const chunks = this.chunks.get(peerId);
        const metadata = this.metadata.get(peerId);

        if (!chunks || !metadata) return;

        const blob = new Blob(chunks, {
            type: metadata[0]?.type || 'application/octet-stream'
        });

        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        this.chunks.delete(peerId);
    }

    async initiateTransfer(peerId: string): Promise<void> {
        const peerConnection = this.createPeerConnection(peerId);
        const dataChannel = peerConnection.createDataChannel('fileTransfer');
        this.setupDataChannel(peerId, dataChannel);
        this.dataChannels.set(peerId, dataChannel);

        const offer = await peerConnection.createOffer();
        await peerConnection.setLocalDescription(offer);
        socket.emit('rtc-offer', { to: peerId, offer });
    }

    destroy(peerId: string) {
        const dataChannel = this.dataChannels.get(peerId);
        const peerConnection = this.peerConnections.get(peerId);

        dataChannel?.close();
        peerConnection?.close();

        this.dataChannels.delete(peerId);
        this.peerConnections.delete(peerId);
        this.chunks.delete(peerId);
        this.metadata.delete(peerId);
    }
}

export const rtcService = new RTCService();