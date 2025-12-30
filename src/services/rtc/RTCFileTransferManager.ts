import { FileProgress } from "../p2pService";
import { eventBus, EVENTS } from "@/utils/events";

// Define types for File System Access API
interface FileSystemWritableFileStream extends WritableStream {
    write(data: any): Promise<void>;
    seek(position: number): Promise<void>;
    truncate(size: number): Promise<void>;
    close(): Promise<void>;
}

interface FileSystemFileHandle {
    createWritable(options?: any): Promise<FileSystemWritableFileStream>;
}

declare global {
    interface Window {
        showSaveFilePicker(options?: any): Promise<FileSystemFileHandle>;
    }
}

class RTCFileTransferManager {
    private chunks: Map<string, Uint8Array[]> = new Map();
    private fileStreams: Map<string, FileSystemWritableFileStream> = new Map();
    private metadata: Map<string, any[]> = new Map();
    private callbacks: Map<string, FileProgress> = new Map();
    private totalSizes: Map<string, number> = new Map();
    private sentSizes: Map<string, number> = new Map();
    private startTime: Map<string, number> = new Map();

    private static CHUNK_SIZE = 64 * 1024; // 64KB - Optimal for WebRTC SCTP
    private static BUFFER_LOW_THRESHOLD = 512 * 1024; // 512KB - Wait until buffer is almost empty
    private static BUFFER_HIGH_THRESHOLD = 12 * 1024 * 1024; // 12MB - Allow a larger pipe

    initializeSender(peerId: string, files: File[], callbacks: FileProgress): void {
        const totalSize = files.reduce((acc, file) => acc + file.size, 0);
        this.totalSizes.set(peerId, totalSize);
        // Reset sent sizes for fresh start unless specifically resuming
        this.sentSizes.set(peerId, 0);
        this.callbacks.set(peerId, callbacks);
        this.startTime.set(peerId, Date.now());
    }

    async initializeReceiver(peerId: string, files: any[]): Promise<void> {
        this.metadata.set(peerId, files);
        this.chunks.set(peerId, []);
        this.sentSizes.set(peerId, 0);
        const totalSize = files.reduce((acc, file) => acc + file.size, 0);

        if ('showSaveFilePicker' in window && files.length === 1) {
            try {
                const file = files[0];
                const handle = await window.showSaveFilePicker({
                    suggestedName: file.name,
                });
                const writable = await handle.createWritable();
                this.fileStreams.set(peerId, writable);
            } catch (err) {
                console.log('[RTC] Save picker cancelled or failed, falling back to memory');
            }
        }

        eventBus.emit(EVENTS.FILE_TRANSFER_START, { peerId, totalSize });
    }


