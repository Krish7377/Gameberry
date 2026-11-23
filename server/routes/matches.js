// server/routes/matches.js — Match history endpoints
import { Router } from 'express';
import mongoose from 'mongoose';
import MatchRecord from '../models/MatchRecord.js';
import { auth } from '../middleware/auth.js';
import { completeSeries } from '../services/seriesService.js';

const router = Router();

/**
 * POST /api/matches
 * Save a completed series, run title rules, return result.
 * Body: { players, mode, format, games, finalScore, winner, titleMode, startedAt }
 */
router.post('/', auth, async (req, res) => {
  try {
    const { players, mode, format, games, finalScore, winner, titleMode, startedAt } = req.body;

    if (!players || !Array.isArray(players) || players.length !== 2) {
      return res.status(400).json({ error: 'players must be an array of 2' });
    }
    if (!winner) {
      return res.status(400).json({ error: 'winner is required' });
    }

    const result = await completeSeries({
      players,
      mode: mode || 'friendly',
      format: format || 3,
      games: games || [],
      finalScore: finalScore || [0, 0],
      winner,
      titleMode: titleMode || false,
      startedAt,
    });

    return res.status(201).json({
      match: result.match,
      titleActions: result.titleActions,
      serverTime: Date.now(),
    });
  } catch (err) {
    console.error('[matches/post]', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

/**
 * GET /api/matches?userId=X
 * Match history for a user, newest first.
 */
router.get('/', async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.json({ matches: [] });
    }

    const filter = {};
    if (req.query.userId) {
      filter['players.userId'] = req.query.userId;
    }

    const matches = await MatchRecord.find(filter)
      .sort({ completedAt: -1 })
      .limit(50)
      .lean();

    return res.json({ matches, serverTime: Date.now() });
  } catch (err) {
    console.error('[matches/get]', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

export default router;
