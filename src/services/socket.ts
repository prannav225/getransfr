/* eslint-disable @typescript-eslint/no-explicit-any */
import { io, Socket } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SERVER_URL || 'http://192.168.0.106:3000';

const socket = io(SOCKET_URL, {
  transports: ['websocket', 'polling'],
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  timeout: 20000,
  autoConnect: true,
  path: '/socket.io'
}) as Socket;

socket.on('connect', () => {
  console.log('Connected to signaling server with ID:', socket.id);
});

socket.on('connect_error', (error) => {
  console.error('Signaling server connection error:', error.message);
  // Try to fallback to polling if websocket fails
  const transport = (socket as any).io.opts.transports;
  if (transport && transport[0] === 'websocket') {
    (socket as any).io.opts.transports = ['polling', 'websocket'];
  }
});

socket.on('disconnect', (reason) => {
  console.log('Disconnected from signaling server:', reason);
  if (reason === 'io server disconnect') {
    socket.connect();
  }
});

export { socket };