// client/src/components/SeriesScore.jsx — Live Series Scoreboard with Animated Pips
import React from 'react';

export default function SeriesScore({ series, p1Name = 'Player 1', p2Name = 'Opponent', isSolo = false }) {
  if (!series) return null;

  if (isSolo || !p2Name) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0.85rem 1.6rem',
          background: '#ffffff',
          border: '2px solid #e2e8f0',
          borderRadius: 'var(--radius)',
          marginBottom: '1.2rem',
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.04)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
          <span style={{ fontWeight: 800, color: '#2563eb', fontSize: '1.1rem' }}>
            👤 {p1Name}
          </span>
          <span className="badge badge-blue">SOLO MODE</span>
        </div>
        <div className="badge badge-gold">
          🏆 BEST TIME / HIGH SCORE
        </div>
      </div>
    );
  }

  const targetWins = series.format === 1 ? 1 : Math.floor(series.format / 2) + 1;
  const p1Wins = series.wins[0] || 0;
  const p2Wins = series.wins[1] || 0;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0.85rem 1.6rem',
        background: '#ffffff',
        border: '2px solid #e2e8f0',
        borderRadius: 'var(--radius)',
        marginBottom: '1.2rem',
        boxShadow: '0 4px 18px rgba(234, 88, 12, 0.05)',
      }}
    >
      {/* Player 1 (Blue) */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.9rem' }}>
        <span
          style={{
            fontWeight: 800,
            fontSize: '1.05rem',
            color: '#2563eb',
          }}
        >
          {p1Name}
        </span>
        <div style={{ display: 'flex', gap: '0.45rem' }}>
          {Array.from({ length: targetWins }).map((_, i) => (
            <div
              key={i}
              style={{
                width: 18,
                height: 18,
                borderRadius: '50%',
                border: '2px solid #2563eb',
                background: i < p1Wins ? '#2563eb' : '#eff6ff',
                boxShadow: i < p1Wins ? '0 0 8px rgba(37, 99, 235, 0.5)' : 'none',
                transition: 'all 0.25s ease',
              }}
            />
          ))}
        </div>
      </div>

      {/* Center Match Format & Stakes */}
      <div style={{ textAlign: 'center' }}>
        <div
          className="badge"
          style={{
            borderColor: series.titleMode ? '#f59e0b' : '#cbd5e1',
            color: series.titleMode ? '#b45309' : '#334155',
            background: series.titleMode ? '#fffbeb' : '#f8fafc',
            fontWeight: 800,
            fontSize: '0.85rem',
          }}
        >
          {series.titleMode ? '🏆 TITLE STAKE' : '⚔️ RIVALRY'} •{' '}
          {series.format === 1
            ? 'Single Match (1 Round)'
            : `Best of ${series.format}${series.format === 2 ? ' (Sudden Death)' : ''}`}
        </div>
        <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '0.2rem', fontWeight: 700 }}>
          Round {series.round + 1}
        </div>
      </div>

      {/* Player 2 (Red) */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.9rem' }}>
        <div style={{ display: 'flex', gap: '0.45rem' }}>
          {Array.from({ length: targetWins }).map((_, i) => (
            <div
              key={i}
              style={{
                width: 18,
                height: 18,
                borderRadius: '50%',
                border: '2px solid #dc2626',
                background: i < p2Wins ? '#dc2626' : '#fef2f2',
                boxShadow: i < p2Wins ? '0 0 8px rgba(220, 38, 38, 0.5)' : 'none',
                transition: 'all 0.25s ease',
              }}
            />
          ))}
        </div>
        <span
          style={{
            fontWeight: 800,
            fontSize: '1.05rem',
            color: '#dc2626',
          }}
        >
          {p2Name}
        </span>
      </div>
    </div>
  );
}
