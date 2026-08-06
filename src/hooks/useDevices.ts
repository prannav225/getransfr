import { useState, useEffect, useCallback } from "react";
import { socket } from "@/services/socket";
import { generateAvatar } from "@/services/avatar";
import { Device } from "@/types/device";

export function useDevices() {
  const [currentDevice, setCurrentDevice] = useState<Device | null>(() => {
    const savedId = localStorage.getItem("deviceId");
    const savedName = localStorage.getItem("deviceName");
    const savedSeed = localStorage.getItem("avatarSeed");

    if (savedId && savedName) {
      const seed = savedSeed || savedName;
      return {
        id: savedId,
        name: savedName,
        socketId: "",
        avatar: generateAvatar(seed),
      };
    }
    return null;
  });

  const [connectedDevices, setConnectedDevices] = useState<Device[]>([]);

  const updateDeviceName = useCallback((newName: string) => {
    if (!newName.trim()) return;
    const cleanName = newName.trim();
    localStorage.setItem("deviceName", cleanName);
    const savedSeed = localStorage.getItem("avatarSeed") || cleanName;

    const updated = {
      id: currentDevice?.id || localStorage.getItem("deviceId") || "",
      name: cleanName,
      socketId: currentDevice?.socketId || "",
      avatar: generateAvatar(savedSeed),
    };

    setCurrentDevice(updated);
    if (socket.connected) {
      socket.emit("updateDeviceName", cleanName);
    }
  }, [currentDevice]);

  const randomizeAvatar = useCallback(() => {
    const randomSeed = Math.random().toString(36).substring(2, 10);
    localStorage.setItem("avatarSeed", randomSeed);

    const deviceName = currentDevice?.name || localStorage.getItem("deviceName") || "Titanium Eclipse";

    const updated = {
      id: currentDevice?.id || localStorage.getItem("deviceId") || "",
      name: deviceName,
      socketId: currentDevice?.socketId || "",
      avatar: generateAvatar(randomSeed),
    };

    setCurrentDevice(updated);
    if (socket.connected) {
      socket.emit("updateAvatarSeed", randomSeed);
    }
  }, [currentDevice]);

  useEffect(() => {
    const handleDeviceInfo = (device: Device) => {
      if (!device || !device.id) return;

      const savedSeed = localStorage.getItem("avatarSeed") || device.name;
      const deviceWithAvatar = {
        ...device,
        avatar: generateAvatar(savedSeed),
      };

      setCurrentDevice(deviceWithAvatar);
      localStorage.setItem("deviceId", device.id);
      localStorage.setItem("deviceName", device.name);
    };

    const handleConnectedDevices = (devices: Device[]) => {
      if (!Array.isArray(devices)) return;

      const validDevices = devices.filter(
        (device) => device && device.id && device.socketId
      );

      const devicesWithAvatars = validDevices.map((device) => ({
        ...device,
        avatar: generateAvatar(device.name),
      }));

      setConnectedDevices(devicesWithAvatars);
    };

    const handleDeviceDisconnected = (deviceId: string) => {
      setConnectedDevices((prev) =>
        prev.filter((device) => device.id !== deviceId)
      );
    };

    socket.on("deviceInfo", handleDeviceInfo);
    socket.on("connectedDevices", handleConnectedDevices);
    socket.on("deviceDisconnected", handleDeviceDisconnected);

    socket.emit("requestDevices");

    const interval = setInterval(() => {
      if (socket.connected) {
        socket.emit("requestDevices");
      }
    }, 10000);

    return () => {
      socket.off("deviceInfo", handleDeviceInfo);
      socket.off("connectedDevices", handleConnectedDevices);
      socket.off("deviceDisconnected", handleDeviceDisconnected);
      clearInterval(interval);
    };
  }, []);

  return {
    currentDevice,
    connectedDevices,
    updateDeviceName,
    randomizeAvatar,
  };
}
