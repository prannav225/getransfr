import { X, Zap, Globe, ShieldCheck, Activity } from "lucide-react";
import { useEffect, useState } from "react";
import { EVENTS } from "@/utils/events";
import rtcService from "@/services/rtcService";
import { motion, AnimatePresence } from "framer-motion";

interface TransferState {
  progress: number;
  isSending: boolean;
  peerId: string;
  speed: number; // bytes per second
  totalSize: number;
  sentSize: number;
  connectionType: "direct" | "relay" | "unknown";
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
  onCancel,
}: TransferProgressProps) {
  const [transfers, setTransfers] = useState<Map<string, TransferState>>(
    new Map()
  );
  const [senderState, setSenderState] = useState<TransferState | null>(null);

  const formatSpeed = (bytesPerSecond: number): string => {
    if (bytesPerSecond === 0) return "0 KB/s";
    if (bytesPerSecond > 1024 * 1024 * 1024) {
      return `${(bytesPerSecond / (1024 * 1024 * 1024)).toFixed(1)} GB/s`;
    }
    if (bytesPerSecond > 1024 * 1024) {
      return `${(bytesPerSecond / (1024 * 1024)).toFixed(1)} MB/s`;
    }
    return `${(bytesPerSecond / 1024).toFixed(1)} KB/s`;
  };

  const calculateETA = (
    totalSize: number,
    sentSize: number,
    speed: number
  ): string => {
    if (speed <= 0) return "Calculating...";
    const remainingBytes = totalSize - sentSize;
    if (remainingBytes <= 0) return "Finishing...";

    const seconds = remainingBytes / speed;
    if (seconds < 5) return "Almost done";
    if (seconds < 60) return `~${Math.ceil(seconds)}s remaining`;

    const minutes = Math.ceil(seconds / 60);
    if (minutes < 60)
      return `~${minutes} ${minutes === 1 ? "min" : "mins"} remaining`;

    const hours = (seconds / 3600).toFixed(1);
    return `~${hours}h remaining`;
  };

  useEffect(() => {
    // Receiver events
    const handleTransferStart = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      setTransfers((prev) =>
        new Map(prev).set(detail.peerId, {
          progress: 0,
          isSending: false,
          peerId: detail.peerId,
          speed: 0,
          totalSize: detail.totalSize,
          sentSize: 0,
          connectionType: rtcService.getConnectionType(detail.peerId),
        })
      );
    };

    const handleTransferProgress = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      setTransfers((prev) => {
        const transfer = prev.get(detail.peerId);
        if (transfer) {
          const newMap = new Map(prev);
          newMap.set(detail.peerId, {
            ...transfer,
            progress: detail.progress,
            speed: detail.speed,
            sentSize: detail.receivedSize,
            totalSize: detail.totalSize || transfer.totalSize,
            connectionType:
              transfer.connectionType === "unknown"
                ? rtcService.getConnectionType(detail.peerId)
                : transfer.connectionType,
          });

          // Auto-close receiver progress when complete
          if (detail.progress === 100) {
            setTimeout(() => {
              setTransfers((current) => {
                const updated = new Map(current);
                updated.delete(detail.peerId);
                return updated;
              });
            }, 5000); // 5s for the glow effect to be visible
          }

          return newMap;
        }
        return prev;
      });
    };

    const handleTransferCancelled = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      setTransfers((prev) => {
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
        sentSize: detail.sentSize,
        connectionType: rtcService.getConnectionType(detail.peerId),
      });
    };

    window.addEventListener(EVENTS.FILE_TRANSFER_START, handleTransferStart);
    window.addEventListener(
      EVENTS.FILE_TRANSFER_PROGRESS,
      handleTransferProgress
    );
    window.addEventListener(EVENTS.TRANSFER_CANCEL, handleTransferCancelled);
    window.addEventListener(EVENTS.TRANSFER_STATS_UPDATE, handleSenderStats);

    return () => {
      window.removeEventListener(
        EVENTS.FILE_TRANSFER_START,
        handleTransferStart
      );
      window.removeEventListener(
        EVENTS.FILE_TRANSFER_PROGRESS,
        handleTransferProgress
      );
      window.removeEventListener(
        EVENTS.TRANSFER_CANCEL,
        handleTransferCancelled
      );
      window.removeEventListener(
        EVENTS.TRANSFER_STATS_UPDATE,
        handleSenderStats
      );
    };
  }, []);

  const handleReceiverCancel = async (peerId: string) => {
    window.dispatchEvent(
      new CustomEvent(EVENTS.TRANSFER_CANCEL, {
        detail: { peerId },
      })
    );
    setTransfers((prev) => {
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

  const ConnectionBadge = ({
    type,
  }: {
    type: "direct" | "relay" | "unknown";
  }) => {
    if (type === "unknown") return null;
    return (
      <div
        className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
          type === "direct"
            ? "bg-primary/10 text-primary border-primary/20"
            : "bg-amber-500/10 text-amber-500 border-amber-500/20"
        }`}
      >
        {type === "direct" ? (
          <Zap className="w-3 h-3" />
        ) : (
          <Globe className="w-3 h-3" />
        )}
        {type === "direct" ? "Direct (P2P)" : "Relay"}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-md flex sm:items-center items-end justify-center z-[70] animate-in fade-in duration-300">
      <div className="flex flex-col gap-4 w-full sm:max-w-md sm:mx-6 pb-8 sm:pb-0 px-4 sm:px-0">
        <AnimatePresence>
          {/* Sender View */}
          {isSendingProp && (
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              className={`relative overflow-hidden bg-glass-card rounded-[2.5rem] p-5 sm:p-7 shadow-2xl text-card-foreground transition-all duration-700 ${
                initialProgress === 100
                  ? "ring-2 ring-primary ring-offset-4 ring-offset-background shadow-[0_0_50px_rgba(var(--primary),0.3)]"
                  : ""
              }`}
            >
              {/* Drag Handle for Mobile */}
              <div className="w-10 h-1 bg-muted/20 rounded-full mx-auto mb-4 md:hidden" />

              {initialProgress === 100 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: [0, 1, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="absolute inset-0 bg-primary/5 pointer-events-none"
                />
              )}

              <div className="flex items-center justify-between mb-5 gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className="text-[var(--text-lg)] font-bold truncate">
                      {isPreparing
                        ? "Preparing Files..."
                        : initialProgress === 100
                        ? "Transfer Complete"
                        : "Sending Files..."}
                    </span>
                    {senderState && (
                      <ConnectionBadge type={senderState.connectionType} />
                    )}
                  </div>
                  <div className="text-muted-foreground text-sm flex items-center gap-2 flex-wrap">
                    {isPreparing ? (
                      "This might take a moment for large folders"
                    ) : senderState ? (
                      <>
                        <div className="flex items-center gap-1.5 bg-primary/5 px-2 py-0.5 rounded-md">
                          <Activity className="w-3.5 h-3.5 text-primary animate-pulse" />
                          <span className="font-medium text-primary">
                            {formatSpeed(senderState.speed)}
                          </span>
                        </div>
                        {initialProgress < 100 && (
                          <>
                            <span className="opacity-30 hidden sm:inline">
                              •
                            </span>
                            <span className="text-muted-foreground font-medium">
                              {calculateETA(
                                senderState.totalSize,
                                senderState.sentSize,
                                senderState.speed
                              )}
                            </span>
                          </>
                        )}
                      </>
                    ) : (
                      "Starting..."
                    )}
                  </div>
                </div>
                {onCancel && initialProgress < 100 && (
                  <button
                    onClick={onCancel}
                    className="p-2.5 hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors text-muted-foreground hover:text-foreground shrink-0 border border-transparent hover:border-muted/20"
                    aria-label="Cancel sending"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>

              <div className="relative w-full bg-black/5 dark:bg-white/10 rounded-full h-3 overflow-hidden shadow-inner">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${initialProgress}%` }}
                  className={`absolute top-0 left-0 h-full bg-primary shadow-[0_0_15px_rgba(var(--primary),0.3)] ${
                    initialProgress === 100
                      ? "bg-gradient-to-r from-primary to-primary-foreground"
                      : ""
                  }`}
                />
              </div>
              <div className="flex justify-between mt-4 text-sm font-semibold text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <span
                    className={
                      initialProgress === 100
                        ? "text-primary font-bold scale-110 transition-transform"
                        : ""
                    }
                  >
                    {initialProgress}%
                  </span>
                  {initialProgress === 100 && (
                    <ShieldCheck className="w-4 h-4 text-primary" />
                  )}
                </div>
                <span className="tabular-nums">
                  {senderState
                    ? `${(senderState.sentSize / 1024 / 1024).toFixed(1)} / ${(
                        senderState.totalSize /
                        1024 /
                        1024
                      ).toFixed(1)} MB`
                    : ""}
                </span>
              </div>
            </motion.div>
          )}

          {/* Receiver Views (Can be multiple) */}
          {Array.from(transfers.values()).map((transfer) => (
            <motion.div
              key={transfer.peerId}
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 50, opacity: 0 }}
              className={`relative overflow-hidden bg-glass-card rounded-[2.5rem] p-5 sm:p-7 shadow-2xl text-card-foreground transition-all duration-700 ${
                transfer.progress === 100
                  ? "ring-2 ring-green-500 ring-offset-4 ring-offset-background shadow-[0_0_50px_rgba(34,197,94,0.3)]"
                  : ""
              }`}
            >
              {/* Drag Handle for Mobile */}
              <div className="w-10 h-1 bg-muted/20 rounded-full mx-auto mb-4 md:hidden" />

              {transfer.progress === 100 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: [0, 1, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="absolute inset-0 bg-green-500/5 pointer-events-none"
                />
              )}

              <div className="flex items-center justify-between mb-5 gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className="text-[var(--text-lg)] font-bold truncate">
                      {transfer.progress === 100
                        ? "Transfer Complete"
                        : "Receiving Files..."}
                    </span>
                    <ConnectionBadge type={transfer.connectionType} />
                  </div>
                  <div className="text-muted-foreground text-sm flex items-center gap-2 flex-wrap">
                    <div className="flex items-center gap-1.5 bg-green-500/5 px-2 py-0.5 rounded-md">
                      <Activity className="w-3.5 h-3.5 text-green-500 animate-pulse" />
                      <span className="font-medium text-green-500">
                        {formatSpeed(transfer.speed)}
                      </span>
                    </div>
                    {transfer.progress < 100 && (
                      <>
                        <span className="opacity-30 hidden sm:inline">•</span>
                        <span className="text-muted-foreground font-medium">
                          {calculateETA(
                            transfer.totalSize,
                            transfer.sentSize,
                            transfer.speed
                          )}
                        </span>
                      </>
                    )}
                  </div>
                </div>
                {transfer.progress < 100 && (
                  <button
                    onClick={() => handleReceiverCancel(transfer.peerId)}
                    className="p-2.5 hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors text-muted-foreground hover:text-foreground shrink-0 border border-transparent hover:border-muted/20"
                    aria-label="Cancel receiving"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>

              <div className="relative w-full bg-black/5 dark:bg-white/10 rounded-full h-3 overflow-hidden shadow-inner">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${transfer.progress}%` }}
                  className={`absolute top-0 left-0 h-full bg-green-500 shadow-[0_0_15px_rgba(34,197,94,0.3)] ${
                    transfer.progress === 100
                      ? "bg-gradient-to-r from-green-500 to-emerald-400"
                      : ""
                  }`}
                />
              </div>
              <div className="flex justify-between mt-4 text-sm font-semibold text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <span
                    className={
                      transfer.progress === 100
                        ? "text-green-500 font-bold scale-110 transition-transform"
                        : ""
                    }
                  >
                    {transfer.progress}%
                  </span>
                  {transfer.progress === 100 && (
                    <ShieldCheck className="w-4 h-4 text-green-500" />
                  )}
                </div>
                <span className="tabular-nums">{`${(
                  transfer.sentSize /
                  1024 /
                  1024
                ).toFixed(1)} / ${(transfer.totalSize / 1024 / 1024).toFixed(
                  1
                )} MB`}</span>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
