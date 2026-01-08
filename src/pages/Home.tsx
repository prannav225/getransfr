import { Header } from "@/components/layout/Header";
import { useDevices } from "@/hooks/useDevices";
import { useFileTransfer } from "@/hooks/useFileTransfer";
import { TransferProgress } from "../components/files/TransferProgress";
import { FileTransferModal } from "@/components/modals/FileTransferModal";
import { lazy, Suspense, useEffect, useState, useRef } from "react";
import {
  FileMetadata,
  FileSystemHandle,
  FileSystemFileHandle,
  FileSystemDirectoryHandle,
} from "@/types/transfer";
const AnimatedBackground = lazy(() =>
  import("@/components/layout/AnimatedBackground").then((m) => ({
    default: m.AnimatedBackground,
  }))
);
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
const SendView = lazy(() =>
  import("@/components/views/SendView").then((m) => ({ default: m.SendView }))
);
const ReceiveView = lazy(() =>
  import("@/components/views/ReceiveView").then((m) => ({
    default: m.ReceiveView,
  }))
);
import { BottomNav } from "@/components/navigation/BottomNav";
import { Link } from "wouter";
import { useClipboard } from "@/hooks/useClipboard";
import { TextTransferModal } from "@/components/modals/TextTransferModal";
import { useSound } from "@/hooks/useSound";
import { useWakeLock } from "@/hooks/useWakeLock";
import { eventBus, EVENTS } from "@/utils/events";

declare global {
  interface Window {
    showSaveFilePicker?: (options?: unknown) => Promise<FileSystemFileHandle>;
    showDirectoryPicker?: (
      options?: unknown
    ) => Promise<FileSystemDirectoryHandle>;
    launchQueue?: {
      setConsumer: (
        callback: (launchParams: { files: FileSystemFileHandle[] }) => void
      ) => void;
    };
  }
}

interface TransferRequestDetail {
  files: FileMetadata[];
  handleAccept: (handle?: FileSystemHandle | null) => void;
  handleDecline: () => void;
}

interface TransferErrorDetail {
  message: string;
}

interface TextTransferDetail {
  from: string;
  text: string;
}

interface HistoryRecord {
  timestamp: number | string;
  [key: string]: unknown;
}

