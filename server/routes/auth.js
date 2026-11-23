// server/routes/auth.js — Authentication routes (guest, register, login, me)
import { Router } from 'express';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import User from '../models/User.js';
import config from '../config.js';
import { auth } from '../middleware/auth.js';

const router = Router();

/** Sign a JWT for a user document */
function signToken(user) {
  return jwt.sign(
    { id: user._id.toString(), username: user.username },
    config.JWT_SECRET,
    { expiresIn: '30d' }
  );
}

/**
 * POST /api/auth/guest
 * Body: { username }
 * Creates a guest identity with a unique device token.
 */
router.post('/guest', async (req, res) => {
  try {
    const { username } = req.body;
    if (!username || username.trim().length < 2) {
      return res.status(400).json({ error: 'Username must be at least 2 characters' });
    }

    const guestToken = crypto.randomUUID();

    if (mongoose.connection.readyState !== 1) {
      // No DB — return an ephemeral token
      const tempUser = { _id: guestToken, username: username.trim(), wins: 0, losses: 0 };
      const token = jwt.sign(
        { id: guestToken, username: username.trim() },
        config.JWT_SECRET,
        { expiresIn: '30d' }
      );
      return res.json({ token, user: tempUser });
    }

    const user = await User.findOrCreateGuest(guestToken, username.trim());
    const token = signToken(user);
    return res.json({ token, user: { _id: user._id, username: user.username, wins: user.wins, losses: user.losses } });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ error: 'Username already taken' });
    }
    console.error('[auth/guest]', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

/**
 * POST /api/auth/register
 * Body: { username, password }
 */
router.post('/register', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || username.trim().length < 2) {
      return res.status(400).json({ error: 'Username must be at least 2 characters' });
    }
    if (!password || password.length < 4) {
      return res.status(400).json({ error: 'Password must be at least 4 characters' });
    }

    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ error: 'Database unavailable' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ username: username.trim(), passwordHash });
    const token = signToken(user);
    return res.status(201).json({ token, user: { _id: user._id, username: user.username, wins: 0, losses: 0 } });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ error: 'Username already taken' });
    }
    console.error('[auth/register]', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

/**
 * POST /api/auth/login
 * Body: { username, password }
 */
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }

    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ error: 'Database unavailable' });
    }

    const user = await User.findOne({ username: username.trim() });
    if (!user || !user.passwordHash) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = signToken(user);
    return res.json({ token, user: { _id: user._id, username: user.username, wins: user.wins, losses: user.losses } });
  } catch (err) {
    console.error('[auth/login]', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

/**
 * GET /api/auth/me
 * Returns the current authenticated user's profile.
 */
router.get('/me', auth, async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.json({ user: { _id: req.user.id, username: req.user.username }, serverTime: Date.now() });
    }
    const user = await User.findById(req.user.id).select('-passwordHash -guestToken');
    if (!user) return res.status(404).json({ error: 'User not found' });
    return res.json({ user, serverTime: Date.now() });
  } catch (err) {
    console.error('[auth/me]', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

export default router;
