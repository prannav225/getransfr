import { io, Socket } from "socket.io-client";

let SOCKET_URL = import.meta.env.VITE_SERVER_URL;

// Deep-link fix for mobile: If we're on a network IP but URL is localhost, swap it
if (
  SOCKET_URL?.includes("localhost") &&
  window.location.hostname !== "localhost"
) {
  SOCKET_URL = SOCKET_URL.replace("localhost", window.location.hostname);
  console.log(
    "[Socket] Detected network access, adjusting server URL to:",
    SOCKET_URL
  );
}

const clientId = localStorage.getItem("deviceId");
const deviceName = localStorage.getItem("deviceName");

const socket = io(SOCKET_URL, {
  transports: ["polling", "websocket"], // Start with polling for better reliability behind proxies/Render
  reconnectionAttempts: 15, // Slightly more attempts
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  timeout: 30000, // Increased timeout for waking up Render instances
  autoConnect: true,
  path: "/socket.io",
  query: {
    ...(clientId && clientId !== "undefined" && { clientId }),
    ...(deviceName && deviceName !== "undefined" && { deviceName }),
  },
}) as Socket;

let reconnectAttempts = 0;

// Handle connection
socket.on("connect", () => {
  console.log("Connected to signaling server with ID:", socket.id);
  reconnectAttempts = 0;

  if (localStorage.getItem("deviceId")) {
    console.log(
      "Reconnecting with existing device ID:",
      localStorage.getItem("deviceId")
    );
    socket.emit("deviceReconnect", localStorage.getItem("deviceId"));
  } else {
    console.log("Announcing as new device");
    socket.emit("deviceAnnounce");
  }

  // Request device list immediately after connection
  socket.emit("requestDevices");
});

// Handle reconnection
socket.on("reconnect", () => {
  console.log("Reconnected to server");
  if (localStorage.getItem("deviceId")) {
    socket.emit("deviceReconnect", localStorage.getItem("deviceId"));
  } else {
    socket.emit("deviceAnnounce");
  }

  // Request device list immediately after reconnection
  socket.emit("requestDevices");
});

// Handle connection errors
socket.on("connect_error", (error) => {
  console.error("Signaling server connection error:", error.message);
  reconnectAttempts++;

  if (reconnectAttempts >= 10) {
    console.error("Max reconnection attempts reached, disconnecting");
    socket.disconnect();
  }
});

// Handle disconnection
socket.on("disconnect", (reason) => {
  console.log("Disconnected from signaling server. Reason:", reason);

  // If the server explicitly disconnected us, we must manually reconnect.
  // For other reasons (like transport loss), Socket.io handles it automatically.
  if (reason === "io server disconnect") {
    console.log("Server disconnected us, attempting manual reconnect in 2s...");
    setTimeout(() => {
      socket.connect();
    }, 2000);
  }
});

// Handle page visibility changes
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible") {
    console.log("Page became visible, checking connection");
    if (!socket.connected) {
      console.log("Reconnecting on visibility change");
      socket.connect();
    }

    // Request fresh device list
    socket.emit("requestDevices");
  }
});

// Handle page unload
window.addEventListener("beforeunload", () => {
  console.log("Page unloading, notifying server");
  socket.emit("deviceDisconnecting", localStorage.getItem("deviceId"));
});

export { socket };
