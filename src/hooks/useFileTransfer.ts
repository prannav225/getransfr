import { useState, useCallback } from 'react';
import { Device } from '@/types/device';
import rtcService from '@/services/rtcService';
import JSZip from 'jszip';
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

  const createZipFile = async (files: File[]): Promise<File> => {
    setIsPreparing(true);
    const zip = new JSZip();

    for (const file of files) {
      // Use webkitRelativePath if available to preserve folder structure, 
      // otherwise fall back to the filename
      const path = (file as any).webkitRelativePath || file.name;
      zip.file(path, file);
    }

    const zipBlob = await zip.generateAsync({ type: 'blob' });
    const firstFileName = files[0].name;
    const zipName = files.length > 1 ? (files[0] as any).webkitRelativePath?.split('/')[0] || 'files' : firstFileName;
    const result = new File([zipBlob], `${zipName}.zip`, { type: 'application/zip' });
    setIsPreparing(false);
    return result;
  };

  const handleSendFiles = useCallback(async (targets: Device | Device[]) => {
    if (selectedFiles.length === 0 || isSending) {
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
      const filesWithMetadata = selectedFiles.map(file => {
          if ((file as any).webkitRelativePath) {
              (file as any).path = (file as any).webkitRelativePath;
          }
          return file;
      });

      const filesToSend = selectedFiles.length > 5 // Zip logic threshold
        ? [await createZipFile(selectedFiles)]
        : filesWithMetadata;

      const cancel = await rtcService.sendFiles(
        socketIds,
        filesToSend,
        {
          onProgress: (p) => {
            setProgress(p);
            if (p === 100) {
              playSound('ding');
              if ('vibrate' in navigator) navigator.vibrate(50);
              setTimeout(() => {
                setIsSending(false);
                setCancelTransfer(null);
                setSelectedFiles([]);
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
              setSelectedFiles([]);
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

  return {
    selectedFiles,
    handleFileSelect,
    handleSendFiles,
    isSending,
    isPreparing,
    progress,
    cancelTransfer,
    setSelectedFiles
  };
}