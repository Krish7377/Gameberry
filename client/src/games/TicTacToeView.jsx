// client/src/games/TicTacToeView.jsx — Pure React View for Tic-Tac-Toe
// Bright, Cheerful Warm White theme with Blue (X) vs Red (O)
import React from 'react';
import { motion } from 'framer-motion';

export default function TicTacToeView({ state, onAction, disabled = false }) {
  const { board, currentPlayer, phase, winLine } = state;

  const isWinningCell = (r, c) => {
    if (!winLine) return false;
    return winLine.some(([wr, wc]) => wr === r && wc === c);
  };

  const isP1 = currentPlayer === 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.4rem' }}>
      {/* Active Turn Indicator */}
      <div
        className="badge"
        style={{
          padding: '0.5rem 1.4rem',
          fontSize: '0.92rem',
          fontWeight: 800,
          borderColor: isP1 ? '#93c5fd' : '#fca5a5',
          background: isP1 ? '#eff6ff' : '#fef2f2',
          color: isP1 ? '#1d4ed8' : '#b91c1c',
          boxShadow: isP1 ? '0 2px 8px rgba(37, 99, 235, 0.15)' : '0 2px 8px rgba(220, 38, 38, 0.15)',
        }}
      >
        {phase === 'playing' ? (
          isP1 ? '🔵 PLAYER 1 (X) TURN' : '🔴 PLAYER 2 (O) TURN'
        ) : phase === 'won' ? (
          '🏆 MATCH DECIDED!'
        ) : (
          '🤝 IT\'S A DRAW!'
        )}
      </div>

      {/* Board Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 115px)',
          gridTemplateRows: 'repeat(3, 115px)',
          gap: '14px',
          background: '#f1f5f9',
          padding: '16px',
          borderRadius: '22px',
          border: '2px solid #e2e8f0',
          boxShadow: '0 8px 25px rgba(0, 0, 0, 0.05)',
        }}
      >
        {board.map((row, r) =>
          row.map((cell, c) => {
            const isWin = isWinningCell(r, c);
            const isFilled = cell !== null;

            return (
              <motion.button
                key={`${r}-${c}`}
                whileHover={!isFilled && phase === 'playing' && !disabled ? { scale: 1.04 } : {}}
                whileTap={!isFilled && phase === 'playing' && !disabled ? { scale: 0.96 } : {}}
                onClick={() => onAction({ type: 'move', row: r, col: c })}
                disabled={disabled || isFilled || phase !== 'playing'}
                style={{
                  width: '115px',
                  height: '115px',
                  background: isWin
                    ? '#dcfce7'
                    : isFilled
                    ? cell === 0
                      ? '#eff6ff'
                      : '#fef2f2'
                    : '#ffffff',
                  border: isWin
                    ? '3px solid #16a34a'
                    : isFilled
                    ? cell === 0
                      ? '3px solid #2563eb'
                      : '3px solid #dc2626'
                    : '2px solid #cbd5e1',
                  borderRadius: '16px',
                  fontSize: '3.6rem',
                  fontFamily: 'var(--font-display)',
                  fontWeight: 900,
                  color:
                    cell === 0
                      ? '#2563eb'
                      : cell === 1
                      ? '#dc2626'
                      : 'transparent',
                  cursor: !isFilled && phase === 'playing' && !disabled ? 'pointer' : 'default',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: isWin
                    ? '0 0 15px rgba(22, 163, 74, 0.4)'
                    : isFilled
                    ? cell === 0
                      ? '0 4px 10px rgba(37, 99, 235, 0.2)'
                      : '0 4px 10px rgba(220, 38, 38, 0.2)'
                    : '0 4px 0 #94a3b8, 0 6px 12px rgba(0, 0, 0, 0.05)',
                  transition: 'all 0.15s ease',
                }}
              >
                {cell === 0 ? 'X' : cell === 1 ? 'O' : ''}
              </motion.button>
            );
          })
        )}
      </div>
    </div>
  );
}
