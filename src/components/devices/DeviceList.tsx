import { Users, Clipboard as ClipboardIcon, Send, Laptop, Smartphone, Tablet } from 'lucide-react';
import { Device } from '@/types/device';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';

interface DeviceListProps {
  currentDevice: Device | null;
  connectedDevices: Device[];
  onSendFiles: (targets: Device | Device[]) => Promise<void>;
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
  isSending
}: DeviceListProps) {
  const [selectedPeerIds, setSelectedPeerIds] = useState<Set<string>>(new Set());

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

  const handleToggleSelect = (peerId: string) => {
      setSelectedPeerIds(prev => {
          const next = new Set(prev);
          if (next.has(peerId)) next.delete(peerId);
          else next.add(peerId);
          return next;
      });
  };

  const handleSendToSelected = async () => {
      if (selectedFiles.length === 0) {
          toast.error('Please select files to send');
          return;
      }
      const targets = uniqueDevices.filter(d => selectedPeerIds.has(d.id));
      if (targets.length === 0) return;
      try {
          await onSendFiles(targets);
          setSelectedPeerIds(new Set()); // Clear selection after sending
      } catch (error) {
          console.error('Failed to send files to selected devices:', error);
          toast.error('Failed to send files to selected devices');
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
            <h2 className="text-device-name text-lg sm:text-xl font-bold tracking-tight">Nearby Devices</h2>
            <p className="text-status mt-0.5 opacity-80">
              {uniqueDevices.length} device{uniqueDevices.length !== 1 ? 's' : ''} found
            </p>
          </div>
        </div>

        {selectedPeerIds.size > 0 && (
            <motion.button
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                onClick={handleSendToSelected}
                disabled={selectedFiles.length === 0 || isSending}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-full text-xs font-bold shadow-lg shadow-primary/30 hover:scale-105 active:scale-95 disabled:opacity-50 transition-all"
            >
                <Send className="w-3 h-3" />
                Send to {selectedPeerIds.size}
            </motion.button>
        )}
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
                        ease: "easeOut"
                      }}
                      className="absolute w-16 h-16 sm:w-24 sm:h-24 border-2 border-primary/30 rounded-full" 
                    />
                  ))}
                  <motion.div 
                    animate={{ rotate: 360 }}
                    transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                    className="absolute w-20 h-20 sm:w-28 sm:h-28 border border-dashed border-primary/20 rounded-full"
                  />
                </div>
                <div className="relative z-10 bg-black/5 dark:bg-white/5 p-5 sm:p-8 rounded-2xl sm:rounded-[var(--radius-xl)] backdrop-blur-md border border-border shadow-inner-light flex flex-col items-center">
                  <Users className="w-8 h-8 sm:w-12 sm:h-12 text-primary/40 animate-pulse" />
                </div>
              </div>
              <h3 className="text-base sm:text-lg font-bold text-foreground">Searching for devices...</h3>
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
                  onClick={() => handleToggleSelect(device.id)}
                  className={`group relative p-3 lg:p-4 rounded-[var(--radius-lg)] border transition-all duration-300 cursor-pointer flex items-center gap-3 sm:gap-4 text-card-foreground
                    ${selectedPeerIds.has(device.id) 
                        ? 'bg-primary/10 border-primary/40 shadow-lg shadow-primary/5' 
                        : 'bg-black/5 dark:bg-white/5 border-border hover:bg-black/10 dark:hover:bg-white/10'}`}
                >
                  <div className="relative flex-none">
                    <div className="relative group-hover:scale-105 transition-transform duration-500">
                        <img
                          src={device.avatar}
                          alt={device.name}
                          className="w-9 h-9 sm:w-11 sm:h-11 rounded-full ring-1 ring-primary/20 shadow-md object-cover"
                        />
                        {/* Status Beacon - Minimalist */}
                        <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-background shadow-sm" />
                    </div>
                  </div>
                  
                  <div className="flex-1 min-w-0 mx-1">
                    <h3 className="text-device-name text-foreground text-sm sm:text-base lg:text-lg font-bold truncate leading-none">
                      {device.name}
                    </h3>
                    <div className="flex items-center gap-1.5 mt-1.5">
                        {currentDevice?.ip === device.ip ? (
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

                  <div className="flex items-center gap-1 sm:gap-2 shrink-0">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onClipboardClick(device.socketId);
                      }}
                      className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center rounded-full bg-primary/20 text-primary border border-primary/30 hover:bg-primary hover:text-primary-foreground transition-all active:scale-90 group/btn"
                      title="Share Text"
                    >
                      <ClipboardIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </button>
                    
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all
                        ${selectedPeerIds.has(device.id) ? 'bg-primary border-primary' : 'border-primary/30'}`}>
                        {selectedPeerIds.has(device.id) && <Send className="w-3 h-3 text-white" />}
                    </div>
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
            <span>Mesh Network Ready</span>
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
