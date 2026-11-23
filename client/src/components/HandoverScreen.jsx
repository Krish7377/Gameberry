// client/src/components/HandoverScreen.jsx — Pass-and-play screen shield with Bright Theme
import React from 'react';

export default function HandoverScreen({ nextPlayerName, onReady }) {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 850,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(255, 255, 255, 0.96)',
        backdropFilter: 'blur(16px)',
        padding: '2rem',
        textAlign: 'center',
      }}
    >
      <div style={{ fontSize: '4rem', marginBottom: '1rem', filter: 'drop-shadow(0 4px 10px rgba(234, 88, 12, 0.2))' }}>
        🛡️
      </div>
      <h2 style={{ fontSize: '2.4rem', marginBottom: '0.8rem', color: '#0f172a', fontWeight: 900 }}>
        Pass the Device
      </h2>
      <p style={{ maxWidth: 480, color: 'var(--text-secondary)', marginBottom: '2rem', lineHeight: 1.6, fontSize: '1.05rem' }}>
        Hand the device over to <strong style={{ color: '#ea580c' }}>{nextPlayerName || 'Player 2'}</strong>.
        The board remains hidden to prevent peeking at the seeded race layout!
      </p>
      <button
        onClick={onReady}
        className="btn btn-primary"
        style={{ padding: '0.85rem 2.4rem', fontSize: '1.1rem', fontWeight: 800 }}
      >
        I Am Ready to Play ➔
      </button>
    </div>
  );
}
