import { X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { EVENTS } from '@/utils/events';

interface TransferState {
  progress: number;
  isSending: boolean;
  peerId: string;
  speed: number; // bytes per second
  totalSize: number;
  sentSize: number;
}

interface TransferProgressProps {
  progress: number;
  isSending: boolean;
  isPreparing?: boolean;
  onCancel?: () => void;
}

export function TransferProgress({ 
  progress: initialProgress, 
  isSending: isSendingProp, 
  isPreparing = false,
  onCancel 
}: TransferProgressProps) {
  const [transfers, setTransfers] = useState<Map<string, TransferState>>(new Map());
  const [senderState, setSenderState] = useState<TransferState | null>(null);

  const formatSpeed = (bytesPerSecond: number): string => {
    if (bytesPerSecond === 0) return '0 KB/s';
    if (bytesPerSecond > 1024 * 1024) {
      return `${(bytesPerSecond / (1024 * 1024)).toFixed(1)} MB/s`;
    }
    return `${(bytesPerSecond / 1024).toFixed(1)} KB/s`;
  };

  const calculateETA = (totalSize: number, sentSize: number, speed: number): string => {
    if (speed <= 0) return 'Calculating...';
    const remainingBytes = totalSize - sentSize;
    const seconds = remainingBytes / speed;

    if (seconds < 60) return `${Math.ceil(seconds)}s`;
    if (seconds < 3600) return `${Math.ceil(seconds / 60)}m`;
    return `${Math.ceil(seconds / 3600)}h`;
  };

  useEffect(() => {
    // Receiver events
    const handleTransferStart = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      setTransfers(prev => new Map(prev).set(detail.peerId, {
        progress: 0,
        isSending: false,
        peerId: detail.peerId,
        speed: 0,
        totalSize: detail.totalSize,
        sentSize: 0
      }));
    };

    const handleTransferProgress = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      setTransfers(prev => {
        const transfer = prev.get(detail.peerId);
        if (transfer) {
          const newMap = new Map(prev);
          newMap.set(detail.peerId, {
            ...transfer,
            progress: detail.progress,
            speed: detail.speed,
            sentSize: detail.receivedSize,
            totalSize: detail.totalSize || transfer.totalSize
          });

          // Auto-close receiver progress when complete
          if (detail.progress === 100) {
            setTimeout(() => {
              setTransfers(current => {
                const updated = new Map(current);
                updated.delete(detail.peerId);
                return updated;
              });
            }, 3000);
          }

          return newMap;
        }
        return prev;
      });
    };

    const handleTransferCancelled = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      setTransfers(prev => {
        const newMap = new Map(prev);
        newMap.delete(detail.peerId);
        return newMap;
      });
    };

    // Sender events
    const handleSenderStats = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      setSenderState({
        peerId: detail.peerId,
        isSending: true,
        progress: detail.progress,
        speed: detail.speed,
        totalSize: detail.totalSize,
        sentSize: detail.sentSize
      });
    };

    window.addEventListener(EVENTS.FILE_TRANSFER_START, handleTransferStart);
    window.addEventListener(EVENTS.FILE_TRANSFER_PROGRESS, handleTransferProgress);
    window.addEventListener(EVENTS.TRANSFER_CANCEL, handleTransferCancelled);
    window.addEventListener(EVENTS.TRANSFER_STATS_UPDATE, handleSenderStats);

    return () => {
      window.removeEventListener(EVENTS.FILE_TRANSFER_START, handleTransferStart);
      window.removeEventListener(EVENTS.FILE_TRANSFER_PROGRESS, handleTransferProgress);
      window.removeEventListener(EVENTS.TRANSFER_CANCEL, handleTransferCancelled);
      window.removeEventListener(EVENTS.TRANSFER_STATS_UPDATE, handleSenderStats);
    };
  }, []);

  const handleReceiverCancel = async (peerId: string) => {
    window.dispatchEvent(new CustomEvent(EVENTS.TRANSFER_CANCEL, {
      detail: { peerId }
    }));
    setTransfers(prev => {
      const newMap = new Map(prev);
      newMap.delete(peerId);
      return newMap;
    });
  };

  // Reset sender state when prop changes to false
  useEffect(() => {
    if (!isSendingProp) {
      setSenderState(null);
    }
  }, [isSendingProp]);

  // If we are not sending and there are no incoming transfers, don't show anything
  if (!isSendingProp && transfers.size === 0) return null;

  return (
    <div className="fixed inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-md flex items-center justify-center z-50 animate-in fade-in duration-300">
      <div className="flex flex-col gap-6 max-w-md w-full mx-6">
        {/* Sender View */}
        {isSendingProp && (
          <div className="relative overflow-hidden bg-glass-card rounded-[var(--radius-xl)] p-8 shadow-2xl text-card-foreground">
            <div className="flex items-center justify-between mb-6">
              <div>
                <span className="text-[var(--text-lg)] font-bold block mb-1">
                  {isPreparing 
                    ? 'Preparing Files...' 
                    : initialProgress === 100 
                      ? 'Transfer Complete' 
                      : 'Sending Files...'}
                </span>
                <div className="text-[var(--text-sm)] text-muted-foreground">
                  {isPreparing ? (
                    'This might take a moment for large folders'
                  ) : senderState ? (
                    <>
                      {formatSpeed(senderState.speed)}
                      {initialProgress < 100 && ` • ${calculateETA(senderState.totalSize, senderState.sentSize, senderState.speed)} remaining`}
                    </>
                  ) : 'Starting...'}
                </div>
              </div>
              {onCancel && initialProgress < 100 && (
                <button
                  onClick={onCancel}
                  className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors text-muted-foreground hover:text-foreground"
                  aria-label="Cancel sending"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>

            <div className="relative w-full bg-black/5 dark:bg-white/10 rounded-full h-3 overflow-hidden shadow-inner">
              <div
                className="absolute top-0 left-0 h-full bg-primary transition-all duration-300 shadow-[0_0_15px_rgba(var(--primary),0.3)]"
                style={{ width: `${initialProgress}%` }}
              />
            </div>
            <div className="flex justify-between mt-3 text-sm font-medium text-muted-foreground">
              <span>{initialProgress}%</span>
              <span>{senderState ? `${(senderState.sentSize / 1024 / 1024).toFixed(1)} / ${(senderState.totalSize / 1024 / 1024).toFixed(1)} MB` : ''}</span>
            </div>
          </div>
        )}

        {/* Receiver Views (Can be multiple) */}
        {Array.from(transfers.values()).map((transfer) => (
          <div key={transfer.peerId} className="relative overflow-hidden bg-glass-card rounded-[var(--radius-xl)] p-8 shadow-2xl animate-in slide-in-from-bottom-4 duration-500 text-card-foreground">
            <div className="flex items-center justify-between mb-6">
              <div>
                <span className="text-[var(--text-lg)] font-bold block mb-1">
                  {transfer.progress === 100 ? 'Transfer Complete' : 'Receiving Files...'}
                </span>
                <div className="text-[var(--text-sm)] text-muted-foreground">
                  {formatSpeed(transfer.speed)}
                  {transfer.progress < 100 && ` • ${calculateETA(transfer.totalSize, transfer.sentSize, transfer.speed)} remaining`}
                </div>
              </div>
              {transfer.progress < 100 && (
                <button
                  onClick={() => handleReceiverCancel(transfer.peerId)}
                  className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors text-muted-foreground hover:text-foreground"
                  aria-label="Cancel receiving"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>

            <div className="relative w-full bg-black/5 dark:bg-white/10 rounded-full h-3 overflow-hidden shadow-inner">
              <div
                className="absolute top-0 left-0 h-full bg-green-500 transition-all duration-300 shadow-[0_0_15px_rgba(34,197,94,0.3)]"
                style={{ width: `${transfer.progress}%` }}
              />
            </div>
            <div className="flex justify-between mt-3 text-sm font-medium text-muted-foreground">
              <span>{transfer.progress}%</span>
              <span>{`${(transfer.sentSize / 1024 / 1024).toFixed(1)} / ${(transfer.totalSize / 1024 / 1024).toFixed(1)} MB`}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}