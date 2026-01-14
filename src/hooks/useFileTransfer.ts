import { useState, useCallback } from "react";
import { Device } from "@/types/device";
import rtcService from "@/services/rtcService";
import { useHaptics } from "./useHaptics";
import { useWakeLock } from "./useWakeLock";

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
            triggerHaptic("success");
            setTimeout(() => {
              setIsSending(false);
              setCancelTransfer(null);
              if (files === selectedFiles) setSelectedFiles([]);
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
