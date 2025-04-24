import { useState, useCallback } from 'react';
import { Device } from '@/types/device';
import { rtcService } from '@/services/rtcService';

export function useFileTransfer() {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [progress, setProgress] = useState(0);
  const [cancelTransfer, setCancelTransfer] = useState<(() => void) | null>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setSelectedFiles(Array.from(event.target.files));
    }
  };

  const handleSendFiles = useCallback(async (targetDevice: Device) => {
    if (selectedFiles.length === 0 || isSending) return;

    setIsSending(true);
    setProgress(0);

    try {
      const cancel = await rtcService.sendFiles(
        targetDevice.socketId,
        selectedFiles,
        {
          onProgress: setProgress,
          onComplete: () => {
            setIsSending(false);
            setProgress(100);
            setCancelTransfer(null);
            setSelectedFiles([]);
          },
          onError: (error) => {
            console.error('Transfer error:', error);
            setIsSending(false);
            setProgress(0);
            setCancelTransfer(null);
          },
          onCancel: () => {
            setIsSending(false);
            setProgress(0);
            setCancelTransfer(null);
          }
        }
      );

      setCancelTransfer(() => cancel);
    } catch (error) {
      console.error('Failed to initialize transfer:', error);
      setIsSending(false);
      setProgress(0);
      throw error;
    }
  }, [selectedFiles, isSending]);

  return {
    selectedFiles,
    handleFileSelect,
    handleSendFiles,
    isSending,
    progress,
    cancelTransfer,
    setSelectedFiles
  };
}