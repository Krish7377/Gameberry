// client/src/components/Badge.jsx — Interactive 7-Day Rivalry Title Card
// Displays Title Date and Expiry ONLY when clicked/expanded
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function formatRemaining(ms) {
  if (ms <= 0) return 'Expired';
  const totalSec = Math.floor(ms / 1000);
  const days = Math.floor(totalSec / 86400);
  const hours = Math.floor((totalSec % 86400) / 3600);
  const minutes = Math.floor((totalSec % 3600) / 60);
  const seconds = totalSec % 60;

  if (days > 0) return `${days}d ${hours}h remaining`;
  if (hours > 0) return `${hours}h ${minutes}m remaining`;
  return `${minutes}m ${seconds}s remaining`;
}

function formatDate(timestamp) {
  if (!timestamp) return 'Recent Match';
  try {
    const d = new Date(timestamp);
    return d.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch (e) {
    return 'Recent Match';
  }
}

export default function Badge({ title, type, onRematch }) {
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(false);
  const [timeLeft, setTimeLeft] = useState(() => {
    return new Date(title.expiresAt).getTime() - Date.now();
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(new Date(title.expiresAt).getTime() - Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, [title.expiresAt]);

  const isVictor = type === 'winner' || title.status === 'winner' || title.winnerName;

  const opponentName = isVictor ? (title.loserName || 'Opponent') : (title.winnerName || 'Opponent');
  const titleDateStr = formatDate(title.createdAt || (title.expiresAt ? title.expiresAt - 7 * 86400000 : null));
  const expiryDateStr = formatDate(title.expiresAt);

  return (
    <div
      className="card"
      style={{
        padding: '0.9rem 1.2rem',
        borderLeft: isVictor ? '5px solid #f59e0b' : '5px solid #ef4444',
        background: isVictor ? '#fffbeb' : '#fef2f2',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        boxShadow: expanded ? '0 8px 24px rgba(0,0,0,0.08)' : '0 2px 6px rgba(0,0,0,0.03)',
      }}
      onClick={() => setExpanded(!expanded)}
    >
      {/* Top Banner Row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
          <span style={{ fontSize: '1.6rem' }}>{isVictor ? '🏆' : '💀'}</span>
          <div>
            <div style={{ fontWeight: 800, fontSize: '1.02rem', color: isVictor ? '#b45309' : '#dc2626' }}>
              {isVictor ? `CONQUERED ${opponentName}` : `CRUSHED BY ${opponentName}`}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
              Game: {title.gameName || '1v1 Arena'} {title.score ? `• Score: ${title.score}` : ''}
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setExpanded(!expanded);
          }}
          className="btn"
          style={{
            fontSize: '0.78rem',
            padding: '0.35rem 0.85rem',
            background: '#ffffff',
            fontWeight: 700,
            borderColor: isVictor ? '#fcd34d' : '#fca5a5',
            color: isVictor ? '#b45309' : '#b91c1c',
          }}
        >
          {expanded ? '▲ Hide Title Date' : '📅 Click for Title Date & Expiry ▼'}
        </button>
      </div>

      {/* Expanded Details: ONLY shown when title is clicked */}
      {expanded && (
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            marginTop: '1rem',
            paddingTop: '0.9rem',
            borderTop: '1px dashed #cbd5e1',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.6rem',
            fontSize: '0.85rem',
          }}
        >
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.8rem' }}>
            <div style={{ background: '#ffffff', padding: '0.6rem 0.9rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase' }}>
                📅 Title Staked Date:
              </span>
              <div style={{ fontWeight: 800, color: '#0f172a', marginTop: '0.2rem' }}>
                {titleDateStr}
              </div>
            </div>

            <div style={{ background: '#ffffff', padding: '0.6rem 0.9rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase' }}>
                ⏳ 7-Day Expiry Countdown:
              </span>
              <div style={{ fontWeight: 800, color: isVictor ? '#d97706' : '#dc2626', marginTop: '0.2rem' }}>
                {formatRemaining(timeLeft)} ({expiryDateStr})
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.4rem' }}>
            <button
              onClick={() => {
                if (onRematch) onRematch(title);
                else navigate('/lobby', { state: { rival: opponentName, titleMode: true } });
              }}
              className={isVictor ? 'btn btn-primary' : 'btn btn-danger'}
              style={{ fontSize: '0.82rem', padding: '0.45rem 1.1rem', fontWeight: 800 }}
            >
              {isVictor ? '⚔️ Defend Title in Rematch' : '⚔️ Rematch to Reclaim Honor'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
