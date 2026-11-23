// client/src/games/SudokuView.jsx — React View for Sudoku
import React, { useState, useEffect } from 'react';

export default function SudokuView({ state, onAction, disabled = false }) {
  const { board, given, conflicts, phase } = state;
  const [selected, setSelected] = useState([0, 0]);

  // Keyboard navigation and number entry
  useEffect(() => {
    function handleKeyDown(e) {
      if (disabled || phase !== 'playing') return;
      const [r, c] = selected;

      if (e.key >= '1' && e.key <= '9') {
        onAction({ type: 'move', row: r, col: c, val: Number(e.key) });
      } else if (e.key === 'Backspace' || e.key === 'Delete' || e.key === '0') {
        onAction({ type: 'move', row: r, col: c, val: 0 });
      } else if (e.key === 'ArrowUp') {
        setSelected(([pr, pc]) => [Math.max(0, pr - 1), pc]);
      } else if (e.key === 'ArrowDown') {
        setSelected(([pr, pc]) => [Math.min(8, pr + 1), pc]);
      } else if (e.key === 'ArrowLeft') {
        setSelected(([pr, pc]) => [pr, Math.max(0, pc - 1)]);
      } else if (e.key === 'ArrowRight') {
        setSelected(([pr, pc]) => [pr, Math.min(8, pc + 1)]);
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selected, disabled, phase, onAction]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.4rem' }}>
      {/* 9x9 Board */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(9, 44px)',
          background: '#ffffff',
          padding: '8px',
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

            // Thicker border for 3x3 boxes
            const borderRight =
              (c + 1) % 3 === 0 && c !== 8 ? '2px solid #0f172a' : '1px solid #cbd5e1';
            const borderBottom =
              (r + 1) % 3 === 0 && r !== 8 ? '2px solid #0f172a' : '1px solid #cbd5e1';

            return (
              <div
                key={`${r}-${c}`}
                onClick={() => setSelected([r, c])}
                style={{
                  width: '44px',
                  height: '44px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.35rem',
                  fontWeight: isGiven ? 900 : 700,
                  color: hasConflict
                    ? '#dc2626'
                    : isGiven
                    ? '#0f172a'
                    : '#2563eb',
                  background: isSelected
                    ? '#dbeafe'
                    : hasConflict
                    ? '#fee2e2'
                    : '#ffffff',
                  borderRight,
                  borderBottom,
                  cursor: 'pointer',
                  userSelect: 'none',
                  transition: 'background 0.1s ease',
                }}
              >
                {val !== 0 ? val : ''}
              </div>
            );
          })
        )}
      </div>

      {/* Number Pad for Touch/Mouse */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center' }}>
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
          <button
            key={num}
            onClick={() => onAction({ type: 'move', row: selected[0], col: selected[1], val: num })}
            className="btn"
            style={{
              width: '44px',
              height: '44px',
              padding: 0,
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: '1.15rem',
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
