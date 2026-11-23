// client/src/games/SpeedSudokuView.jsx — React View for Speed Sudoku (4x4 or 6x6)
import React, { useState, useEffect } from 'react';

export default function SpeedSudokuView({ state, onAction, disabled = false }) {
  const { size, board, given, conflicts, phase } = state;
  const [selected, setSelected] = useState([0, 0]);

  // Box geometry
  const boxRows = 2;
  const boxCols = size === 4 ? 2 : 3;

  useEffect(() => {
    function handleKeyDown(e) {
      if (disabled || phase !== 'playing') return;
      const [r, c] = selected;

      const num = Number(e.key);
      if (num >= 1 && num <= size) {
        onAction({ type: 'move', row: r, col: c, val: num });
      } else if (e.key === 'Backspace' || e.key === 'Delete' || e.key === '0') {
        onAction({ type: 'move', row: r, col: c, val: 0 });
      } else if (e.key === 'ArrowUp') {
        setSelected(([pr, pc]) => [Math.max(0, pr - 1), pc]);
      } else if (e.key === 'ArrowDown') {
        setSelected(([pr, pc]) => [Math.min(size - 1, pr + 1), pc]);
      } else if (e.key === 'ArrowLeft') {
        setSelected(([pr, pc]) => [pr, Math.max(0, pc - 1)]);
      } else if (e.key === 'ArrowRight') {
        setSelected(([pr, pc]) => [pr, Math.min(size - 1, pc + 1)]);
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selected, disabled, phase, size, onAction]);

  if (phase === 'dnf') {
    return (
      <div style={{ textAlign: 'center', padding: '2rem' }}>
        <h2 style={{ color: '#dc2626', fontSize: '2.5rem', marginBottom: '0.5rem' }}>⏰ DNF!</h2>
        <p style={{ color: 'var(--text-secondary)' }}>You ran out of time before completing the grid.</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.4rem' }}>
      {/* Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${size}, 58px)`,
          background: '#ffffff',
          padding: '10px',
          borderRadius: '18px',
          border: '3px solid #0f172a',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.08)',
        }}
      >
        {board.map((row, r) =>
          row.map((val, c) => {
            const isGiven = given[r][c];
            const isSelected = selected[0] === r && selected[1] === c;
            const hasConflict = conflicts.has(`${r},${c}`);

            const borderRight =
              (c + 1) % boxCols === 0 && c !== size - 1
                ? '2px solid #0f172a'
                : '1px solid #cbd5e1';
            const borderBottom =
              (r + 1) % boxRows === 0 && r !== size - 1
                ? '2px solid #0f172a'
                : '1px solid #cbd5e1';

            return (
              <div
                key={`${r}-${c}`}
                onClick={() => setSelected([r, c])}
                style={{
                  width: '58px',
                  height: '58px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.5rem',
                  fontWeight: isGiven ? 900 : 700,
                  color: hasConflict
                    ? '#dc2626'
                    : isGiven
                    ? '#0f172a'
                    : '#ea580c',
                  background: isSelected
                    ? '#ffedd5'
                    : hasConflict
                    ? '#fee2e2'
                    : '#ffffff',
                  borderRight,
                  borderBottom,
                  cursor: 'pointer',
                  userSelect: 'none',
                }}
              >
                {val !== 0 ? val : ''}
              </div>
            );
          })
        )}
      </div>

      {/* Number Pad */}
      <div style={{ display: 'flex', gap: '8px' }}>
        {Array.from({ length: size }, (_, i) => i + 1).map((num) => (
          <button
            key={num}
            onClick={() => onAction({ type: 'move', row: selected[0], col: selected[1], val: num })}
            className="btn"
            style={{
              width: '46px',
              height: '46px',
              padding: 0,
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: '1.2rem',
              color: '#0f172a',
            }}
          >
            {num}
          </button>
        ))}
        <button
          onClick={() => onAction({ type: 'move', row: selected[0], col: selected[1], val: 0 })}
          className="btn btn-red"
          style={{ padding: '0 1.2rem', fontSize: '0.9rem' }}
        >
          Erase
        </button>
      </div>
    </div>
  );
}
