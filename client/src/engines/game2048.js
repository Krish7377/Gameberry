// DSA: Stack for limited snapshot undo (with PRNG state); 2D Array matrix transformations.
import { Stack } from '../dsa/structures.js';
import { createRandom } from '../core/random.js';

let nextTileId = 1;

function createEmptyGrid() {
  return Array.from({ length: 4 }, () => Array(4).fill(null));
}

function cloneGrid(grid) {
  return grid.map(row => row.map(tile => (tile ? { ...tile } : null)));
}

function spawnTile(grid, rng) {
  const empty = [];
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      if (grid[r][c] === null) empty.push([r, c]);
    }
  }
  if (empty.length === 0) return null;
  const [r, c] = empty[rng.int(empty.length)];
  const value = rng.next() < 0.9 ? 2 : 4;
  const tile = { id: nextTileId++, value, row: r, col: c };
  grid[r][c] = tile;
  return tile;
}

export function create(seed, options = {}) {
  const rng = createRandom(seed);
  const targetTile = options.targetTile || 512;
  const grid = createEmptyGrid();

  // Spawn 2 initial tiles
  spawnTile(grid, rng);
  spawnTile(grid, rng);

  return {
    grid,
    score: 0,
    targetTile,
    // DSA: Stack for limited undo snapshots (capped at 3).
    undoStack: new Stack(),
    maxUndos: 3,
    phase: 'playing', // 'playing', 'won', 'lost'
    winner: null,
    rng,
  };
}

// 1D row compress and merge: slide left
function slideRowLeft(row, events) {
  const filtered = row.filter(t => t !== null);
  const result = Array(4).fill(null);
  let mergeIndex = 0;
  let scoreGain = 0;
  let mergesThisRow = 0;

  for (let i = 0; i < filtered.length; i++) {
    if (i < filtered.length - 1 && filtered[i].value === filtered[i + 1].value) {
      const mergedVal = filtered[i].value * 2;
      result[mergeIndex] = {
        id: nextTileId++,
        value: mergedVal,
        mergedFrom: [filtered[i].id, filtered[i + 1].id],
      };
      scoreGain += mergedVal;
      mergesThisRow++;
      events.push({ type: 'merge', value: mergedVal });
      i++; // skip next tile because it merged
    } else {
      result[mergeIndex] = { ...filtered[i] };
    }
    mergeIndex++;
  }

  return { row: result, scoreGain, merges: mergesThisRow };
}

function rotateGridClockwise(grid) {
  const rotated = createEmptyGrid();
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      rotated[c][3 - r] = grid[r][c];
    }
  }
  return rotated;
}

function rotateGridCounterClockwise(grid) {
  const rotated = createEmptyGrid();
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      rotated[3 - c][r] = grid[r][c];
    }
  }
  return rotated;
}

function rotateGrid180(grid) {
  return rotateGridClockwise(rotateGridClockwise(grid));
}

function gridsEqual(g1, g2) {
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      const v1 = g1[r][c]?.value ?? null;
      const v2 = g2[r][c]?.value ?? null;
      if (v1 !== v2) return false;
    }
  }
  return true;
}

function hasMovesRemaining(grid) {
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      if (grid[r][c] === null) return true;
      const v = grid[r][c].value;
      if (r < 3 && grid[r + 1][c]?.value === v) return true;
      if (c < 3 && grid[r][c + 1]?.value === v) return true;
    }
  }
  return false;
}

