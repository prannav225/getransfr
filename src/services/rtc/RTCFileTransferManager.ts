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
        showDirectoryPicker(options?: any): Promise<FileSystemDirectoryHandle>;
    }
}

interface FileSystemGetFileOptions {
    create?: boolean;
}

interface FileSystemDirectoryHandle {
    kind: 'directory';
    name: string;
    getFileHandle(name: string, options?: FileSystemGetFileOptions): Promise<FileSystemFileHandle>;
    getDirectoryHandle(name: string, options?: FileSystemGetFileOptions): Promise<FileSystemDirectoryHandle>;
}

/**
 * Ensures async operations (like file writes) are executed strictly in order.
 * This is CRITICAL for preventing file corruption during high-speed P2P transfers.
 */
class SequentialTaskQueue {
    private queue: Promise<void> = Promise.resolve();

    async push(task: () => Promise<void>): Promise<void> {
        this.queue = this.queue.then(async () => {
            try {
                await task();
            } catch (e) {
                console.error('[TaskQueue] Operation failed:', e);
            }
        });
        return this.queue;
    }
}

class RTCFileTransferManager {
    private chunks: Map<string, Uint8Array[]> = new Map();
    private fileStreams: Map<string, FileSystemWritableFileStream> = new Map();
    private metadata: Map<string, any[]> = new Map();
    private callbacks: Map<string, FileProgress> = new Map();
    private totalSizes: Map<string, number> = new Map();
    private static CHUNK_SIZE = 64 * 1024; 
    private static BUFFER_HIGH_THRESHOLD = 8 * 1024 * 1024; // 8MB
    private sentSizes: Map<string, number> = new Map();
    private startTime: Map<string, number> = new Map();
    private dirHandles: Map<string, FileSystemDirectoryHandle> = new Map();
    private senderFiles: Map<string, File[]> = new Map();
    private currentFileIndices: Map<string, number> = new Map();
    private taskQueues: Map<string, SequentialTaskQueue> = new Map();

    private getFileId(file: { name: string, size: number }): string {
        return `${file.name}-${file.size}`;
    }

    public getTransferProgress(peerId: string): number {
        return this.sentSizes.get(peerId) || 0;
    }

    private worker: Worker | null = null;

    initializeSender(peerId: string, files: File[], callbacks: FileProgress): void {
        console.log(`[RTC] Initializing sender for ${peerId} with ${files.length} files`);
        const totalSize = files.reduce((acc, file) => acc + file.size, 0);
        this.totalSizes.set(peerId, totalSize);
        this.sentSizes.set(peerId, 0);
        this.callbacks.set(peerId, callbacks);
        this.startTime.set(peerId, Date.now());
        this.senderFiles.set(peerId, files);

        if (!this.worker) {
            this.worker = new Worker(new URL('./TransferWorker.ts', import.meta.url), { type: 'module' });
        }
    }

    async initializeReceiver(peerId: string, files: any[], fileSystemHandle?: any): Promise<void> {
        console.log(`[RTC] Initializing receiver for ${peerId}`);
        this.chunks.set(peerId, []);
        this.sentSizes.set(peerId, 0);
        this.currentFileIndices.set(peerId, 0);
        this.metadata.set(peerId, files);

        const totalSize = files.reduce((acc, file) => acc + file.size, 0);
        this.totalSizes.set(peerId, totalSize);

        if (fileSystemHandle) {
             try {
                if (files.length === 1 && fileSystemHandle.kind === 'file') {
                    const writable = await fileSystemHandle.createWritable();
                    this.fileStreams.set(peerId, writable);
                    console.log('[RTC] Using direct File Handle');
                } else if (files.length > 1 && fileSystemHandle.kind === 'directory') {
                    this.dirHandles.set(peerId, fileSystemHandle);
                    console.log('[RTC] Using Directory Handle for batch');
                }
             } catch (err) {
                 console.error('[RTC] Failed to bind FileSystemHandle:', err);
             }
        }
        
        eventBus.emit(EVENTS.FILE_TRANSFER_START, { peerId, totalSize });
    }

