/**
 * TransferWorker.ts
 * Reliable file chunker for 1-to-1 transfers.
 */

self.onmessage = async (e: MessageEvent) => {
    const { type, file, offset, chunkSize } = e.data;

    if (type === 'read') {
        try {
            // Calculate slice boundaries
            const start = offset;
            const end = Math.min(start + chunkSize, file.size);
            
            // Check for end of file
            if (start >= file.size) {
                (self as any).postMessage({ type: 'complete' });
                return;
            }

            // Read the actual slice
            const blob = file.slice(start, end);
            const arrayBuffer = await blob.arrayBuffer();

            // Guard against empty buffers if slice logic fails
            if (arrayBuffer.byteLength === 0 && start < file.size) {
                 throw new Error('Read resulted in 0-byte buffer at non-EOF offset');
            }

            // Send back to main thread using transferable array (zero-copy)
            (self as any).postMessage({
                type: 'chunk',
                chunk: arrayBuffer,
                offset: start,
                totalSize: file.size
            }, [arrayBuffer]);

        } catch (err) {
            console.error('[Worker] Read Error:', err);
            (self as any).postMessage({ type: 'error', error: String(err) });
        }
    }
};
