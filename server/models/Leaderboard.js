// server/models/Leaderboard.js — Per-player best time for a given board
import mongoose from 'mongoose';

const leaderboardSchema = new mongoose.Schema({
  board:    { type: String, required: true },      // e.g. 'minesweeper:9x9'
  userId:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  username: { type: String, required: true },
  bestTime: { type: Number, required: true },      // milliseconds
});

// One best time per player per board
leaderboardSchema.index({ board: 1, userId: 1 }, { unique: true });

const Leaderboard = mongoose.model('Leaderboard', leaderboardSchema);
export default Leaderboard;
