// server/routes/titles.js — Rivalry title endpoints
import { Router } from 'express';
import mongoose from 'mongoose';
import RivalryTitle from '../models/RivalryTitle.js';
import config from '../config.js';
import { isExpired, shouldCleanup } from '../services/titleRules.js';

const router = Router();

/**
 * GET /api/titles/active
 * All currently active titles.
 */
router.get('/active', async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.json({ titles: [], serverTime: Date.now() });
    }
    const titles = await RivalryTitle.find({ status: 'active' })
      .populate('winner', 'username')
      .populate('loser', 'username')
      .lean();

    return res.json({ titles, serverTime: Date.now() });
  } catch (err) {
    console.error('[titles/active]', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

/**
 * GET /api/titles/:userId
 * All titles (active, reclaimed, recently expired) for a user.
 */
router.get('/:userId', async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.json({ titles: [], serverTime: Date.now() });
    }
    const userId = req.params.userId;
    const titles = await RivalryTitle.find({
      $or: [{ winner: userId }, { loser: userId }],
    })
      .populate('winner', 'username')
      .populate('loser', 'username')
      .sort({ awardedAt: -1 })
      .lean();

    return res.json({ titles, serverTime: Date.now() });
  } catch (err) {
    console.error('[titles/:userId]', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

/**
 * POST /api/titles/cleanup
 * Internal/admin — mark expired titles, delete old ones past cleanup window.
 */
router.post('/cleanup', async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.json({ marked: 0, deleted: 0 });
    }

    const now = new Date();

    // 1. Mark active titles whose expiresAt has passed as 'expired'
    const expiredResult = await RivalryTitle.updateMany(
      { status: 'active', expiresAt: { $lte: now } },
      { $set: { status: 'expired' } }
    );

    // 2. Delete titles that have been expired longer than TITLE_CLEANUP_DAYS
    const cleanupCutoff = new Date(now.getTime() - config.TITLE_CLEANUP_DAYS * 24 * 60 * 60 * 1000);
    const deletedResult = await RivalryTitle.deleteMany({
      status: 'expired',
      expiresAt: { $lte: cleanupCutoff },
    });

    return res.json({
      marked: expiredResult.modifiedCount || 0,
      deleted: deletedResult.deletedCount || 0,
      serverTime: Date.now(),
    });
  } catch (err) {
    console.error('[titles/cleanup]', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

export default router;
