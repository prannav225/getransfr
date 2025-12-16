/* eslint-disable @typescript-eslint/no-unused-vars */
import { Users } from 'lucide-react';
import { Device } from '@/types/device';
import toast from 'react-hot-toast';

interface DeviceListProps {
  currentDevice: Device | null;
  connectedDevices: Device[];
  onSendFiles: (device: Device) => Promise<void>;
  selectedFiles: File[];
  isSending: boolean;
}

export function DeviceList({
  currentDevice,
  connectedDevices,
  onSendFiles,
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
    <div className="relative overflow-hidden backdrop-blur-2xl bg-glass-card border border-white/20 dark:border-white/10 rounded-2xl lg:rounded-3xl shadow-soft dark:shadow-soft-dark p-4 lg:p-8 transition-all duration-300 h-full group/card hover:shadow-glow dark:hover:shadow-glow-dark flex flex-col">
      <div className="hidden lg:flex items-center gap-3 mb-8 relative z-10">
        <div className="p-2.5 rounded-full bg-primary/10 dark:bg-primary/20 ring-1 ring-primary/20">
          <Users className="w-5 h-5 text-primary" />
        </div>
        <h2 className="text-xl font-semibold text-foreground tracking-tight">Nearby Devices</h2>
      </div>

      <div className="flex-1 min-h-0 flex flex-col">
        {uniqueDevices.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center py-8">
            <div className="relative mb-4 lg:mb-8">
              {/* Radar animation circles */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-16 h-16 lg:w-24 lg:h-24 bg-primary/20 rounded-full animate-radar opacity-0" />
              </div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-16 h-16 lg:w-24 lg:h-24 bg-primary/20 rounded-full animate-radar opacity-0" style={{ animationDelay: '1s' }} />
              </div>

              {/* Icon container */}
              <div className="relative z-10 bg-background/50 p-4 lg:p-6 rounded-full backdrop-blur-md shadow-inner-light dark:shadow-inner-dark border border-white/10">
                <Users className="w-6 h-6 lg:w-10 lg:h-10 text-primary/70" />
              </div>
            </div>
            <p className="text-base lg:text-lg font-medium text-foreground">Scanning for devices...</p>
            <p className="text-xs lg:text-sm text-muted-foreground mt-1 lg:mt-2 max-w-[200px] lg:max-w-none mx-auto">
              Ensure devices are on the same network
            </p>
          </div>
        ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
          {uniqueDevices.map(device => (
            <div
              key={device.id}
              className="group relative p-4 rounded-2xl bg-white/5 dark:bg-black/5 border border-white/10 hover:bg-white/10 dark:hover:bg-white/5 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg cursor-pointer flex flex-col items-center text-center gap-3"
              onClick={() => handleSendClick(device)}
            >
              <div className="relative">
                <img
                  src={device.avatar}
                  alt={device.name}
                  className="w-16 h-16 rounded-full ring-4 ring-white/10 dark:ring-white/5 shadow-lg group-hover:ring-primary/50 transition-all"
                />
                <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 rounded-full border-2 border-glass-card shadow-sm" />
              </div>
              
              <div className="min-w-0 w-full px-2">
                <h3 className="font-semibold text-foreground text-base tracking-tight truncate w-full">
                  {device.name}
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Ready to receive
                </p>
              </div>

              <button
                disabled={selectedFiles.length === 0 || isSending}
                className="w-full py-2 rounded-xl text-sm font-semibold bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground transition-all flex items-center justify-center gap-2 group-hover:opacity-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                  <span>Send Files</span>
              </button>
            </div>
          ))}
        </div>
      )}
      </div>
    </div>
  );
}