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

// Checkpoint interface
interface TransferCheckpoint {
    peerId: string;
    receivedSize: number;
    totalSize: number;
    timestamp: number;
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

class RTCFileTransferManager {
    private chunks: Map<string, Uint8Array[]> = new Map();
    private fileStreams: Map<string, FileSystemWritableFileStream> = new Map();
    private metadata: Map<string, any[]> = new Map();
    private callbacks: Map<string, FileProgress> = new Map();
    private totalSizes: Map<string, number> = new Map();
    private static CHUNK_SIZE = 64 * 1024; // 64KB - Optimal for WebRTC SCTP
    private static BUFFER_HIGH_THRESHOLD = 12 * 1024 * 1024; // 12MB - Allow a larger pipe
    private sentSizes: Map<string, number> = new Map();
    private startTime: Map<string, number> = new Map();
    private dirHandles: Map<string, FileSystemDirectoryHandle> = new Map();
    private senderFiles: Map<string, File[]> = new Map();
    private currentFileIndices: Map<string, number> = new Map();

    // Track partial transfers for resume capability
    // Map<fileId, { receivedSize, chunks }>
    // Track partial transfers for resume capability
    // Map<fileId, TransferCheckpoint>
    private resumeState: Map<string, TransferCheckpoint> = new Map();

    private getFileId(file: { name: string, size: number }): string {
        return `${file.name}-${file.size}`;
    }

    public getTransferProgress(peerId: string): number {
        return this.sentSizes.get(peerId) || 0;
    }

    private worker: Worker | null = null;

    initializeSender(peerId: string, files: File[], callbacks: FileProgress): void {
        const totalSize = files.reduce((acc, file) => acc + file.size, 0);
        this.totalSizes.set(peerId, totalSize);
        // Reset sent sizes for fresh start unless specifically resuming
        this.sentSizes.set(peerId, 0);
        this.callbacks.set(peerId, callbacks);
        this.startTime.set(peerId, Date.now());
        this.senderFiles.set(peerId, files);

        if (!this.worker) {
            this.worker = new Worker(new URL('./TransferWorker.ts', import.meta.url), { type: 'module' });
        }
    }

    async initializeReceiver(peerId: string, files: any[], fileSystemHandle?: any): Promise<void> {
        this.chunks.set(peerId, []);
        this.sentSizes.set(peerId, 0);
        this.currentFileIndices.set(peerId, 0);
        this.metadata.set(peerId, files);

        const totalSize = files.reduce((acc, file) => acc + file.size, 0);
        this.totalSizes.set(peerId, totalSize);

        // Usage of provided File System Handle (from UI User Gesture)
        if (fileSystemHandle) {
             try {
                if (files.length === 1 && fileSystemHandle.kind === 'file') {
                    // Single File
                    const writable = await fileSystemHandle.createWritable();
                    this.fileStreams.set(peerId, writable);
                    console.log('[RTC] Using provided File Handle for single file');
                } else if (files.length > 1 && fileSystemHandle.kind === 'directory') {
                    // Directory / Batch
                    this.dirHandles.set(peerId, fileSystemHandle);
                    
                    // Open first file
                    const firstFile = files[0];
                    const fileHandle = await fileSystemHandle.getFileHandle(firstFile.name, { create: true });
                    const writable = await fileHandle.createWritable();
                    this.fileStreams.set(peerId, writable);
                     console.log('[RTC] Using provided Directory Handle for batch');
                }
             } catch (err) {
                 console.error('[RTC] Failed to use provided FileSystemHandle:', err);
             }
        }
        
        eventBus.emit(EVENTS.FILE_TRANSFER_START, { peerId, totalSize });
    }



    async sendFile(peerId: string, file: File, dataChannel: RTCDataChannel, startingOffset: number = 0, fileIndex?: number): Promise<void> {
        return this.sendMesh([peerId], file, { [peerId]: dataChannel }, startingOffset, fileIndex);
    }

