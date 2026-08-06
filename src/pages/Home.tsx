import { Header } from "@/components/layout/Header";
import { useDevices } from "@/hooks/useDevices";
import { useFileTransfer } from "@/hooks/useFileTransfer";
import { TransferProgress } from "../components/files/TransferProgress";
import { FileTransferModal } from "@/components/modals/FileTransferModal";
import { SettingsModal } from "@/components/modals/SettingsModal";
import { TransferHistoryModal } from "@/components/modals/TransferHistoryModal";
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
import { useClipboard } from "@/hooks/useClipboard";
import { TextTransferModal } from "@/components/modals/TextTransferModal";
import { useHaptics } from "@/hooks/useHaptics";
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
  const { triggerHaptic } = useHaptics();
  const {
    requestWakeLock: requestReceiverWakeLock,
    releaseWakeLock: releaseReceiverWakeLock,
  } = useWakeLock();

  const [activeTab, setActiveTab] = useState<"receive" | "send">("receive");
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [transferHistory, setTransferHistory] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem("transfer_history");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

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

  const handleClearHistory = () => {
    setTransferHistory([]);
    localStorage.removeItem("transfer_history");
  };

  const handleTabChange = (tab: "receive" | "send") => {
    setActiveTab(tab);
    triggerHaptic("light");
    if (tab === "receive") {
      requestReceiverWakeLock();
    } else {
      releaseReceiverWakeLock();
    }
  };

  const handleFileRemove = (index: number) => {
    triggerHaptic("medium");
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleClipboardClick = async (to: string) => {
    const data = await retrieveClipboard();
    const device = connectedDevices.find((d) => d.socketId === to);

    if (!data || (data.type === "text" && typeof data.content === "string")) {
      setTextModal({
        isOpen: true,
        mode: "send",
        text: typeof data?.content === "string" ? data.content : "",
        deviceName: device?.name || "Unknown Device",
        targetSocketId: to,
      });
    }
  };

  // Event Listeners for Transfer Events
  useEffect(() => {
    const handleTransferRequest = (data: any) => {
      setFileTransferRequest(data);
    };

    const handleTextReceived = (data: { from: string; text: string }) => {
      setTextModal({
        isOpen: true,
        mode: "receive",
        text: data.text,
        deviceName: data.from,
      });
    };

    const unsub1 = eventBus.on(EVENTS.FILE_TRANSFER_REQUEST, handleTransferRequest);
    const unsub2 = eventBus.on(EVENTS.TEXT_TRANSFER_REQUEST, handleTextReceived);

    return () => {
      unsub1();
      unsub2();
    };
  }, []);

  return (
    <div className="relative h-[100dvh] w-full overflow-hidden bg-background text-foreground flex flex-col font-sans select-none">
      <Suspense fallback={null}>
        <AnimatedBackground />
      </Suspense>

      {/* Modals & Sheets */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        currentDevice={currentDevice}
      />

      <TransferHistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        history={transferHistory}
        onClearHistory={handleClearHistory}
      />

      <AnimatePresence>
        {fileTransferRequest && (
          <FileTransferModal
            files={fileTransferRequest.files}
            onConfirm={async () => {
              fileTransferRequest.handleAccept();
              setFileTransferRequest(null);
            }}
            onCancel={() => {
              fileTransferRequest.handleDecline();
              setFileTransferRequest(null);
            }}
          />
        )}
      </AnimatePresence>

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

      {/* Main Layout Container */}
      <div className="relative z-10 h-full w-full flex flex-col bg-background">
        {/* Header Bar */}
        <Header
          activeTab={activeTab}
          onOpenHistory={() => setIsHistoryOpen(true)}
          onOpenSettings={() => setIsSettingsOpen(true)}
        />

        {/* Scrollable Content Layer */}
        <div className="flex-1 overflow-y-auto custom-scrollbar bg-background">
          <div className="min-h-full flex flex-col pt-4 pb-28 w-full max-w-4xl mx-auto">
            {/* View Container */}
            <div className="flex-1 relative w-full">
              <Suspense
                fallback={
                  <div className="w-full h-48 bg-card/50 rounded-2xl animate-pulse" />
                }
              >
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="w-full h-full"
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
                        onClearAll={() => {
                          triggerHaptic("medium");
                          setSelectedFiles([]);
                          toast.success("Selection cleared");
                        }}
                        isSending={isSending}
                      />
                    ) : (
                      <ReceiveView currentDevice={currentDevice} />
                    )}
                  </motion.div>
                </AnimatePresence>
              </Suspense>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Bottom Navigation */}
      <BottomNav activeTab={activeTab} onTabChange={handleTabChange} />

      <TransferProgress
        progress={progress}
        isSending={isSending}
        isPreparing={isPreparing}
        onCancel={cancelTransfer || undefined}
      />
    </div>
  );
}
