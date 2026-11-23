// server/services/seriesService.js — Handles series completion logic
// DSA: HashMap used as an in-memory title cache for fast lookups without
//      hitting the DB on every request. Keys are "winnerId:loserId" strings.
import { HashMap } from '../../client/src/dsa/structures.js';
import mongoose from 'mongoose';
import MatchRecord from '../models/MatchRecord.js';
import RivalryTitle from '../models/RivalryTitle.js';
import User from '../models/User.js';
import config from '../config.js';
import { decideTitleOutcome } from './titleRules.js';

// In-memory title cache: key = "winnerId:loserId" → title doc
export const titleCache = new HashMap(64);

/**
 * Rebuild the in-memory title cache from the database.
 * Called once at startup.
 */
export async function rebuildTitleCache() {
  if (mongoose.connection.readyState !== 1) return;
  try {
    const activeTitles = await RivalryTitle.find({ status: 'active' }).lean();
    for (const t of activeTitles) {
      titleCache.set(`${t.winner}:${t.loser}`, t);
    }
    console.log(`[titleCache] loaded ${activeTitles.length} active titles`);
  } catch (err) {
    console.warn('[titleCache] could not rebuild from DB:', err.message);
  }
}

/**
 * Complete a series: persist the match, run title rules, update stats.
 *
 * @param {Object} data — { players, mode, format, games, finalScore, winner, titleMode, startedAt }
 * @returns {{ match, titleActions }}
 */
export async function completeSeries(data) {
  const dbReady = mongoose.connection.readyState === 1;

  // 1. Persist the match record
  let match = null;
  if (dbReady) {
    match = await MatchRecord.create({
      players:     data.players,
      mode:        data.mode,
      format:      data.format,
      games:       data.games,
      finalScore:  data.finalScore,
      winner:      data.winner,
      titleMode:   data.titleMode,
      startedAt:   data.startedAt || new Date(),
      completedAt: new Date(),
    });
  }

  // 2. Update user win/loss counts
  const winnerId = String(data.winner);
  const loserId  = String(
    data.players.find((p) => String(p.userId) !== winnerId)?.userId
  );

  if (dbReady) {
    await User.findByIdAndUpdate(winnerId, { $inc: { wins: 1 } });
    await User.findByIdAndUpdate(loserId, { $inc: { losses: 1 } });
  }

  // 3. Title logic (only for title-mode series)
  let titleActions = [];
  if (data.titleMode || data.mode === 'title') {
    // Gather existing active titles between these two players (both directions)
    let existingTitles = [];
    if (dbReady) {
      existingTitles = await RivalryTitle.find({
        status: 'active',
        $or: [
          { winner: winnerId, loser: loserId },
          { winner: loserId, loser: winnerId },
        ],
      }).lean();
    } else {
      // Fall back to in-memory cache
      const cached1 = titleCache.get(`${winnerId}:${loserId}`);
      const cached2 = titleCache.get(`${loserId}:${winnerId}`);
      if (cached1) existingTitles.push(cached1);
      if (cached2) existingTitles.push(cached2);
    }

    titleActions = decideTitleOutcome(winnerId, loserId, existingTitles);

    const durationMs = config.TITLE_DURATION_DAYS * 24 * 60 * 60 * 1000;

    for (const action of titleActions) {
      if (action.type === 'award') {
        const newTitle = {
          winner:    action.winner,
          loser:     action.loser,
          series:    match?._id || null,
          awardedAt: new Date(),
          expiresAt: new Date(Date.now() + durationMs),
          status:    'active',
        };
        if (dbReady) {
          const doc = await RivalryTitle.create(newTitle);
          newTitle._id = doc._id;
        }
        titleCache.set(`${action.winner}:${action.loser}`, newTitle);
      } else if (action.type === 'renew') {
        const newExpiry = new Date(Date.now() + durationMs);
        if (dbReady) {
          await RivalryTitle.findByIdAndUpdate(action.titleId, { expiresAt: newExpiry });
        }
        // Update cache
        const key1 = `${winnerId}:${loserId}`;
        const cached = titleCache.get(key1);
        if (cached) {
          cached.expiresAt = newExpiry;
          titleCache.set(key1, cached);
        }
      } else if (action.type === 'reclaim') {
        if (dbReady) {
          await RivalryTitle.findByIdAndUpdate(action.titleId, {
            status: 'reclaimed',
            reclaimedAt: new Date(),
          });
        }
        // Remove from cache
        titleCache.delete(`${loserId}:${winnerId}`);
      }
    }
  }

  return { match, titleActions };
}
