// DSA: Parameterized grid Sudoku with HashMaps for O(1) conflict validation & countdown timer.
import { HashMap } from '../dsa/structures.js';
import { createRandom, shuffle } from '../core/random.js';

function getBox(r, c, size) {
  if (size === 4) {
    // 4x4 has 2x2 boxes
    return Math.floor(r / 2) * 2 + Math.floor(c / 2);
  } else {
    // 6x6 has 2 rows x 3 cols boxes
    return Math.floor(r / 2) * 2 + Math.floor(c / 3);
  }
}

function solveSmall(grid, size, rng) {
  const boxRows = 2;
  const boxCols = size === 4 ? 2 : 3;

  function isValid(r, c, val) {
    for (let i = 0; i < size; i++) {
      if (grid[r][i] === val || grid[i][c] === val) return false;
    }
    const br = Math.floor(r / boxRows) * boxRows;
    const bc = Math.floor(c / boxCols) * boxCols;
    for (let dr = 0; dr < boxRows; dr++) {
      for (let dc = 0; dc < boxCols; dc++) {
        if (grid[br + dr][bc + dc] === val) return false;
      }
    }
    return true;
  }

  function backtrack(index) {
    if (index === size * size) return true;
    const r = Math.floor(index / size);
    const c = index % size;
    if (grid[r][c] !== 0) return backtrack(index + 1);

    const nums = Array.from({ length: size }, (_, i) => i + 1);
    const candidates = rng ? shuffle(nums, rng) : nums;
    for (const d of candidates) {
      if (isValid(r, c, d)) {
        grid[r][c] = d;
        if (backtrack(index + 1)) return true;
        grid[r][c] = 0;
      }
    }
    return false;
  }

  backtrack(0);
}

export function create(seed, options = {}) {
  const rng = createRandom(seed);
  const size = options.size === 6 ? 6 : 4;
  const timeLimitMs = options.timeLimitMs || (size === 4 ? 60000 : 120000); // 60s or 120s

  const grid = Array.from({ length: size }, () => Array(size).fill(0));
  solveSmall(grid, size, rng);
  const solution = grid.map(row => [...row]);

  // Remove clues: 4x4 -> 6 clues left, 6x6 -> 14 clues left
  const cluesLeft = size === 4 ? 6 : 14;
  const initial = grid.map(row => [...row]);
  const coords = [];
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) coords.push([r, c]);
  }
  const shuffled = shuffle(coords, rng);

  let removed = size * size - cluesLeft;
  for (let i = 0; i < removed; i++) {
    const [r, c] = shuffled[i];
    initial[r][c] = 0;
  }

  const userBoard = initial.map(row => [...row]);
  const given = initial.map(row => row.map(v => v !== 0));

  // DSA: HashMaps for O(1) conflict validation
  const numBoxes = size === 4 ? 4 : 6;
  const rowHash = Array.from({ length: size }, () => new HashMap());
  const colHash = Array.from({ length: size }, () => new HashMap());
  const boxHash = Array.from({ length: numBoxes }, () => new HashMap());

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const val = userBoard[r][c];
      if (val !== 0) {
        rowHash[r].set(val, (rowHash[r].get(val) || 0) + 1);
        colHash[c].set(val, (colHash[c].get(val) || 0) + 1);
        const b = getBox(r, c, size);
        boxHash[b].set(val, (boxHash[b].get(val) || 0) + 1);
      }
    }
  }

  return {
    size,
    timeLimitMs,
    board: userBoard,
    initial: initial.map(row => [...row]),
    solution,
    given,
    rowHash,
    colHash,
    boxHash,
    conflicts: new Set(),
    phase: 'playing', // 'playing', 'won', 'dnf'
    filledCount: cluesLeft,
    totalCells: size * size,
    winner: null,
    rng,
  };
}

function updateConflicts(state) {
  const conflicts = new Set();
  const { size } = state;
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const val = state.board[r][c];
      if (val !== 0) {
        const b = getBox(r, c, size);
        const rc = state.rowHash[r].get(val) || 0;
        const cc = state.colHash[c].get(val) || 0;
        const bc = state.boxHash[b].get(val) || 0;
        if (rc > 1 || cc > 1 || bc > 1) {
          conflicts.add(`${r},${c}`);
        }
      }
    }
  }
  state.conflicts = conflicts;
}

export function apply(state, action) {
  const events = [];
  if (state.phase !== 'playing') return { ...state, events };

  if (action.type === 'timeout') {
    state.phase = 'dnf';
    state.winner = 'opponent';
    events.push({ type: 'loss', reason: 'timeout' });
    return { ...state, events };
  }

  if (action.type === 'move') {
    const { row, col, val } = action;
    if (row < 0 || row >= state.size || col < 0 || col >= state.size) return { ...state, events };
    if (state.given[row][col]) return { ...state, events };

    const oldVal = state.board[row][col];
    const newVal = Number(val) || 0;
    if (newVal < 0 || newVal > state.size) return { ...state, events };
    if (oldVal === newVal) return { ...state, events };

    const b = getBox(row, col, state.size);

    if (oldVal !== 0) {
      const rc = state.rowHash[row].get(oldVal) || 1;
      if (rc <= 1) state.rowHash[row].delete(oldVal);
      else state.rowHash[row].set(oldVal, rc - 1);

      const cc = state.colHash[col].get(oldVal) || 1;
      if (cc <= 1) state.colHash[col].delete(oldVal);
      else state.colHash[col].set(oldVal, cc - 1);

      const bc = state.boxHash[b].get(oldVal) || 1;
      if (bc <= 1) state.boxHash[b].delete(oldVal);
      else state.boxHash[b].set(oldVal, bc - 1);

      state.filledCount--;
    }

    state.board[row][col] = newVal;
    if (newVal !== 0) {
      state.rowHash[row].set(newVal, (state.rowHash[row].get(newVal) || 0) + 1);
      state.colHash[col].set(newVal, (state.colHash[col].get(newVal) || 0) + 1);
      state.boxHash[b].set(newVal, (state.boxHash[b].get(newVal) || 0) + 1);
      state.filledCount++;
    }

    updateConflicts(state);
    events.push({ type: 'move', row, col, val: newVal, hasConflicts: state.conflicts.size > 0 });

    if (state.filledCount === state.totalCells && state.conflicts.size === 0) {
      state.phase = 'won';
      state.winner = 'self';
      events.push({ type: 'win' });
    }

    return { ...state, events };
  }

  return { ...state, events };
}

export function status(state) {
  return {
    phase: state.phase,
    winner: state.winner,
    size: state.size,
    filledCount: state.filledCount,
    totalCells: state.totalCells,
    conflictCount: state.conflicts.size,
    progress: Math.floor((state.filledCount / state.totalCells) * 100),
  };
}

export function inspect(state) {
  return {
    gridSize: `${state.size}x${state.size}`,
    timeLimitMs: state.timeLimitMs,
    filled: state.filledCount,
    conflicts: state.conflicts.size,
    row0Entries: state.rowHash[0].size,
    col0Entries: state.colHash[0].size,
  };
}
