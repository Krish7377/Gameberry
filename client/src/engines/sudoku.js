// DSA: Backtracking generation; Row/Column/Box HashMaps for O(1) conflict validation.
import { HashMap } from '../dsa/structures.js';
import { createRandom, shuffle } from '../core/random.js';

const N = 9;
const BOX_SIZE = 3;

function getBoxIndex(r, c) {
  return Math.floor(r / BOX_SIZE) * BOX_SIZE + Math.floor(c / BOX_SIZE);
}

function solveBacktrack(grid, rng, limitSolutions = 1) {
  let solutions = 0;
  let firstSolution = null;

  function backtrack(index) {
    if (index === 81) {
      solutions++;
      if (!firstSolution) firstSolution = grid.map(row => [...row]);
      return solutions >= limitSolutions;
    }

    const r = Math.floor(index / 9);
    const c = index % 9;

    if (grid[r][c] !== 0) {
      return backtrack(index + 1);
    }

    const digits = [1, 2, 3, 4, 5, 6, 7, 8, 9];
    const candidateList = rng ? shuffle(digits, rng) : digits;

    for (const d of candidateList) {
      if (isValidPlacement(grid, r, c, d)) {
        grid[r][c] = d;
        if (backtrack(index + 1)) return true;
        grid[r][c] = 0;
      }
    }
    return false;
  }

  backtrack(0);
  return { solutions, solution: firstSolution };
}

function isValidPlacement(grid, r, c, val) {
  for (let i = 0; i < 9; i++) {
    if (grid[r][i] === val) return false;
    if (grid[i][c] === val) return false;
  }
  const br = Math.floor(r / 3) * 3;
  const bc = Math.floor(c / 3) * 3;
  for (let dr = 0; dr < 3; dr++) {
    for (let dc = 0; dc < 3; dc++) {
      if (grid[br + dr][bc + dc] === val) return false;
    }
  }
  return true;
}

export function create(seed, options = {}) {
  const rng = createRandom(seed);
  const difficulty = options.difficulty || 'medium';
  const clueMap = { easy: 38, medium: 30, hard: 24 };
  const targetClues = clueMap[difficulty] || 30;

  // 1. Generate full solved grid with randomized backtracking
  const grid = Array.from({ length: 9 }, () => Array(9).fill(0));
  solveBacktrack(grid, rng, 1);
  const fullSolution = grid.map(row => [...row]);

  // 2. Remove cells while keeping uniqueness
  const cells = [];
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) cells.push([r, c]);
  }
  const shuffledCells = shuffle(cells, rng);

  let currentClues = 81;
  const initial = grid.map(row => [...row]);

  for (const [r, c] of shuffledCells) {
    if (currentClues <= targetClues) break;
    const temp = initial[r][c];
    initial[r][c] = 0;

    // Test solution uniqueness
    const testGrid = initial.map(row => [...row]);
    const { solutions } = solveBacktrack(testGrid, null, 2);
    if (solutions === 1) {
      currentClues--;
    } else {
      initial[r][c] = temp; // Restore if not unique
    }
  }

  const userBoard = initial.map(row => [...row]);
  const given = initial.map(row => row.map(v => v !== 0));

  // DSA: HashMaps for O(1) duplicate checks across Rows, Columns, and 3x3 Boxes
  const rowHash = Array.from({ length: 9 }, () => new HashMap());
  const colHash = Array.from({ length: 9 }, () => new HashMap());
  const boxHash = Array.from({ length: 9 }, () => new HashMap());

  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      const val = userBoard[r][c];
      if (val !== 0) {
        rowHash[r].set(val, (rowHash[r].get(val) || 0) + 1);
        colHash[c].set(val, (colHash[c].get(val) || 0) + 1);
        const b = getBoxIndex(r, c);
        boxHash[b].set(val, (boxHash[b].get(val) || 0) + 1);
      }
    }
  }

  return {
    board: userBoard,
    initial: initial.map(row => [...row]),
    solution: fullSolution,
    given,
    rowHash,
    colHash,
    boxHash,
    conflicts: new Set(),
    phase: 'playing', // 'playing', 'won'
    filledCount: currentClues,
    totalCells: 81,
    winner: null,
    rng,
  };
}

function updateConflicts(state) {
  const conflicts = new Set();
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      const val = state.board[r][c];
      if (val !== 0) {
        const b = getBoxIndex(r, c);
        const rCount = state.rowHash[r].get(val) || 0;
        const cCount = state.colHash[c].get(val) || 0;
        const bCount = state.boxHash[b].get(val) || 0;
        if (rCount > 1 || cCount > 1 || bCount > 1) {
          conflicts.add(`${r},${c}`);
        }
      }
    }
  }
  state.conflicts = conflicts;
  return conflicts;
}

export function apply(state, action) {
  const events = [];
  if (state.phase !== 'playing') return { ...state, events };

  const { row, col, val } = action;
  if (row < 0 || row >= 9 || col < 0 || col >= 9) return { ...state, events };
  if (state.given[row][col]) return { ...state, events }; // Cannot modify given clues

  const oldVal = state.board[row][col];
  const newVal = Number(val) || 0;
  if (newVal < 0 || newVal > 9) return { ...state, events };

  if (oldVal === newVal) return { ...state, events };

  const b = getBoxIndex(row, col);

  // Remove old value from HashMaps
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

  // Insert new value into HashMaps
  state.board[row][col] = newVal;
  if (newVal !== 0) {
    state.rowHash[row].set(newVal, (state.rowHash[row].get(newVal) || 0) + 1);
    state.colHash[col].set(newVal, (state.colHash[col].get(newVal) || 0) + 1);
    state.boxHash[b].set(newVal, (state.boxHash[b].get(newVal) || 0) + 1);
    state.filledCount++;
  }

  // Update conflict markers
  updateConflicts(state);

  events.push({ type: 'move', row, col, val: newVal, hasConflicts: state.conflicts.size > 0 });

  // Win condition: full board with 0 conflicts
  if (state.filledCount === 81 && state.conflicts.size === 0) {
    state.phase = 'won';
    state.winner = 'self';
    events.push({ type: 'win' });
  }

  return { ...state, events };
}

export function status(state) {
  return {
    phase: state.phase,
    winner: state.winner,
    filledCount: state.filledCount,
    conflictCount: state.conflicts.size,
    progress: Math.floor((state.filledCount / 81) * 100),
  };
}

export function inspect(state) {
  let totalEntries = 0;
  for (let i = 0; i < 9; i++) {
    totalEntries += state.rowHash[i].size + state.colHash[i].size + state.boxHash[i].size;
  }
  return {
    filledCount: state.filledCount,
    conflictCells: state.conflicts.size,
    hashEntries: totalEntries,
    row0Entries: state.rowHash[0].size,
    col0Entries: state.colHash[0].size,
    box0Entries: state.boxHash[0].size,
  };
}
