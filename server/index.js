// server/index.js — Main Server Entry Point
import express from 'express';
import http from 'http';
import cors from 'cors';
import mongoose from 'mongoose';
import { Server as SocketIOServer } from 'socket.io';
import config from './config.js';

import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import matchRoutes from './routes/matches.js';
import titleRoutes from './routes/titles.js';
import leaderboardRoutes from './routes/leaderboards.js';

import { setupSockets } from './sockets/index.js';
import { rebuildTitleCache } from './services/seriesService.js';

const app = express();
const server = http.createServer(app);

// CORS setup
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/matches', matchRoutes);
app.use('/api/titles', titleRoutes);
app.use('/api/leaderboards', leaderboardRoutes);

// Health & Server Time endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    serverTime: Date.now(),
    mongoConnected: mongoose.connection.readyState === 1,
  });
});

// Socket.io
const io = new SocketIOServer(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});
setupSockets(io);

// MongoDB connection with graceful offline fallback
async function startServer() {
  try {
    console.log(`[mongo] Connecting to ${config.MONGO_URI}...`);
    // 3 second timeout for connection attempt
    await mongoose.connect(config.MONGO_URI, {
      serverSelectionTimeoutMS: 3000,
    });
    console.log('[mongo] Connected successfully.');
    await rebuildTitleCache();
  } catch (err) {
    console.warn(`[mongo] Could not connect to MongoDB (${err.message}).`);
    console.warn('[mongo] Running in memory/offline mode — in-memory cache and rules active.');
  }

  const PORT = config.PORT || 3001;

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`\n[server] ⚠️ Port ${PORT} is already in use by another process.`);
      console.error(`[server] To free it on Windows CMD, run:\n   netstat -ano | findstr :${PORT}\n   taskkill /PID <PID> /F\n`);
      process.exit(1);
    } else {
      console.error('[server] Unexpected server error:', err);
    }
  });

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`[server] Rivalry Arena server running on port ${PORT}`);
  });
}

startServer();
