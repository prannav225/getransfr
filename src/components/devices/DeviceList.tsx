import {
  Users,
  Clipboard as ClipboardIcon,
  Send,
  Wifi,
  Globe,
  Radio,
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
    <div className="relative p-5 lg:p-8 h-full flex flex-col group/card bg-card/10 min-h-[320px]">
      {/* Header - Stays Fixed at Top of Section */}
      <div className="flex items-center justify-between mb-6 relative z-10 px-1 shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-primary/10">
            <Radio className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-bold tracking-tight font-outfit uppercase">
              Nearby Devices
            </h2>
            <div className="flex items-center gap-1.5 opacity-60">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-primary"></span>
              </span>
              <span className="text-[10px] font-bold uppercase tracking-widest">
                {uniqueDevices.length} Available
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content - Scrollable Area */}
      <div className="flex-1 min-h-0 relative z-10 overflow-hidden flex flex-col">
        <AnimatePresence mode="wait">
          {uniqueDevices.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 flex flex-col items-center justify-center text-center py-10 lg:py-16"
            >
              {/* ... empty state content ... */}
              <div className="relative mb-10">
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  {[1, 2, 3].map((i) => (
                    <motion.div
                      key={i}
                      className="absolute rounded-full border border-primary/10 bg-primary/2"
                      initial={{ width: "60px", height: "60px", opacity: 0 }}
                      animate={{
                        width: ["60px", "280px"],
                        height: ["60px", "280px"],
                        opacity: [0, 0.3, 0],
                        scale: [1, 1.1],
                      }}
                      transition={{
                        duration: 4,
                        repeat: Infinity,
                        delay: i * 1,
                        ease: [0.16, 1, 0.3, 1],
                      }}
                    />
                  ))}
                </div>
                <div className="relative z-10 bg-muted/30 p-8 rounded-full border border-border/5 flex flex-col items-center">
                  <Users className="w-10 h-10 text-primary/20" />
                </div>
              </div>
              <h3 className="text-lg font-bold text-foreground font-outfit">
                Looking for devices...
              </h3>
              <p className="text-[10px] text-muted-foreground/40 mt-2 max-w-[200px] mx-auto font-black uppercase tracking-widest leading-relaxed">
                Ensure others are on the Receive screen
              </p>
            </motion.div>
          ) : (
            <motion.div
              key="list"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex-1 overflow-y-auto custom-scrollbar space-y-3 pr-1 pb-10"
            >
              {uniqueDevices.map((device, idx) => (
                <motion.div
                  key={device.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="group relative p-3 rounded-xl border border-border/5 bg-background hover:bg-muted/30 transition-all duration-200 flex items-center gap-4"
                >
                  <div className="relative flex-none">
                    <img
                      src={device.avatar}
                      alt={device.name}
                      className="w-12 h-12 rounded-xl ring-1 ring-primary/10 object-cover"
                    />
                    <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-background" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="text-base font-bold text-foreground truncate font-outfit leading-tight mb-1">
                      {device.name}
                    </h3>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40">
                        Ready to connect
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onClipboardClick(device.socketId);
                      }}
                      className="w-10 h-10 flex items-center justify-center rounded-xl bg-muted text-muted-foreground hover:bg-primary/10 hover:text-primary transition-all"
                    >
                      <ClipboardIcon className="w-4 h-4" />
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeviceClick(device);
                      }}
                      disabled={selectedFiles.length === 0 || isSending}
                      className="w-12 h-12 bg-primary text-primary-foreground rounded-xl shadow-lg shadow-primary/10 hover:scale-105 active:scale-95 disabled:grayscale disabled:opacity-20 transition-all flex items-center justify-center"
                    >
                      <Send className="w-5 h-5" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Info Badge - Tucked at the bottom of the list area */}
      {uniqueDevices.length > 0 && (
        <div className="shrink-0 pt-4 flex items-center justify-center border-t border-border/5 mt-2">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/5 border border-primary/10 opacity-70">
            <div className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-40"></span>
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-primary/60"></span>
            </div>
            <span className="text-[9px] font-black uppercase tracking-[0.15em] text-primary/80">
              Secure Local Discovery
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
