import { useState, useEffect } from 'react';
import { socket } from '@/services/socket';
import { generateAvatar } from '@/services/avatar';
import { Device } from '@/types/device';

export function useDevices() {
  const [currentDevice, setCurrentDevice] = useState<Device | null>(null);
  const [connectedDevices, setConnectedDevices] = useState<Device[]>([]);

  useEffect(() => {
    // Ensure socket is connected
    if (!socket.connected) {
      socket.connect();
    }

    socket.on('deviceInfo', (device: Device) => {
      console.log('Received device info:', device);
      setCurrentDevice({
        ...device,
        avatar: generateAvatar(device.name)
      });
    });

    socket.on('connectedDevices', (devices: Device[]) => {
      console.log('Received connected devices:', devices);
      setConnectedDevices(devices.map(device => ({
        ...device,
        avatar: generateAvatar(device.name)
      })));
    });

    return () => {
      socket.off('deviceInfo');
      socket.off('connectedDevices');
    };
  }, []);

  return { currentDevice, connectedDevices };
}