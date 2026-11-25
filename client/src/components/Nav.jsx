// client/src/components/Nav.jsx — Top Navigation Bar with Bright, Warm White Arcade Theme
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../net/AuthContext.jsx';
import { useSound } from '../audio/SoundContext.jsx';

export default function Nav() {
  const { user, activePlayer, setActivePlayer } = useAuth();
  const { muted, toggleMute } = useSound();
  const location = useLocation();

  const isLobby = location.pathname === '/lobby' || location.pathname === '/arena';
  const isGames = location.pathname === '/' || location.pathname === '/games';

  return (
    <nav
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0.9rem 1.8rem',
        background: 'rgba(255, 255, 255, 0.96)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '2px solid #e2e8f0',
        boxShadow: '0 4px 20px rgba(234, 88, 12, 0.06), 0 1px 3px rgba(0, 0, 0, 0.03)',
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
        <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.7rem' }}>
          <span style={{ fontSize: '1.9rem', filter: 'drop-shadow(0 2px 4px rgba(234, 88, 12, 0.25))' }}>
            ⚔️
          </span>
          <span
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '1.55rem',
              fontWeight: 900,
              background: 'linear-gradient(135deg, #ff5500 0%, #ea580c 45%, #2563eb 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              letterSpacing: '0.04em',
            }}
          >
            GAMEBERRY
          </span>
        </Link>

        <div style={{ display: 'flex', gap: '0.6rem' }}>
          <Link
            to="/"
            className="btn"
            style={{
              padding: '0.5rem 1.1rem',
              fontSize: '0.88rem',
              background: isGames ? '#fff7ed' : '#ffffff',
              borderColor: isGames ? '#ea580c' : '#e2e8f0',
              color: isGames ? '#c2410c' : 'var(--text-primary)',
              boxShadow: isGames ? '0 3px 0 #cbd5e1' : 'none',
              fontWeight: isGames ? 800 : 600,
            }}
          >
            🎮 Games
          </Link>
          <Link
            to="/lobby"
            className="btn"
            style={{
              padding: '0.5rem 1.1rem',
              fontSize: '0.88rem',
              background: isLobby ? '#fff7ed' : '#ffffff',
              borderColor: isLobby ? '#ea580c' : '#e2e8f0',
              color: isLobby ? '#c2410c' : 'var(--text-primary)',
              boxShadow: isLobby ? '0 3px 0 #cbd5e1' : 'none',
              fontWeight: isLobby ? 800 : 600,
            }}
          >
            ⚔️ 1v1 Arena
          </Link>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        {/* Pass-and-play Player Switcher (Blue vs Red) */}
        <button
          onClick={() => setActivePlayer((p) => (p === 0 ? 1 : 0))}
          className="btn"
          title="Switch Active Pass-and-Play Device Player"
          style={{
            padding: '0.5rem 1rem',
            fontSize: '0.82rem',
            fontWeight: 800,
            background: activePlayer === 0 ? '#eff6ff' : '#fef2f2',
            borderColor: activePlayer === 0 ? '#3b82f6' : '#ef4444',
            color: activePlayer === 0 ? '#1d4ed8' : '#b91c1c',
            boxShadow:
              activePlayer === 0
                ? '0 2px 6px rgba(37, 99, 235, 0.15)'
                : '0 2px 6px rgba(220, 38, 38, 0.15)',
          }}
        >
          {activePlayer === 0 ? '🔵 P1: Blue (X)' : '🔴 P2: Red (O)'}
        </button>

        {/* Audio Mute/Unmute Toggle */}
        <button
          onClick={toggleMute}
          className="btn"
          title={muted ? 'Unmute Audio' : 'Mute Audio'}
          style={{ padding: '0.5rem 0.9rem', fontSize: '0.85rem' }}
        >
          {muted ? '🔇 Muted' : '🔊 Sound On'}
        </button>

        {/* User Profile */}
        <Link
          to="/profile"
          className="btn"
          style={{
            padding: '0.5rem 1.1rem',
            fontSize: '0.88rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            background: '#ffffff',
            border: '2px solid #e2e8f0',
          }}
        >
          <span>👤</span>
          <span style={{ fontWeight: 700 }}>{user?.username || 'Profile'}</span>
        </Link>
      </div>
    </nav>
  );
}
