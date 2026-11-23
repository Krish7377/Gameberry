// client/src/net/socket.js — Socket.io client wrapper
import { io } from 'socket.io-client';

const WS_URL = import.meta.env.VITE_WS_URL || window.location.origin;

// Use direct websocket transport to prevent "invalid Upgrade header" long-polling handshake errors
export const socket = io(WS_URL, {
  autoConnect: true,
  reconnection: true,
  reconnectionDelay: 1000,
  transports: ['websocket'],
});

export function syncUser(user) {
  if (user) {
    socket.emit('set-user', { userId: user._id, username: user.username });
  }
}

export function createRoom(config, callback) {
  socket.emit('create-room', config, callback);
}

export function joinRoom(code, guestName, callback) {
  socket.emit('join-room', { code, guestName }, callback);
}

export function leaveRoom(code, callback) {
  socket.emit('leave-room', { code }, callback);
}

export function sendMove(roomCode, gameId, action) {
  socket.emit('move', { roomCode, gameId, action });
}

export function sendProgress(roomCode, percentage) {
  socket.emit('progress', { roomCode, percentage });
}

export function sendResult(roomCode, result) {
  socket.emit('result', { roomCode, result });
}

export function requestRematch(roomCode) {
  socket.emit('rematch-request', { roomCode });
}

export function acceptRematch(roomCode) {
  socket.emit('rematch-accept', { roomCode });
}
