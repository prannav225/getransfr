import {
  FileProgress,
  FileMetadata,
  FileSystemHandle,
  FileSystemFileHandle,
} from "../../types/transfer";
import { eventBus, EVENTS } from "../../utils/events";

// Define browser types for File System Access API if not in global
interface FileSystemWritableFileStream extends WritableStream {
  write(data: Uint8Array | Blob | string): Promise<void>;
  seek(position: number): Promise<void>;
  truncate(size: number): Promise<void>;
}

/**
 * SequentialTaskQueue
 * Ensures that file writes and closures happen in the exact order the messages arrived.
 */
class SequentialTaskQueue {
  private queue: Promise<void> = Promise.resolve();

  async push(task: () => Promise<void>): Promise<void> {
    this.queue = this.queue.then(async () => {
      try {
        await task();
      } catch (e) {
        console.error("[TaskQueue] Operation failed:", e);
      }
    });
    return this.queue;
  }
}

class RTCFileTransferManager {
  private metadata: Map<string, FileMetadata[]> = new Map();
  private totalSizes: Map<string, number> = new Map();
  private sentSizes: Map<string, number> = new Map(); // Cumulative batch sent bytes
  private startTime: Map<string, number> = new Map();
  private callbacks: Map<string, FileProgress> = new Map();

  // Receiver-specific
  private chunks: Map<string, Map<string, Uint8Array[]>> = new Map();
  private fileStreams: Map<string, FileSystemWritableFileStream> = new Map();
  private dirHandles: Map<string, FileSystemHandle> = new Map();
  private currentFileIndices: Map<string, number> = new Map();
  private taskQueues: Map<string, SequentialTaskQueue> = new Map();

  private static CHUNK_SIZE = 128 * 1024; // 128KB chunks
  private static BUFFER_THRESHOLD = 8 * 1024 * 1024; // 8MB

  public initializeSender(
    peerId: string,
    files: File[],
    callbacks: FileProgress
  ): void {
    const totalSize = files.reduce((acc, f) => acc + f.size, 0);
    this.totalSizes.set(peerId, totalSize);
    this.sentSizes.set(peerId, 0);
    this.callbacks.set(peerId, callbacks);
    this.startTime.set(peerId, Date.now());
    console.log(
      `[RTC] Sender initialized for peer ${peerId}. Total batch: ${totalSize} bytes`
    );
  }

  public async initializeReceiver(
    peerId: string,
    files: FileMetadata[],
    fileSystemHandle?: FileSystemHandle
  ): Promise<void> {
    const totalSize = files.reduce((acc, f) => acc + f.size, 0);
    this.totalSizes.set(peerId, totalSize);
    this.sentSizes.set(peerId, 0);
    this.metadata.set(peerId, files);
    this.currentFileIndices.set(peerId, 0);
    this.chunks.set(peerId, new Map());
    this.startTime.set(peerId, Date.now());

    if (fileSystemHandle) {
      try {
        if (files.length === 1 && fileSystemHandle.kind === "file") {
          this.fileStreams.set(
            peerId,
            (await (
              fileSystemHandle as unknown as FileSystemFileHandle
            ).createWritable()) as FileSystemWritableFileStream
          );
        } else if (files.length > 1 && fileSystemHandle.kind === "directory") {
          this.dirHandles.set(peerId, fileSystemHandle);
        }
      } catch (err) {
        console.error("[RTC] FS API Init Error:", err);
      }
    }
    eventBus.emit(EVENTS.FILE_TRANSFER_START, { peerId, totalSize });
    console.log(
      `[RTC] Receiver initialized for ${peerId}. Expecting ${files.length} files.`
    );
  }

  public async sendFile(
    peerId: string,
    file: File,
    dataChannel: RTCDataChannel
  ): Promise<void> {
    // Use a static URL for Worker concatenation to satisfy Vite & TypeScript
    const worker = new Worker(new URL("./TransferWorker.ts", import.meta.url), {
      type: "module",
    });

    return new Promise((resolve, reject) => {
      let offset = 0;
      let lastUiUpdate = 0;
      const batchBase = this.sentSizes.get(peerId) || 0;

      worker.onmessage = async (e: MessageEvent) => {
        const { type, chunk, error } = e.data;

        if (type === "chunk") {
          // Backpressure Check
          if (
            dataChannel.bufferedAmount > RTCFileTransferManager.BUFFER_THRESHOLD
          ) {
            await new Promise<void>((res) => {
              const onLow = () => {
                dataChannel.removeEventListener("bufferedamountlow", onLow);
                clearInterval(poller);
                res();
              };
              const poller = setInterval(() => {
                if (
                  dataChannel.bufferedAmount <
                  RTCFileTransferManager.BUFFER_THRESHOLD / 2
                ) {
                  onLow();
                }
              }, 50);
              dataChannel.addEventListener("bufferedamountlow", onLow);
              setTimeout(onLow, 5000);
            });
          }

          try {
            dataChannel.send(chunk);
            offset += chunk.byteLength;
          } catch (err) {
            worker.terminate();
            return reject(err);
          }

          const now = Date.now();
          if (now - lastUiUpdate > 100 || offset >= file.size) {
            const batchTotal = this.totalSizes.get(peerId) || file.size;
            const totalSent = batchBase + offset;
            const progress = Math.min(
              100,
              Math.round((totalSent / batchTotal) * 100)
            );
            const speed =
              totalSent /
              ((now - (this.startTime.get(peerId) || now)) / 1000 || 0.001);

            this.callbacks.get(peerId)?.onProgress(progress);
            eventBus.emit(EVENTS.TRANSFER_STATS_UPDATE, {
              peerId,
              speed,
              progress,
              totalSize: batchTotal,
              sentSize: totalSent,
            });
            lastUiUpdate = now;
          }

          if (offset < file.size) {
            worker.postMessage({
              type: "read",
              file,
              offset,
              chunkSize: RTCFileTransferManager.CHUNK_SIZE,
            });
          } else {
            worker.terminate();
            console.log(`[RTC] Sending file-complete for: ${file.name}`);
            dataChannel.send(
              JSON.stringify({ type: "file-complete", name: file.name })
            );
            this.sentSizes.set(peerId, batchBase + file.size);
            resolve();
          }
        } else if (type === "error") {
          worker.terminate();
          reject(new Error(error));
        }
      };

      worker.postMessage({
        type: "read",
        file,
        offset,
        chunkSize: RTCFileTransferManager.CHUNK_SIZE,
      });
    });
  }

