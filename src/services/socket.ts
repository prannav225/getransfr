import { io, Socket } from 'socket.io-client';
import toast from 'react-hot-toast';

let SOCKET_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:5001';

// Deep-link fix for mobile: If we're on a network IP but URL is localhost, swap it
// This ensures that when you access the app via 192.168.x.x, it connects to the server at 192.168.x.x:5001
// instead of trying to connect to localhost (which would be the phone itself)
if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
  if (SOCKET_URL.includes('localhost') || SOCKET_URL.includes('127.0.0.1')) {
    try {
      const url = new URL(SOCKET_URL);
      SOCKET_URL = `${window.location.protocol}//${window.location.hostname}:${url.port}`;
      console.log('[Socket] Detected network access, adjusting server URL to:', SOCKET_URL);
    } catch (e) {
      console.error('[Socket] Failed to parse SOCKET_URL, fallback to default logic', e);
    }
  }
}

// Create a persistent device ID if not exists
if (!localStorage.getItem('deviceId')) {
  localStorage.setItem('deviceIdTimestamp', Date.now().toString());
}

const socket = io(SOCKET_URL, {
  transports: ['websocket', 'polling'],
  reconnectionAttempts: 10,
  reconnectionDelay: 1000,
  timeout: 10000, // Reduced timeout
  autoConnect: true,
  path: '/socket.io',
  query: {
    clientId: localStorage.getItem('deviceId') || undefined
  }
}) as Socket;

let reconnectAttempts = 0;

// Handle connection
socket.on('connect', () => {
  console.log('Connected to signaling server:', SOCKET_URL);
  reconnectAttempts = 0;
  
  if (localStorage.getItem('deviceId')) {
    socket.emit('deviceReconnect', localStorage.getItem('deviceId'));
  } else {
    socket.emit('deviceAnnounce');
  }
  
  // Request device list immediately after connection
  socket.emit('requestDevices');
});

// Handle reconnection
socket.on('reconnect', () => {
  console.log('Reconnected to server');
  if (localStorage.getItem('deviceId')) {
    socket.emit('deviceReconnect', localStorage.getItem('deviceId'));
  } else {
    socket.emit('deviceAnnounce');
  }
  
  socket.emit('requestDevices');
});

// Handle connection errors
socket.on('connect_error', (error) => {
  console.error('Signaling server connection error:', error.message);
  reconnectAttempts++;
  
  if (reconnectAttempts === 1) {
    // Only show toast on first distinct failure to avoid spam
    toast.error('Cannot connect to server. Retrying...');
  }
  
  if (reconnectAttempts >= 10) {
    console.error('Max reconnection attempts reached');
    toast.error('Connection failed. Please check if the server is running.');
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