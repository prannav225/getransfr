import { useEffect, useCallback } from 'react';
import clipboardService from '@/services/clipboardService';
import toast from 'react-hot-toast';
import { eventBus, EVENTS } from '@/utils/events';

export function useClipboard() {
  useEffect(() => {
    const cleanup = clipboardService.onReceive(({ from, text }) => {
      // Deduplication Logic:
      // Check if we already processed this exact text recently (persist across refreshes)
      const lastText = sessionStorage.getItem('last_received_text');
      const lastTime = parseInt(sessionStorage.getItem('last_received_time') || '0');
      const now = Date.now();

      // If text matches and was received recently (< 5 seconds ago or "just before refresh"), 
      // AND we are close to page load (e.g. within 2 seconds of mount), assume it's a socket replay.
      // Since we can't easily valid "page load time" here without state, we'll just check "same text".
      // But user MIGHT want to send same text twice. 
      // Let's use a specialized "hash" or just strict equality.
      
      // If the message is structurally identical to the last one we handled...
      if (text === lastText) {
          // If it was relatively recent (e.g. 10 seconds), treat as replay
          // This covers the "Refresh" case where the socket reconnects immediately.
          if (now - lastTime < 10000) {
              console.log('[useClipboard] Ignoring duplicate/replay text event');
              return;
          }
      }

      sessionStorage.setItem('last_received_text', text);
      sessionStorage.setItem('last_received_time', now.toString());

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
