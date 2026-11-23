// server/models/MatchRecord.js — One record per completed series
import mongoose from 'mongoose';

const gameRoundSchema = new mongoose.Schema({
  game:    { type: String, required: true },     // e.g. 'ticTacToe'
  variant: { type: String, default: null },      // e.g. '9x9'
  seed:    { type: Number, default: null },
  winner:  { type: Number, default: null },      // 0 or 1 (player index)
  times:   { type: [Number], default: [0, 0] },  // [player0ms, player1ms]
  scores:  { type: [Number], default: [0, 0] },  // per-game scores if applicable
}, { _id: false });

const matchRecordSchema = new mongoose.Schema({
  players: [
    {
      userId:   { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      username: { type: String, required: true },
      _id: false,
    },
  ],
  mode:       { type: String, enum: ['title', 'friendly'], required: true },
  format:     { type: Number, enum: [2, 3, 5], required: true },   // best-of
  games:      { type: [gameRoundSchema], default: [] },
  finalScore: { type: [Number], default: [0, 0] },
  winner:     { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  titleMode:  { type: Boolean, default: false },
  startedAt:  { type: Date, default: Date.now },
  completedAt:{ type: Date, default: null },
});

const MatchRecord = mongoose.model('MatchRecord', matchRecordSchema);
export default MatchRecord;
