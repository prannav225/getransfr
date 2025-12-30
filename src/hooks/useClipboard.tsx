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
          if (navigator.clipboard && navigator.clipboard.readText) {
             const text = await navigator.clipboard.readText();
             if (text && text.trim()) return { type: 'text', content: text };
          }
      } catch (err) {
          console.error('Clipboard text read failed', err);
      }
      return null;
  }, []);

  return { shareText, retrieveClipboard };
}
