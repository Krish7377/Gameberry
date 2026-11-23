// DSA: Queue BFS flood fill algorithm; 2D array representation.
import { Queue } from '../dsa/structures.js';
import { createRandom, shuffle } from '../core/random.js';

export function create(seed, options = {}) {
  const rng = createRandom(seed);
  const rows = options.rows || (options.variant === '16x16' ? 16 : 9);
  const cols = options.cols || (options.variant === '16x16' ? 16 : 9);
  const mineCount = options.mines || (rows === 16 ? 40 : 10);

  // Initialize empty grid
  const grid = Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => ({
      mine: false,
      revealed: false,
      flagged: false,
      neighborMines: 0,
    }))
  );

  // Place mines by shuffling cell coordinates
  const allCoords = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      allCoords.push([r, c]);
    }
  }
  const shuffledCoords = shuffle(allCoords, rng);

  // Pick a designated safe opening center (to guarantee an initial 0-clue cascade)
  // We reserve the first cell in shuffledCoords and its 8 neighbors from being mines
  const safeCenter = shuffledCoords[0];
  const forbidden = new Set();
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      const nr = safeCenter[0] + dr;
      const nc = safeCenter[1] + dc;
      if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
        forbidden.add(`${nr},${nc}`);
      }
    }
  }

  let placed = 0;
  for (let i = 1; i < shuffledCoords.length && placed < mineCount; i++) {
    const [r, c] = shuffledCoords[i];
    if (!forbidden.has(`${r},${c}`)) {
      grid[r][c].mine = true;
      placed++;
    }
  }

  // Calculate neighbor counts
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (grid[r][c].mine) continue;
      let count = 0;
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          if (dr === 0 && dc === 0) continue;
          const nr = r + dr;
          const nc = c + dc;
          if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && grid[nr][nc].mine) {
            count++;
          }
        }
      }
      grid[r][c].neighborMines = count;
    }
  }

  // Initial state before safe opening reveal
  const state = {
    rows,
    cols,
    mineCount,
    grid,
    phase: 'playing', // 'playing', 'won', 'lost'
    revealedCount: 0,
    flagsCount: 0,
    totalSafeCells: rows * cols - mineCount,
    lastVisitedCount: 0,
    peakQueueSize: 0,
    winner: null,
    rng,
  };

  // Pre-reveal safe opening using BFS Queue so both players start with identical board state
  bfsReveal(state, safeCenter[0], safeCenter[1]);

  return state;
}

// DSA: BFS Flood Fill using Queue. Cells with 0 neighbors expand outwardly in waves.
function bfsReveal(state, startR, startC) {
  const { rows, cols, grid } = state;
  if (grid[startR][startC].revealed || grid[startR][startC].mine) return [];

  const queue = new Queue();
  queue.enqueue([startR, startC]);

  const revealedBatch = [];
  const visited = new Set();
  visited.add(`${startR},${startC}`);

  while (queue.size > 0) {
    state.peakQueueSize = Math.max(state.peakQueueSize, queue.size);
    const [r, c] = queue.dequeue();
    const cell = grid[r][c];

    if (!cell.revealed && !cell.flagged) {
      cell.revealed = true;
      state.revealedCount++;
      revealedBatch.push({ r, c, neighborMines: cell.neighborMines });

      // If cell has 0 neighbors, enqueue all unrevealed neighbors
      if (cell.neighborMines === 0) {
        for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
            if (dr === 0 && dc === 0) continue;
            const nr = r + dr;
            const nc = c + dc;
            const key = `${nr},${nc}`;
            if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && !visited.has(key)) {
              visited.add(key);
              if (!grid[nr][nc].revealed && !grid[nr][nc].flagged && !grid[nr][nc].mine) {
                queue.enqueue([nr, nc]);
              }
            }
          }
        }
      }
    }
  }

  state.lastVisitedCount = revealedBatch.length;
  return revealedBatch;
}

export function apply(state, action) {
  const events = [];
  if (state.phase !== 'playing') return { ...state, events };

  const { type, row, col } = action;
  if (row < 0 || row >= state.rows || col < 0 || col >= state.cols) return { ...state, events };

  const cell = state.grid[row][col];

  if (type === 'flag') {
    if (cell.revealed) return { ...state, events };
    cell.flagged = !cell.flagged;
    state.flagsCount += cell.flagged ? 1 : -1;
    events.push({ type: 'flag', row, col, flagged: cell.flagged });
    return { ...state, events };
  }

  if (type === 'reveal') {
    if (cell.revealed || cell.flagged) return { ...state, events };

    // Hit a mine!
    if (cell.mine) {
      cell.revealed = true;
      state.phase = 'lost';
      state.winner = 'opponent'; // In race, this player lost
      events.push({ type: 'loss', reason: 'mine', row, col });
      return { ...state, events };
    }

    // Safe reveal: BFS flood fill
    const revealedBatch = bfsReveal(state, row, col);
    events.push({ type: 'reveal', cells: revealedBatch });

    if (revealedBatch.length >= 10) {
      events.push({ type: 'combo', kind: 'cascade', count: revealedBatch.length });
    }

    // Check win condition: all safe cells revealed
    if (state.revealedCount >= state.totalSafeCells) {
      state.phase = 'won';
      state.winner = 'self';
      events.push({ type: 'win', revealedCount: state.revealedCount });
    }

    return { ...state, events };
  }

  return { ...state, events };
}

export function status(state) {
  return {
    phase: state.phase,
    winner: state.winner,
    revealedCount: state.revealedCount,
    totalSafeCells: state.totalSafeCells,
    flagsCount: state.flagsCount,
    mineCount: state.mineCount,
    progress: Math.floor((state.revealedCount / state.totalSafeCells) * 100),
  };
}

export function inspect(state) {
  return {
    dimensions: `${state.rows}x${state.cols}`,
    mineCount: state.mineCount,
    revealedCount: state.revealedCount,
    totalSafe: state.totalSafeCells,
    peakBFSQueueSize: state.peakQueueSize,
    lastCellsVisited: state.lastVisitedCount,
  };
}
