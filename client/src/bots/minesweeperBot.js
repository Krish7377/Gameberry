/**
 * Minesweeper Bot — Rule-based solver using a work Queue.
 * Deductions:
 * 1. Safe Neighbors: If flagged count == clue, unrevealed neighbors are 100% safe to reveal.
 * 2. Mine Neighbors: If unrevealed count == clue - flags, all unrevealed neighbors are mines.
 * 3. Guessing: Probability heuristic.
 */

// DSA: Queue for worklist traversal of revealed perimeter cells.
import { Queue } from '../dsa/structures.js';

function getNeighbors(r, c, rows, cols) {
  const neighbors = [];
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue;
      const nr = r + dr;
      const nc = c + dc;
      if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
        neighbors.push([nr, nc]);
      }
    }
  }
  return neighbors;
}

export function getMove(state, difficulty = 'medium') {
  const { rows, cols, grid } = state;

  // Work Queue holds revealed cells with positive clues
  const queue = new Queue();
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (grid[r][c].revealed && grid[r][c].neighborMines > 0) {
        queue.enqueue([r, c]);
      }
    }
  }

  const safeToReveal = [];
  const minesToFlag = [];

  while (queue.size > 0) {
    const [r, c] = queue.dequeue();
    const cell = grid[r][c];
    const neighbors = getNeighbors(r, c, rows, cols);

    let unrevealed = [];
    let flaggedCount = 0;

    for (const [nr, nc] of neighbors) {
      if (grid[nr][nc].flagged) flaggedCount++;
      else if (!grid[nr][nc].revealed) unrevealed.push([nr, nc]);
    }

    if (unrevealed.length === 0) continue;

    // Rule 1: All remaining unrevealed neighbors are safe
    if (flaggedCount === cell.neighborMines) {
      for (const [ur, uc] of unrevealed) {
        safeToReveal.push({ type: 'reveal', row: ur, col: uc });
      }
    }

    // Rule 2: All remaining unrevealed neighbors are mines
    if (unrevealed.length === cell.neighborMines - flaggedCount) {
      for (const [ur, uc] of unrevealed) {
        minesToFlag.push({ type: 'flag', row: ur, col: uc });
      }
    }
  }

  // Easy mode has a 20% mistake/random guess rate
  if (difficulty === 'easy' && Math.random() < 0.2) {
    // pick random
  } else {
    if (safeToReveal.length > 0) return safeToReveal[0];
    if (minesToFlag.length > 0) return minesToFlag[0];
  }

  // Fallback: Pick an unrevealed, unflagged cell
  const unrevealedPool = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (!grid[r][c].revealed && !grid[r][c].flagged) {
        unrevealedPool.push([r, c]);
      }
    }
  }

  if (unrevealedPool.length === 0) return null;
  const [pickR, pickC] = unrevealedPool[Math.floor(Math.random() * unrevealedPool.length)];
  return { type: 'reveal', row: pickR, col: pickC };
}