export function Home() {
  const { currentDevice, connectedDevices } = useDevices();
  const connectedDevicesRef = useRef(connectedDevices);
  useEffect(() => {
    connectedDevicesRef.current = connectedDevices;
  }, [connectedDevices]);

  const { shareText, retrieveClipboard } = useClipboard();
  const {
    selectedFiles,
    handleFileSelect,
    handleSendFiles,
    isSending,
    isPreparing,
    progress,
    cancelTransfer,
    setSelectedFiles,
  } = useFileTransfer();
  const { playSound } = useSound();
  const {
    requestWakeLock: requestReceiverWakeLock,
    releaseWakeLock: releaseReceiverWakeLock,
  } = useWakeLock();

  const handleFileRemove = (index: number) => {
    if ("vibrate" in navigator) navigator.vibrate(30);
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
    toast.success("File removed successfully");
  };

  const handleClipboardClick = async (to: string) => {
    console.log("[Home] handleClipboardClick for:", to);
    const data = await retrieveClipboard();
    const device = connectedDevices.find((d) => d.socketId === to);

    if (!data) {
      // Fallback/Empty
      setTextModal({
        isOpen: true,
        mode: "send",
        text: "",
        deviceName: device?.name || "Unknown Device",
        targetSocketId: to,
      });
      return;
    }

    if (data && data.type === "text" && typeof data.content === "string") {
      setTextModal({
        isOpen: true,
        mode: "send",
        text: data.content,
        deviceName: device?.name || "Unknown Device",
        targetSocketId: to,
      });
    }
  };

  const [textModal, setTextModal] = useState<{
    isOpen: boolean;
    mode: "send" | "receive";
    text: string;
    deviceName: string;
    targetSocketId?: string;
  }>({
    isOpen: false,
    mode: "send",
    text: "",
    deviceName: "",
  });

  const [fileTransferRequest, setFileTransferRequest] = useState<{
    files: FileMetadata[];
    handleAccept: (handle?: FileSystemHandle | null) => void;
    handleDecline: () => void;
  } | null>(null);

  useEffect(() => {
    const checkSharedFiles = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.has("share-target")) {
        try {
          const db = await new Promise<IDBDatabase>((resolve, reject) => {
            const request = indexedDB.open("SharedFilesDB", 2);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
          });

          const files = await new Promise<File[] | null>((resolve) => {
            const transaction = db.transaction("files", "readonly");
            const request = transaction
              .objectStore("files")
              .get("pending_share");
            request.onsuccess = () => resolve(request.result);
          });

          if (files && files.length > 0) {
            if ("vibrate" in navigator) navigator.vibrate([30, 80, 30]);
            const event = {
              target: {
                files: Object.assign([], files),
              },
            } as unknown as React.ChangeEvent<HTMLInputElement>;
            handleFileSelect(event);
            toast.success(`${files.length} file(s) shared with Getransfr`);

            // Clear the storage
            const deleteTx = db.transaction("files", "readwrite");
            deleteTx.objectStore("files").delete("pending_share");
          }

          // Clean URL
          window.history.replaceState({}, document.title, "/");
        } catch (err) {
          console.error("[Home] Failed to retrieve shared files:", err);
        }
      }
    };

    checkSharedFiles();

    // Standard File Handling API (Chrome/Edge native files)
    if ("launchQueue" in window && window.launchQueue) {
      window.launchQueue.setConsumer(async (launchParams) => {
        if (launchParams.files && launchParams.files.length > 0) {
          const files = await Promise.all(
            launchParams.files.map((fileHandle) => fileHandle.getFile())
          );

          if (files.length > 0) {
            if ("vibrate" in navigator) navigator.vibrate([30, 80, 30]); // High-precision double-pulse for shared files
            const event = {
              target: {
                files: Object.assign([], files),
              },
            } as unknown as React.ChangeEvent<HTMLInputElement>;
            handleFileSelect(event);
            toast.success(`${files.length} file(s) shared with Getransfr`);
          }
        }
      });
    }

    const handleTransferRequest = (data: TransferRequestDetail) => {
      const { files, handleAccept, handleDecline } = data;

      if (typeof handleAccept !== "function") {
        console.error("[Home] handleAccept is MISSING!", data);
      }

      playSound("ding");
      if ("vibrate" in navigator) navigator.vibrate([100, 50, 100]); // Attention blip
      setFileTransferRequest({
        files,
        handleAccept: handleAccept,
        handleDecline,
      });
    };

    const handleTransferError = (data: TransferErrorDetail) => {
      const { message } = data;
      toast.error(message);
    };

    const handleTextTransferRequest = (data: TextTransferDetail) => {
      const { from, text } = data;
      const sender = connectedDevicesRef.current.find(
        (d) => d.socketId === from
      );
      playSound("ding");
      if ("vibrate" in navigator) navigator.vibrate(60);
      setTextModal({
        isOpen: true,
        mode: "receive",
        text,
        deviceName: sender?.name || "Unknown Device",
        targetSocketId: from,
      });
    };

    // Cleanup old history
    const savedHistory = localStorage.getItem("transferHistory");
    if (savedHistory) {
      try {
        const history = JSON.parse(savedHistory);
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const filtered = history.filter(
          (record: HistoryRecord) => new Date(record.timestamp) > sevenDaysAgo
        );
        if (filtered.length !== history.length) {
          localStorage.setItem("transferHistory", JSON.stringify(filtered));
        }
      } catch {
        /* ignore */
      }
    }

    const handleTransferComplete = () => {
      releaseReceiverWakeLock();
      if (Notification.permission === "granted") {
        new Notification("Transfer Complete", {
          body: "Files have been transferred successfully.",
          icon: "/G.png",
        });
      }
    };

    const handleTransferStart = () => {
      requestReceiverWakeLock();
    };

    const unsubFileTransfer = eventBus.on(
      EVENTS.FILE_TRANSFER_REQUEST,
      handleTransferRequest
    );
    const unsubFileError = eventBus.on(
      EVENTS.FILE_TRANSFER_ERROR,
      (data: TransferErrorDetail) => {
        handleTransferError(data);
        releaseReceiverWakeLock();
      }
    );
    const unsubFileComplete = eventBus.on(
      EVENTS.FILE_TRANSFER_COMPLETE,
      handleTransferComplete
    );
    const unsubTextTransfer = eventBus.on(
      EVENTS.TEXT_TRANSFER_REQUEST,
      handleTextTransferRequest
    );
    const unsubFileStart = eventBus.on(
      EVENTS.FILE_TRANSFER_START,
      handleTransferStart
    );

    return () => {
      unsubFileTransfer();
      unsubFileError();
      unsubFileComplete();
      unsubTextTransfer();
      unsubFileStart();
      releaseReceiverWakeLock();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array means these listeners are set once and remain stable

  // Stagger animation for children
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.12,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring" as const,
        stiffness: 100,
      },
    },
  };

  const [activeTab, setActiveTab] = useState<"send" | "receive">("send");

  const handleTabChange = (tab: "send" | "receive") => {
    if (tab === activeTab) return;
    setActiveTab(tab);
  };

  const slideVariants = {
    enter: {
      opacity: 0,
      scale: 0.98,
      filter: "blur(10px)",
    },
    center: {
      zIndex: 1,
      opacity: 1,
      scale: 1,
      filter: "blur(0px)",
    },
    exit: {
      zIndex: 0,
      opacity: 0,
      scale: 1.02,
      filter: "blur(10px)",
    },
  };

  const slideTransition = {
    opacity: { duration: 0.35 },
    scale: {
      duration: 0.4,
      ease: [0.16, 1, 0.3, 1] as [number, number, number, number],
    },
    filter: { duration: 0.35 },
  };

  return (
    <div className="relative h-[100dvh] font-sans overflow-hidden">
      <Suspense fallback={<div className="fixed inset-0 bg-background" />}>
        <AnimatedBackground />
      </Suspense>

      {/* Overlays and Modals - High Priority */}
      <div className="fixed inset-0 z-[100] pointer-events-none">
        <AnimatePresence>
          {fileTransferRequest && (
            <div className="pointer-events-auto">
              <FileTransferModal
                files={fileTransferRequest.files}
                onConfirm={async () => {
                  const files = fileTransferRequest.files;
                  let handle: FileSystemHandle | undefined = undefined;

                  // Try to get File System Handle immediately within User Gesture
                  if (
                    "showSaveFilePicker" in window &&
                    window.showSaveFilePicker
                  ) {
                    try {
                      if (files.length === 1) {
                        handle = await window.showSaveFilePicker({
                          suggestedName: files[0].name,
                        });
                      } else if (
                        files.length > 1 &&
                        window.showDirectoryPicker
                      ) {
                        handle = await window.showDirectoryPicker();
                      }
                    } catch (err) {
                      console.log(
                        "[Home] File picker cancelled or failed:",
                        err
                      );
                      // Proceed without handle (will fallback to memory/download)
                    }
                  }

                  if (typeof fileTransferRequest.handleAccept === "function") {
                    fileTransferRequest.handleAccept(handle);
                  }
                  setFileTransferRequest(null);
                  toast.success("Transfer accepted");
                }}
                onCancel={() => {
                  if (typeof fileTransferRequest.handleDecline === "function") {
                    fileTransferRequest.handleDecline();
                  }
                  setFileTransferRequest(null);
                  toast("Transfer declined");
                }}
              />
            </div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {textModal.isOpen && (
          <div className="fixed inset-0 z-[101]">
            <TextTransferModal
              mode={textModal.mode}
              deviceName={textModal.deviceName}
              initialText={textModal.text}
              onAction={(text) => {
                if (
                  textModal.mode === "send" &&
                  textModal.targetSocketId &&
                  text
                ) {
                  shareText(textModal.targetSocketId, text);
                }
              }}
              onClose={() =>
                setTextModal((prev) => ({ ...prev, isOpen: false }))
              }
            />
          </div>
        )}
      </AnimatePresence>

      <TransferProgress
        progress={progress}
        isSending={isSending}
        isPreparing={isPreparing}
        onCancel={cancelTransfer || undefined}
      />

      {/* Main Layout Container */}
      <motion.div
        className="container mx-auto max-w-6xl relative z-10 h-full"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Header - Fixed/Absolute Glass Layer */}
        <motion.div
          variants={itemVariants}
          className="absolute top-0 left-0 right-0 z-40 p-4 sm:p-6 pt-[max(0.75rem,env(safe-area-inset-top))] pointer-events-none"
        >
          <div className="pointer-events-auto">
            <Header currentDevice={currentDevice} />
          </div>
        </motion.div>

        {/* Scrollable Content Layer - Full Height */}
        <div className="absolute inset-0 overflow-y-auto custom-scrollbar">
          {/* Content Wrapper with Space for Header */}
          <div className="min-h-full flex flex-col p-4 sm:p-6 pt-[9rem] sm:pt-28 pb-32">
            {/* View Container - Responsive Cross-Fade */}
            <div className="flex-1 relative">
              <Suspense
                fallback={
                  <div className="w-full h-48 bg-white/5 rounded-[var(--radius-xl)] animate-pulse" />
                }
              >
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeTab}
                    variants={slideVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={slideTransition}
                    className="w-full h-full transform-gpu overflow-x-hidden px-1"
                  >
                    {activeTab === "send" ? (
                      <SendView
                        currentDevice={currentDevice}
                        connectedDevices={connectedDevices}
                        handleSendFiles={handleSendFiles}
                        onClipboardClick={handleClipboardClick}
                        selectedFiles={selectedFiles}
                        handleFileSelect={handleFileSelect}
                        handleFileRemove={handleFileRemove}
                        isSending={isSending}
                      />
                    ) : (
                      <ReceiveView currentDevice={currentDevice} />
                    )}
                  </motion.div>
                </AnimatePresence>
              </Suspense>
            </div>

            {/* Footer */}
            <div className="py-8 text-center space-y-2 relative z-0 flex-none">
              <p className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-muted-foreground/60">
                Designed for Speed. Built with privacy in mind.
              </p>
              <p className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-muted-foreground/50">
                Send. Copy. Done
              </p>
              <div className="flex items-center justify-center gap-4 mt-4">
                <Link
                  href="/privacy"
                  className="text-muted-foreground/40 hover:text-primary transition-colors text-[10px] font-bold uppercase tracking-widest block"
                >
                  Privacy Policy
                </Link>
                <div className="w-1 h-1 rounded-full bg-muted-foreground/20" />
                <Link
                  href="/support"
                  className="text-muted-foreground/40 hover:text-amber-500 transition-colors text-[10px] font-bold uppercase tracking-widest block"
                >
                  Support
                </Link>
              </div>
            </div>

            {/* Scroll Spacer for Bottom Nav */}
            <div className="h-16 sm:h-24 flex-none" />
          </div>
        </div>
      </motion.div>

      {/* Bottom Navigation */}
      <BottomNav activeTab={activeTab} onTabChange={handleTabChange} />
    </div>
  );
}
