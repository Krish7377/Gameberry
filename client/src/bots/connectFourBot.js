/**
 * Connect Four Bot — Alpha-beta pruning.
 * Easy: depth 2. Medium: depth 4. Hard: depth 6, centre-first ordering.
 */

// DSA: Stack used to simulate column drops during search tree exploration.
import { Stack } from '../dsa/structures.js';

const NUM_ROWS = 6;
const NUM_COLS = 7;

function cloneColumns(columns) {
  return columns.map(c => new Stack(c.toArray()));
}

function buildGrid(columns) {
  const grid = Array.from({ length: NUM_ROWS }, () => Array(NUM_COLS).fill(null));
  for (let c = 0; c < NUM_COLS; c++) {
    const discs = columns[c].toArray();
    for (let r = 0; r < discs.length; r++) {
      grid[NUM_ROWS - 1 - r][c] = discs[r];
    }
  }
  return grid;
}

function getValidCols(columns) {
  const valid = [];
  for (let c = 0; c < NUM_COLS; c++) {
    if (columns[c].size < NUM_ROWS) valid.push(c);
  }
  return valid;
}

function checkDirection(grid, row, col, dr, dc) {
  const player = grid[row][col];
  if (player === null) return 0;
  let count = 1;
  for (const sign of [1, -1]) {
    for (let i = 1; i < 4; i++) {
      const r = row + dr * i * sign;
      const c = col + dc * i * sign;
      if (r < 0 || r >= NUM_ROWS || c < 0 || c >= NUM_COLS) break;
      if (grid[r][c] !== player) break;
      count++;
    }
  }
  return count;
}

function checkWinAt(grid, row, col) {
  const directions = [[0,1],[1,0],[1,1],[1,-1]];
  for (const [dr, dc] of directions) {
    if (checkDirection(grid, row, col, dr, dc) >= 4) return grid[row][col];
  }
  return null;
}

function dropAndRow(columns, col, player) {
  columns[col].push(player);
  return NUM_ROWS - columns[col].size;
}

function undrop(columns, col) {
  columns[col].pop();
}

function evaluate(grid) {
  let score = 0;
  // Score windows of 4
  const directions = [[0,1],[1,0],[1,1],[1,-1]];
  for (let r = 0; r < NUM_ROWS; r++) {
    for (let c = 0; c < NUM_COLS; c++) {
      for (const [dr, dc] of directions) {
        const window = [];
        for (let i = 0; i < 4; i++) {
          const nr = r + dr * i;
          const nc = c + dc * i;
          if (nr < 0 || nr >= NUM_ROWS || nc < 0 || nc >= NUM_COLS) break;
          window.push(grid[nr][nc]);
        }
        if (window.length < 4) continue;
        const p0 = window.filter(v => v === 0).length;
        const p1 = window.filter(v => v === 1).length;
        const empty = window.filter(v => v === null).length;
        if (p0 > 0 && p1 === 0) score += [0, 1, 10, 100][p0];
        if (p1 > 0 && p0 === 0) score -= [0, 1, 10, 100][p1];
      }
    }
  }
  // Centre column preference
  for (let r = 0; r < NUM_ROWS; r++) {
    if (grid[r][3] === 0) score += 3;
    else if (grid[r][3] === 1) score -= 3;
  }
  return score;
}

function alphaBeta(columns, depth, alpha, beta, maximizing, botPlayer) {
  const grid = buildGrid(columns);
  const valid = getValidCols(columns);
  if (valid.length === 0) return { score: 0 };

  // Check terminal
  for (let c = 0; c < NUM_COLS; c++) {
    if (columns[c].size > 0) {
      const row = NUM_ROWS - columns[c].size;
      const winner = checkWinAt(grid, row, c);
      if (winner !== null) {
        return { score: winner === botPlayer ? 100000 + depth : -100000 - depth };
      }
    }
  }

  if (depth === 0) return { score: botPlayer === 0 ? evaluate(grid) : -evaluate(grid) };

  let bestCol = valid[0];
  if (maximizing) {
    let value = -Infinity;
    for (const c of valid) {
      const player = botPlayer;
      const row = dropAndRow(columns, c, player);
      const g = buildGrid(columns);
      const w = checkWinAt(g, row, c);
      let result;
      if (w === player) {
        result = { score: 100000 + depth };
      } else {
        result = alphaBeta(columns, depth - 1, alpha, beta, false, botPlayer);
      }
      undrop(columns, c);
      if (result.score > value) { value = result.score; bestCol = c; }
      alpha = Math.max(alpha, value);
      if (alpha >= beta) break;
    }
    return { score: value, col: bestCol };
  } else {
    let value = Infinity;
    const opponent = 1 - botPlayer;
    for (const c of valid) {
      const row = dropAndRow(columns, c, opponent);
      const g = buildGrid(columns);
      const w = checkWinAt(g, row, c);
      let result;
      if (w === opponent) {
        result = { score: -100000 - depth };
      } else {
        result = alphaBeta(columns, depth - 1, alpha, beta, true, botPlayer);
      }
      undrop(columns, c);
      if (result.score < value) { value = result.score; bestCol = c; }
      beta = Math.min(beta, value);
      if (alpha >= beta) break;
    }
    return { score: value, col: bestCol };
  }
}

export function getMove(state, difficulty = 'medium') {
  const columns = cloneColumns(state.columns);
  const botPlayer = state.currentPlayer;

  const depthMap = { easy: 2, medium: 4, hard: 6 };
  const depth = depthMap[difficulty] || 4;

  let validCols = getValidCols(columns);
  if (difficulty === 'hard') {
    // Centre-first move ordering
    validCols.sort((a, b) => Math.abs(a - 3) - Math.abs(b - 3));
  }

  const result = alphaBeta(columns, depth, -Infinity, Infinity, true, botPlayer);
  return { type: 'drop', col: result.col ?? validCols[0] };
}
