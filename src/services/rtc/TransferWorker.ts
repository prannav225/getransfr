/// <reference lib="webworker" />
/**
 * TransferWorker.ts - Optimized High-Speed Chunker
 */

self.onmessage = async (e: MessageEvent) => {
  const { type, file, offset, chunkSize = 1024 * 1024 } = e.data;

  if (type === "read") {
    try {
      const start = offset;
      const end = Math.min(start + chunkSize, file.size);

      if (start >= file.size) {
        (self as DedicatedWorkerGlobalScope).postMessage({ type: "complete" });
        return;
      }

      const blob = file.slice(start, end);
      const arrayBuffer = await blob.arrayBuffer();

      if (arrayBuffer.byteLength === 0 && start < file.size) {
        throw new Error("Read resulted in 0-byte buffer");
      }

      // Transfer ownership of arrayBuffer to main thread (zero-copy)
      (self as DedicatedWorkerGlobalScope).postMessage(
        {
          type: "chunk",
          chunk: arrayBuffer,
          offset: start,
          byteLength: arrayBuffer.byteLength,
        },
        [arrayBuffer]
      );
    } catch (err) {
      (self as DedicatedWorkerGlobalScope).postMessage({
        type: "error",
        error: String(err),
      });
    }
  }
};
