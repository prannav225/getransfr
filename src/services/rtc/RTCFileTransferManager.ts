import { FileProgress } from "../p2pService";
import { eventBus, EVENTS } from "@/utils/events";
import { storageManager } from "@/utils/StorageManager";

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
    private currentFileIndices: Map<string, number> = new Map();

    // Track partial transfers for resume capability
    // Map<fileId, { receivedSize, chunks }>
    private resumeState: Map<string, { receivedSize: number, chunks: Uint8Array[] }> = new Map();

    private getFileId(file: { name: string, size: number }): string {
        return `${file.name}-${file.size}`;
    }

    private worker: Worker | null = null;

    initializeSender(peerId: string, files: File[], callbacks: FileProgress): void {
        const totalSize = files.reduce((acc, file) => acc + file.size, 0);
        this.totalSizes.set(peerId, totalSize);
        // Reset sent sizes for fresh start unless specifically resuming
        this.sentSizes.set(peerId, 0);
        this.callbacks.set(peerId, callbacks);
        this.startTime.set(peerId, Date.now());

        if (!this.worker) {
            this.worker = new Worker(new URL('./TransferWorker.ts', import.meta.url), { type: 'module' });
        }
    }

    async initializeReceiver(peerId: string, files: any[]): Promise<void> {
        // We will update the metadata with resolved names after conflict resolution
        const resolvedFiles = [...files]; 
        
        this.chunks.set(peerId, []);
        this.sentSizes.set(peerId, 0);
        this.currentFileIndices.set(peerId, 0);

        const totalSize = files.reduce((acc, file) => acc + file.size, 0);

        // Try to use Directory Picker for native file handling + Conflict Resolution
        if ('showDirectoryPicker' in window) {
            try {
                // Ask user for a destination folder
                const dirHandle = await (window as any).showDirectoryPicker({});
                this.dirHandles.set(peerId, dirHandle);

                // Pre-flight check for conflicts
                for (let i = 0; i < resolvedFiles.length; i++) {
                    const file = resolvedFiles[i];
                    try {
                        // Check if file exists
                        await dirHandle.getFileHandle(file.name);
                        
                        // If we are here, file exists. Prompt user.
                        const decision = await this.promptConflict(peerId, file.name);
                        
                        if (decision === 'overwrite') {
                            // Do nothing, we will overwrite
                        } else if (decision === 'keep-both') {
                            const extension = file.name.split('.').pop();
                            const nameWithoutExt = file.name.substring(0, file.name.lastIndexOf('.'));
                            const hasExt = file.name.includes('.');
                            const newName = hasExt 
                                ? `${nameWithoutExt}_${Date.now()}.${extension}`
                                : `${file.name}_${Date.now()}`;
                            
                            resolvedFiles[i] = { ...file, name: newName }; // Update metadata
                        } else {
                            // Cancel - for now we just treat as overwrite or we could implement skip
                            // Implementing skip is complex without sender support. 
                            eventBus.emit(EVENTS.TRANSFER_CANCEL, { peerId });
                            return;
                        }

                    } catch (e: any) {
                        // File not found, safe to proceed
                        if (e.name !== 'NotFoundError' && e.name !== 'TypeMismatchError') console.warn(e);
                    }
                }

                // Initialize the first stream
                if (resolvedFiles.length > 0) {
                    const firstFile = resolvedFiles[0];
                    const fileHandle = await dirHandle.getFileHandle(firstFile.name, { create: true });
                    const writable = await fileHandle.createWritable();
                    this.fileStreams.set(peerId, writable);
                }

            } catch (err) {
                console.log('[RTC] Directory picker cancelled or failed, falling back to memory/legacy', err);
                if ((err as Error).name === 'AbortError') {
                    eventBus.emit(EVENTS.TRANSFER_CANCEL, { peerId });
                    return;
                }
            }
        } 
        
        // Fallback: Legacy Single File Save Picker
        else if ('showSaveFilePicker' in window && files.length === 1) {
            try {
                const file = files[0];
                const handle = await (window as any).showSaveFilePicker({
                    suggestedName: file.name,
                });
                const writable = await handle.createWritable();
                this.fileStreams.set(peerId, writable);
            } catch {
                console.log('[RTC] Save picker cancelled or failed, falling back to memory');
            }
        }

        this.metadata.set(peerId, resolvedFiles); // Update with resolved names
        
        // Resume check logic (placeholder)
        // ...

        eventBus.emit(EVENTS.FILE_TRANSFER_START, { peerId, totalSize });
    }

    private async promptConflict(peerId: string, fileName: string): Promise<'overwrite' | 'keep-both' | 'cancel'> {
        return new Promise((resolve) => {
            eventBus.emit(EVENTS.CONFLICT_REQUEST, {
                peerId,
                fileName,
                resolve
            });
        });
    }

    async sendFile(peerId: string, file: File, dataChannel: RTCDataChannel): Promise<void> {
        return this.sendMesh([peerId], file, { [peerId]: dataChannel });
    }

    async sendMesh(peerIds: string[], file: File, channels: Record<string, RTCDataChannel>): Promise<void> {
        const fileId = this.getFileId(file);
        
        // 1. Resume Check (for mesh, we simplify to the lowest common denominator or fresh start)
        // For simplicity in mesh, we start from 0 unless it's a single peer
        const offset = 0;

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
                const { type, chunk, offset: currentOffset, totalSize } = e.data;

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
                    if (now - lastUiUpdate > UI_UPDATE_INTERVAL || currentOffset >= totalSize) {
                        peerIds.forEach(pid => {
                            const cb = this.callbacks.get(pid);
                            const total = this.totalSizes.get(pid) || totalSize;
                            const progress = Math.round((currentOffset / totalSize) * 100);
                            const start = this.startTime.get(pid) || now;
                            const speed = (currentOffset / ((now - start) / 1000));
                            
                            if (cb) cb.onProgress(progress);
                            eventBus.emit(EVENTS.TRANSFER_STATS_UPDATE, {
                                peerId: pid, speed, progress, totalSize: total, sentSize: currentOffset
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
        const currentFileIndex = metadata.findIndex(f => {
            return receivedSizeBefore < f.size; 
        });
        
        const currentFile = metadata[currentFileIndex] || metadata[0];
        const fileId = this.getFileId(currentFile);
        
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
        if (receivedSize % (RTCFileTransferManager.CHUNK_SIZE * 20) === 0) {
            storageManager.saveResumeState(fileId, { receivedSize });
        }

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

            // Folder Structure Preservation: Use path if available
            const finalName = fileMetadata?.path || fileName;

            const blob = new Blob(chunks as BlobPart[], {
                type: fileMetadata?.type || 'application/octet-stream'
            });

            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = finalName.split('/').pop() || finalName; // Browser download only supports flat filename unless using FS API
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            this.chunks.set(peerId, []);
            if (fileId) {
                this.resumeState.delete(fileId);
                storageManager.clearResumeState(fileId);
            }
        }
    }

    // Helper for Service to handle resume queries
    async handleResumeQuery(dataChannel: RTCDataChannel, fileId: string): Promise<void> {
        const state = await storageManager.getResumeState(fileId);
        dataChannel.send(JSON.stringify({
            type: 'resume-response',
            fileId,
            offset: state ? state.receivedSize : 0
        }));
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