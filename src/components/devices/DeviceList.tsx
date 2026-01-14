import {
  Users,
  Clipboard as ClipboardIcon,
  Send,
  Laptop,
  Smartphone,
  Tablet,
} from "lucide-react";
import { Device } from "@/types/device";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";

interface DeviceListProps {
  currentDevice: Device | null;
  connectedDevices: Device[];
  onSendFiles: (device: Device) => Promise<void>;
  onClipboardClick: (to: string) => void;
  selectedFiles: File[];
  isSending: boolean;
}

export function DeviceList({
  currentDevice,
  connectedDevices,
  onSendFiles,
  onClipboardClick,
  selectedFiles,
  isSending,
}: DeviceListProps) {
  const uniqueDevices = Array.from(
    new Map(
      connectedDevices
        .filter(
          (device) =>
            device.id !== currentDevice?.id &&
            device.socketId &&
            device.socketId !== currentDevice?.socketId &&
            device.name
        )
        .map((device) => [device.id, device])
    ).values()
  );

  const handleDeviceClick = async (device: Device) => {
    if (selectedFiles.length === 0) {
      if ("vibrate" in navigator) navigator.vibrate(50);
      toast.error("Please select files to send");
      return;
    }
    if (isSending) return;

    if ("vibrate" in navigator) navigator.vibrate(20);
    try {
      await onSendFiles(device);
    } catch (error) {
      console.error("Failed to send files:", error);
      toast.error("Failed to send files");
    }
  };

  return (
    <div className="relative bg-glass-card rounded-[var(--radius-xl)] p-4 lg:p-8 transition-all duration-300 h-full flex flex-col group/card text-card-foreground">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 lg:mb-8 relative z-10 px-1 sm:px-2 text-card-foreground">
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="relative">
            <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full" />
            <div className="relative p-2 sm:p-3 rounded-[var(--radius-md)] lg:rounded-[var(--radius-lg)] bg-primary/10 ring-1 ring-primary/30">
              <Users className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
            </div>
          </div>
          <div>
            <h2 className="text-device-name text-lg sm:text-xl font-bold tracking-tight">
              Nearby Devices
            </h2>
            <p className="text-status mt-0.5 opacity-80">
              {uniqueDevices.length} device
              {uniqueDevices.length !== 1 ? "s" : ""} found
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 min-h-0 flex flex-col relative">
        <AnimatePresence mode="wait">
          {uniqueDevices.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex-1 flex flex-col items-center justify-center text-center py-6 sm:py-12"
            >
              <div className="relative mb-4 sm:mb-8 text-card-foreground">
                <div className="absolute inset-0 flex items-center justify-center">
                  {[...Array(3)].map((_, i) => (
                    <motion.div
                      key={i}
                      initial={{ scale: 0.8, opacity: 0.5 }}
                      animate={{ scale: 2, opacity: 0 }}
                      transition={{
                        duration: 3,
                        repeat: Infinity,
                        delay: i * 1,
                        ease: "easeOut",
                      }}
                      className="absolute w-16 h-16 sm:w-24 sm:h-24 border-2 border-primary/30 rounded-full"
                    />
                  ))}
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{
                      duration: 10,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                    className="absolute w-20 h-20 sm:w-28 sm:h-28 border border-dashed border-primary/20 rounded-full"
                  />
                </div>
                <div className="relative z-10 bg-black/5 dark:bg-white/5 p-5 sm:p-8 rounded-2xl sm:rounded-[var(--radius-xl)] backdrop-blur-md border border-border shadow-inner-light flex flex-col items-center">
                  <Users className="w-8 h-8 sm:w-12 sm:h-12 text-primary/40 animate-pulse" />
                </div>
              </div>
              <h3 className="text-base sm:text-lg font-bold text-foreground">
                Searching for devices...
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground mt-2 max-w-[180px] sm:max-w-[200px] mx-auto leading-relaxed">
                Open Getransfr on other devices to connect.
              </p>
            </motion.div>
          ) : (
            <motion.div
              key="list"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-3 pr-1 overflow-y-auto custom-scrollbar overflow-x-hidden max-h-[60vh] lg:max-h-none"
            >
              {uniqueDevices.map((device) => (
                <div
                  key={device.id}
                  className="group relative p-3 lg:p-4 rounded-[var(--radius-lg)] border transition-all duration-300 flex items-center gap-3 sm:gap-4 text-card-foreground bg-black/5 dark:bg-white/5 border-border hover:bg-black/10 dark:hover:bg-white/10 shadow-sm"
                >
                  <div className="relative flex-none">
                    <div className="relative">
                      <img
                        src={device.avatar}
                        alt={device.name}
                        className="w-9 h-9 sm:w-11 sm:h-11 rounded-full ring-1 ring-primary/20 shadow-md object-cover"
                      />
                      <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-background shadow-sm" />
                    </div>
                  </div>

                  <div className="flex-1 min-w-0 mx-1">
                    <h3 className="text-device-name text-foreground text-sm sm:text-base lg:text-lg font-bold truncate leading-none">
                      {device.name}
                    </h3>
                    <div className="flex items-center gap-1.5 mt-1.5">
                      {device.ip &&
                      currentDevice?.ip &&
                      device.ip !== "127.0.0.1" &&
                      device.ip !== "::1" &&
                      currentDevice.ip === device.ip ? (
                        <span className="px-1.5 py-0.5 rounded-md bg-green-500/10 text-green-500 text-[10px] font-bold uppercase tracking-wider border border-green-500/20">
                          Local Wifi
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.5 rounded-md bg-amber-500/10 text-amber-500 text-[10px] font-bold uppercase tracking-wider border border-amber-500/20">
                          Remote
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if ("vibrate" in navigator) navigator.vibrate(10);
                        onClipboardClick(device.socketId);
                      }}
                      className="w-10 h-10 sm:w-10 sm:h-10 flex items-center justify-center rounded-full bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-all active:scale-90 shrink-0"
                      title="Share Text"
                    >
                      <ClipboardIcon className="w-4 h-4 sm:w-4 sm:h-4" />
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeviceClick(device);
                      }}
                      disabled={selectedFiles.length === 0 || isSending}
                      className="flex items-center justify-center gap-2 w-10 h-10 sm:w-auto sm:h-auto sm:px-4 sm:py-2 bg-primary text-primary-foreground rounded-full text-xs sm:text-sm font-bold shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 disabled:grayscale disabled:opacity-30 disabled:hover:scale-100 transition-all shrink-0"
                    >
                      <Send className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
                      <span className="hidden sm:inline">Send</span>
                    </button>
                  </div>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer / Tip */}
      {uniqueDevices.length > 0 && (
        <div className="mt-6 pt-6 border-t border-border flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-muted-foreground opacity-50">
          <span>Secure 1-to-1 Transfer</span>
          <div className="flex gap-1.5">
            <Laptop className="w-3 h-3" />
            <Smartphone className="w-3 h-3" />
            <Tablet className="w-3 h-3" />
          </div>
        </div>
      )}
    </div>
  );
}
