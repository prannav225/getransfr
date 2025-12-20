import { Users, Clipboard as ClipboardIcon, Send, Laptop, Smartphone, Tablet } from 'lucide-react';
import { Device } from '@/types/device';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

interface DeviceListProps {
  currentDevice: Device | null;
  connectedDevices: Device[];
  onSendFiles: (device: Device) => Promise<void>;
  onShareText: (to: string, text: string) => void;
  selectedFiles: File[];
  isSending: boolean;
}

export function DeviceList({
  currentDevice,
  connectedDevices,
  onSendFiles,
  onShareText,
  selectedFiles,
  isSending
}: DeviceListProps) {
  const uniqueDevices = Array.from(
    new Map(
      connectedDevices
        .filter(device =>
          device.id !== currentDevice?.id &&
          device.socketId &&
          device.socketId !== currentDevice?.socketId &&
          device.name
        )
        .map(device => [device.id, device])
    ).values()
  );

  const handleSendClick = async (device: Device) => {
    if (selectedFiles.length === 0) {
      toast.error('Please select files to send');
      return;
    }

    try {
      await onSendFiles(device);
    } catch (error) {
      console.error('Failed to establish connection:', error);
      toast.error('Failed to establish connection');
    }
  };

  return (
    <div className="relative overflow-hidden bg-glass-card rounded-[var(--radius-xl)] p-4 lg:p-8 transition-all duration-500 h-full flex flex-col group/card hover:shadow-glow dark:hover:shadow-glow-dark">
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
            <h2 className="text-lg sm:text-xl font-bold tracking-tight">Nearby Devices</h2>
            <p className="text-[10px] sm:text-xs text-muted-foreground font-medium">
              {uniqueDevices.length} device{uniqueDevices.length !== 1 ? 's' : ''} found
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
                  <motion.div 
                    animate={{ scale: [1, 1.5, 1], opacity: [0.3, 0.1, 0.3] }}
                    transition={{ duration: 3, repeat: Infinity }}
                    className="w-16 h-16 sm:w-24 sm:h-24 bg-primary/20 rounded-full" 
                  />
                </div>
                <div className="relative z-10 bg-black/5 dark:bg-white/5 p-5 sm:p-8 rounded-2xl sm:rounded-[2rem] backdrop-blur-md border border-border shadow-inner-light">
                  <Users className="w-8 h-8 sm:w-12 sm:h-12 text-primary/40" />
                </div>
              </div>
              <h3 className="text-base sm:text-lg font-bold text-foreground">Scanning for devices...</h3>
              <p className="text-xs sm:text-sm text-muted-foreground mt-2 max-w-[180px] sm:max-w-[200px] mx-auto leading-relaxed">
                Connect devices to the same network to start sharing.
              </p>
            </motion.div>
          ) : (
            <motion.div 
              key="list"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-3 pr-2 overflow-y-auto custom-scrollbar overflow-x-hidden"
            >
              {uniqueDevices.map((device, index) => (
                <motion.div
                  initial={{ opacity: 0, y: 10, x: -10 }}
                  animate={{ opacity: 1, y: 0, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  key={device.id}
                  className="group relative p-3 lg:p-4 rounded-[var(--radius-lg)] bg-black/5 dark:bg-white/5 border border-border hover:bg-black/10 dark:hover:bg-white/10 transition-all duration-300 hover:scale-[1.01] hover:shadow-xl flex items-center gap-3 sm:gap-4 text-card-foreground"
                >
                  <div className="relative flex-none">
                    <div className="relative group-hover:scale-105 transition-transform duration-300">
                        <img
                          src={device.avatar}
                          alt={device.name}
                          className="w-10 h-10 sm:w-14 sm:h-14 rounded-[var(--radius-md)] lg:rounded-[var(--radius-lg)] ring-2 ring-primary/20 shadow-lg object-cover"
                        />
                        <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 sm:w-4 sm:h-4 bg-green-500 rounded-full border-2 border-background shadow-sm" />
                    </div>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-foreground text-sm sm:text-base lg:text-lg tracking-tight truncate max-w-[120px] sm:max-w-none">
                      {device.name}
                    </h3>
                    <div className="flex items-center gap-1.5 mt-0.5 text-[10px] sm:text-xs text-muted-foreground font-medium">
                        <span className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-green-500/50" />
                        Ready to receive
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <button
                      disabled={selectedFiles.length === 0 || isSending}
                      onClick={(e) => { e.stopPropagation(); handleSendClick(device); }}
                      className="h-9 sm:h-11 px-3 sm:px-4 lg:px-6 rounded-[var(--radius-md)] bg-primary text-primary-foreground text-xs sm:text-sm font-bold shadow-lg shadow-primary/20 hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95 flex items-center gap-1.5"
                    >
                        <Send className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        <span className="hidden xl:inline">Send</span>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onShareText(device.socketId, '');
                      }}
                      className="w-9 h-9 sm:w-11 sm:h-11 flex items-center justify-center rounded-[var(--radius-md)] bg-black/10 dark:bg-white/10 text-foreground border border-border hover:bg-black/20 dark:hover:bg-white/20 transition-all active:scale-95 group/btn shadow-sm"
                      title="Share Text"
                    >
                      <ClipboardIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 group-hover/btn:scale-110 transition-transform" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer / Tip */}
      {uniqueDevices.length > 0 && (
        <div className="mt-6 pt-6 border-t border-border flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-muted-foreground opacity-50">
            <span>Nearby and visible</span>
            <div className="flex gap-1">
                <Laptop className="w-3 h-3" />
                <Smartphone className="w-3 h-3" />
                <Tablet className="w-3 h-3" />
            </div>
        </div>
      )}
    </div>
  );
}