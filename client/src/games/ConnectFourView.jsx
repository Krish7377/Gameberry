// client/src/games/ConnectFourView.jsx — React View for Connect Four
import React, { useState } from 'react';
import { motion } from 'framer-motion';

export default function ConnectFourView({ state, onAction, disabled = false }) {
  const { grid, columns, currentPlayer, phase, winCells } = state;
  const [hoverCol, setHoverCol] = useState(null);

  const isWinCell = (r, c) => {
    if (!winCells) return false;
    return winCells.some(([wr, wc]) => wr === r && wc === c);
  };

  const isP1 = currentPlayer === 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.2rem' }}>
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
          isP1 ? '🔵 PLAYER 1 (BLUE) TURN' : '🔴 PLAYER 2 (RED) TURN'
        ) : phase === 'won' ? (
          '🏆 4-IN-A-ROW ACHIEVED!'
        ) : (
          '🤝 BOARD FULL (DRAW)'
        )}
      </div>

      {/* 7 Columns Board */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 60px)',
          gap: '10px',
          background: '#1d4ed8',
          padding: '16px',
          borderRadius: '24px',
          border: '4px solid #3b82f6',
          boxShadow: '0 12px 30px rgba(29, 78, 216, 0.25), 0 4px 0 #1e40af',
        }}
      >
        {Array.from({ length: 7 }).map((_, c) => {
          const colFull = columns[c].size >= 6;
          return (
            <div
              key={c}
              onClick={() => {
                if (!disabled && phase === 'playing' && !colFull) {
                  onAction({ type: 'drop', col: c });
                }
              }}
              onMouseEnter={() => setHoverCol(c)}
              onMouseLeave={() => setHoverCol(null)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
                cursor: !disabled && phase === 'playing' && !colFull ? 'pointer' : 'default',
                background: hoverCol === c && !colFull ? 'rgba(255, 255, 255, 0.12)' : 'transparent',
                borderRadius: '12px',
                padding: '4px 2px',
                transition: 'background 0.15s ease',
              }}
            >
              {Array.from({ length: 6 }).map((_, r) => {
                const cell = grid[r][c];
                const isWin = isWinCell(r, c);
                // Ghost hover disc at top landing spot
                const landingRow = 6 - columns[c].size - 1;
                const isGhost = hoverCol === c && r === landingRow && cell === null && phase === 'playing';

                return (
                  <motion.div
                    key={`${r}-${c}`}
                    animate={cell !== null ? { scale: [0.8, 1.05, 1] } : {}}
                    transition={{ duration: 0.2 }}
                    style={{
                      width: '56px',
                      height: '56px',
                      borderRadius: '50%',
                      background:
                        cell === 0
                          ? 'linear-gradient(135deg, #60a5fa, #2563eb)'
                          : cell === 1
                          ? 'linear-gradient(135deg, #f87171, #dc2626)'
                          : isGhost
                          ? isP1
                            ? 'rgba(96, 165, 250, 0.5)'
                            : 'rgba(248, 113, 113, 0.5)'
                          : '#ffffff',
                      border: isWin
                        ? '4px solid #10b981'
                        : cell !== null
                        ? cell === 0
                          ? '3px solid #93c5fd'
                          : '3px solid #fca5a5'
                        : isGhost
                        ? isP1
                          ? '3px dashed #3b82f6'
                          : '3px dashed #ef4444'
                        : '2px solid rgba(0, 0, 0, 0.08)',
                      boxShadow: isWin
                        ? '0 0 20px #10b981'
                        : cell === 0
                        ? '0 4px 10px rgba(37, 99, 235, 0.4)'
                        : cell === 1
                        ? '0 4px 10px rgba(220, 38, 38, 0.4)'
                        : 'inset 0 4px 6px rgba(0, 0, 0, 0.15)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#ffffff',
                      fontSize: '1.3rem',
                      fontWeight: 800,
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {cell === 0 ? '●' : cell === 1 ? '◆' : isGhost ? '◌' : ''}
                  </motion.div>
                );
              })}
            </div>
          );
        })}
      </div>

      <div style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', fontWeight: 700 }}>
        Click any column to drop: <span style={{ color: '#2563eb' }}>● Blue (P1)</span> vs{' '}
        <span style={{ color: '#dc2626' }}>◆ Red (P2)</span>
      </div>
    </div>
  );
}
