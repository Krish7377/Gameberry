// server/routes/leaderboards.js — Leaderboard submission & retrieval
import { Router } from 'express';
import { auth } from '../middleware/auth.js';
import { submitTime, getTopTimes } from '../services/leaderboardService.js';

const router = Router();

/**
 * POST /api/leaderboards
 * Body: { board, time }
 * Submit a time for a board (auth required).
 */
router.post('/', auth, async (req, res) => {
  try {
    const { board, time } = req.body;
    if (!board || typeof time !== 'number' || time <= 0) {
      return res.status(400).json({ error: 'board (string) and time (positive number) required' });
    }

    const result = await submitTime(req.user.id, req.user.username, board, time);
    return res.json({ ...result, serverTime: Date.now() });
  } catch (err) {
    console.error('[leaderboards/post]', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

/**
 * GET /api/leaderboards/:board
 * Top 10 times for a board.
 */
router.get('/:board', async (req, res) => {
  try {
    const times = await getTopTimes(req.params.board, 10);
    return res.json({ board: req.params.board, times, serverTime: Date.now() });
  } catch (err) {
    console.error('[leaderboards/get]', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

export default router;
