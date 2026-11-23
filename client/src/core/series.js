// ── Series State Machine ──
// Runs Best-of-2/3/5, queues games, counts round wins, handles draws.
// - First to majority wins (2 of 3, 3 of 5).
// - Best-of-2 that ends 1-1 gets one sudden-death decider.
// - Drawn rounds are replayed (up to 2 times with swapped starter).
//   After that, the round is voided and one extra round is added.

import { createRandom, shuffle } from './random.js';
import { Queue } from '../dsa/structures.js';

export function createSeries({ games, format = 3, seed = Date.now(), players = [], titleMode = false }) {
  const random = createRandom(seed);
  const count = Math.max(1, Number(format) || 3);
  const pool = shuffle(games.length ? games : ['tic-tac-toe'], random);

  // DSA: Queue holds the upcoming games. The series pops from front and cycles.
  const gameQueue = new Queue();
  for (let i = 0; i < count; i++) {
    gameQueue.enqueue(pool[i % pool.length]);
  }

  return {
    seed,
    format: count,
    gameQueue,
    round: 0,
    wins: [0, 0],
    results: [],
    complete: false,
    players,
    titleMode,
    drawRetries: 0,       // consecutive draws for current round's game
    maxDrawRetries: 2,
    startingPlayer: 0,     // swapped on draw retries
  };
}

export function nextGame(series) {
  if (series.complete || series.gameQueue.size === 0) return null;
  // Peek at the front without dequeuing (we dequeue on round end)
  return series.gameQueue.items?.[series.gameQueue.head] ?? null;
}

export function recordRound(series, result) {
  if (series.complete) return series;

  const next = {
    ...series,
    wins: [...series.wins],
    results: [...series.results],
    drawRetries: series.drawRetries,
    startingPlayer: series.startingPlayer,
  };

  // Handle draw
  if (result.winner === null || result.winner === 'draw') {
    next.drawRetries += 1;
    if (next.drawRetries <= next.maxDrawRetries) {
      // Replay the same game with swapped starter
      next.startingPlayer = next.startingPlayer === 0 ? 1 : 0;
      next.results.push({ ...result, type: 'draw-replay' });
      return next;
    }
    // After max retries, void the draw and add an extra round
    next.results.push({ ...result, type: 'draw-voided' });
    next.drawRetries = 0;
    next.startingPlayer = 0;
    // Dequeue the drawn game, add a fresh one
    next.gameQueue.dequeue();
    const pool = next.results.map((r) => r.game).filter(Boolean);
    const extraGame = pool[next.round % pool.length] || 'tic-tac-toe';
    next.gameQueue.enqueue(extraGame);
    next.round += 1;
    return next;
  }

  // Normal win/loss
  next.results.push(result);
  if (result.winner === 0 || result.winner === 1) {
    next.wins[result.winner] += 1;
  }
  next.round += 1;
  next.drawRetries = 0;
  next.startingPlayer = 0;
  next.gameQueue.dequeue();

  const majority = Math.floor(next.format / 2) + 1;
  const reachedMajority = next.wins.some((w) => w >= majority);

  // Best-of-2 sudden death
  if (!reachedMajority && next.gameQueue.size === 0 && next.format === 2 && next.wins[0] === next.wins[1]) {
    const lastGame = next.results[next.results.length - 1]?.game || 'tic-tac-toe';
    next.gameQueue.enqueue(lastGame);
  }

  next.complete = reachedMajority || (next.gameQueue.size === 0);
  return next;
}

export function seriesWinner(series) {
  if (!series.complete || series.wins[0] === series.wins[1]) return null;
  return series.wins[0] > series.wins[1] ? 0 : 1;
}

export function seriesSummary(series) {
  return {
    format: series.format,
    round: series.round,
    wins: [...series.wins],
    results: [...series.results],
    complete: series.complete,
    winner: seriesWinner(series),
    titleMode: series.titleMode,
    players: series.players,
  };
}
