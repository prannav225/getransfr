import { useState, useCallback } from 'react';
import { Device } from '@/types/device';
import rtcService from '@/services/rtcService';
// import JSZip from 'jszip'; // Removed – batch queue sends files individually
import { useSound } from './useSound';
import { useWakeLock } from './useWakeLock';

export function useFileTransfer() {
  const { playSound } = useSound();
  const { requestWakeLock, releaseWakeLock } = useWakeLock();
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [isPreparing, setIsPreparing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [cancelTransfer, setCancelTransfer] = useState<(() => void) | null>(null);

  const validateFiles = (files: File[]): boolean => {
    return files.length > 0;
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const files = Array.from(event.target.files);
      if (!validateFiles(files)) {
        return;
      }
      setSelectedFiles(files);
    }
  };

// Zip logic removed – files are sent individually as a batch queue.


  const startTransfer = useCallback(async (targets: Device | Device[], files: File[]) => {
    if (files.length === 0 || isSending) {
      return;
    }

    const targetDevices = Array.isArray(targets) ? targets : [targets];
    const socketIds = targetDevices.map(d => d.socketId);

    setIsSending(true);
    setProgress(0);
    playSound('whoosh');
    requestWakeLock();
    if ('vibrate' in navigator) navigator.vibrate([10, 50, 10]);

    try {
      // Enrichment: Add path metadata for raw files if they have webkitRelativePath
      const filesWithMetadata = files.map(file => {
          if ((file as any).webkitRelativePath) {
              (file as any).path = (file as any).webkitRelativePath;
          }
          return file;
      });

      const cancel = await rtcService.sendFiles(
        socketIds,
        filesWithMetadata,
        {
          onProgress: (p) => {
            setProgress(p);
            if (p === 100) {
              playSound('ding');
              if ('vibrate' in navigator) navigator.vibrate(50);
              setTimeout(() => {
                setIsSending(false);
                setCancelTransfer(null);
                setSelectedFiles([]); // Clear selection on success? Or just leave it?
                // If we are sending clipboard files, we probably shouldn't clear selectedFiles if they were separate.
                // But startTransfer doesn't know if it's clipboard or not.
                // Compatibility: handleSendFiles clears selectedFiles.
                // We will move setSelectedFiles([]) to handleSendFiles's onComplete logic if possible, OR just clear it here safely.
                // If files !== selectedFiles, maybe don't clear selectedFiles?
                // Let's assume clear is fine for now or check equality.
                if (files === selectedFiles) setSelectedFiles([]);
                
                releaseWakeLock();
              }, 2000);
            }
          },
          onComplete: () => {
            setProgress(100);
            playSound('ding');
            if ('vibrate' in navigator) navigator.vibrate(50);
            setTimeout(() => {
              setIsSending(false);
              setCancelTransfer(null);
              if (files === selectedFiles) setSelectedFiles([]);
              releaseWakeLock();
            }, 2000);
          },
          onError: (error) => {
            console.error('Transfer error:', error);
            playSound('error');
            setIsSending(false);
            setProgress(0);
            setCancelTransfer(null);
            releaseWakeLock();
          },
          onCancel: () => {
            setIsSending(false);
            setIsPreparing(false);
            setProgress(0);
            setCancelTransfer(null);
            releaseWakeLock();
          }
        }
      );

      setCancelTransfer(() => cancel);
    } catch (error) {
      console.error('Failed to initialize transfer:', error);
      setIsSending(false);
      setProgress(0);
      releaseWakeLock();
      throw error;
    }
  }, [selectedFiles, isSending]);

  const handleSendFiles = useCallback(async (targets: Device | Device[]) => {
      await startTransfer(targets, selectedFiles);
  }, [selectedFiles, startTransfer]);

  return {
    selectedFiles,
    handleFileSelect,
    handleSendFiles,
    isSending,
    isPreparing,
    progress,
    cancelTransfer,
    setSelectedFiles,
    startTransfer
  };
}