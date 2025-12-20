import { useEffect, useCallback } from 'react';
import clipboardService from '@/services/clipboardService';
import toast from 'react-hot-toast';

export function useClipboard(): { shareText: (to: string, text: string) => void } {
  useEffect(() => {
    const cleanup = clipboardService.onReceive(({ text }) => {
      // Find device name from somewhere? Or just show "Incoming text"
      // We can improve this later when we have device mapping in a global state
      
      const handleCopy = async () => {
        try {
          await navigator.clipboard.writeText(text);
          toast.success('Shared text copied to clipboard!');
        } catch (err) {
          console.error('Failed to copy text:', err);
          toast.error('Failed to copy shared text');
        }
      };

      toast((t) => (
        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium">Incoming text snippet</p>
          <p className="text-xs text-muted-foreground truncate max-w-[200px]">{text}</p>
          <div className="flex gap-2 mt-1">
            <button
              onClick={() => {
                handleCopy();
                toast.dismiss(t.id);
              }}
              className="px-2 py-1 bg-primary text-white text-[10px] rounded-md font-bold"
            >
              Copy
            </button>
            <button
              onClick={() => toast.dismiss(t.id)}
              className="px-2 py-1 bg-slate-200 dark:bg-slate-700 text-[10px] rounded-md font-bold"
            >
              Ignore
            </button>
          </div>
        </div>
      ), { duration: 6000 });
      
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

  return { shareText };
}
