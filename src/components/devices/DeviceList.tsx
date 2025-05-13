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
  const handleSendClick = async (device: Device) => {
    if (selectedFiles.length === 0) {
      toast.error('Please select files to send');
      return;
    }
    
    try {
      await onSendFiles(device);
    } catch (error) {
      toast.error('Failed to establish connection');
    }
  };

  const filteredDevices = connectedDevices.filter(device => device.id !== currentDevice?.id);


  return (
    <div className="bg-gradient-card-light dark:bg-gradient-card-dark backdrop-blur-sm rounded-2xl shadow-soft dark:shadow-soft-dark border border-white/10 dark:border-white/5 p-6">
      <div className="flex items-center gap-3 mb-6">
        <Users className="w-5 h-5 text-dropmate-primary dark:text-dropmate-primary-dark" />
        <h2 className="text-xl font-medium text-dropmate-text-primary dark:text-dropmate-text-primary-dark">Nearby Devices</h2>
      </div>

      {filteredDevices.length === 0 ? (
        <div className="text-center py-12">
          <Users className="w-12 h-12 mx-auto mb-4 text-dropmate-primary/30 dark:text-dropmate-primary-dark/30" />
          <p className="text-sm text-dropmate-text-muted/70 dark:text-dropmate-text-muted-dark/70">No devices found nearby</p>
          <p className="text-xs text-dropmate-text-muted/50 dark:text-dropmate-text-muted-dark/50 mt-1">
            Make sure other devices are connected to the same network
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredDevices.map(device => (
            <div
              key={device.id}
              className="p-4 rounded-xl bg-black/5 dark:bg-white/5 hover:bg-gradient-accent hover:text-white transition-all group"
            >
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <img
                    src={device.avatar}
                    alt={device.name}
                    className="w-10 h-10 rounded-full ring-2 ring-dropmate-primary/30 dark:ring-dropmate-primary-dark/30 group-hover:ring-white/30"
                  />
                  <div>
                    <p className="font-medium text-dropmate-text-primary dark:text-dropmate-text-primary-dark group-hover:text-white">
                      {device.name}
                    </p>
                    <p className="text-sm text-dropmate-primary/70 dark:text-dropmate-primary-dark/70 group-hover:text-white/70">
                      Ready to receive
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleSendClick(device)}
                  disabled={selectedFiles.length === 0 || isSending}
                  className="px-4 py-2 rounded-full text-sm font-medium bg-dropmate-primary/10 dark:bg-dropmate-primary-dark/10 text-dropmate-primary dark:text-dropmate-primary-dark group-hover:bg-white/20 group-hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {isSending ? 'Connecting...' : 'Send Files'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}