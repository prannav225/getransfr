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
    private chunks: Map<string, Map<string, Uint8Array[]>> = new Map();
    private fileStreams: Map<string, FileSystemWritableFileStream> = new Map();
    private metadata: Map<string, any[]> = new Map();
    private callbacks: Map<string, FileProgress> = new Map();
    private totalSizes: Map<string, number> = new Map();
    private sentSizes: Map<string, number> = new Map();
    private startTime: Map<string, number> = new Map();
    private dirHandles: Map<string, FileSystemDirectoryHandle> = new Map();
    private senderFiles: Map<string, File[]> = new Map();
    private currentFileIndices: Map<string, number> = new Map();
    private taskQueues: Map<string, SequentialTaskQueue> = new Map();

    private static CHUNK_SIZE = 128 * 1024; // 128KB chunks
    private static BUFFER_HIGH_THRESHOLD = 16 * 1024 * 1024; // 16MB threshold

    private getFileId(file: { name: string, size: number }): string {
        return `${file.name}-${file.size}`;
    }

    public getTransferProgress(peerId: string): number {
        return this.sentSizes.get(peerId) || 0;
    }

    private worker: Worker | null = null;

    initializeSender(peerId: string, files: File[], callbacks: FileProgress): void {
        const totalSize = files.reduce((acc, f) => acc + f.size, 0);
        this.totalSizes.set(peerId, totalSize);
        this.sentSizes.set(peerId, 0);
        this.callbacks.set(peerId, callbacks);
        this.startTime.set(peerId, Date.now());
        this.senderFiles.set(peerId, files);
    }

    async initializeReceiver(peerId: string, files: any[], fileSystemHandle?: any): Promise<void> {
        console.log(`[RTC] Receiver setup for ${peerId}, Batch: ${files.length} files`);
        this.chunks.set(peerId, new Map());
        this.sentSizes.set(peerId, 0);
        this.currentFileIndices.set(peerId, 0);
        this.metadata.set(peerId, files);

        const totalSize = files.reduce((acc, f) => acc + f.size, 0);
        this.totalSizes.set(peerId, totalSize);

        if (fileSystemHandle) {
             try {
                if (files.length === 1 && fileSystemHandle.kind === 'file') {
                    const writable = await fileSystemHandle.createWritable();
                    this.fileStreams.set(peerId, writable);
                } else if (files.length > 1 && fileSystemHandle.kind === 'directory') {
                    this.dirHandles.set(peerId, fileSystemHandle);
                }
             } catch (err) {
                 console.error('[RTC] FileSystemHandle init failed:', err);
             }
        }
        eventBus.emit(EVENTS.FILE_TRANSFER_START, { peerId, totalSize });
    }

    async sendFile(peerId: string, file: File, dataChannel: RTCDataChannel, startingOffset: number = 0, fileIndex?: number): Promise<void> {
        return this.sendMesh([peerId], file, { [peerId]: dataChannel }, startingOffset, fileIndex);
    }

    async sendMesh(peerIds: string[], file: File, channels: Record<string, RTCDataChannel>, startingOffset: number = 0, fileIndex?: number): Promise<void> {
        const fileId = this.getFileId(file);
        
        // Terminate old worker to prevent interleaved chunk leaks during batch switching
        if (this.worker) this.worker.terminate();
        this.worker = new Worker(new URL('./TransferWorker.ts', import.meta.url), { type: 'module' });

        return new Promise((resolve, reject) => {
            if (!this.worker) return reject('Worker creation failed');

            let lastUiUpdate = 0;
            const UI_UPDATE_INTERVAL = 100;

            const onMsg = async (e: MessageEvent) => {
                const { type, chunk, offset: currentFileOffset, totalSize: currentFileSize } = e.data;

                if (type === 'chunk') {
                    const sendPromises = Object.entries(channels).map(async ([pid, dc]) => {
                        if (dc.readyState !== 'open') return;

                        if (dc.bufferedAmount > RTCFileTransferManager.BUFFER_HIGH_THRESHOLD) {
                            await new Promise<void>(res => {
                                const onLow = () => {
                                    dc.removeEventListener('bufferedamountlow', onLow);
                                    res();
                                };
                                dc.addEventListener('bufferedamountlow', onLow);
                                setTimeout(res, 3000); // 3s safety timeout
                            });
                        }

                        try {
                            dc.send(chunk);
                        } catch (err) {
                            console.error(`[RTC] send fail to ${pid}:`, err);
                        }
                    });

                    await Promise.all(sendPromises);
                    
                    const now = Date.now();
                    if (now - lastUiUpdate > UI_UPDATE_INTERVAL || currentFileOffset + chunk.byteLength >= currentFileSize) {
                        peerIds.forEach(pid => {
                            const cb = this.callbacks.get(pid);
                            const grandTotal = Math.max(1, this.totalSizes.get(pid) || currentFileSize);
                            const files = this.senderFiles.get(pid);
                            
                            let bytesSentBatch = currentFileOffset + chunk.byteLength;
                            if (files) {
                                const idx = (fileIndex !== undefined) ? fileIndex : files.indexOf(file);
                                if (idx > 0) {
                                    const prevBytes = files.slice(0, idx).reduce((sum, f) => sum + f.size, 0);
                                    bytesSentBatch += prevBytes;
                                }
                            }

                            this.sentSizes.set(pid, bytesSentBatch);
                            const progress = Math.min(100, Math.round((bytesSentBatch / grandTotal) * 100));
                            const start = this.startTime.get(pid) || now;
                            const speed = (bytesSentBatch / (Math.max(1, (now - start)) / 1000));
                            
                            if (cb) cb.onProgress(progress);
                            eventBus.emit(EVENTS.TRANSFER_STATS_UPDATE, {
                                peerId: pid, speed, progress, totalSize: grandTotal, sentSize: bytesSentBatch 
                            });
                        });
                        lastUiUpdate = now;
                    }

                    this.worker?.postMessage({ type: 'next' });
                } else if (type === 'complete') {
                    this.worker?.removeEventListener('message', onMsg);
                    peerIds.forEach(pid => {
                        const dc = channels[pid];
                        if (dc.readyState === 'open') {
                             dc.send(JSON.stringify({ type: 'file-complete', name: file.name, fileId }));
                        }
                    });
                    resolve();
                } else if (type === 'error') {
                    this.worker?.removeEventListener('message', onMsg);
                    reject(e.data.error);
                }
            };

            this.worker.addEventListener('message', onMsg);
            this.worker.postMessage({
                type: 'start',
                file,
                offset: startingOffset,
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

            const currentIdx = this.currentFileIndices.get(peerId) || 0;
            const currentFileMetadata = metadata[currentIdx];
            if (!currentFileMetadata) return;

            let stream = this.fileStreams.get(peerId);

            // Lazy open for directory handle mode
            if (!stream && this.dirHandles.has(peerId)) {
                const dirHandle = this.dirHandles.get(peerId)!;
                try {
                    const handle = await dirHandle.getFileHandle(currentFileMetadata.name, { create: true });
                    stream = await handle.createWritable();
                    this.fileStreams.set(peerId, stream);
                    console.log(`[RTC] Opened stream for ${currentFileMetadata.name}`);
                } catch (e) {
                    console.error('[RTC] Auto-open failed:', e);
                }
            }

            const prevBatchSize = this.sentSizes.get(peerId) || 0;
            
            if (stream) {
                try {
                    await stream.write(data);
                } catch (err) {
                    console.error('File Write Error:', err);
                }
            } else {
                const peerMap = this.chunks.get(peerId);
                if (peerMap) {
                    let fileChunks = peerMap.get(currentFileMetadata.name);
                    if (!fileChunks) {
                        fileChunks = [];
                        peerMap.set(currentFileMetadata.name, fileChunks);
                    }
                    fileChunks.push(new Uint8Array(data));
                }
            }

            const totalBatchSize = Math.max(1, this.totalSizes.get(peerId) || 1);
            const updatedBatchSize = prevBatchSize + data.byteLength;
            this.sentSizes.set(peerId, updatedBatchSize);

            if (!this.startTime.has(peerId)) this.startTime.set(peerId, Date.now());
            const now = Date.now();
            const elapsed = (now - (this.startTime.get(peerId) || now)) / 1000;
            const speed = elapsed > 0 ? updatedBatchSize / elapsed : 0;
            const progress = Math.min(100, Math.round((updatedBatchSize / totalBatchSize) * 100));

            eventBus.emit(EVENTS.FILE_TRANSFER_PROGRESS, { 
                peerId, progress, speed, 
                receivedSize: Math.min(updatedBatchSize, totalBatchSize), 
                totalSize: totalBatchSize 
            });
        });
    }

    async saveFile(peerId: string, fileName: string, _fileId?: string): Promise<void> {
        const queue = this.taskQueues.get(peerId);
        if (!queue) return;

        await queue.push(async () => {
             console.log(`[RTC] Saving file: ${fileName}`);
            const stream = this.fileStreams.get(peerId);
            const metadata = this.metadata.get(peerId);
            if (!metadata) return;

            if (stream) {
                try {
                    await stream.close();
                } catch (err) {
                    console.error('Stream close fail:', err);
                }
                this.fileStreams.delete(peerId);
            } else {
                const peerMap = this.chunks.get(peerId);
                const fileChunks = peerMap?.get(fileName);
                
                if (fileChunks && fileChunks.length > 0) {
                    const fileMeta = metadata.find(m => m.name === fileName);
                    const blob = new Blob(fileChunks as BlobPart[], {
                        type: fileMeta?.type || 'application/octet-stream'
                    });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = fileName;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                    peerMap?.delete(fileName);
                }
            }

            // Move to NEXT file index ONLY after previous file is fully saved
            const idx = this.currentFileIndices.get(peerId) || 0;
            if (idx < metadata.length - 1) {
                this.currentFileIndices.set(peerId, idx + 1);
            }
        });
    }

    cleanup(peerId: string): void {
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