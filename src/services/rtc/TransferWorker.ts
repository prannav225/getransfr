/**
 * TransferWorker.ts
 * Robust background thread for file chunking and backpressure handling.
 */

// Use addEventListener instead of onmessage to allow multiple listeners/cleaner state
self.addEventListener('message', async (e: MessageEvent) => {
    const { type, file, offset, chunkSize } = e.data;

    if (type === 'start-read') {
        runReadLoop(file, offset, chunkSize);
    }
});

async function runReadLoop(file: File, startOffset: number, chunkSize: number) {
    let offset = startOffset;
    const totalSize = file.size;
    let paused = false;
    let stopped = false;

    const messageHandler = (e: MessageEvent) => {
        if (e.data.type === 'next') paused = false;
        if (e.data.type === 'stop') stopped = true;
    };

    self.addEventListener('message', messageHandler);

    try {
        while (offset < totalSize && !stopped) {
            if (paused) {
                await new Promise(r => setTimeout(r, 5));
                continue;
            }

            const slice = file.slice(offset, offset + chunkSize);
            const chunk = await slice.arrayBuffer();

            if (stopped) break;

            (self as any).postMessage({
                type: 'chunk',
                chunk,
                offset,
                totalSize
            }, [chunk]); 

            offset += chunk.byteLength;
            paused = true; // Wait for 'next' from main thread backpressure
        }

        if (stopped) {
            console.log('[Worker] Transfer stopped');
        } else {
            (self as any).postMessage({ type: 'complete' });
        }
    } catch (err) {
        console.error('[Worker] Read Error:', err);
        (self as any).postMessage({ type: 'error', error: 'Failed to read file chunk. The file may have been moved or modified.' });
    } finally {
        self.removeEventListener('message', messageHandler);
    }
}
