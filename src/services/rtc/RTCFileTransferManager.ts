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
 * Uses an array-based queue to avoid massive Promise chains in memory.
 */
class SequentialTaskQueue {
  private queue: (() => Promise<void>)[] = [];
  private isProcessing = false;

  async push(task: () => Promise<void>): Promise<void> {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          await task();
          resolve();
        } catch (e) {
          reject(e);
        }
      });
      this.process();
    });
  }

  private async process() {
    if (this.isProcessing) return;
    this.isProcessing = true;
    while (this.queue.length > 0) {
      const task = this.queue.shift();
      if (task) await task();
    }
    this.isProcessing = false;
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
  private ackWaiters: Map<string, { resolve: () => void; threshold: number }> =
    new Map();
  private totalAcked: Map<string, number> = new Map();

  private static CHUNK_SIZE = 256 * 1024; // 256KB - Optimal for mobile network stacks
  private static BUFFER_THRESHOLD = 4 * 1024 * 1024; // 4MB safe network buffer

  public handleAck(peerId: string, byteLength: number): void {
    const currentAcked = (this.totalAcked.get(peerId) || 0) + byteLength;
    this.totalAcked.set(peerId, currentAcked);

    const waiter = this.ackWaiters.get(peerId);
    if (waiter && currentAcked >= waiter.threshold) {
      this.ackWaiters.delete(peerId);
      waiter.resolve();
    }
  }

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
        if (fileSystemHandle.kind === "directory") {
          this.dirHandles.set(peerId, fileSystemHandle);
        } else if (fileSystemHandle.kind === "file" && files.length === 1) {
          this.fileStreams.set(
            peerId,
            (await (
              fileSystemHandle as unknown as FileSystemFileHandle
            ).createWritable()) as FileSystemWritableFileStream
          );
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
    const worker = new Worker(new URL("./TransferWorker.ts", import.meta.url), {
      type: "module",
    });

    // Configure the data channel for high-speed bursts
    dataChannel.bufferedAmountLowThreshold = 2 * 1024 * 1024; // 2MB "low" signal

    return new Promise((resolve, reject) => {
      let readOffset = 0;
      let sentOffset = 0;
      let lastUiUpdate = 0;
      const batchBase = this.sentSizes.get(peerId) || 0;

      const MAX_IN_FLIGHT = 8 * 1024 * 1024; // 8MB Sliding Window
      let isWaitingForAck = false;

      const requestNextChunk = () => {
        if (readOffset >= file.size || dataChannel.readyState !== "open")
          return;

        // Flow control balancing Network vs Disk capacity
        const inFlight = sentOffset - (this.totalAcked.get(peerId) || 0);

        if (
          inFlight > MAX_IN_FLIGHT ||
          dataChannel.bufferedAmount > RTCFileTransferManager.BUFFER_THRESHOLD
        ) {
          if (!isWaitingForAck) {
            isWaitingForAck = true;
            this.ackWaiters.set(peerId, {
              threshold: (this.totalAcked.get(peerId) || 0) + MAX_IN_FLIGHT / 2,
              resolve: () => {
                isWaitingForAck = false;
                requestNextChunk();
              },
            });
          }
          return;
        }

        worker.postMessage({
          type: "read",
          file,
          offset: readOffset,
          chunkSize: RTCFileTransferManager.CHUNK_SIZE,
        });
        readOffset += Math.min(
          RTCFileTransferManager.CHUNK_SIZE,
          file.size - readOffset
        );
      };

      dataChannel.onbufferedamountlow = () => requestNextChunk();

      worker.onmessage = async (e: MessageEvent) => {
        const { type, chunk, byteLength, error } = e.data;

        if (type === "chunk") {
          try {
            if (dataChannel.readyState !== "open") {
              worker.terminate();
              return reject(new Error("Connection lost"));
            }

            dataChannel.send(chunk);
            sentOffset += byteLength;

            requestNextChunk();

            const now = Date.now();
            if (now - lastUiUpdate > 200 || sentOffset >= file.size) {
              const batchTotal = this.totalSizes.get(peerId) || file.size;
              const totalSent = batchBase + sentOffset;
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

            if (sentOffset >= file.size) {
              worker.terminate();
              dataChannel.send(
                JSON.stringify({ type: "file-complete", name: file.name })
              );
              this.sentSizes.set(peerId, batchBase + file.size);
              resolve();
            }
          } catch (err) {
            worker.terminate();
            return reject(err);
          }
        } else if (type === "error") {
          worker.terminate();
          reject(new Error(error));
        }
      };

      requestNextChunk();
    });
  }

  public async addChunk(peerId: string, data: ArrayBuffer): Promise<void> {
    let queue = this.taskQueues.get(peerId);
    if (!queue) {
      queue = new SequentialTaskQueue();
      this.taskQueues.set(peerId, queue);
    }

    const chunkData = new Uint8Array(data);

    // Await the push so we can signal ACK back only after it's in the queue pipeline
    await queue.push(async () => {
      const metadata = this.metadata.get(peerId);
      const currentIdx = this.currentFileIndices.get(peerId) || 0;
      const currentFile = metadata?.[currentIdx];
      if (!currentFile) return;

      let stream = this.fileStreams.get(peerId);

      if (!stream && this.dirHandles.has(peerId)) {
        try {
          const dirHandle = this.dirHandles.get(
            peerId
          ) as unknown as FileSystemDirectoryHandle;
          if (dirHandle) {
            const pathParts = currentFile.name.split("/");
            const fileName = pathParts.pop()!;
            let currentDir = dirHandle;

            // Traverse/Create subdirectories
            for (const part of pathParts) {
              if (!part) continue;
              currentDir = await currentDir.getDirectoryHandle(part, {
                create: true,
              });
            }

            const handle = await currentDir.getFileHandle(fileName, {
              create: true,
            });
            stream =
              (await handle.createWritable()) as FileSystemWritableFileStream;
            if (stream) {
              this.fileStreams.set(peerId, stream);
            }
          }
        } catch (e) {
          console.error("[RTC] Stream open fail (nested):", e);
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
            peerMap.set(
              currentFile.name,
              fileChunks as unknown as Uint8Array[]
            );
          }
          // Memory Safety: Store as a Blob immediately.
          // Browsers can swap Blobs to disk more efficiently than Uint8Arrays.
          (fileChunks as unknown as Blob[]).push(new Blob([chunkData]));
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
          const blob = new Blob(fileChunks as unknown as BlobPart[], {
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
    this.ackWaiters.delete(peerId);
    this.totalAcked.delete(peerId);
    this.startTime.delete(peerId);
  }
}

export default RTCFileTransferManager;
