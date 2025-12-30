/**
 * TransferWorker.ts
 * Offloads heavy file chunking and multi-peer broadcasting to a background thread.
 * This prevents UI freezes and WebSocket heartbeat drops during 1GB+ mesh transfers.
 */

self.onmessage = async (e: MessageEvent) => {
    const { type, file, offset, chunkSize } = e.data;

    if (type === 'start-read') {
        runReadLoop(file, offset, chunkSize);
    }
};

async function runReadLoop(file: File, startOffset: number, chunkSize: number) {
    let offset = startOffset;
    const totalSize = file.size;
    let paused = false;

    // Listen for backpressure from main thread
    self.onmessage = (e) => {
        if (e.data.type === 'next') paused = false;
        if (e.data.type === 'stop') offset = totalSize;
    };

    while (offset < totalSize) {
        if (paused) {
            await new Promise(r => setTimeout(r, 10));
            continue;
        }

        const slice = file.slice(offset, offset + chunkSize);
        try {
            const chunk = await slice.arrayBuffer();
            (self as any).postMessage({
                type: 'chunk',
                chunk,
                offset,
                totalSize
            }, [chunk]); // Transfer the ArrayBuffer for zero-copy speed

            offset += chunk.byteLength;
            paused = true; // Wait for 'next' from main thread
        } catch (err) {
            (self as any).postMessage({ type: 'error', error: 'Failed to read file chunk' });
            return;
        }
    }

    (self as any).postMessage({ type: 'complete' });
}
