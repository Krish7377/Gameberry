// client/src/games/MemoryView.jsx — React View for Memory Card Flip with Robust Card Display
import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function MemoryView({ state, onAction, disabled = false }) {
  const { deck, cardMap, streakMap, currentPlayer, phase, lockUntilMismatchResolved, size } = state;
  const resolveTimerRef = useRef(null);

  // Auto-resolve mismatch after brief preview
  useEffect(() => {
    if (lockUntilMismatchResolved) {
      if (resolveTimerRef.current) clearTimeout(resolveTimerRef.current);
      resolveTimerRef.current = setTimeout(() => {
        onAction({ type: 'resolveMismatch' });
        resolveTimerRef.current = null;
      }, 900);
    } else {
      if (resolveTimerRef.current) {
        clearTimeout(resolveTimerRef.current);
        resolveTimerRef.current = null;
      }
    }

    return () => {
      // Keep timer alive across renders, do not clear prematurely
    };
  }, [lockUntilMismatchResolved, onAction]);

  const streak = streakMap.get(currentPlayer) || 0;
  const isP1 = currentPlayer === 0;

  const handleCardClick = (idx) => {
    if (disabled || phase !== 'playing') return;

    // If mismatch is currently showing, clicking immediately clears it and flips
    if (lockUntilMismatchResolved) {
      if (resolveTimerRef.current) {
        clearTimeout(resolveTimerRef.current);
        resolveTimerRef.current = null;
      }
      onAction({ type: 'flip', index: idx });
      return;
    }

    const card = cardMap.get(idx);
    if (!card || card.isFlipped || card.isMatched) return;

    onAction({ type: 'flip', index: idx });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.2rem' }}>
      {/* Active Turn and Streak Indicator */}
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center' }}>
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
          {isP1 ? '🔵 PLAYER 1 (BLUE) TURN' : '🔴 PLAYER 2 (RED) TURN'}
        </div>

        {streak > 1 && (
          <span className="badge badge-orange" style={{ fontSize: '0.88rem', fontWeight: 800 }}>
            🔥 Combo Streak: {streak} in a row!
          </span>
        )}

        {lockUntilMismatchResolved && (
          <span
            onClick={() => onAction({ type: 'resolveMismatch' })}
            style={{
              cursor: 'pointer',
              fontSize: '0.85rem',
              fontWeight: 700,
              color: '#ea580c',
              background: '#fff7ed',
              padding: '0.35rem 0.8rem',
              borderRadius: '999px',
              border: '1px solid #fed7aa',
            }}
          >
            ⏳ Mismatch! Tap any card to continue ➔
          </span>
        )}
      </div>

      {/* Card Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${size}, 80px)`,
          gap: '12px',
          background: '#f8fafc',
          padding: '16px',
          borderRadius: '22px',
          border: '2px solid #e2e8f0',
          boxShadow: '0 8px 25px rgba(0, 0, 0, 0.05)',
        }}
      >
        {deck.map((_, idx) => {
          const card = cardMap.get(idx);
          if (!card) return null;
          const isFlipped = card.isFlipped || card.isMatched;

          return (
            <motion.button
              key={idx}
              whileHover={!isFlipped && !disabled ? { scale: 1.05 } : {}}
              whileTap={!isFlipped && !disabled ? { scale: 0.95 } : {}}
              onClick={() => handleCardClick(idx)}
              disabled={disabled || card.isMatched}
              style={{
                width: '80px',
                height: '80px',
                borderRadius: '16px',
                cursor: !isFlipped && !disabled ? 'pointer' : 'default',
                padding: 0,
                border: 'none',
                background: 'transparent',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
              }}
            >
              <AnimatePresence mode="wait">
                {isFlipped ? (
                  /* Card Face (Emoji shown clearly) */
                  <motion.div
                    key="face"
                    initial={{ scale: 0.7, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.7, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    style={{
                      width: '100%',
                      height: '100%',
                      borderRadius: '16px',
                      background: card.isMatched
                        ? '#ecfdf5'
                        : isP1
                        ? '#eff6ff'
                        : '#fef2f2',
                      border: card.isMatched
                        ? '3px solid #10b981'
                        : isP1
                        ? '3px solid #2563eb'
                        : '3px solid #dc2626',
                      boxShadow: card.isMatched
                        ? '0 0 16px rgba(16, 185, 129, 0.35)'
                        : isP1
                        ? '0 4px 12px rgba(37, 99, 235, 0.2)'
                        : '0 4px 12px rgba(220, 38, 38, 0.2)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '2.5rem',
                      userSelect: 'none',
                    }}
                  >
                    {card.face}
                  </motion.div>
                ) : (
                  /* Card Back (Orange ? with 3D depth) */
                  <motion.div
                    key="back"
                    initial={{ scale: 0.7, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.7, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    style={{
                      width: '100%',
                      height: '100%',
                      borderRadius: '16px',
                      background: 'linear-gradient(180deg, #ffffff 0%, #fff7ed 100%)',
                      border: '2px solid #fed7aa',
                      boxShadow: '0 4px 0 #ea580c, 0 8px 16px rgba(234, 88, 12, 0.15)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.9rem',
                      color: '#ea580c',
                      fontWeight: 900,
                      userSelect: 'none',
                    }}
                  >
                    ?
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
