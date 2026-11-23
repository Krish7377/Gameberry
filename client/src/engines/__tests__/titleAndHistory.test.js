// client/src/engines/__tests__/titleAndHistory.test.js
import { describe, it, expect, beforeEach } from 'vitest';

// Node/Vitest localStorage mock
const store = {};
globalThis.localStorage = {
  getItem: (k) => store[k] || null,
  setItem: (k, v) => {
    store[k] = String(v);
  },
  removeItem: (k) => {
    delete store[k];
  },
  clear: () => {
    Object.keys(store).forEach((k) => delete store[k]);
  },
};

import { getActiveRivalries, saveRivalryResult } from '../../core/rivalryStorage.js';
import { getMatchHistory, saveMatchRecord } from '../../core/matchHistoryStorage.js';
import { getPersonalBests, recordGameResult } from '../../core/personalBestStorage.js';

describe('Strict 7-Day Title Staking and Match History', () => {
  beforeEach(() => {
    globalThis.localStorage.clear();
  });

  it('never saves or mints titles for bot opponents', () => {
    const botTitle1 = saveRivalryResult({
      winnerName: 'Player1',
      loserName: 'RoboRival MEDIUM',
      gameName: 'Tic-Tac-Toe',
      score: '1 - 0',
    });
    expect(botTitle1).toBeNull();

    const botTitle2 = saveRivalryResult({
      winnerName: 'RoboRival EASY',
      loserName: 'Player1',
      gameName: 'Connect Four',
      score: '1 - 0',
    });
    expect(botTitle2).toBeNull();

    const active = getActiveRivalries();
    expect(active.length).toBe(0);
  });

  it('successfully saves 7-day titles for human vs human title matches', () => {
    const title = saveRivalryResult({
      winnerName: 'Alice',
      winnerId: 'p1',
      loserName: 'Bob',
      loserId: 'p2',
      gameName: 'Connect Four',
      score: '2 - 1',
    });
    expect(title).not.toBeNull();
    expect(title.winnerName).toBe('Alice');
    expect(title.loserName).toBe('Bob');

    const active = getActiveRivalries();
    expect(active.length).toBe(1);
    expect(active[0].winnerName).toBe('Alice');
    expect(active[0].expiresAt).toBeGreaterThan(Date.now());
  });

  it('records all match types (bot, human, solo) in general Match History', () => {
    // 1. Bot match
    saveMatchRecord({
      gameName: 'Tic-Tac-Toe',
      gameId: 'tic-tac-toe',
      opponentName: 'RoboRival Medium',
      opponentType: 'bot',
      isTitleMatch: false,
      won: true,
      score: '1 - 0',
    });

    // 2. Solo game
    saveMatchRecord({
      gameName: '2048',
      gameId: '2048',
      opponentName: 'Solo Practice',
      opponentType: 'solo',
      isTitleMatch: false,
      won: true,
      score: 'Completed',
    });

    // 3. Staked 1v1 match
    saveMatchRecord({
      gameName: 'Connect Four',
      gameId: 'connect-four',
      opponentName: 'Bob',
      opponentType: 'human',
      isTitleMatch: true,
      won: true,
      score: '2 - 1',
    });

    const history = getMatchHistory();
    expect(history.length).toBe(3);
    expect(history[0].opponentName).toBe('Bob');
    expect(history[0].isTitleMatch).toBe(true);
    expect(history[1].opponentType).toBe('solo');
    expect(history[2].opponentType).toBe('bot');
  });

  it('tracks personal bests per game in user profile with zero database drag', () => {
    // 2048 high score: higher is better
    const res1 = recordGameResult({ gameId: '2048', score: 1024, won: true });
    expect(res1.isNewBest).toBe(true);
    expect(res1.record.display).toBe('1,024 pts');

    const res2 = recordGameResult({ gameId: '2048', score: 512, won: true });
    expect(res2.isNewBest).toBe(false);

    const res3 = recordGameResult({ gameId: '2048', score: 2048, won: true });
    expect(res3.isNewBest).toBe(true);
    expect(res3.record.display).toBe('2,048 pts');

    // Minesweeper: fastest time (lower is better)
    const ms1 = recordGameResult({ gameId: 'minesweeper', timeMs: 45000, won: true });
    expect(ms1.isNewBest).toBe(true);

    const ms2 = recordGameResult({ gameId: 'minesweeper', timeMs: 38000, won: true });
    expect(ms2.isNewBest).toBe(true);

    const ms3 = recordGameResult({ gameId: 'minesweeper', timeMs: 50000, won: true });
    expect(ms3.isNewBest).toBe(false);

    // Tic-Tac-Toe: win streak
    const ttt1 = recordGameResult({ gameId: 'tic-tac-toe', won: true });
    expect(ttt1.record.bestValue).toBe(1);

    const ttt2 = recordGameResult({ gameId: 'tic-tac-toe', won: true });
    expect(ttt2.record.bestValue).toBe(2);

    const allBests = getPersonalBests();
    expect(allBests['2048'].bestValue).toBe(2048);
    expect(allBests['minesweeper'].bestValue).toBe(38000);
    expect(allBests['tic-tac-toe'].bestValue).toBe(2);
  });
});