    async sendFile(peerId: string, file: File, dataChannel: RTCDataChannel, startingOffset: number = 0, fileIndex?: number): Promise<void> {
        return this.sendMesh([peerId], file, { [peerId]: dataChannel }, startingOffset, fileIndex);
    }

    async sendMesh(peerIds: string[], file: File, channels: Record<string, RTCDataChannel>, startingOffset: number = 0, fileIndex?: number): Promise<void> {
        const fileId = this.getFileId(file);
        const offset = peerIds.length === 1 ? startingOffset : 0;

        if (!this.worker) {
            this.worker = new Worker(new URL('./TransferWorker.ts', import.meta.url), { type: 'module' });
        }

        let lastUiUpdate = 0;
        const UI_UPDATE_INTERVAL = 100;

        return new Promise((resolve, reject) => {
            const cleanupWorker = () => {
                if (this.worker) this.worker.onmessage = null;
            };

            if (!this.worker) return reject('Worker init failed');

            // Listen for chunks from worker
            const messageHandler = async (e: MessageEvent) => {
                const { type, chunk, offset: currentFileOffset, totalSize: currentFileSize } = e.data;

                if (type === 'chunk') {
                    const sendPromises = Object.entries(channels).map(async ([pid, dc]) => {
                        if (dc.readyState !== 'open') return;

                        // Backpressure: If buffer is full, wait for it to drain
                        if (dc.bufferedAmount > RTCFileTransferManager.BUFFER_HIGH_THRESHOLD) {
                            await new Promise<void>((res) => {
                                const onLow = () => {
                                    dc.removeEventListener('bufferedamountlow', onLow);
                                    res();
                                };
                                dc.addEventListener('bufferedamountlow', onLow);
                                // Safety timeout if event fails to fire
                                setTimeout(res, 5000);
                            });
                        }

                        try {
                            dc.send(chunk);
                        } catch (err) {
                            console.error(`[RTC Mesh] Send failed to ${pid}`, err);
                        }
                    });

                    await Promise.all(sendPromises);
                    
                    const now = Date.now();
                    if (now - lastUiUpdate > UI_UPDATE_INTERVAL || currentFileOffset >= currentFileSize) {
                        peerIds.forEach(pid => {
                            const cb = this.callbacks.get(pid);
                            const grandTotal = Math.max(1, this.totalSizes.get(pid) || currentFileSize);
                            const files = this.senderFiles.get(pid);
                            
                            // Calculate cumulative sent bytes accurately
                            let cumulativeSent = currentFileOffset + chunk.byteLength;
                            if (files) {
                                const index = (fileIndex !== undefined) ? fileIndex : files.indexOf(file);
                                if (index > 0) {
                                    const prevBytes = files.slice(0, index).reduce((acc, f) => acc + f.size, 0);
                                    cumulativeSent += prevBytes;
                                }
                            }

                            this.sentSizes.set(pid, cumulativeSent);
                            const progress = Math.min(100, Math.round((cumulativeSent / grandTotal) * 100));
                            const start = this.startTime.get(pid) || now;
                            const speed = (cumulativeSent / (Math.max(1, now - start) / 1000));
                            
                            if (cb) cb.onProgress(progress);
                            eventBus.emit(EVENTS.TRANSFER_STATS_UPDATE, {
                                peerId: pid, speed, progress, totalSize: grandTotal, sentSize: cumulativeSent 
                            });
                        });
                        lastUiUpdate = now;
                    }

                    // Request next chunk
                    this.worker?.postMessage({ type: 'next' });
                } else if (type === 'complete') {
                    this.worker?.removeEventListener('message', messageHandler);
                    peerIds.forEach(pid => {
                        const dc = channels[pid];
                        if (dc.readyState === 'open') {
                             dc.send(JSON.stringify({ type: 'file-complete', name: file.name, fileId }));
                        }
                    });
                    resolve();
                } else if (type === 'error') {
                    this.worker?.removeEventListener('message', messageHandler);
                    reject(e.data.error);
                }
            };

            this.worker.addEventListener('message', messageHandler);

            this.worker.postMessage({
                type: 'start-read',
                file,
                offset,
                chunkSize: RTCFileTransferManager.CHUNK_SIZE
            });
        });
    }

