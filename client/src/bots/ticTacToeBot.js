/**
 * Tic-Tac-Toe Bot
 * Easy: random valid cell.
 * Medium: win-or-block heuristic.
 * Hard: full minimax.
 */

const ROWS = 3;
const COLS = 3;
const LINES = [
  [[0,0],[0,1],[0,2]], [[1,0],[1,1],[1,2]], [[2,0],[2,1],[2,2]],
  [[0,0],[1,0],[2,0]], [[0,1],[1,1],[2,1]], [[0,2],[1,2],[2,2]],
  [[0,0],[1,1],[2,2]], [[0,2],[1,1],[2,0]],
];

function getEmpty(board) {
  const cells = [];
  for (let r = 0; r < ROWS; r++)
    for (let c = 0; c < COLS; c++)
      if (board[r][c] === null) cells.push({ row: r, col: c });
  return cells;
}

function checkWin(board) {
  for (const line of LINES) {
    const v = board[line[0][0]][line[0][1]];
    if (v !== null && v === board[line[1][0]][line[1][1]] && v === board[line[2][0]][line[2][1]])
      return v;
  }
  return null;
}

function findWinningMove(board, player) {
  for (const { row, col } of getEmpty(board)) {
    board[row][col] = player;
    const won = checkWin(board) === player;
    board[row][col] = null;
    if (won) return { row, col };
  }
  return null;
}

function minimax(board, player, isMaximizing, maximizer) {
  const winner = checkWin(board);
  if (winner === maximizer) return 10;
  if (winner !== null) return -10;
  const empty = getEmpty(board);
  if (empty.length === 0) return 0;

  let best = isMaximizing ? -Infinity : Infinity;
  for (const { row, col } of empty) {
    board[row][col] = player;
    const score = minimax(board, 1 - player, !isMaximizing, maximizer);
    board[row][col] = null;
    best = isMaximizing ? Math.max(best, score) : Math.min(best, score);
  }
  return best;
}

function randomMove(board) {
  const empty = getEmpty(board);
  return empty[Math.floor(Math.random() * empty.length)] || null;
}

export function getMove(state, difficulty = 'medium') {
  const board = state.board.map(row => [...row]);
  const me = state.currentPlayer;
  const opponent = 1 - me;

  if (difficulty === 'easy') {
    const m = randomMove(board);
    return m ? { type: 'move', row: m.row, col: m.col } : null;
  }

  if (difficulty === 'medium') {
    // Win if possible
    const win = findWinningMove(board, me);
    if (win) return { type: 'move', row: win.row, col: win.col };
    // Block opponent win
    const block = findWinningMove(board, opponent);
    if (block) return { type: 'move', row: block.row, col: block.col };
    // Take center if available
    if (board[1][1] === null) return { type: 'move', row: 1, col: 1 };
    // Random
    const m = randomMove(board);
    return m ? { type: 'move', row: m.row, col: m.col } : null;
  }

  // Hard: full minimax
  const empty = getEmpty(board);
  if (empty.length === 0) return null;
  let bestScore = -Infinity;
  let bestMove = empty[0];
  for (const { row, col } of empty) {
    board[row][col] = me;
    const score = minimax(board, 1 - me, false, me);
    board[row][col] = null;
    if (score > bestScore) {
      bestScore = score;
      bestMove = { row, col };
    }
  }
  return { type: 'move', row: bestMove.row, col: bestMove.col };
}
