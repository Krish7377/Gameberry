// server/scripts/seed.js — Seeds demo users, bots, sample rivalry titles, and leaderboard times
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import config from '../config.js';
import User from '../models/User.js';
import MatchRecord from '../models/MatchRecord.js';
import RivalryTitle from '../models/RivalryTitle.js';
import Leaderboard from '../models/Leaderboard.js';

async function seed() {
  console.log('[seed] Connecting to MongoDB...');
  try {
    await mongoose.connect(config.MONGO_URI, { serverSelectionTimeoutMS: 3000 });
  } catch (err) {
    console.error('[seed] Could not connect to MongoDB:', err.message);
    process.exit(1);
  }

  console.log('[seed] Clearing existing data...');
  await Promise.all([
    User.deleteMany({}),
    MatchRecord.deleteMany({}),
    RivalryTitle.deleteMany({}),
    Leaderboard.deleteMany({}),
  ]);

  const passwordHash = await bcrypt.hash('password123', 8);

  // 1. Create Bot Profiles
  const bots = await User.create([
    {
      username: 'RoboRival Easy',
      isBot: true,
      botDifficulty: 'easy',
      wins: 3,
      losses: 12,
    },
    {
      username: 'RoboRival Medium',
      isBot: true,
      botDifficulty: 'medium',
      wins: 15,
      losses: 8,
    },
    {
      username: 'RoboRival Hard',
      isBot: true,
      botDifficulty: 'hard',
      wins: 28,
      losses: 2,
    },
  ]);

  // 2. Create Demo Human Users
  const [player1, player2] = await User.create([
    {
      username: 'ChallengerOne',
      passwordHash,
      wins: 8,
      losses: 4,
    },
    {
      username: 'ArenaMaster',
      passwordHash,
      wins: 14,
      losses: 6,
    },
  ]);

  // 3. Create Sample Match Record
  const match = await MatchRecord.create({
    players: [
      { userId: player1._id, username: player1.username },
      { userId: player2._id, username: player2.username },
    ],
    mode: 'title',
    format: 3,
    games: [
      { game: 'tic-tac-toe', winner: 0, seed: 1001 },
      { game: 'connect-four', winner: 1, seed: 1002 },
      { game: 'minesweeper', winner: 0, seed: 1003 },
    ],
    finalScore: [2, 1],
    winner: player1._id,
    titleMode: true,
    startedAt: new Date(Date.now() - 3600000),
    completedAt: new Date(Date.now() - 3000000),
  });

  // 4. Create Active Rivalry Title with visible countdown (expires in 2 hours for demo)
  await RivalryTitle.create({
    winner: player1._id,
    loser: player2._id,
    series: match._id,
    awardedAt: new Date(),
    expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours from now
    status: 'active',
  });

  // 5. Create Sample Leaderboard Times
  await Leaderboard.create([
    { board: 'minesweeper:9x9', userId: player1._id, username: player1.username, bestTime: 38200 },
    { board: 'minesweeper:9x9', userId: player2._id, username: player2.username, bestTime: 45600 },
    { board: 'sudoku:easy', userId: player2._id, username: player2.username, bestTime: 92400 },
    { board: 'speed-sudoku:4x4', userId: player1._id, username: player1.username, bestTime: 18450 },
    { board: 'speed-sudoku:6x6', userId: player2._id, username: player2.username, bestTime: 54300 },
  ]);

  console.log('[seed] Seeding completed successfully!');
  await mongoose.disconnect();
}

seed();
