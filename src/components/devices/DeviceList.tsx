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
    <div className="relative bg-glass-card rounded-[2.5rem] p-4 lg:p-6 transition-all duration-300 h-full flex flex-col group/card overflow-hidden">
      {/* Background Decorative Element */}
      <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 bg-primary/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between mb-6 relative z-10 px-2 lg:px-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-2xl bg-primary/10 ring-1 ring-primary/20">
            <Radio className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight font-outfit">
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

      {/* Main Content */}
      <div className="flex-1 min-h-0 flex flex-col relative z-10">
        <AnimatePresence mode="wait">
          {uniqueDevices.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex-1 flex flex-col items-center justify-center text-center py-16 lg:py-20"
            >
              <div className="relative mb-12">
                {/* Sonar Pulse - High Fidelity Waves (matching ReceiveView) */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  {[1, 2, 3, 4].map((i) => (
                    <motion.div
                      key={i}
                      className="absolute rounded-full border border-primary/20 bg-primary/2"
                      initial={{ width: "80px", height: "80px", opacity: 0 }}
                      animate={{
                        width: ["80px", "320px"],
                        height: ["80px", "320px"],
                        opacity: [0, 0.4, 0],
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
                <div className="relative z-10 bg-white/5 dark:bg-white/5 p-8 rounded-[2rem] backdrop-blur-md border border-border/50 shadow-inner flex flex-col items-center [transform:translateZ(0)]">
                  <Users className="w-12 h-12 text-primary/30 animate-pulse" />
                </div>
              </div>
              <h3 className="text-xl lg:text-2xl font-bold text-foreground font-outfit">
                Looking for nearby devices
              </h3>
              <p className="text-sm text-muted-foreground mt-3 max-w-[240px] mx-auto leading-relaxed font-medium font-inter">
                Make sure the other device is on the Receive screen.
              </p>
            </motion.div>
          ) : (
            <motion.div
              key="list"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-3 pr-1 overflow-y-auto custom-scrollbar overflow-x-hidden"
            >
              {uniqueDevices.map((device, idx) => (
                <motion.div
                  key={device.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="group relative p-3 rounded-[1.5rem] border transition-all duration-300 flex items-center gap-4 bg-black/5 dark:bg-white/5 border-border/50 hover:bg-black/10 dark:hover:bg-white/10 hover:border-border shadow-sm active:scale-[0.98]"
                >
                  <div className="relative flex-none">
                    <div className="relative">
                      <img
                        src={device.avatar}
                        alt={device.name}
                        className="w-12 h-12 rounded-2xl ring-1 ring-primary/20 shadow-md object-cover transform transition-transform group-hover:scale-105"
                      />
                      <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-background shadow-sm" />
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="text-base font-bold text-foreground truncate font-outfit leading-tight mb-1">
                      {device.name}
                    </h3>
                    <div className="flex items-center gap-1.5">
                      {device.ip &&
                      currentDevice?.ip &&
                      device.ip !== "127.0.0.1" &&
                      device.ip !== "::1" &&
                      currentDevice.ip === device.ip ? (
                        <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-500/10 text-green-500 border border-green-500/20">
                          <Wifi className="w-2.5 h-2.5" />
                          <span className="text-[9px] font-bold uppercase tracking-wider">
                            Local Wifi
                          </span>
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20">
                          <Globe className="w-2.5 h-2.5" />
                          <span className="text-[9px] font-bold uppercase tracking-wider">
                            Remote
                          </span>
                        </div>
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
                      className="w-10 h-10 flex items-center justify-center rounded-2xl bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-all active:scale-90"
                      title="Share Text"
                    >
                      <ClipboardIcon className="w-4 h-4" />
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeviceClick(device);
                      }}
                      disabled={selectedFiles.length === 0 || isSending}
                      className="flex items-center justify-center w-12 h-12 bg-primary text-primary-foreground rounded-2xl shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 disabled:grayscale disabled:opacity-30 disabled:hover:scale-100 transition-all relative overflow-hidden group/btn"
                    >
                      <Send className="w-5 h-5 relative z-10 transition-transform group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5" />
                      <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover/btn:translate-x-[100%] transition-transform duration-700" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Device Info Badge */}
      {uniqueDevices.length > 0 && (
        <div className="mt-auto pt-6 flex items-center justify-center">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/5 border border-primary/10 opacity-70 hover:opacity-100 transition-opacity duration-300">
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
