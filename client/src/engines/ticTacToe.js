// DSA: Stack provides O(1) push/pop for undo/redo move history, naturally LIFO.
import { Stack } from '../dsa/structures.js';
import { createRandom } from '../core/random.js';

const ROWS = 3;
const COLS = 3;
const LINES = [
  // rows
  [[0,0],[0,1],[0,2]],
  [[1,0],[1,1],[1,2]],
  [[2,0],[2,1],[2,2]],
  // cols
  [[0,0],[1,0],[2,0]],
  [[0,1],[1,1],[2,1]],
  [[0,2],[1,2],[2,2]],
  // diagonals
  [[0,0],[1,1],[2,2]],
  [[0,2],[1,1],[2,0]],
];

function emptyBoard() {
  return Array.from({ length: ROWS }, () => Array(COLS).fill(null));
}

function cloneBoard(board) {
  return board.map(row => [...row]);
}

function checkWinner(board) {
  for (const line of LINES) {
    const [a, b, c] = line;
    const v = board[a[0]][a[1]];
    if (v !== null && v === board[b[0]][b[1]] && v === board[c[0]][c[1]]) {
      return { winner: v, line };
    }
  }
  return null;
}

function isFull(board) {
  for (let r = 0; r < ROWS; r++)
    for (let c = 0; c < COLS; c++)
      if (board[r][c] === null) return false;
  return true;
}

/** Could the opponent win on their next move at (row,col)? */
function isBlockingMove(board, player, row, col) {
  const opponent = 1 - player;
  // Temporarily place opponent's mark and check
  const test = cloneBoard(board);
  test[row][col] = opponent;
  return checkWinner(test) !== null;
}

export function create(seed, options = {}) {
  const rng = createRandom(seed);
  return {
    board: emptyBoard(),
    currentPlayer: 0,
    // DSA: Stack for undo history — last move is always on top, O(1) push/pop.
    undoStack: new Stack(),
    // DSA: Stack for redo history — undone moves are restored in reverse order.
    redoStack: new Stack(),
    events: [],
    moveCount: 0,
    phase: 'playing',
    winner: null,
    winLine: null,
    rng,
  };
}

export function apply(state, action) {
  const events = [];

  if (action.type === 'undo') {
    if (state.undoStack.size === 0) return { ...state, events };
    const move = state.undoStack.pop(); // DSA: Stack pop retrieves the most recent move in O(1).
    state.redoStack.push(move);         // DSA: Stack push stores undone move for potential redo.
    state.board[move.row][move.col] = null;
    state.currentPlayer = move.player;
    state.moveCount -= 1;
    state.phase = 'playing';
    state.winner = null;
    state.winLine = null;
    return { ...state, events };
  }

  if (action.type === 'redo') {
    if (state.redoStack.size === 0) return { ...state, events };
    const move = state.redoStack.pop(); // DSA: Stack pop retrieves the last undone move.
    state.undoStack.push(move);         // DSA: Stack push re-records the move in history.
    state.board[move.row][move.col] = move.player;
    state.currentPlayer = 1 - move.player;
    state.moveCount += 1;
    // Re-check game state after redo
    const result = checkWinner(state.board);
    if (result) {
      state.phase = 'won';
      state.winner = result.winner;
      state.winLine = result.line;
      events.push({ type: 'win', winner: result.winner, line: result.line });
    } else if (isFull(state.board)) {
      state.phase = 'draw';
      events.push({ type: 'draw' });
    }
    return { ...state, events };
  }

  if (action.type === 'move') {
    const { row, col } = action;
    if (state.phase !== 'playing') return { ...state, events };
    if (row < 0 || row >= ROWS || col < 0 || col >= COLS) return { ...state, events };
    if (state.board[row][col] !== null) return { ...state, events };

    const player = state.currentPlayer;

    // Check if this is a clutch block before placing
    const blocking = isBlockingMove(state.board, player, row, col);

    state.board[row][col] = player;
    state.moveCount += 1;

    const moveRecord = { row, col, player };
    state.undoStack.push(moveRecord); // DSA: Stack push records move for O(1) undo access.
    state.redoStack.clear();          // DSA: Clear redo stack — new move invalidates redo branch.

    events.push({ type: 'move', row, col, player });

    if (blocking) {
      events.push({ type: 'combo', kind: 'block', row, col, player });
    }

    const result = checkWinner(state.board);
    if (result) {
      state.phase = 'won';
      state.winner = result.winner;
      state.winLine = result.line;
      events.push({ type: 'win', winner: result.winner, line: result.line });
    } else if (isFull(state.board)) {
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
    movesPlayedInStack: state.undoStack.size,
    totalBoardCells: 9,
    remainingEmptyCells: 9 - state.undoStack.size,
    activePlayer: state.currentPlayer === 0 ? 'Player 1 (Blue X)' : 'Player 2 (Red O)',
    phase: state.phase,
    winningLine: state.winLine || 'None',
  };
}
