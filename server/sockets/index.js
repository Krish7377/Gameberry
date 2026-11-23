// server/sockets/index.js — Socket.io real-time synchronization
// DSA: HashMap for room registry (4-letter code → room) and presence registry (userId → socketId).
import { HashMap } from '../../client/src/dsa/structures.js';
import { GAME_REGISTRY } from '../../client/src/engines/registry.js';

// In-memory room and presence registries using custom HashMap
export const rooms = new HashMap();
export const presence = new HashMap();
export const soundboardCooldowns = new HashMap();

function generateRoomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 4; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export function setupSockets(io) {
  io.on('connection', (socket) => {
    let currentUserId = socket.handshake.auth?.userId || socket.id;
    let currentUsername = socket.handshake.auth?.username || `Guest_${socket.id.slice(0, 4)}`;
    let currentRoomCode = null;

    presence.set(currentUserId, socket.id);

    // ── Sync User Profile ──
    socket.on('set-user', ({ userId, username }) => {
      if (userId) currentUserId = userId;
      if (username) currentUsername = username;
      presence.set(currentUserId, socket.id);
    });

    // ── Create Room ──
    socket.on('create-room', (config, callback) => {
      let code = generateRoomCode();
      while (rooms.has(code)) {
        code = generateRoomCode();
      }

      const room = {
        code,
        host: { id: currentUserId, username: config.hostName || currentUsername, socketId: socket.id, ready: true },
        guest: null,
        seriesConfig: config || { format: 1, titleMode: false, games: ['tic-tac-toe'] },
        seriesState: null,
        createdAt: Date.now(),
      };

      rooms.set(code, room);
      currentRoomCode = code;
      socket.join(code);

      if (typeof callback === 'function') {
        callback({ success: true, code, room });
      }
    });

    // ── Join Room ──
    socket.on('join-room', ({ code, guestName }, callback) => {
      const upperCode = (code || '').toUpperCase().trim();
      const room = rooms.get(upperCode);

      if (!room) {
        if (typeof callback === 'function') callback({ success: false, error: 'Room not found. Check the 4-letter code.' });
        return;
      }

      if (room.guest && room.guest.id !== currentUserId) {
        if (typeof callback === 'function') callback({ success: false, error: 'Room is already full.' });
        return;
      }

      room.guest = {
        id: currentUserId,
        username: guestName || currentUsername,
        socketId: socket.id,
        ready: true,
      };
      currentRoomCode = upperCode;
      socket.join(upperCode);

      const seed = Date.now();
      room.seed = seed;

      // Broadcast room-updated to everyone in room
      io.to(upperCode).emit('room-updated', { room });

      // Trigger synchronized match countdown to start the game
      io.to(upperCode).emit('match-countdown-start', {
        room,
        countdownSec: 3,
        seed,
      });

      if (typeof callback === 'function') callback({ success: true, room });
    });

    // ── Leave Room ──
    socket.on('leave-room', ({ code }, callback) => {
      const targetCode = code || currentRoomCode;
      if (!targetCode) return;
      const room = rooms.get(targetCode);
      if (room) {
        if (room.host?.id === currentUserId) {
          rooms.delete(targetCode);
          io.to(targetCode).emit('room-closed', { reason: 'Host closed the room.' });
        } else if (room.guest?.id === currentUserId) {
          room.guest = null;
          io.to(targetCode).emit('room-updated', { room });
        }
      }
      socket.leave(targetCode);
      if (targetCode === currentRoomCode) currentRoomCode = null;
      if (typeof callback === 'function') callback({ success: true });
    });

    // ── Turn-Based Move Relay ──
    socket.on('move', ({ roomCode, gameId, action }) => {
      const targetCode = roomCode || currentRoomCode;
      if (!targetCode) return;
      // Broadcast move to opponent
      socket.to(targetCode).emit('opponent-move', { gameId, action, sender: currentUserId });
    });

    // ── Race Progress Ping (percentage) ──
    socket.on('progress', ({ roomCode, percentage }) => {
      const targetCode = roomCode || currentRoomCode;
      if (!targetCode) return;
      socket.to(targetCode).emit('opponent-progress', {
        userId: currentUserId,
        percentage,
      });
    });

    // ── Race Result Submission ──
    socket.on('result', ({ roomCode, result }) => {
      const targetCode = roomCode || currentRoomCode;
      if (!targetCode) return;
      io.to(targetCode).emit('opponent-result', {
        userId: currentUserId,
        result,
      });
    });

    // ── Rematch Flow ──
    socket.on('rematch-request', ({ roomCode }) => {
      const targetCode = roomCode || currentRoomCode;
      if (!targetCode) return;
      socket.to(targetCode).emit('rematch-offered', { from: currentUsername });
    });

    socket.on('rematch-accept', ({ roomCode }) => {
      const targetCode = roomCode || currentRoomCode;
      if (!targetCode) return;
      const seed = Date.now();
      io.to(targetCode).emit('rematch-start', { seed });
    });

    // ── Disconnect ──
    socket.on('disconnect', () => {
      presence.delete(currentUserId);
      if (currentRoomCode) {
        const room = rooms.get(currentRoomCode);
        if (room) {
          io.to(currentRoomCode).emit('player-disconnected', { userId: currentUserId });
        }
      }
    });
  });
}
