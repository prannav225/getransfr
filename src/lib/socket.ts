import { io } from 'socket.io-client';

// Get the server URL from environment variables or use localhost for development
const serverURL = import.meta.env.VITE_SERVER_URL;

// Create and export the socket instance
export const socket = io(serverURL);

// Add connection event handlers for debugging
socket.on('connect', () => {
  console.log('Connected to server');
});

socket.on('connect_error', (error) => {
  console.error('Connection error:', error);
});

socket.on('disconnect', (reason) => {
  console.log('Disconnected:', reason);
});