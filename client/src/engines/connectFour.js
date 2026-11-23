// DSA: Stack models each column — discs drop in LIFO order, O(1) push for drops.
import { Stack } from '../dsa/structures.js';
import { createRandom } from '../core/random.js';

const NUM_ROWS = 6;
const NUM_COLS = 7;

function emptyGrid() {
  return Array.from({ length: NUM_ROWS }, () => Array(NUM_COLS).fill(null));
}

function buildGrid(columns) {
  const grid = emptyGrid();
  for (let c = 0; c < NUM_COLS; c++) {
    const discs = columns[c].toArray();
    for (let r = 0; r < discs.length; r++) {
      grid[NUM_ROWS - 1 - r][c] = discs[r]; // bottom-up
    }
  }
  return grid;
}

function checkDirection(grid, row, col, dr, dc) {
  const player = grid[row][col];
  if (player === null) return null;
  let count = 1;
  const cells = [[row, col]];
  for (const sign of [1, -1]) {
    for (let i = 1; i < 4; i++) {
      const r = row + dr * i * sign;
      const c = col + dc * i * sign;
      if (r < 0 || r >= NUM_ROWS || c < 0 || c >= NUM_COLS) break;
      if (grid[r][c] !== player) break;
      count++;
      cells.push([r, c]);
    }
  }
  return count >= 4 ? { winner: player, cells } : null;
}

function checkWinAround(grid, row, col) {
  const directions = [[0, 1], [1, 0], [1, 1], [1, -1]]; // horiz, vert, diag-down-right, diag-down-left
  for (const [dr, dc] of directions) {
    const result = checkDirection(grid, row, col, dr, dc);
    if (result) return result;
  }
  return null;
}

function isBoardFull(columns) {
  for (let c = 0; c < NUM_COLS; c++) {
    if (columns[c].size < NUM_ROWS) return false;
  }
  return true;
}

export function create(seed, options = {}) {
  const rng = createRandom(seed);
  // DSA: Array of 7 Stacks — each column is a stack of discs, push = drop disc on top.
  const columns = Array.from({ length: NUM_COLS }, () => new Stack());
  return {
    columns,
    grid: emptyGrid(),
    currentPlayer: 0,
    events: [],
    moveCount: 0,
    phase: 'playing',
    winner: null,
    winCells: null,
    hoverColumn: null,
    rng,
  };
}

export function apply(state, action) {
  const events = [];

  if (action.type === 'hover') {
    return { ...state, hoverColumn: action.col, events };
  }

  if (action.type === 'drop') {
    const { col } = action;
    if (state.phase !== 'playing') return { ...state, events };
    if (col < 0 || col >= NUM_COLS) return { ...state, events };
    if (state.columns[col].size >= NUM_ROWS) return { ...state, events };

    const player = state.currentPlayer;

    // DSA: Stack push — disc drops onto column top in O(1).
    state.columns[col].push(player);
    state.moveCount += 1;

    const grid = buildGrid(state.columns);
    state.grid = grid;

    const row = NUM_ROWS - state.columns[col].size; // row where disc landed (top-down index)
    events.push({ type: 'move', row, col, player });

    const result = checkWinAround(grid, row, col);
    if (result) {
      state.phase = 'won';
      state.winner = result.winner;
      state.winCells = result.cells;
      events.push({ type: 'win', winner: result.winner, cells: result.cells });
    } else if (isBoardFull(state.columns)) {
      state.phase = 'draw';
      events.push({ type: 'draw' });
    } else {
      state.currentPlayer = 1 - player;
    }

    return { ...state, events };
  }

  return { ...state, events };
}

export function status(state) {
  return {
    phase: state.phase,
    winner: state.winner,
    currentPlayer: state.currentPlayer,
    moveCount: state.moveCount,
  };
}

export function inspect(state) {
  return {
    columnSizes: state.columns.map(c => c.size),
    grid: state.grid.map(row => [...row]),
    hoverColumn: state.hoverColumn,
    winCells: state.winCells,
  };
}
