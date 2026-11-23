// server/models/User.js — Mongoose schema for users (humans, guests, bots)
import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  username:     { type: String, required: true, unique: true },
  passwordHash: { type: String, default: null },      // null for guests
  guestToken:   { type: String, default: null },       // device-based guest identity
  isBot:        { type: Boolean, default: false },
  botDifficulty:{ type: String, default: null },       // 'easy' | 'medium' | 'hard'
  wins:         { type: Number, default: 0 },
  losses:       { type: Number, default: 0 },
  fastestTimes: { type: Map, of: Number, default: {} }, // board-key → milliseconds
  createdAt:    { type: Date, default: Date.now },
});

/**
 * Find an existing guest by their device token, or create a new one.
 */
userSchema.statics.findOrCreateGuest = async function (guestToken, username) {
  let user = await this.findOne({ guestToken });
  if (user) return user;
  user = await this.create({ username, guestToken });
  return user;
};

const User = mongoose.model('User', userSchema);
export default User;
