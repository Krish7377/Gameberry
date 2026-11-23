// client/src/games/MinesweeperView.jsx — React View for Minesweeper with Mobile/Touch Support
import React, { useState } from 'react';

const NUMBER_COLORS = [
  'transparent',
  '#2563eb', // 1: Blue
  '#16a34a', // 2: Green
  '#dc2626', // 3: Red
  '#7c3aed', // 4: Purple
  '#ea580c', // 5: Amber/Orange
  '#0891b2', // 6: Cyan
  '#db2777', // 7: Pink
  '#475569', // 8: Slate Gray
];

export default function MinesweeperView({ state, onAction, disabled = false }) {
  const { rows, cols, grid, phase, flagsCount, mineCount } = state;
  const [clickMode, setClickMode] = useState('reveal'); // 'reveal' or 'flag'

  const handleCellClick = (r, c) => {
    if (disabled || phase !== 'playing') return;
    if (clickMode === 'flag') {
      onAction({ type: 'flag', row: r, col: c });
    } else {
      onAction({ type: 'reveal', row: r, col: c });
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
      {/* Top Status & Controls */}
      <div style={{ display: 'flex', gap: '1.2rem', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center' }}>
        <span style={{ color: '#dc2626', fontWeight: 800, fontSize: '0.95rem' }}>
          🚩 Flags: {flagsCount} / {mineCount}
        </span>

        {/* Dig / Flag Mode Switcher (Great for touch laptops and mobile) */}
        <div style={{ display: 'flex', gap: '0.4rem', background: '#f1f5f9', padding: '3px', borderRadius: '999px', border: '1px solid #cbd5e1' }}>
          <button
            onClick={() => setClickMode('reveal')}
            className="btn"
            style={{
              padding: '0.3rem 0.9rem',
              fontSize: '0.82rem',
              background: clickMode === 'reveal' ? '#ea580c' : 'transparent',
              color: clickMode === 'reveal' ? '#ffffff' : '#0f172a',
              boxShadow: clickMode === 'reveal' ? '0 2px 6px rgba(234, 88, 12, 0.3)' : 'none',
              border: 'none',
              fontWeight: 800,
            }}
          >
            ⛏️ Dig Mode
          </button>
          <button
            onClick={() => setClickMode('flag')}
            className="btn"
            style={{
              padding: '0.3rem 0.9rem',
              fontSize: '0.82rem',
              background: clickMode === 'flag' ? '#dc2626' : 'transparent',
              color: clickMode === 'flag' ? '#ffffff' : '#0f172a',
              boxShadow: clickMode === 'flag' ? '0 2px 6px rgba(220, 38, 38, 0.3)' : 'none',
              border: 'none',
              fontWeight: 800,
            }}
          >
            🚩 Flag Mode
          </button>
        </div>
      </div>

      {/* Grid */}
      <div
        className={phase === 'lost' ? 'anim-shake' : ''}
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${cols}, 34px)`,
          gap: '3px',
          background: '#cbd5e1',
          padding: '10px',
          borderRadius: '16px',
          border: '3px solid #94a3b8',
          boxShadow: '0 8px 25px rgba(0, 0, 0, 0.08)',
        }}
        onContextMenu={(e) => e.preventDefault()}
      >
        {grid.map((row, r) =>
          row.map((cell, c) => {
            return (
              <button
                key={`${r}-${c}`}
                onClick={() => handleCellClick(r, c)}
                onContextMenu={(e) => {
                  e.preventDefault();
                  if (!disabled && phase === 'playing') {
                    onAction({ type: 'flag', row: r, col: c });
                  }
                }}
                disabled={disabled || (cell.revealed && cell.neighborMines === 0)}
                style={{
                  width: '34px',
                  height: '34px',
                  background: cell.revealed
                    ? cell.mine
                      ? '#fee2e2'
                      : '#f1f5f9'
                    : '#ffffff',
                  border: cell.revealed
                    ? '1px solid #cbd5e1'
                    : '2px solid #cbd5e1',
                  borderRadius: '6px',
                  fontSize: '1rem',
                  fontWeight: 900,
                  color: cell.revealed && cell.neighborMines > 0
                    ? NUMBER_COLORS[cell.neighborMines]
                    : '#0f172a',
                  cursor: !cell.revealed && phase === 'playing' ? 'pointer' : 'default',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 0,
                  boxShadow: !cell.revealed ? '0 2px 4px rgba(0,0,0,0.06)' : 'none',
                }}
              >
                {cell.flagged
                  ? '🚩'
                  : cell.revealed
                  ? cell.mine
                    ? '💥'
                    : cell.neighborMines > 0
                    ? cell.neighborMines
                    : ''
                  : ''}
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