export function apply(state, action) {
  const events = [];

  if (action.type === 'undo') {
    if (state.undoStack.size === 0) return { ...state, events };
    // DSA: Stack pop retrieves the snapshot in O(1)
    const snapshot = state.undoStack.pop();
    state.grid = cloneGrid(snapshot.grid);
    state.score = snapshot.score;
    state.phase = snapshot.phase;
    state.winner = snapshot.winner;
    state.rng.setState(snapshot.rngState);
    events.push({ type: 'undo', remainingUndos: state.undoStack.size });
    return { ...state, events };
  }

  if (action.type === 'move') {
    if (state.phase !== 'playing') return { ...state, events };

    const dir = action.dir; // 'left', 'right', 'up', 'down'
    let current = cloneGrid(state.grid);

    // Save snapshot onto undo stack before moving (capped at maxUndos)
    const snapshot = {
      grid: cloneGrid(state.grid),
      score: state.score,
      phase: state.phase,
      winner: state.winner,
      rngState: state.rng.getState(),
    };

    // Transform grid so that target slide direction becomes 'left'
    if (dir === 'up') current = rotateGridCounterClockwise(current);
    else if (dir === 'right') current = rotateGrid180(current);
    else if (dir === 'down') current = rotateGridClockwise(current);

    let totalScoreGain = 0;
    let totalMerges = 0;
    const newGrid = createEmptyGrid();

    for (let r = 0; r < 4; r++) {
      const { row: slidRow, scoreGain, merges } = slideRowLeft(current[r], events);
      newGrid[r] = slidRow;
      totalScoreGain += scoreGain;
      totalMerges += merges;
    }

    // Revert rotation back
    let finalGrid = newGrid;
    if (dir === 'up') finalGrid = rotateGridClockwise(newGrid);
    else if (dir === 'right') finalGrid = rotateGrid180(newGrid);
    else if (dir === 'down') finalGrid = rotateGridCounterClockwise(newGrid);

    // Check if board actually changed
    if (!gridsEqual(state.grid, finalGrid)) {
      // DSA: Push previous state snapshot onto Stack
      if (state.undoStack.size >= state.maxUndos) {
        // Shift oldest if at capacity
        const items = state.undoStack.toArray().slice(1);
        state.undoStack = new Stack(items);
      }
      state.undoStack.push(snapshot);

      state.grid = finalGrid;
      state.score += totalScoreGain;

      // Update positions
      for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 4; c++) {
          if (state.grid[r][c]) {
            state.grid[r][c].row = r;
            state.grid[r][c].col = c;
          }
        }
      }

      // Spawn new tile
      const spawned = spawnTile(state.grid, state.rng);
      events.push({ type: 'move', dir, scoreGain: totalScoreGain, spawned });

      if (totalMerges >= 2) {
        events.push({ type: 'combo', kind: 'multi-merge', count: totalMerges });
      }

      // Check win condition (reached target tile)
      for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 4; c++) {
          if (state.grid[r][c]?.value >= state.targetTile && state.phase === 'playing') {
            state.phase = 'won';
            state.winner = 'self';
            events.push({ type: 'win', target: state.targetTile });
          }
        }
      }

      // Check loss condition (no moves remaining)
      if (state.phase === 'playing' && !hasMovesRemaining(state.grid)) {
        state.phase = 'lost';
        state.winner = 'opponent';
        events.push({ type: 'loss', reason: 'no_moves' });
      }
    }

    return { ...state, events };
  }

  return { ...state, events };
}

export function status(state) {
  let maxTile = 0;
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      if (state.grid[r][c]?.value > maxTile) maxTile = state.grid[r][c].value;
    }
  }
  return {
    phase: state.phase,
    winner: state.winner,
    score: state.score,
    maxTile,
    targetTile: state.targetTile,
    undoCount: state.undoStack.size,
    progress: Math.min(100, Math.floor((Math.log2(maxTile || 2) / Math.log2(state.targetTile)) * 100)),
  };
}

export function inspect(state) {
  let maxTile = 0;
  let filledTiles = 0;
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      if (state.grid[r][c]) {
        filledTiles++;
        if (state.grid[r][c].value > maxTile) maxTile = state.grid[r][c].value;
      }
    }
  }
  return {
    currentScore: state.score,
    highestTileOnBoard: maxTile || 2,
    activeTilesCount: `${filledTiles} / 16`,
    movesMadeInHistory: state.undoStack.size,
    phase: state.phase,
  };
}
