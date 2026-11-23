import * as ticTacToeEngine from './ticTacToe.js';
import * as ticTacToeBot from '../bots/ticTacToeBot.js';

import * as connectFourEngine from './connectFour.js';
import * as connectFourBot from '../bots/connectFourBot.js';

import * as minesweeperEngine from './minesweeper.js';
import * as minesweeperBot from '../bots/minesweeperBot.js';

import * as sudokuEngine from './sudoku.js';
import * as sudokuBot from '../bots/sudokuBot.js';

import * as speedSudokuEngine from './speedSudoku.js';

import * as memoryEngine from './memory.js';
import * as memoryBot from '../bots/memoryBot.js';

import * as game2048Engine from './game2048.js';
import * as game2048Bot from '../bots/game2048Bot.js';

export const GAME_REGISTRY = [
  // ── 1v1 Rivalry Games (Turn-based & Head-to-Head Race) ──
  {
    id: 'tic-tac-toe',
    name: 'Tic-Tac-Toe',
    category: 'Strategy',
    icon: '✳',
    format: 'turn-based',
    modeType: 'versus', // 1v1 Versus (Bot, Local 2P, Online)
    description: 'Three in a row. Blue (X) vs Red (O) with full undo/redo stack history.',
    engine: ticTacToeEngine,
    bot: ticTacToeBot,
  },
  {
    id: 'connect-four',
    name: 'Connect Four',
    category: 'Strategy',
    icon: '◉',
    format: 'turn-based',
    modeType: 'versus', // 1v1 Versus
    description: 'Connect four in a row. Blue discs vs Red discs with 7-column stacks.',
    engine: connectFourEngine,
    bot: connectFourBot,
  },
  {
    id: 'memory',
    name: 'Memory Card Flip',
    category: 'Arcade',
    icon: '▧',
    format: 'turn-based',
    modeType: 'versus', // 1v1 Versus
    description: 'Flip emoji pairs. Match to earn extra turns; build combo streaks.',
    engine: memoryEngine,
    bot: memoryBot,
  },
  {
    id: 'minesweeper',
    name: 'Minesweeper Race',
    category: 'Puzzle',
    icon: '✹',
    format: 'race',
    modeType: 'versus', // 1v1 Race or Solo
    description: 'Identical seeded minefields. BFS flood-fill cascade; clear safely to win.',
    engine: minesweeperEngine,
    bot: minesweeperBot,
  },

  // ── Solo Puzzle & Arcade Games (No Bot 1v1 Needed) ──
  {
    id: '2048',
    name: '2048 Classic',
    category: 'Arcade',
    icon: '◈',
    format: 'solo',
    modeType: 'solo', // Pure Solo
    description: 'Merge number tiles to reach 512, 1024, or 2048. Matrix row compression.',
    engine: game2048Engine,
    bot: game2048Bot,
  },
  {
    id: 'sudoku',
    name: 'Sudoku 9×9',
    category: 'Puzzle',
    icon: '▦',
    format: 'solo',
    modeType: 'solo', // Pure Solo
    description: 'Classic 9×9 logic grid with instant O(1) conflict validation.',
    engine: sudokuEngine,
    bot: sudokuBot,
  },
  {
    id: 'speed-sudoku',
    name: 'Speed Sudoku',
    category: 'Puzzle',
    icon: '⌁',
    format: 'solo',
    modeType: 'solo', // Pure Solo
    description: 'Race against the countdown timer in 4×4 or 6×6 subgrids.',
    engine: speedSudokuEngine,
    bot: sudokuBot,
  },
];

export function getGame(id) {
  return GAME_REGISTRY.find((game) => game.id === id) || GAME_REGISTRY[0];
}

export function getVersusGames() {
  return GAME_REGISTRY.filter((game) => game.modeType === 'versus');
}

export function getSoloGames() {
  return GAME_REGISTRY.filter((game) => game.modeType === 'solo');
}
