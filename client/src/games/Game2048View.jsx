// client/src/games/Game2048View.jsx — React View for 2048 with Framer Motion and Touch Swipes
import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

const TILE_COLORS = {
  2: { bg: '#e2e8f0', text: '#0f172a' },
  4: { bg: '#cbd5e1', text: '#0f172a' },
  8: { bg: '#fed7aa', text: '#7c2d12' },
  16: { bg: '#fdba74', text: '#7c2d12' },
  32: { bg: '#fb923c', text: '#fff' },
  64: { bg: '#f97316', text: '#fff' },
  128: { bg: '#fde047', text: '#713f12' },
  256: { bg: '#facc15', text: '#713f12' },
  512: { bg: '#eab308', text: '#000' },
  1024: { bg: '#3b82f6', text: '#fff' },
  2048: { bg: '#10b981', text: '#fff' },
};

export default function Game2048View({ state, onAction, disabled = false }) {
  const { grid, score, undoStack, maxUndos, phase } = state;
  const touchStartRef = useRef(null);

  // Keyboard navigation
  useEffect(() => {
    function handleKeyDown(e) {
      if (disabled || phase !== 'playing') return;
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        e.preventDefault();
        onAction({ type: 'move', dir: 'up' });
      } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
        e.preventDefault();
        onAction({ type: 'move', dir: 'down' });
      } else if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        e.preventDefault();
        onAction({ type: 'move', dir: 'left' });
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        e.preventDefault();
        onAction({ type: 'move', dir: 'right' });
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [disabled, phase, onAction]);

  // Touch Swipe handlers
  const onTouchStart = (e) => {
    const touch = e.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
  };

  const onTouchEnd = (e) => {
    if (!touchStartRef.current || disabled || phase !== 'playing') return;
    const touch = e.changedTouches[0];
    const dx = touch.clientX - touchStartRef.current.x;
    const dy = touch.clientY - touchStartRef.current.y;
    const absX = Math.abs(dx);
    const absY = Math.abs(dy);

    if (Math.max(absX, absY) > 25) {
      if (absX > absY) {
        onAction({ type: 'move', dir: dx > 0 ? 'right' : 'left' });
      } else {
        onAction({ type: 'move', dir: dy > 0 ? 'down' : 'up' });
      }
    }
    touchStartRef.current = null;
  };

  return (
    <div
      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.2rem' }}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* Top Status */}
      <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
        <div
          className="badge badge-gold"
          style={{ fontSize: '1.15rem', padding: '0.45rem 1.4rem', fontWeight: 800 }}
        >
          Score: {score}
        </div>
      </div>

      {/* 4x4 Grid Board */}
      <div
        style={{
          width: '340px',
          height: '340px',
          background: '#bbada0',
          borderRadius: '18px',
          border: '4px solid #a89988',
          boxShadow: '0 10px 25px rgba(0, 0, 0, 0.12), 0 3px 0 #8f8274',
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gridTemplateRows: 'repeat(4, 1fr)',
          gap: '10px',
          padding: '10px',
          position: 'relative',
        }}
      >
        {grid.map((row, r) =>
          row.map((tile, c) => {
            const config = tile ? TILE_COLORS[tile.value] || { bg: '#ea580c', text: '#fff' } : null;
            return (
              <div
                key={`${r}-${c}`}
                style={{
                  background: '#cdc1b4',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative',
                }}
              >
                {tile && (
                  <motion.div
                    key={tile.id}
                    layoutId={`tile-${tile.id}`}
                    initial={{ scale: 0.6, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                    style={{
                      position: 'absolute',
                      inset: 0,
                      background: config.bg,
                      color: config.text,
                      borderRadius: '10px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 900,
                      fontFamily: 'var(--font-display)',
                      fontSize: tile.value >= 1000 ? '1.3rem' : '1.7rem',
                      boxShadow: tile.value >= 128 ? `0 0 16px ${config.bg}99` : '0 2px 6px rgba(0,0,0,0.3)',
                    }}
                  >
                    {tile.value}
                  </motion.div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* On-screen Directional Controls */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem' }}>
        <button
          onClick={() => onAction({ type: 'move', dir: 'up' })}
          disabled={disabled || phase !== 'playing'}
          className="btn"
          style={{ padding: '0.4rem 1.2rem', fontSize: '1.1rem' }}
        >
          ▲
        </button>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={() => onAction({ type: 'move', dir: 'left' })}
            disabled={disabled || phase !== 'playing'}
            className="btn"
            style={{ padding: '0.4rem 1.2rem', fontSize: '1.1rem' }}
          >
            ◀
          </button>
          <button
            onClick={() => onAction({ type: 'move', dir: 'down' })}
            disabled={disabled || phase !== 'playing'}
            className="btn"
            style={{ padding: '0.4rem 1.2rem', fontSize: '1.1rem' }}
          >
            ▼
          </button>
          <button
            onClick={() => onAction({ type: 'move', dir: 'right' })}
            disabled={disabled || phase !== 'playing'}
            className="btn"
            style={{ padding: '0.4rem 1.2rem', fontSize: '1.1rem' }}
          >
            ▶
          </button>
        </div>
      </div>
      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
        Keyboard: Arrow Keys / WASD • Touch: Swipe Screen
      </div>
    </div>
  );
}