    async sendMesh(peerIds: string[], file: File, channels: Record<string, RTCDataChannel>, startingOffset: number = 0, fileIndex?: number): Promise<void> {
        const fileId = this.getFileId(file);
        
        // 1. Resume Check (sending offset logic)
        // For mesh with multiple peers, we default to 0 to ensure everyone gets the file.
        // For single-peer mesh (common case), we respect the requested offset.
        const offset = peerIds.length === 1 ? startingOffset : 0;

        // 2. Worker-Powered Reading
        if (!this.worker) {
            this.worker = new Worker(new URL('./TransferWorker.ts', import.meta.url), { type: 'module' });
        }

        let lastUiUpdate = 0;
        const UI_UPDATE_INTERVAL = 150;

        return new Promise((resolve, reject) => {
            const cleanupWorker = () => {
                if (this.worker) this.worker.onmessage = null;
            };

            if (!this.worker) return reject('Worker init failed');

            this.worker.onmessage = async (e) => {
                const { type, chunk, offset: currentFileOffset, totalSize: currentFileSize } = e.data;

                if (type === 'chunk') {
                    // BROADCAST: One read, Multi-send
                    const sendPromises = Object.entries(channels).map(async ([pid, dc]) => {
                        if (dc.readyState !== 'open') return;

                        // Backpressure: Wait for this peer's specific buffer
                        if (dc.bufferedAmount > RTCFileTransferManager.BUFFER_HIGH_THRESHOLD) {
                            await new Promise<void>((res) => {
                                const onLow = () => {
                                    dc.removeEventListener('bufferedamountlow', onLow);
                                    res();
                                };
                                dc.addEventListener('bufferedamountlow', onLow);
                                setTimeout(res, 10000);
                            });
                        }

                        try {
                            dc.send(chunk);
                        } catch (err) {
                            console.error(`[RTC Mesh] Send failed to ${pid}`, err);
                        }
                    });

                    await Promise.all(sendPromises);
                    
                    // Stats & UI
                    const now = Date.now();
                    if (now - lastUiUpdate > UI_UPDATE_INTERVAL || currentFileOffset >= currentFileSize) {
                        peerIds.forEach(pid => {
                            const cb = this.callbacks.get(pid);
                            
                            // Calculate cumulative progress
                            const grandTotal = this.totalSizes.get(pid) || currentFileSize;
                            const files = this.senderFiles.get(pid);
                            let cumulativeSent = currentFileOffset;
                            
                            if (files) {
                                // Robust Index Resolution: Use explicit fileIndex if provided, otherwise fallback to reference check
                                const index = (fileIndex !== undefined) ? fileIndex : files.indexOf(file);
                                
                                if (index > 0) {
                                    const prevBytes = files.slice(0, index).reduce((acc, f) => acc + f.size, 0);
                                    cumulativeSent += prevBytes;
                                }
                            }

                            this.sentSizes.set(pid, cumulativeSent);
                            
                            const progress = Math.round((cumulativeSent / grandTotal) * 100);
                            const start = this.startTime.get(pid) || now;
                            const speed = (cumulativeSent / ((now - start) / 1000));
                            
                            const safeProgress = progress > 100 ? 100 : progress;
                            
                            if (cb) cb.onProgress(safeProgress);
                            eventBus.emit(EVENTS.TRANSFER_STATS_UPDATE, {
                                peerId: pid, 
                                speed, 
                                progress: safeProgress, 
                                totalSize: grandTotal, 
                                sentSize: cumulativeSent 
                            });
                        });
                        lastUiUpdate = now;
                    }

                    // Tell worker we are ready for next chunk
                    this.worker?.postMessage({ type: 'next' });
                } else if (type === 'complete') {
                    cleanupWorker();
                    peerIds.forEach(pid => {
                        const dc = channels[pid];
                        if (dc.readyState === 'open') {
                             dc.send(JSON.stringify({ type: 'file-complete', name: file.name, fileId }));
                        }
                    });
                    resolve();
                } else if (type === 'error') {
                    cleanupWorker();
                    reject(e.data.error);
                }
            };

            // Start the worker loop
            this.worker.postMessage({
                type: 'start-read',
                file,
                offset,
                chunkSize: RTCFileTransferManager.CHUNK_SIZE
            });
        });
    }


