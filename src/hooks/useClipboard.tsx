import { useEffect, useCallback } from 'react';
import clipboardService from '@/services/clipboardService';
import toast from 'react-hot-toast';
import { eventBus, EVENTS } from '@/utils/events';

export function useClipboard() {
  useEffect(() => {
    const cleanup = clipboardService.onReceive(({ from, text }) => {
      // Dispatch custom event for Home component to handle
      eventBus.emit(EVENTS.TEXT_TRANSFER_REQUEST, { from, text });
      
      // Also trigger a system notification if enabled
      if (Notification.permission === 'granted') {
          new Notification('New Shared Text', {
              body: text.length > 50 ? text.substring(0, 47) + '...' : text,
              icon: '/G.png'
          });
      }
    });

    return cleanup;
  }, []);

  const shareText = useCallback((to: string, text: string) => {
    if (!text.trim()) return;
    clipboardService.shareText(to, text);
    toast.success('Text snippet sent!');
  }, []);

  const retrieveClipboard = useCallback(async (): Promise<{ type: 'image' | 'text'; content: Blob | string } | null> => {
      console.log('Attempting to read clipboard...');
      try {
          // Chrome/Edge/Safari support navigator.clipboard.read()
          if (navigator.clipboard && navigator.clipboard.read) {
              try {
                  // Race condition: If read() hangs (permission prompt ignored), fail fast after 3s so UI doesn't freeze
                  const readPromise = navigator.clipboard.read();
                  const timeoutPromise = new Promise<never>((_, reject) => 
                        setTimeout(() => reject(new Error('Clipboard read timeout')), 2000)
                  );
                  
                  const items = await Promise.race([readPromise, timeoutPromise]) as ClipboardItem[];
                  
                  for (const item of items) {
                      const imageType = item.types.find(t => t.startsWith('image/'));
                      if (imageType) {
                          const blob = await item.getType(imageType);
                          return { type: 'image', content: blob };
                      }
                      if (item.types.includes('text/plain')) {
                          const blob = await item.getType('text/plain');
                          const text = await blob.text();
                          if (text.trim()) return { type: 'text', content: text };
                      }
                  }
              } catch (readErr) {
                  // If read() failed or timed out, fall through to text fallback
                  console.warn('Clipboard.read() failed or timed out, falling back to text:', readErr);
                  throw new Error('Fallback to text');
              }
          }
          throw new Error('Fallback to text');
      } catch (err) {
          // Fallback: Try reading text directly
          try {
              if (navigator.clipboard && navigator.clipboard.readText) {
                 const text = await navigator.clipboard.readText();
                 if (text && text.trim()) return { type: 'text', content: text };
              }
              console.warn('Clipboard direct read failed or empty', err);
          } catch (e) {
              console.error('Clipboard text fallback failed', e);
          }
      }
      return null;
  }, []);

  return { shareText, retrieveClipboard };
}
