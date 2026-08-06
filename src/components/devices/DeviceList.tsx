import { Clipboard as ClipboardIcon, Send, Wifi, Smartphone, Globe, Info } from "lucide-react";
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
      toast.error("Please select files to send first");
      return;
    }
    if (isSending) return;

    try {
      await onSendFiles(device);
    } catch (error) {
      console.error("Failed to send files:", error);
      toast.error("Failed to send files");
    }
  };

  return (
    <div className="w-full flex flex-col gap-4">
      {/* Section Header */}
      <div className="flex items-center justify-between px-1">
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          Nearby Devices
        </h3>
        <span className="px-2.5 py-0.5 rounded-full bg-secondary text-[11px] font-bold text-muted-foreground">
          {uniqueDevices.length} Active
        </span>
      </div>

      {/* Main Content Area */}
      <AnimatePresence mode="wait">
        {uniqueDevices.length === 0 ? (
          /* Zero-Device Discovery Helper Card (Matching Mobile App) */
          <motion.div
            key="empty"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex flex-col gap-4 p-5 rounded-2xl bg-card border border-border/40 shadow-sm"
          >
            <div className="flex items-center gap-3">
              <div className="relative flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary">
                <Wifi className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-foreground">
                  Searching for Nearby Devices...
                </h4>
                <p className="text-xs text-muted-foreground">
                  Make sure target devices are on the Receive tab
                </p>
              </div>
            </div>

            {/* Connection Tips Card */}
            <div className="p-3.5 rounded-xl bg-secondary/60 border border-border/30 flex flex-col gap-2.5">
              <div className="flex items-center gap-2 text-xs font-bold text-foreground">
                <Info className="w-4 h-4 text-primary" />
                <span>Connection Tips</span>
              </div>

              <div className="flex flex-col gap-2 text-xs text-muted-foreground pl-1">
                <div className="flex items-start gap-2">
                  <Wifi className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                  <span>Connect both devices to the same Wi-Fi network.</span>
                </div>
                <div className="flex items-start gap-2">
                  <Smartphone className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                  <span>Or connect via Mobile Hotspot if Wi-Fi is unavailable.</span>
                </div>
                <div className="flex items-start gap-2">
                  <Globe className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                  <span>Desktops can connect by visiting <strong>getransfr.com</strong>.</span>
                </div>
              </div>
            </div>
          </motion.div>
        ) : (
          /* Active Devices List */
          <motion.div
            key="list"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col gap-3"
          >
            {uniqueDevices.map((device, idx) => (
              <motion.div
                key={device.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="group flex items-center justify-between p-3.5 rounded-2xl bg-card border border-border/40 hover:border-primary/40 transition-all shadow-sm"
              >
                {/* Device Info */}
                <div className="flex items-center gap-3 min-w-0">
                  <div className="relative shrink-0">
                    <img
                      src={device.avatar}
                      alt={device.name}
                      className="w-11 h-11 rounded-full object-cover bg-secondary"
                    />
                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full border-2 border-card" />
                  </div>

                  <div className="flex flex-col min-w-0">
                    <h4 className="text-sm font-bold text-foreground truncate">
                      {device.name}
                    </h4>
                    <span className="text-xs text-muted-foreground truncate">
                      Tap to send • Direct P2P
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  {/* Clipboard Action */}
                  <button
                    onClick={() => onClipboardClick(device.socketId)}
                    className="w-9 h-9 rounded-xl bg-secondary border border-border/30 flex items-center justify-center text-muted-foreground hover:text-primary transition-all active:scale-95"
                    title="Send Clipboard Text"
                  >
                    <ClipboardIcon className="w-4 h-4" />
                  </button>

                  {/* File Send Action */}
                  <button
                    onClick={() => handleDeviceClick(device)}
                    disabled={selectedFiles.length === 0 || isSending}
                    className="w-9 h-9 rounded-xl bg-primary text-primary-foreground flex items-center justify-center hover:scale-105 active:scale-95 disabled:opacity-40 disabled:hover:scale-100 transition-all shadow-sm"
                    title="Send Selected Files"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
