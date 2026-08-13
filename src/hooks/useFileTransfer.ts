import { useState, useCallback } from "react";
import { Device } from "@/types/device";
import rtcService from "@/services/rtcService";
import { useHaptics } from "./useHaptics";
import { useWakeLock } from "./useWakeLock";
import { addToHistory } from "@/utils/history";

export function useFileTransfer() {
  const { triggerHaptic } = useHaptics();
  const { requestWakeLock, releaseWakeLock } = useWakeLock();
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [isPreparing, setIsPreparing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [cancelTransfer, setCancelTransfer] = useState<(() => void) | null>(
    null
  );

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
      triggerHaptic("light");
    }
  };

  // Zip logic removed – files are sent individually as a batch queue.

  const startTransfer = useCallback(
    async (target: Device, files: File[]) => {
      if (files.length === 0 || isSending) {
        return;
      }

      const peerId = target.socketId;

      setIsSending(true);
      setProgress(0);
      triggerHaptic("medium");
      requestWakeLock();

      try {
        const cancel = await rtcService.sendFiles(peerId, files, {
          onProgress: (p) => {
            setProgress(p);
            if (p === 100) {
              triggerHaptic("success");
              setTimeout(() => {
                setIsSending(false);
                setCancelTransfer(null);
                setSelectedFiles([]);
                files.forEach(file => {
                  addToHistory({
                    fileName: file.name,
                    fileSize: file.size,
                    peerName: target.name,
                    isSent: true,
                    mimeType: file.type
                  });
                });

                releaseWakeLock();
              }, 2000);
            }
          },
          onComplete: () => {
            setProgress(100);
            triggerHaptic("success");
            setTimeout(() => {
              setIsSending(false);
              setCancelTransfer(null);
              setSelectedFiles([]);
              
              files.forEach(file => {
                addToHistory({
                  fileName: file.name,
                  fileSize: file.size,
                  peerName: target.name,
                  isSent: true,
                  mimeType: file.type
                });
              });
              
              releaseWakeLock();
            }, 2000);
          },
          onError: (error) => {
            console.error("Transfer error:", error);
            triggerHaptic("error");
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
          },
        });

        setCancelTransfer(() => cancel);
      } catch (error) {
        console.error("Failed to initialize transfer:", error);
        setIsSending(false);
        setProgress(0);
        releaseWakeLock();
        throw error;
      }
    },
    [selectedFiles, isSending, triggerHaptic, requestWakeLock, releaseWakeLock]
  );

  const handleSendFiles = useCallback(
    async (device: Device) => {
      await startTransfer(device, selectedFiles);
    },
    [selectedFiles, startTransfer]
  );

  return {
    selectedFiles,
    handleFileSelect,
    handleSendFiles,
    isSending,
    isPreparing,
    progress,
    cancelTransfer,
    setSelectedFiles,
    startTransfer,
  };
}