  public async addChunk(peerId: string, data: ArrayBuffer): Promise<void> {
    let queue = this.taskQueues.get(peerId);
    if (!queue) {
      queue = new SequentialTaskQueue();
      this.taskQueues.set(peerId, queue);
    }

    const chunkData = new Uint8Array(data);

    queue.push(async () => {
      const metadata = this.metadata.get(peerId);
      const currentIdx = this.currentFileIndices.get(peerId) || 0;
      const currentFile = metadata?.[currentIdx];
      if (!currentFile) return;

      let stream = this.fileStreams.get(peerId);

      if (!stream && this.dirHandles.has(peerId)) {
        try {
          const dirHandle = this.dirHandles.get(peerId);
          if (dirHandle) {
            const handle = await (
              dirHandle as unknown as FileSystemDirectoryHandle
            ).getFileHandle(currentFile.name, { create: true });
            stream =
              (await handle.createWritable()) as FileSystemWritableFileStream;
            if (stream) {
              this.fileStreams.set(peerId, stream);
            }
          }
        } catch (e) {
          console.error("[RTC] Stream open fail:", e);
        }
      }

      if (stream) {
        try {
          await stream.write(chunkData);
        } catch (err) {
          console.error("[RTC] Write fail:", err);
        }
      } else {
        const peerMap = this.chunks.get(peerId);
        if (peerMap) {
          let fileChunks = peerMap.get(currentFile.name);
          if (!fileChunks) {
            fileChunks = [];
            peerMap.set(currentFile.name, fileChunks);
          }
          fileChunks.push(chunkData);
        }
      }

      const totalBatch = this.totalSizes.get(peerId) || 1;
      const receivedNow =
        (this.sentSizes.get(peerId) || 0) + chunkData.byteLength;
      this.sentSizes.set(peerId, receivedNow);

      const progress = Math.min(
        100,
        Math.round((receivedNow / totalBatch) * 100)
      );
      const now = Date.now();
      const elapsed = (now - (this.startTime.get(peerId) || now)) / 1000;
      const speed = receivedNow / (elapsed || 0.001);

      eventBus.emit(EVENTS.FILE_TRANSFER_PROGRESS, {
        peerId,
        progress,
        speed,
        receivedSize: receivedNow,
        totalSize: totalBatch,
      });
    });
  }

  public async saveFile(peerId: string, fileName: string): Promise<void> {
    const queue = this.taskQueues.get(peerId);
    if (!queue) return;

    await queue.push(async () => {
      console.log(`[RTC] Finalizing: ${fileName}`);
      const stream = this.fileStreams.get(peerId);
      const metadata = this.metadata.get(peerId);
      if (!metadata) return;

      if (stream) {
        try {
          await stream.close();
        } catch (err) {
          console.error("[RTC] Save close fail:", err);
        }
        this.fileStreams.delete(peerId);
      } else {
        const peerMap = this.chunks.get(peerId);
        const fileChunks = peerMap?.get(fileName);
        if (fileChunks && fileChunks.length > 0) {
          const fileMeta = metadata.find((m) => m.name === fileName);
          const blob = new Blob(fileChunks as BlobPart[], {
            type: fileMeta?.type || "application/octet-stream",
          });
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = fileName;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          peerMap?.delete(fileName);
        }
      }
      const nextIdx = (this.currentFileIndices.get(peerId) || 0) + 1;
      this.currentFileIndices.set(peerId, nextIdx);

      if (metadata && nextIdx >= metadata.length) {
        console.log(
          `[RTC] All ${metadata.length} files received for ${peerId}`
        );
        eventBus.emit(EVENTS.FILE_TRANSFER_COMPLETE, { peerId });
      }
    });
  }

  public cleanup(peerId: string): void {
    const stream = this.fileStreams.get(peerId);
    if (stream) {
      stream.close().catch(() => {});
      this.fileStreams.delete(peerId);
    }
    this.chunks.delete(peerId);
    this.metadata.delete(peerId);
    this.sentSizes.delete(peerId);
    this.totalSizes.delete(peerId);
    this.taskQueues.delete(peerId);
    this.currentFileIndices.delete(peerId);
    this.dirHandles.delete(peerId);
    this.startTime.delete(peerId);
  }
}

export default RTCFileTransferManager;
