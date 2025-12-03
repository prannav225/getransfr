/* eslint-disable @typescript-eslint/no-explicit-any */
import { io, Socket } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SERVER_URL;

// Create a persistent device ID if not exists
if (!localStorage.getItem('deviceId')) {
  localStorage.setItem('deviceIdTimestamp', Date.now().toString());
}

const socket = io(SOCKET_URL, {
  transports: ['websocket', 'polling'],
  reconnectionAttempts: 10,
  reconnectionDelay: 1000,
  timeout: 20000,
  autoConnect: true,
  path: '/socket.io',
  query: {
    clientId: localStorage.getItem('deviceId') || undefined
  }
}) as Socket;

let reconnectAttempts = 0;
// let isReconnecting = false;

// Handle connection
socket.on('connect', () => {
  console.log('Connected to signaling server with ID:', socket.id);
  reconnectAttempts = 0;
  
  if (localStorage.getItem('deviceId')) {
    console.log('Reconnecting with existing device ID:', localStorage.getItem('deviceId'));
    socket.emit('deviceReconnect', localStorage.getItem('deviceId'));
  } else {
    console.log('Announcing as new device');
    socket.emit('deviceAnnounce');
  }
  
  // Request device list after connection
  setTimeout(() => {
    socket.emit('requestDevices');
  }, 1000);
});

// Handle reconnection
socket.on('reconnect', () => {
  console.log('Reconnected to server');
  if (localStorage.getItem('deviceId')) {
    socket.emit('deviceReconnect', localStorage.getItem('deviceId'));
  } else {
    socket.emit('deviceAnnounce');
  }
  
  // Request device list after reconnection
  setTimeout(() => {
    socket.emit('requestDevices');
  }, 1000);
});

// Handle connection errors
socket.on('connect_error', (error) => {
  console.error('Signaling server connection error:', error.message);
  reconnectAttempts++;
  
  if (reconnectAttempts >= 10) {
    console.error('Max reconnection attempts reached, disconnecting');
    socket.disconnect();
  }
});

// Handle disconnection
socket.on('disconnect', (reason) => {
  console.log('Disconnected from signaling server:', reason);
  
  if (reason === 'io server disconnect' || reason === 'transport close') {
    setTimeout(() => {
      console.log('Attempting to reconnect...');
      socket.connect();
    }, 2000);
  }
});

// Handle page visibility changes
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') {
    console.log('Page became visible, checking connection');
    if (!socket.connected) {
      console.log('Reconnecting on visibility change');
      socket.connect();
    }
    
    // Request fresh device list
    socket.emit('requestDevices');
  }
});

// Handle page unload
window.addEventListener('beforeunload', () => {
  console.log('Page unloading, notifying server');
  socket.emit('deviceDisconnecting', localStorage.getItem('deviceId'));
});

export { socket };