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

    private static CHUNK_SIZE = 64 * 1024; // 64KB chunks
    private static MAX_BUFFERED_AMOUNT = 16 * 1024 * 1024; // 16MB buffer

    initializeSender(peerId: string, files: File[], callbacks: FileProgress): void {
        const totalSize = files.reduce((acc, file) => acc + file.size, 0);
        this.totalSizes.set(peerId, totalSize);
        // Don't reset sentSizes if we're resuming
        if (!this.sentSizes.has(peerId)) {
            this.sentSizes.set(peerId, 0);
        }
        this.callbacks.set(peerId, callbacks);
        if (!this.startTime.has(peerId)) {
            this.startTime.set(peerId, Date.now());
        }
    }

    async initializeReceiver(peerId: string, files: any[]): Promise<void> {
        this.metadata.set(peerId, files);
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
                if (!this.chunks.has(peerId)) {
                    this.chunks.set(peerId, []);
                }
            }
        } else {
            if (!this.chunks.has(peerId)) {
                this.chunks.set(peerId, []);
            }
        }

        eventBus.emit(EVENTS.FILE_TRANSFER_START, { peerId, totalSize });
    }

    async sendFile(peerId: string, file: File, dataChannel: RTCDataChannel): Promise<void> {
        if (dataChannel.readyState !== 'open') {
            throw new Error('Data channel not open');
        }

        const callbacks = this.callbacks.get(peerId);
        if (!callbacks) {
            throw new Error('No callbacks found for peer');
        }

        const totalSize = this.totalSizes.get(peerId) || 0;
        let sentSize = this.sentSizes.get(peerId) || 0;

        const reader = new FileReader();
        const chunkSize = RTCFileTransferManager.CHUNK_SIZE;
        
        // Support Resuming: Start from sentSize
        let offset = sentSize; 

        while (offset < file.size) {
            const slice = file.slice(offset, offset + chunkSize);
            const chunk = await this.readFileChunk(reader, slice);

            while (dataChannel.bufferedAmount > RTCFileTransferManager.MAX_BUFFERED_AMOUNT) {
                await new Promise(resolve => setTimeout(resolve, 50));

                if (dataChannel.readyState !== 'open') {
                    // This is where we break on connection loss
                    this.sentSizes.set(peerId, offset);
                    throw new Error('Connection lost');
                }
            }

            try {
                dataChannel.send(chunk);
            } catch (error) {
                await new Promise(resolve => setTimeout(resolve, 100));
                dataChannel.send(chunk);
            }

            offset += chunk.byteLength;
            sentSize += chunk.byteLength;

            const now = Date.now();
            const start = this.startTime.get(peerId) || now;
            const elapsed = (now - start) / 1000;
            const speed = elapsed > 0 ? sentSize / elapsed : 0;

            const progress = Math.round((sentSize / totalSize) * 100);
            callbacks.onProgress(progress);

            eventBus.emit(EVENTS.TRANSFER_STATS_UPDATE, {
                peerId,
                speed,
                progress,
                totalSize,
                sentSize
            });

            this.sentSizes.set(peerId, sentSize);
        }

        dataChannel.send(JSON.stringify({
            type: 'file-complete',
            name: file.name
        }));
    }

    private readFileChunk(reader: FileReader, slice: Blob): Promise<ArrayBuffer> {
        return new Promise((resolve, reject) => {
            reader.onload = (e) => resolve(e.target?.result as ArrayBuffer);
            reader.onerror = reject;
            reader.readAsArrayBuffer(slice);
        });
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