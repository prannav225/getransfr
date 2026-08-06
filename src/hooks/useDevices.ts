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
  const [isRefreshing, setIsRefreshing] = useState(false);

  const updateDeviceName = useCallback((newName: string) => {
    if (!newName.trim()) return;
    const cleanName = newName.trim();
    localStorage.setItem("deviceName", cleanName);
    localStorage.setItem("avatarSeed", cleanName); // Also update avatar seed when name changes

    const updated = {
      id: currentDevice?.id || localStorage.getItem("deviceId") || "",
      name: cleanName,
      socketId: currentDevice?.socketId || "",
      avatar: generateAvatar(cleanName),
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

  const refreshDevices = useCallback(() => {
    setIsRefreshing(true);
    if (socket.connected) {
      socket.emit("requestDevices");
    }
    setTimeout(() => setIsRefreshing(false), 800);
  }, []);

  useEffect(() => {
    const handleDeviceInfo = (device: Device) => {
      if (!device || !device.id || device.name === "Unknown Device") return;

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

      // Filter out invalid/unknown devices and self socket
      const validDevices = devices.filter(
        (device) =>
          device &&
          device.id &&
          device.name &&
          device.name !== "Unknown Device" &&
          device.socketId &&
          device.socketId !== socket.id
      );

      // Deduplicate by device.id so stale sockets never create phantom duplicate devices
      const uniqueMap = new Map<string, Device>();
      validDevices.forEach((device) => {
        uniqueMap.set(device.id, {
          ...device,
          avatar: generateAvatar(device.name),
        });
      });

      setConnectedDevices(Array.from(uniqueMap.values()));
    };

    const handleDeviceUpdated = (updatedDevice: Device) => {
      if (!updatedDevice || !updatedDevice.id) return;
      setConnectedDevices((prev) =>
        prev.map((device) =>
          device.id === updatedDevice.id
            ? {
                ...updatedDevice,
                avatar: generateAvatar(updatedDevice.name),
              }
            : device
        )
      );
    };

    const handleDeviceDisconnected = (deviceId: string) => {
      setConnectedDevices((prev) =>
        prev.filter((device) => device.id !== deviceId)
      );
    };

    socket.on("deviceInfo", handleDeviceInfo);
    socket.on("connectedDevices", handleConnectedDevices);
    socket.on("deviceUpdated", handleDeviceUpdated);
    socket.on("deviceDisconnected", handleDeviceDisconnected);

    socket.emit("requestDevices");

    const interval = setInterval(() => {
      if (socket.connected) {
        socket.emit("requestDevices");
      }
    }, 8000);

    return () => {
      socket.off("deviceInfo", handleDeviceInfo);
      socket.off("connectedDevices", handleConnectedDevices);
      socket.off("deviceUpdated", handleDeviceUpdated);
      socket.off("deviceDisconnected", handleDeviceDisconnected);
      clearInterval(interval);
    };
  }, []);

  return {
    currentDevice,
    connectedDevices,
    isRefreshing,
    updateDeviceName,
    randomizeAvatar,
    refreshDevices,
  };
}
