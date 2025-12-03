import { useState, useCallback } from 'react';
import { Device } from '@/types/device';
import rtcService from '@/services/rtcService';
import JSZip from 'jszip';

export function useFileTransfer() {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isSending, setIsSending] = useState(false);
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
    const zip = new JSZip();

    for (const file of files) {
      zip.file(file.name, file);
    }

    const zipBlob = await zip.generateAsync({ type: 'blob' });
    return new File([zipBlob], 'shared_files.zip', { type: 'application/zip' });
  };

  const handleSendFiles = useCallback(async (targetDevice: Device) => {
    if (selectedFiles.length === 0 || isSending) {
      return;
    }

    setIsSending(true);
    setProgress(0);

    try {
      const filesToSend = selectedFiles.length > 1
        ? [await createZipFile(selectedFiles)]
        : selectedFiles;

      const cancel = await rtcService.sendFiles(
        targetDevice.socketId,
        filesToSend,
        {
          onProgress: (p) => {
            setProgress(p);
            if (p === 100) {
              // Auto-close after a short delay when progress reaches 100%
              setTimeout(() => {
                setIsSending(false);
                setCancelTransfer(null);
                setSelectedFiles([]);
              }, 2000);
            }
          },
          onComplete: () => {
            // Ensure we show 100% before closing
            setProgress(100);
            setTimeout(() => {
              setIsSending(false);
              setCancelTransfer(null);
              setSelectedFiles([]);
            }, 2000);
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