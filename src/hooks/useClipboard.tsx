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
      try {
          // Chrome/Edge/Safari support navigator.clipboard.read()
          // Check if 'read' method exists
          if (navigator.clipboard && navigator.clipboard.read) {
              const items = await navigator.clipboard.read();
              for (const item of items) {
                  // Priority to Images
                  const imageType = item.types.find(t => t.startsWith('image/'));
                  if (imageType) {
                      const blob = await item.getType(imageType);
                      return { type: 'image', content: blob };
                  }
                  // Then Text
                  if (item.types.includes('text/plain')) {
                      const blob = await item.getType('text/plain');
                      const text = await blob.text();
                      if (text.trim()) return { type: 'text', content: text };
                  }
              }
          }
          throw new Error('Fallback to text');
      } catch (err) {
          // Fallback for Firefox or permission denials: Try reading text directly
          try {
              const text = await navigator.clipboard.readText();
              if (text && text.trim()) return { type: 'text', content: text };
              
              // If we are here, we might not have permission or clipboard is empty/incompatible
              // Inform user:
              console.warn('Clipboard direct read failed or empty', err);
          } catch (e) {
              console.error('Clipboard text fallback failed', e);
              // We return null here, which prompts the empty text modal in Home.tsx
              // This acts as a manual "Paste Here" box.
          }
      }
      return null;
  }, []);

  return { shareText, retrieveClipboard };
}
