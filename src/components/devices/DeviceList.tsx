import { useState } from "react";
import { Clipboard as ClipboardIcon, Send, Wifi, Smartphone, Globe, RefreshCw, Loader2, Radar } from "lucide-react";
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
  onRefreshDevices?: () => void;
  isRefreshing?: boolean;
}

export function DeviceList({
  currentDevice,
  connectedDevices,
  onSendFiles,
  onClipboardClick,
  selectedFiles,
  isSending,
  onRefreshDevices,
  isRefreshing = false,
}: DeviceListProps) {
  const [sendingDeviceId, setSendingDeviceId] = useState<string | null>(null);

  const uniqueDevices = Array.from(
    new Map(
      connectedDevices
        .filter(
          (device) =>
            device &&
            device.id &&
            device.id !== currentDevice?.id &&
            device.socketId &&
            device.socketId !== currentDevice?.socketId &&
            device.name &&
            device.name !== "Unknown Device"
        )
        .map((device) => [device.id, device])
    ).values()
  );

  const handleDeviceClick = async (device: Device) => {
    if (selectedFiles.length === 0) {
      toast.error("Please select files to send first (Step 1 above)");
      return;
    }
    if (isSending || sendingDeviceId) return;

    try {
      setSendingDeviceId(device.id);
      const loadingToast = toast.loading(`Connecting to ${device.name}...`);
      await onSendFiles(device);
      toast.dismiss(loadingToast);
    } catch (error) {
      console.error("Failed to send files:", error);
      toast.error(`Failed to connect to ${device.name}`);
    } finally {
      setSendingDeviceId(null);
    }
  };

  return (
    <div className="w-full flex flex-col gap-4">
      {/* Section Header */}
      {/* Section Header */}
      <div className="flex items-center justify-between px-1 gap-2">
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground truncate shrink">
          STEP 2 • RECEIVER DEVICE
        </h3>

        <div className="flex items-center gap-2 shrink-0">
          {onRefreshDevices && (
            <button
              onClick={() => {
                onRefreshDevices();
                toast.success("Scanning for nearby devices...", { id: "refresh-toast" });
              }}
              disabled={isRefreshing}
              className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 hover:bg-primary/20 border border-primary/20 text-primary transition-all active:scale-95 text-xs font-semibold h-7 leading-none"
              title="Refresh nearby devices"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
              <span>{isRefreshing ? "Scanning..." : "Refresh"}</span>
            </button>
          )}

          <span className="flex items-center justify-center px-3 py-1 rounded-full bg-secondary border border-border/30 text-xs font-semibold text-muted-foreground h-7 leading-none">
            {uniqueDevices.length} Active
          </span>
        </div>
      </div>

      {/* Main Content Area */}
      <AnimatePresence mode="wait">
        {uniqueDevices.length === 0 ? (
          /* Zero-Device Discovery Helper Card */
          <motion.div
            key="empty"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex flex-col gap-6"
          >
            <div className="flex flex-col items-center text-center mt-4 mb-2">
              <div className="flex items-center justify-center w-16 h-16 rounded-full bg-card border border-border/40 shadow-sm mb-4">
                <Radar className="w-8 h-8 text-primary animate-pulse" />
              </div>
              <h4 className="text-[15px] font-bold text-foreground mb-1">
                Searching for Nearby Devices...
              </h4>
              <p className="text-[12px] text-muted-foreground">
                Open Getransfr on nearby phone or computer
              </p>
            </div>

            {/* Connection Tips Card */}
            <div className="w-full p-4 rounded-2xl bg-card border border-border/40 flex flex-col gap-3 shadow-sm">
              <div className="flex items-center gap-2 text-[13px] font-bold text-foreground mb-1">
                <Wifi className="w-4 h-4 text-primary" />
                <span>Connection Tips</span>
              </div>

              <div className="flex flex-col gap-3 text-xs text-muted-foreground">
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center shrink-0">
                    <Wifi className="w-3 h-3 text-primary" />
                  </div>
                  <span>Connect both devices to the same Wi-Fi network.</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center shrink-0">
                    <Smartphone className="w-3 h-3 text-primary" />
                  </div>
                  <span>Or connect via Mobile Hotspot if Wi-Fi is unavailable.</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center shrink-0">
                    <Globe className="w-3 h-3 text-primary" />
                  </div>
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
            {uniqueDevices.map((device, idx) => {
              const isTargetSending = sendingDeviceId === device.id;

              return (
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
                        {isTargetSending ? "Connecting & sending..." : "Tap to send • Direct P2P"}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    {/* Clipboard Action */}
                    <button
                      onClick={() => onClipboardClick(device.socketId)}
                      disabled={isSending || isTargetSending}
                      className="w-9 h-9 rounded-xl bg-secondary border border-border/30 flex items-center justify-center text-muted-foreground hover:text-primary transition-all active:scale-95 disabled:opacity-40"
                      title="Send Clipboard Text"
                    >
                      <ClipboardIcon className="w-4 h-4" />
                    </button>

                    {/* File Send Action */}
                    <button
                      onClick={() => handleDeviceClick(device)}
                      disabled={selectedFiles.length === 0 || isSending || isTargetSending}
                      className="w-9 h-9 rounded-xl bg-primary text-primary-foreground flex items-center justify-center hover:scale-105 active:scale-95 disabled:opacity-40 disabled:hover:scale-100 transition-all shadow-sm"
                      title="Send Selected Files"
                    >
                      {isTargetSending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
