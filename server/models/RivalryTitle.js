// server/models/RivalryTitle.js — Tracks who holds a rivalry title over whom
import mongoose from 'mongoose';

const rivalryTitleSchema = new mongoose.Schema({
  winner:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  loser:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  series:     { type: mongoose.Schema.Types.ObjectId, ref: 'MatchRecord', required: true },
  awardedAt:  { type: Date, default: Date.now },
  expiresAt:  { type: Date, required: true },
  status:     { type: String, enum: ['active', 'reclaimed', 'expired'], default: 'active' },
  reclaimedAt:{ type: Date, default: null },
});

// Index for fast lookups: "does winner already hold a title over loser?"
rivalryTitleSchema.index({ winner: 1, loser: 1 });
// Index for expiry cleanup queries
rivalryTitleSchema.index({ expiresAt: 1 });

const RivalryTitle = mongoose.model('RivalryTitle', rivalryTitleSchema);
export default RivalryTitle;
