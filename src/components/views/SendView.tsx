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
  onRefreshDevices?: () => void;
  isRefreshing?: boolean;
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
  onRefreshDevices,
  isRefreshing,
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
      {/* Current Device Identity Badge */}
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

      {/* STEP 1: Select Payload Banner & Dropzone */}
      <div className="w-full space-y-4">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <span>STEP 1 • CHOOSE FILES TO SEND</span>
            </h3>
          </div>
        </div>

        <div className="w-full">
          <FileUpload
            selectedFiles={selectedFiles}
            onFileSelect={handleFileSelect}
            onFileRemove={handleFileRemove}
            onClearAll={onClearAll}
          />
        </div>
      </div>

      {/* STEP 2: Nearby Devices Section */}
      <div className="w-full pt-1">
        <DeviceList
          currentDevice={currentDevice}
          connectedDevices={connectedDevices}
          onSendFiles={handleSendFiles}
          onClipboardClick={onClipboardClick}
          selectedFiles={selectedFiles}
          isSending={isSending}
          onRefreshDevices={onRefreshDevices}
          isRefreshing={isRefreshing}
        />
      </div>
    </motion.div>
  );
}
