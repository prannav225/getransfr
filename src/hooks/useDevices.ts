import { useState, useEffect } from 'react';
import { socket } from '@/services/socket';
import { generateAvatar } from '@/services/avatar';
import { Device } from '@/types/device';

export function useDevices() {
  const [currentDevice, setCurrentDevice] = useState<Device | null>(null);
  const [connectedDevices, setConnectedDevices] = useState<Device[]>([]);

  useEffect(() => {
    const handleDeviceInfo = (device: Device) => {
      console.log('Received device info:', device);
      
      if (!device || !device.id) {
        console.error('Invalid device info received');
        return;
      }
      
      const deviceWithAvatar = {
        ...device,
        avatar: generateAvatar(device.name)
      };
      
      setCurrentDevice(deviceWithAvatar);
      localStorage.setItem('deviceId', device.id);
    };

    const handleConnectedDevices = (devices: Device[]) => {
      console.log('Received connected devices:', devices);
      
      if (!Array.isArray(devices)) {
        console.error('Invalid devices data received');
        return;
      }
      
      // Filter out invalid devices but keep the "self" check for the component to handle
      const validDevices = devices.filter(device => 
        device && 
        device.id && 
        device.socketId
      );
      
      // Add avatars to devices
      const devicesWithAvatars = validDevices.map(device => ({
        ...device,
        avatar: generateAvatar(device.name)
      }));
      
      setConnectedDevices(devicesWithAvatars);
    };
    
    const handleDeviceDisconnected = (deviceId: string) => {
      console.log('Device disconnected:', deviceId);
      setConnectedDevices(prev => prev.filter(device => device.id !== deviceId));
    };

    // Register event handlers
    socket.on('deviceInfo', handleDeviceInfo);
    socket.on('connectedDevices', handleConnectedDevices);
    socket.on('deviceDisconnected', handleDeviceDisconnected);
    
    // Request initial device list
    socket.emit('requestDevices');
    
    // Periodically request device list to ensure it's up to date
    const interval = setInterval(() => {
      if (socket.connected) {
        socket.emit('requestDevices');
      }
    }, 10000);

    return () => {
      // Clean up event handlers
      socket.off('deviceInfo', handleDeviceInfo);
      socket.off('connectedDevices', handleConnectedDevices);
      socket.off('deviceDisconnected', handleDeviceDisconnected);
      clearInterval(interval);
    };
  }, [currentDevice?.id]);

  return { currentDevice, connectedDevices };
}