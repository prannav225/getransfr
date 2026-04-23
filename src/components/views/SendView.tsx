import { FileUpload } from "@/components/files/FileUpload";
import { DeviceList } from "@/components/devices/DeviceList";
import { Device } from "@/types/device";
import { motion, AnimatePresence } from "framer-motion";
import { FileStack, Plus, ArrowLeft } from "lucide-react";
import { useState, useEffect } from "react";

interface SendViewProps {
  selectedFiles: File[];
  handleFileSelect: (event: React.ChangeEvent<HTMLInputElement>) => void;
  handleFileRemove: (index: number) => void;
  onClearAll: () => void;
  currentDevice: Device | null;
  connectedDevices: Device[];
  handleSendFiles: (device: Device) => Promise<void>;
  onClipboardClick: (to: string) => void;
  isSending: boolean;
}

export function SendView({
  selectedFiles,
  handleFileSelect,
  handleFileRemove,
  onClearAll,
  currentDevice,
  connectedDevices,
  handleSendFiles,
  onClipboardClick,
  isSending,
}: SendViewProps) {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const [forceShowPicker, setForceShowPicker] = useState(false);
  const hasFiles = selectedFiles.length > 0;
  const showDevices = hasFiles && !forceShowPicker;

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const slideVariants = {
    initial: { x: 20, opacity: 0 },
    animate: { x: 0, opacity: 1 },
    exit: { x: -20, opacity: 0 },
  };

  const desktopContent = (
    <div className="hidden lg:grid lg:grid-cols-12 gap-10 items-start w-full">
      <div className="lg:col-span-6 border border-slate-200 dark:border-border/10 rounded-2xl bg-card shadow-subtle overflow-hidden">
        <FileUpload
          selectedFiles={selectedFiles}
          onFileSelect={handleFileSelect}
          onFileRemove={handleFileRemove}
          onClearAll={onClearAll}
        />
      </div>
      <div className="lg:col-span-6 rounded-2xl bg-card border border-slate-200 dark:border-border/10 shadow-subtle overflow-hidden">
        <DeviceList
          currentDevice={currentDevice}
          connectedDevices={connectedDevices}
          onSendFiles={handleSendFiles}
          onClipboardClick={onClipboardClick}
          selectedFiles={selectedFiles}
          isSending={isSending}
        />
      </div>
    </div>
  );

  const mobileContent = (
    <div className="flex lg:hidden flex-col flex-1 w-full bg-background">
      <AnimatePresence mode="wait">
        {!showDevices ? (
          <motion.div
            key="picker"
            variants={slideVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="flex-1 flex flex-col pt-1"
          >
            {hasFiles && (
              <div className="px-4 py-2 bg-primary/5 flex items-center justify-between border-b border-slate-200 dark:border-border/10 mt-1">
                <button
                  onClick={() => setForceShowPicker(false)}
                  className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-widest"
                >
                  <ArrowLeft className="w-4 h-4" />
                  View Devices
                </button>
              </div>
            )}
            <FileUpload
              selectedFiles={selectedFiles}
              onFileSelect={handleFileSelect}
              onFileRemove={handleFileRemove}
              onClearAll={onClearAll}
            />
          </motion.div>
        ) : (
          <motion.div
            key="devices"
            variants={slideVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="flex-1 flex flex-col"
          >
            {/* Selection Summary Bar */}
            <div className="mx-4 mt-2 mb-4 p-4 rounded-2xl bg-primary/5 border border-slate-200 dark:border-primary/10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <FileStack className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground font-outfit">
                    {selectedFiles.length} {selectedFiles.length === 1 ? "File" : "Files"}
                  </p>
                  <p className="text-[10px] font-black uppercase tracking-widest text-primary/60">
                    Ready to send
                  </p>
                </div>
              </div>
              <button
                onClick={() => setForceShowPicker(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-[10px] font-black uppercase tracking-widest shadow-lg shadow-primary/20 active:scale-95 transition-transform"
              >
                <Plus className="w-3 h-3" />
                Add
              </button>
            </div>

            <div className="flex-1">
              <DeviceList
                currentDevice={currentDevice}
                connectedDevices={connectedDevices}
                onSendFiles={handleSendFiles}
                onClipboardClick={onClipboardClick}
                selectedFiles={selectedFiles}
                isSending={isSending}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="flex flex-col flex-1 items-stretch min-h-0"
    >
      {isMobile ? mobileContent : desktopContent}
    </motion.div>
  );
}
