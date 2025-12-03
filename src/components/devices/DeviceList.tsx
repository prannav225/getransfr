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
    <div className="relative overflow-hidden backdrop-blur-xl bg-white/30 dark:bg-black/30 border border-white/20 dark:border-white/10 rounded-3xl shadow-2xl p-6 transition-all duration-300">
      <div className="flex items-center gap-3 mb-6 relative z-10">
        <div className="p-2 rounded-full bg-dropmate-primary/10 dark:bg-dropmate-primary-dark/10">
          <Users className="w-5 h-5 text-dropmate-primary dark:text-dropmate-primary-dark" />
        </div>
        <h2 className="text-xl font-semibold text-dropmate-text-primary dark:text-dropmate-text-primary-dark">Nearby Devices</h2>
      </div>

      {uniqueDevices.length === 0 ? (
        <div className="text-center py-16">
          <div className="flex justify-center mb-4">
            <div className="relative">
              {/* Radar animation circles - centered on the icon */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-16 h-16 bg-dropmate-primary/5 rounded-full animate-radar" />
              </div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-16 h-16 bg-dropmate-primary/5 rounded-full animate-radar" style={{ animationDelay: '1s' }} />
              </div>

              {/* Icon container */}
              <div className="relative z-10 bg-white/50 dark:bg-black/50 p-4 rounded-full backdrop-blur-sm shadow-lg">
                <Users className="w-8 h-8 text-dropmate-primary/50 dark:text-dropmate-primary-dark/50" />
              </div>
            </div>
          </div>
          <p className="text-sm font-medium text-dropmate-text-muted dark:text-dropmate-text-muted-dark">Scanning for devices...</p>
          <p className="text-xs text-dropmate-text-muted/50 dark:text-dropmate-text-muted-dark/50 mt-2">
            Ensure devices are on the same network
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {uniqueDevices.map(device => (
            <div
              key={device.id}
              className="group relative p-4 rounded-2xl bg-white/40 dark:bg-white/5 border border-white/40 dark:border-white/5 hover:bg-white/60 dark:hover:bg-white/10 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg cursor-pointer"
              onClick={() => handleSendClick(device)}
            >
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <img
                      src={device.avatar}
                      alt={device.name}
                      className="w-12 h-12 rounded-full ring-2 ring-white/50 dark:ring-white/10 shadow-md group-hover:ring-dropmate-primary/50 transition-all"
                    />
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white dark:border-gray-900" />
                  </div>
                  <div>
                    <p className="font-semibold text-dropmate-text-primary dark:text-dropmate-text-primary-dark text-lg">
                      {device.name}
                    </p>
                    <p className="text-sm text-dropmate-text-muted dark:text-dropmate-text-muted-dark">
                      Ready to receive
                    </p>
                  </div>
                </div>
                <button
                  disabled={selectedFiles.length === 0 || isSending}
                  className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-dropmate-primary text-white shadow-lg shadow-dropmate-primary/30 hover:shadow-dropmate-primary/50 hover:-translate-y-0.5 active:translate-y-0 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none"
                >
                  {isSending ? 'Sending...' : 'Send'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}