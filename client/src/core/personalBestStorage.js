// client/src/core/personalBestStorage.js — Lightweight Local Personal Best Records
const STORAGE_KEY = 'ra_personal_bests_v1';

const GAME_METRIC_CONFIG = {
  '2048': {
    name: '2048 Sliding Puzzle',
    type: 'score', // higher is better
    unit: 'pts',
    icon: '🔢',
  },
  'minesweeper': {
    name: 'Minesweeper Race',
    type: 'time', // lower is better
    unit: 'time',
    icon: '💣',
  },
  'speed-sudoku': {
    name: 'Speed Sudoku',
    type: 'time',
    unit: 'time',
    icon: '⚡',
  },
  'sudoku': {
    name: 'Sudoku (9x9 Classic)',
    type: 'time',
    unit: 'time',
    icon: '🧩',
  },
  'memory-cards': {
    name: 'Memory Card Flip',
    type: 'time',
    unit: 'time',
    icon: '🎴',
  },
  'tic-tac-toe': {
    name: 'Tic-Tac-Toe',
    type: 'streak', // consecutive wins
    unit: 'wins',
    icon: '❌',
  },
  'connect-four': {
    name: 'Connect Four',
    type: 'streak',
    unit: 'wins',
    icon: '🔴',
  },
};

function formatTime(ms) {
  if (!ms || ms <= 0) return '0:00.000';
  const totalSec = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSec / 60);
  const seconds = totalSec % 60;
  const milli = ms % 1000;
  return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}.${milli.toString().padStart(3, '0')}`;
}

export function getPersonalBests() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) || {};
  } catch (err) {
    console.warn('[personalBestStorage] read error:', err);
    return {};
  }
}

export function recordGameResult({ gameId, gameName, score = 0, timeMs = 0, won = false }) {
  if (!gameId) return { isNewBest: false };

  try {
    const allBests = getPersonalBests();
    const config = GAME_METRIC_CONFIG[gameId] || {
      name: gameName || 'Game',
      type: 'score',
      unit: 'pts',
      icon: '🎮',
    };

    const current = allBests[gameId] || {
      gameId,
      gameName: config.name,
      icon: config.icon,
      type: config.type,
      bestValue: null,
      display: 'No record yet',
      currentStreak: 0,
      achievedAt: null,
    };

    let isNewBest = false;
    const now = Date.now();

    if (config.type === 'score') {
      const numScore = Number(score) || 0;
      if (current.bestValue === null || numScore > current.bestValue) {
        current.bestValue = numScore;
        current.display = `${numScore.toLocaleString()} pts`;
        current.achievedAt = now;
        isNewBest = true;
      }
    } else if (config.type === 'time') {
      // Only record clear time if the puzzle was successfully solved/won
      const numTime = Number(timeMs) || 0;
      if (won && numTime > 0) {
        if (current.bestValue === null || numTime < current.bestValue) {
          current.bestValue = numTime;
          current.display = formatTime(numTime);
          current.achievedAt = now;
          isNewBest = true;
        }
      }
    } else if (config.type === 'streak') {
      if (won) {
        const streak = (current.currentStreak || 0) + 1;
        current.currentStreak = streak;
        if (current.bestValue === null || streak > current.bestValue) {
          current.bestValue = streak;
          current.display = `${streak} ${streak === 1 ? 'Win' : 'Wins'} Streak`;
          current.achievedAt = now;
          isNewBest = true;
        }
      } else {
        current.currentStreak = 0;
      }
    }

    allBests[gameId] = current;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(allBests));

    return { isNewBest, record: current };
  } catch (err) {
    console.warn('[personalBestStorage] save error:', err);
    return { isNewBest: false };
  }
}

export function getAllConfiguredGames() {
  return GAME_METRIC_CONFIG;
}
