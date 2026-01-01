import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001';

export const socket = io(SOCKET_URL, {
    autoConnect: false, // Подключаемся вручную
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: 5
});

// Debug logs
socket.on('connect', () => {
    console.log('Connected to server:', socket.id);
});

socket.on('disconnect', () => {
    console.log('Disconnected from server');
});

socket.on('connect_error', (error) => {
    console.error('Connection error:', error.message);
});
