// client/src/components/GameCard.jsx — Interactive Game Selection Card with Bright Warm Theme
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../net/AuthContext.jsx';

export default function GameCard({ game }) {
  const navigate = useNavigate();
  const { user } = useAuth();

  const isSolo = game.modeType === 'solo';

  const handleSelect = () => {
    if (isSolo) {
      // Direct jump into solo match with clean URL slug
      navigate(`/play/${game.id}`, {
        state: {
          format: 1,
          titleMode: false,
          games: [game.id],
          players: [{ id: user?._id || 'p1', username: user?.username || 'Player 1' }],
          isSolo: true,
          isOnline: false,
        },
      });
    } else {
      // 1v1 versus arena
      navigate('/lobby', { state: { selectedGame: game.id } });
    }
  };

  return (
    <div
      className="card"
      onClick={handleSelect}
      style={{
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        transition: 'all 0.18s ease',
        background: '#ffffff',
        border: isSolo ? '2px solid #fed7aa' : '2px solid #bfdbfe',
        boxShadow: '0 4px 14px rgba(0, 0, 0, 0.04)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-4px)';
        e.currentTarget.style.borderColor = isSolo ? 'var(--warm-orange)' : 'var(--p1-blue)';
        e.currentTarget.style.boxShadow = isSolo
          ? '0 12px 28px rgba(234, 88, 12, 0.16)'
          : '0 12px 28px rgba(37, 99, 235, 0.16)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'none';
        e.currentTarget.style.borderColor = isSolo ? '#fed7aa' : '#bfdbfe';
        e.currentTarget.style.boxShadow = '0 4px 14px rgba(0, 0, 0, 0.04)';
      }}
    >
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem' }}>
          <span style={{ fontSize: '2.2rem' }}>{game.icon}</span>
          <span
            className="badge"
            style={{
              borderColor: isSolo ? '#fed7aa' : '#bfdbfe',
              color: isSolo ? '#c2410c' : '#1d4ed8',
              background: isSolo ? '#fff7ed' : '#eff6ff',
              fontWeight: 800,
              fontSize: '0.78rem',
            }}
          >
            {isSolo ? '🧩 SOLO PUZZLE' : '⚔️ 1v1 VERSUS'}
          </span>
        </div>
        <h3 style={{ marginBottom: '0.4rem', color: '#0f172a', fontSize: '1.25rem', fontWeight: 800 }}>
          {game.name}
        </h3>
        <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
          {game.description}
        </p>
      </div>

      <div style={{ marginTop: '1.4rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 700 }}>
          {game.format.toUpperCase()}
        </span>
        <button
          className={`btn ${isSolo ? 'btn-gold' : 'btn-primary'}`}
          style={{ padding: '0.45rem 1.15rem', fontSize: '0.85rem' }}
          onClick={(e) => {
            e.stopPropagation();
            handleSelect();
          }}
        >
          {isSolo ? 'Play Solo ➔' : 'Play 1v1 ➔'}
        </button>
      </div>
    </div>
  );
}
