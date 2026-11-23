// server/services/leaderboardService.js — Leaderboard time submission & queries
// DSA: PriorityQueue used for in-memory top-k computation. A min-heap of size
//      `limit` efficiently tracks the fastest k times without sorting the full set.
import { PriorityQueue } from '../../client/src/dsa/structures.js';
import mongoose from 'mongoose';
import Leaderboard from '../models/Leaderboard.js';

/**
 * Submit a time for a given board. Upserts only if the new time is better.
 *
 * @param {string} userId
 * @param {string} username
 * @param {string} board     - e.g. 'minesweeper:9x9'
 * @param {number} time      - milliseconds
 * @returns {Object} { improved, bestTime }
 */
export async function submitTime(userId, username, board, time) {
  if (mongoose.connection.readyState !== 1) {
    // Graceful fallback — accept but cannot persist
    return { improved: false, bestTime: time, persisted: false };
  }

  const existing = await Leaderboard.findOne({ board, userId });
  if (existing) {
    if (time < existing.bestTime) {
      existing.bestTime = time;
      existing.username = username; // in case they renamed
      await existing.save();
      return { improved: true, bestTime: time, persisted: true };
    }
    return { improved: false, bestTime: existing.bestTime, persisted: true };
  }

  // First submission for this board
  await Leaderboard.create({ board, userId, username, bestTime: time });
  return { improved: true, bestTime: time, persisted: true };
}

/**
 * Get the top `limit` times for a board, sorted ascending (fastest first).
 * Uses a PriorityQueue (max-heap of size `limit`) for efficient top-k.
 *
 * @param {string} board
 * @param {number} limit
 * @returns {Array<{ userId, username, bestTime }>}
 */
export async function getTopTimes(board, limit = 10) {
  if (mongoose.connection.readyState !== 1) {
    return [];
  }

  const entries = await Leaderboard.find({ board })
    .select('userId username bestTime -_id')
    .lean();

  // DSA: PriorityQueue as a max-heap capped at `limit` entries.
  //      We keep the smallest (fastest) times by evicting the largest when the
  //      heap exceeds `limit`. Compare is reversed so the root is the *largest*
  //      time — the one we want to evict first.
  const pq = new PriorityQueue((a, b) => b.bestTime - a.bestTime, limit);

  for (const entry of entries) {
    pq.push(entry);
  }

  // Drain the heap into an array and sort ascending
  const result = [];
  while (pq.size > 0) {
    result.push(pq.pop());
  }
  result.sort((a, b) => a.bestTime - b.bestTime);

  return result;
}