    async addChunk(peerId: string, data: ArrayBuffer): Promise<void> {
        const stream = this.fileStreams.get(peerId);
        const chunks = this.chunks.get(peerId);
        const metadata = this.metadata.get(peerId);

        if (!metadata) return;

        // Populate resumeState for checkpointing
        const receivedSizeBefore = this.sentSizes.get(peerId) || 0;


        
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

        const totalSize = this.totalSizes.get(peerId) || metadata.reduce((acc, file) => acc + file.size, 0);
        const receivedSize = receivedSizeBefore + data.byteLength;
        this.sentSizes.set(peerId, receivedSize);

        // Check for file boundary crossing
        const nextFileIndex = metadata.findIndex(f => {
             // Calculate cumulative size up to this file
             let accum = 0;
             for(let i=0; i<metadata.indexOf(f)+1; i++) accum += metadata[i].size;
             return receivedSize < accum;
        });

        // Loop handling: if nextFileIndex is -1, we are at the last file or done
        const targetIndex = nextFileIndex === -1 ? metadata.length - 1 : nextFileIndex;
        
        const storedIndex = this.currentFileIndices.get(peerId) || 0;

        if (targetIndex > storedIndex && this.dirHandles.has(peerId)) {
            // WE CROSSED A BOUNDARY!
            const dirHandle = this.dirHandles.get(peerId)!;
            
            // 1. Close current stream
            if (stream) {
                try { await stream.close(); } catch(e) { console.error('Error closing stream', e); }
            }

            // 2. Open new stream
            const nextFile = metadata[targetIndex];
            try {
                console.log(`[RTC] Switching stream to next file: ${nextFile.name}`);
                const fileHandle = await dirHandle.getFileHandle(nextFile.name, { create: true });
                const writable = await fileHandle.createWritable();
                this.fileStreams.set(peerId, writable);
            } catch(e) {
                console.error('Error opening next file stream', e);
            }
            this.currentFileIndices.set(peerId, targetIndex);
        } else if (targetIndex > storedIndex) {
             this.currentFileIndices.set(peerId, targetIndex);
        }

        // Persistent update: Save periodically to Disk for true persistence
        // We update the session state. In a real app, this would write to IndexedDB.
        if (receivedSize % (RTCFileTransferManager.CHUNK_SIZE * 50) === 0) {
           this.resumeState.set(peerId, { 
               peerId,
               receivedSize, 
               totalSize,
               timestamp: Date.now()
           });
        }

        if (!this.startTime.has(peerId)) {
            this.startTime.set(peerId, Date.now());
        }

        const now = Date.now();
        const start = this.startTime.get(peerId) || now;
        const elapsed = (now - start) / 1000;
        const speed = elapsed > 0 ? receivedSize / elapsed : 0;
        const rawProgress = Math.round((receivedSize / totalSize) * 100);
        const progress = rawProgress > 100 ? 100 : rawProgress;

        eventBus.emit(EVENTS.FILE_TRANSFER_PROGRESS, { 
            peerId, 
            progress: progress, 
            speed, 
            receivedSize: receivedSize > totalSize ? totalSize : receivedSize, 
            totalSize 
        });
    }

    async saveFile(peerId: string, fileName: string, fileId?: string): Promise<void> {
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
            if (fileId) {
                this.resumeState.delete(fileId);
                // Resume cleared
            }
        }
    }



    cleanup(peerId: string): void {
        const stream = this.fileStreams.get(peerId);
        if (stream) {
            stream.close().catch(console.error);
            this.fileStreams.delete(peerId);
        }
        // Don't fully delete chunks if we want resume, but for now we follow simple logic
        this.chunks.delete(peerId);
        this.metadata.delete(peerId);
        this.callbacks.delete(peerId);
        this.totalSizes.delete(peerId);
        this.sentSizes.delete(peerId);
        this.startTime.delete(peerId);
    }
}

export default RTCFileTransferManager;