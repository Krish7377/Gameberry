/**
 * Sudoku & Speed Sudoku Bot — Paced ghost racer that fills cells from the known solution.
 * Pacing:
 * Easy: 3.0s per cell
 * Medium: 1.5s per cell
 * Hard: 0.8s per cell
 */

export const PACE_MS = {
  easy: 3000,
  medium: 1500,
  hard: 800,
};

export function getMove(state, difficulty = 'medium') {
  const { board, solution, size = 9 } = state;
  const emptyCells = [];

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (board[r][c] === 0) {
        emptyCells.push({ row: r, col: c });
      }
    }
  }

  if (emptyCells.length === 0) return null;

  // Pick the first empty cell and supply its correct digit from solution
  const target = emptyCells[0];
  const correctDigit = solution[target.row][target.col];

  return {
    type: 'move',
    row: target.row,
    col: target.col,
    val: correctDigit,
    delayMs: PACE_MS[difficulty] || 1500,
  };
}
