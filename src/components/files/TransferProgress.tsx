import { X } from 'lucide-react';
import { useEffect, useState } from 'react';

interface TransferState {
  progress: number;
  isSending: boolean;
  peerId: string;
}

interface TransferProgressProps {
  progress: number;
  isSending: boolean;
  onCancel?: () => void;
}

export function TransferProgress({ progress: sendProgress, isSending: isSendingProp, onCancel }: TransferProgressProps) {
  const [transfers, setTransfers] = useState<Map<string, TransferState>>(new Map());

  useEffect(() => {
    const handleTransferStart = (e: CustomEvent<{ peerId: string; totalSize: number }>) => {
      setTransfers(prev => new Map(prev).set(e.detail.peerId, { 
        progress: 0, 
        isSending: false, 
        peerId: e.detail.peerId 
      }));
    };

    const handleTransferProgress = (e: CustomEvent<{ peerId: string; progress: number }>) => {
      setTransfers(prev => {
        const transfer = prev.get(e.detail.peerId);
        if (transfer) {
          const newMap = new Map(prev);
          newMap.set(e.detail.peerId, { ...transfer, progress: e.detail.progress });
          return newMap;
        }
        return prev;
      });
    };

    const handleTransferCancelled = (e: CustomEvent<{ peerId: string }>) => {
      setTransfers(prev => {
        const newMap = new Map(prev);
        newMap.delete(e.detail.peerId);
        return newMap;
      });
    };

    window.addEventListener('file-transfer-start', handleTransferStart as EventListener);
    window.addEventListener('file-transfer-progress', handleTransferProgress as EventListener);
    window.addEventListener('file-transfer-cancelled', handleTransferCancelled as EventListener);

    return () => {
      window.removeEventListener('file-transfer-start', handleTransferStart as EventListener);
      window.removeEventListener('file-transfer-progress', handleTransferProgress as EventListener);
      window.removeEventListener('file-transfer-cancelled', handleTransferCancelled as EventListener);
    };
  }, []);

  const handleReceiverCancel = (peerId: string) => {
    window.dispatchEvent(new CustomEvent('file-transfer-cancel', {
      detail: { peerId }
    }));
  };

  if (!isSendingProp && transfers.size === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 flex flex-col gap-2">
      {isSendingProp && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 w-80">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
              {sendProgress === 100 ? 'Transfer Complete' : 'Sending Files...'}
            </span>
            {onCancel && sendProgress < 100 && (
              <button
                onClick={onCancel}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                aria-label="Cancel sending"
              >
                <X className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              </button>
            )}
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 overflow-hidden">
            <div
              className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
              style={{ width: `${sendProgress}%` }}
            />
          </div>
          <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {sendProgress}%
          </span>
        </div>
      )}

      {Array.from(transfers.values()).map((transfer) => (
        <div key={transfer.peerId} className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 w-80">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
              {transfer.progress === 100 ? 'Transfer Complete' : 'Receiving Files...'}
            </span>
            {transfer.progress < 100 && (
              <button
                onClick={() => handleReceiverCancel(transfer.peerId)}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                aria-label="Cancel receiving"
              >
                <X className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              </button>
            )}
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 overflow-hidden">
            <div
              className="bg-green-600 h-2.5 rounded-full transition-all duration-300"
              style={{ width: `${transfer.progress}%` }}
            />
          </div>
          <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {transfer.progress}%
          </span>
        </div>
      ))}
    </div>
  );
}