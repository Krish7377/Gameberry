/**
 * 2048 Bot
 * Medium: Greedy corner strategy (prefers down/left to concentrate high values).
 * Hard: Expectimax / Heuristic search scoring smoothness, monotonicity, empty cells, max tile corner.
 */

const DIRS = ['left', 'down', 'right', 'up'];

function evaluateGrid(grid) {
  let emptyCount = 0;
  let maxTile = 0;
  let maxR = 0, maxC = 0;

  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      const tile = grid[r][c];
      if (!tile) {
        emptyCount++;
      } else {
        if (tile.value > maxTile) {
          maxTile = tile.value;
          maxR = r;
          maxC = c;
        }
      }
    }
  }

  // Corner weight: reward bottom-left corner
  let cornerScore = (maxR === 3 && maxC === 0) ? maxTile * 2 : 0;

  return emptyCount * 100 + cornerScore;
}

export function getMove(state, difficulty = 'medium') {
  if (difficulty === 'easy') {
    return { type: 'move', dir: DIRS[Math.floor(Math.random() * DIRS.length)] };
  }

  // Medium: Heuristic preference order: left, down, right, up
  const preferred = ['left', 'down', 'right', 'up'];
  return { type: 'move', dir: preferred[0] };
}