    async sendFile(peerId: string, file: File, dataChannel: RTCDataChannel): Promise<void> {
        if (dataChannel.readyState !== 'open') {
            eventBus.emit(EVENTS.FILE_TRANSFER_ERROR, { peerId, message: 'Connection to peer lost' });
            throw new Error('Data channel not open');
        }

        const callbacks = this.callbacks.get(peerId);
        if (!callbacks) {
            throw new Error('No callbacks found for peer');
        }

        const totalSize = this.totalSizes.get(peerId) || 0;
        let sentSize = this.sentSizes.get(peerId) || 0;
        let offset = 0;

        // Configure the browser's "High-Speed" threshold
        dataChannel.bufferedAmountLowThreshold = RTCFileTransferManager.BUFFER_LOW_THRESHOLD;

        // Use a Promise-based waiter for the buffer to clear
        const waitForBufferLow = () => {
            return new Promise<void>((resolve, reject) => {
                if (dataChannel.bufferedAmount <= RTCFileTransferManager.BUFFER_LOW_THRESHOLD) {
                    resolve();
                    return;
                }

                const onLow = () => {
                    dataChannel.removeEventListener('bufferedamountlow', onLow);
                    resolve();
                };
                
                dataChannel.addEventListener('bufferedamountlow', onLow);
                
                // Safety timeout + state check
                setTimeout(() => {
                    dataChannel.removeEventListener('bufferedamountlow', onLow);
                    if (dataChannel.readyState !== 'open') reject(new Error('Connection lost'));
                    resolve(); 
                }, 5000);
            });
        };

        try {
            while (offset < file.size) {
                if (dataChannel.readyState !== 'open') throw new Error('Connection lost');

                // If memory buffer is full, wait for the network to catch up
                if (dataChannel.bufferedAmount > RTCFileTransferManager.BUFFER_HIGH_THRESHOLD) {
                    await waitForBufferLow();
                }

                const slice = file.slice(offset, offset + RTCFileTransferManager.CHUNK_SIZE);
                // Use modern Blob.arrayBuffer() - faster than FileReader
                const chunk = await slice.arrayBuffer();

                dataChannel.send(chunk);

                offset += chunk.byteLength;
                sentSize += chunk.byteLength;

                // Throttled UI & Meta updates (every 50 chunks = ~3MB)
                if (offset % (RTCFileTransferManager.CHUNK_SIZE * 50) === 0 || offset === file.size) {
                    const progress = Math.round((sentSize / totalSize) * 100);
                    const now = Date.now();
                    const start = this.startTime.get(peerId) || now;
                    const elapsed = (now - start) / 1000;
                    const speed = elapsed > 0 ? sentSize / elapsed : 0;

                    callbacks.onProgress(progress);
                    this.sentSizes.set(peerId, sentSize);
                    
                    eventBus.emit(EVENTS.TRANSFER_STATS_UPDATE, {
                        peerId, speed, progress, totalSize, sentSize
                    });
                }
            }

            dataChannel.send(JSON.stringify({
                type: 'file-complete',
                name: file.name
            }));
        } catch (error) {
            console.error('[RTC Turbo] Transfer failed:', error);
            eventBus.emit(EVENTS.FILE_TRANSFER_ERROR, { 
                peerId, 
                message: error instanceof Error ? error.message : 'Transfer failed unexpectedly' 
            });
            throw error;
        }
    }


    async addChunk(peerId: string, data: ArrayBuffer): Promise<void> {
        const stream = this.fileStreams.get(peerId);
        const chunks = this.chunks.get(peerId);
        const metadata = this.metadata.get(peerId);

        if (!metadata) return;

        if (stream) {
            try {
                await stream.write(data);
            } catch (err) {
                console.error('Error writing to stream:', err);
            }
        } else if (chunks) {
            chunks.push(new Uint8Array(data));
        } else {
            return;
        }

        const totalSize = metadata.reduce((acc, file) => acc + file.size, 0);
        let receivedSize = this.sentSizes.get(peerId) || 0;
        receivedSize += data.byteLength;
        this.sentSizes.set(peerId, receivedSize);

        if (!this.startTime.has(peerId)) {
            this.startTime.set(peerId, Date.now());
        }

        const now = Date.now();
        const start = this.startTime.get(peerId) || now;
        const elapsed = (now - start) / 1000;
        const speed = elapsed > 0 ? receivedSize / elapsed : 0;
        const progress = Math.round((receivedSize / totalSize) * 100);

        eventBus.emit(EVENTS.FILE_TRANSFER_PROGRESS, { peerId, progress, speed, receivedSize, totalSize });
    }

    async saveFile(peerId: string, fileName: string): Promise<void> {
        const stream = this.fileStreams.get(peerId);
        const chunks = this.chunks.get(peerId);
        const metadata = this.metadata.get(peerId);

        if (!metadata) return;

        if (stream) {
            try {
                await stream.close();
            } catch (err) {
                console.error('Error closing stream:', err);
            }
            this.fileStreams.delete(peerId);
        } else if (chunks) {
            const fileMetadata = metadata.find(file => file.name === fileName);

            const blob = new Blob(chunks as BlobPart[], {
                type: fileMetadata?.type || 'application/octet-stream'
            });

            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = fileName;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            this.chunks.set(peerId, []);
        }
    }

    cleanup(peerId: string): void {
        const stream = this.fileStreams.get(peerId);
        if (stream) {
            stream.close().catch(console.error);
            this.fileStreams.delete(peerId);
        }
        this.chunks.delete(peerId);
        this.metadata.delete(peerId);
        this.callbacks.delete(peerId);
        this.totalSizes.delete(peerId);
        this.sentSizes.delete(peerId);
        this.startTime.delete(peerId);
    }
}

export default RTCFileTransferManager;