    async addChunk(peerId: string, data: ArrayBuffer): Promise<void> {
        let queue = this.taskQueues.get(peerId);
        if (!queue) {
            queue = new SequentialTaskQueue();
            this.taskQueues.set(peerId, queue);
        }

        queue.push(async () => {
            const metadata = this.metadata.get(peerId);
            if (!metadata) return;

            let stream = this.fileStreams.get(peerId);
            let currentIdx = this.currentFileIndices.get(peerId) || 0;

            // Auto-open logic for directory streaming
            if (!stream && this.dirHandles.has(peerId)) {
                const dirHandle = this.dirHandles.get(peerId)!;
                const nextFile = metadata[currentIdx];
                if (nextFile) {
                    try {
                        const fileHandle = await dirHandle.getFileHandle(nextFile.name, { create: true });
                        stream = await fileHandle.createWritable();
                        this.fileStreams.set(peerId, stream);
                    } catch (e) {
                        console.error('[RTC] Auto-open failed:', e);
                    }
                }
            }

            const receivedSizeBefore = this.sentSizes.get(peerId) || 0;
            
            // Write to disk OR store in memory
            if (stream) {
                try {
                    await stream.write(data);
                } catch (err) {
                    console.error('Write error:', err);
                }
            } else {
                let chunks = this.chunks.get(peerId);
                if (!chunks) {
                    chunks = [];
                    this.chunks.set(peerId, chunks);
                }
                chunks.push(new Uint8Array(data));
            }

            const totalSize = Math.max(1, this.totalSizes.get(peerId) || 1);
            const receivedSize = receivedSizeBefore + data.byteLength;
            this.sentSizes.set(peerId, receivedSize);

            // Shift index when current file is predicted to be full
            let currentAccum = 0;
            for(let i=0; i <= currentIdx; i++) currentAccum += metadata[i].size;
            
            if (receivedSize >= currentAccum && currentIdx < metadata.length - 1) {
                this.currentFileIndices.set(peerId, currentIdx + 1);
            }

            if (!this.startTime.has(peerId)) this.startTime.set(peerId, Date.now());
            const now = Date.now();
            const elapsed = (now - (this.startTime.get(peerId) || now)) / 1000;
            const speed = elapsed > 0 ? receivedSize / elapsed : 0;
            const progress = Math.min(100, Math.round((receivedSize / totalSize) * 100));

            eventBus.emit(EVENTS.FILE_TRANSFER_PROGRESS, { 
                peerId, progress, speed, 
                receivedSize: Math.min(receivedSize, totalSize), 
                totalSize 
            });
        });
    }

    async saveFile(peerId: string, fileName: string, _fileId?: string): Promise<void> {
        const queue = this.taskQueues.get(peerId);
        if (!queue) return;

        await queue.push(async () => {
            console.log(`[RTC] Saving/Closing file: ${fileName}`);
            const stream = this.fileStreams.get(peerId);
            const metadata = this.metadata.get(peerId);

            if (!metadata) return;

            if (stream) {
                try {
                    await stream.close();
                    console.log(`[RTC] Stream closed successfully for ${fileName}`);
                } catch (err) {
                    console.error('Close error:', err);
                }
                this.fileStreams.delete(peerId);
            } else {
                const chunks = this.chunks.get(peerId);
                if (chunks && chunks.length > 0) {
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
        });
    }

    cleanup(peerId: string): void {
        console.log(`[RTC] Cleaning up peer: ${peerId}`);
        const stream = this.fileStreams.get(peerId);
        if (stream) {
            stream.close().catch(() => {});
            this.fileStreams.delete(peerId);
        }
        this.chunks.delete(peerId);
        this.metadata.delete(peerId);
        this.callbacks.delete(peerId);
        this.totalSizes.delete(peerId);
        this.sentSizes.delete(peerId);
        this.startTime.delete(peerId);
        this.taskQueues.delete(peerId);
        this.currentFileIndices.delete(peerId);
        this.dirHandles.delete(peerId);
    }
}

export default RTCFileTransferManager;