// server/routes/users.js — User profile and title endpoints
import { Router } from 'express';
import mongoose from 'mongoose';
import User from '../models/User.js';
import RivalryTitle from '../models/RivalryTitle.js';

const router = Router();

/**
 * GET /api/users/:id
 * Public profile with win/loss counts.
 */
router.get('/:id', async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ error: 'Database unavailable' });
    }
    const user = await User.findById(req.params.id).select('-passwordHash -guestToken');
    if (!user) return res.status(404).json({ error: 'User not found' });
    return res.json({ user, serverTime: Date.now() });
  } catch (err) {
    console.error('[users/:id]', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

/**
 * GET /api/users/:id/titles
 * Active and recent titles for this user (as winner and as loser).
 */
router.get('/:id/titles', async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ error: 'Database unavailable' });
    }
    const userId = req.params.id;
    const titles = await RivalryTitle.find({
      $or: [{ winner: userId }, { loser: userId }],
    })
      .populate('winner', 'username')
      .populate('loser', 'username')
      .sort({ awardedAt: -1 })
      .lean();

    return res.json({ titles, serverTime: Date.now() });
  } catch (err) {
    console.error('[users/:id/titles]', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

export default router;
