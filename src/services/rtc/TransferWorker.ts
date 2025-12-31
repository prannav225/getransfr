/**
 * TransferWorker.ts
 * Streamlined file reader for ultra-fast P2P transfers.
 */

self.onmessage = async (e: MessageEvent) => {
    const { type, file, offset: startOffset, chunkSize } = e.data;

    if (type === 'start') {
        let offset = startOffset;
        const totalSize = file.size;
        let paused = false;

        // Command listener for this specific loop
        const cmdListener = (msg: MessageEvent) => {
            if (msg.data.type === 'next') paused = false;
            if (msg.data.type === 'stop') offset = totalSize; // End the loop
        };
        self.addEventListener('message', cmdListener);

        try {
            while (offset < totalSize) {
                if (paused) {
                    // Small yield for thread responsiveness, but no fixed delay
                    await new Promise(r => setTimeout(r, 0));
                    continue;
                }

                const end = Math.min(offset + chunkSize, totalSize);
                const chunk = await file.slice(offset, end).arrayBuffer();
                
                // If stopped while reading
                if (offset >= totalSize) break;

                (self as any).postMessage({
                    type: 'chunk',
                    chunk,
                    offset,
                    totalSize
                }, [chunk]);

                offset += chunk.byteLength;
                paused = true; // Wait for drain from main thread
            }
            (self as any).postMessage({ type: 'complete' });
        } catch (err) {
            (self as any).postMessage({ type: 'error', error: String(err) });
        } finally {
            self.removeEventListener('message', cmdListener);
        }
    }
};
