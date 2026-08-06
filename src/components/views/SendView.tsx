import { FileUpload } from "@/components/files/FileUpload";
import { DeviceList } from "@/components/devices/DeviceList";
import { Device } from "@/types/device";
import { motion } from "framer-motion";

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
  const avatarUrl =
    currentDevice?.avatar ||
    `https://api.dicebear.com/7.x/bottts/svg?seed=TitaniumEclipse`;
  const deviceName = currentDevice?.name || "Titanium Eclipse";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-xl mx-auto px-4 py-4 flex flex-col gap-5 pb-24"
    >
      {/* Current Device Identity Badge (Matching Mobile App) */}
      <div className="flex justify-center">
        <div className="flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-card border border-border/40 shadow-sm">
          <div className="relative">
            <img
              src={avatarUrl}
              alt={deviceName}
              className="w-5 h-5 rounded-full object-cover bg-secondary"
            />
            <span className="absolute bottom-0 right-0 w-1.5 h-1.5 bg-emerald-500 rounded-full" />
          </div>
          <span className="text-xs font-bold text-foreground">
            {deviceName}
          </span>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
        </div>
      </div>

      {/* Select Payload Card */}
      <div className="w-full rounded-2xl bg-card border border-border/40 shadow-sm overflow-hidden p-1">
        <FileUpload
          selectedFiles={selectedFiles}
          onFileSelect={handleFileSelect}
          onFileRemove={handleFileRemove}
          onClearAll={onClearAll}
        />
      </div>

      {/* Nearby Devices Section */}
      <div className="w-full">
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
  );
}
