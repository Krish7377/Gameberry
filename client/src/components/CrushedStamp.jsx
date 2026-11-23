// client/src/components/CrushedStamp.jsx — The "CRUSHED!" series victory stamp & confetti
// Bright, Cheerful Warm White theme
import React, { useEffect } from 'react';
import { motion } from 'framer-motion';

const CONFETTI_COLORS = ['#ff5500', '#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#ea580c'];

export default function CrushedStamp({ winnerName = 'Player 1', loserName = 'Opponent', onDismiss }) {
  // Auto-dismiss after 3.5 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      if (onDismiss) onDismiss();
    }, 3500);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  // Generate 36 confetti pieces
  const confettiPieces = Array.from({ length: 36 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    delay: Math.random() * 0.4,
    duration: 1.8 + Math.random() * 1.5,
    color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
    size: 9 + Math.random() * 10,
  }));

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(255, 255, 255, 0.88)',
        backdropFilter: 'blur(12px)',
        pointerEvents: 'auto',
      }}
      onClick={onDismiss}
    >
      {/* Falling Confetti */}
      {confettiPieces.map((p) => (
        <motion.div
          key={p.id}
          initial={{ y: '-10vh', x: `${p.x}vw`, rotate: 0, opacity: 1 }}
          animate={{ y: '110vh', rotate: 720, opacity: 0.9 }}
          transition={{ duration: p.duration, delay: p.delay, ease: 'easeIn' }}
          style={{
            position: 'absolute',
            width: p.size,
            height: p.size * 1.6,
            background: p.color,
            borderRadius: '3px',
            pointerEvents: 'none',
          }}
        />
      ))}

      {/* Slamming CRUSHED! Stamp */}
      <motion.div
        initial={{ scale: 3.5, rotate: -18, opacity: 0 }}
        animate={{ scale: 1, rotate: -6, opacity: 1 }}
        transition={{ type: 'spring', damping: 12, stiffness: 220 }}
        onClick={(e) => e.stopPropagation()}
        style={{
          border: '6px dashed #ef4444',
          borderRadius: '24px',
          padding: '2rem 4rem',
          background: 'rgba(254, 242, 242, 0.98)',
          boxShadow: '0 20px 60px rgba(239, 68, 68, 0.35)',
          textAlign: 'center',
          maxWidth: '90vw',
        }}
      >
        <h1
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '5rem',
            color: '#ef4444',
            letterSpacing: '0.12em',
            textShadow: '0 4px 15px rgba(239, 68, 68, 0.4)',
            margin: 0,
            lineHeight: 1,
            fontWeight: 900,
          }}
        >
          CRUSHED!
        </h1>
        <div
          style={{
            marginTop: '1rem',
            fontFamily: 'var(--font-ui)',
            fontWeight: 800,
            fontSize: '1.4rem',
            color: '#0f172a',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
          }}
        >
          <span style={{ color: '#2563eb' }}>
            {winnerName}
          </span>{' '}
          CONQUERED{' '}
          <span style={{ color: '#dc2626' }}>
            {loserName}
          </span>
        </div>
      </motion.div>

      {/* Explicit Dismiss / Cancel Button */}
      <motion.button
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        onClick={(e) => {
          e.stopPropagation();
          if (onDismiss) onDismiss();
        }}
        className="btn btn-red"
        style={{
          marginTop: '2rem',
          padding: '0.8rem 2.2rem',
          fontSize: '1.05rem',
          fontWeight: 800,
        }}
      >
        ✕ Dismiss & View Results
      </motion.button>
    </div>
  );
}
