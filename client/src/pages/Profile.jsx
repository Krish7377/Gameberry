// client/src/pages/Profile.jsx — User Profile, 7-Day Rivalry Titles, & Match History
import React, { useState, useEffect } from 'react';
import { useAuth } from '../net/AuthContext.jsx';
import Badge from '../components/Badge.jsx';
import api from '../net/api.js';
import { getActiveRivalries } from '../core/rivalryStorage.js';
import { getMatchHistory, clearMatchHistory } from '../core/matchHistoryStorage.js';
import { getPersonalBests, getAllConfiguredGames } from '../core/personalBestStorage.js';

function formatMatchTime(timestamp) {
  if (!timestamp) return 'Just now';
  try {
    const d = new Date(timestamp);
    return d.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch (e) {
    return 'Recently';
  }
}

export default function Profile() {
  const { user, login, register, logout } = useAuth();
  const [titles, setTitles] = useState([]);
  const [matchHistory, setMatchHistory] = useState([]);
  const [personalBests, setPersonalBests] = useState({});
  const [loading, setLoading] = useState(true);
  const [profileErrors, setProfileErrors] = useState({ titles: false, matches: false });

  // Auth form state for optional registration/login
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [authUsername, setAuthUsername] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authError, setAuthError] = useState('');

  useEffect(() => {
    if (!user) {
      setLoading(true);
      return;
    }

    setPersonalBests(getPersonalBests());

    // Local records are device-bound; only this device's guest may read them.
    if (user.isGuest || !user._id) {
      setTitles(getActiveRivalries());
      setMatchHistory(getMatchHistory());
      setProfileErrors({ titles: false, matches: false });
      setLoading(false);
      return;
    }

    let active = true;
    setLoading(true);
    Promise.allSettled([
      api.get(`/titles/${user._id}`),
      api.get(`/matches?userId=${user._id}`),
    ]).then(([titleRes, matchRes]) => {
      if (!active) return;
      const titlesFailed = titleRes.status === 'rejected';
      const matchesFailed = matchRes.status === 'rejected';
      setProfileErrors({ titles: titlesFailed, matches: matchesFailed });
      setTitles(titlesFailed ? [] : titleRes.value?.titles || []);

      if (matchesFailed) {
        setMatchHistory([]);
      } else {
        const serverList = (matchRes.value?.matches || []).map((m) => ({
          id: m._id || m.id,
          gameName: m.games?.[0] || '1v1 Arena',
          opponentName: m.players?.find((p) => p.id !== user._id)?.username || 'Opponent',
          opponentType: m.mode === 'bot' ? 'bot' : 'human',
          isTitleMatch: Boolean(m.titleMode),
          won: m.winner === user._id,
          score: Array.isArray(m.finalScore) ? `${m.finalScore[0]} - ${m.finalScore[1]}` : '1 - 0',
          playedAt: new Date(m.createdAt || Date.now()).getTime(),
        }));
        serverList.sort((a, b) => (b.playedAt || 0) - (a.playedAt || 0));
        setMatchHistory(serverList);
      }
    }).catch(() => {
      if (!active) return;
      setProfileErrors({ titles: true, matches: true });
      setTitles([]);
      setMatchHistory([]);
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, [user]);

  const handleClearHistory = () => {
    if (window.confirm('Clear your local match history?')) {
      clearMatchHistory();
      setMatchHistory([]);
    }
  };

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setAuthError('');
    try {
      if (isRegistering) {
        await register(authUsername, authPassword);
      } else {
        await login(authUsername, authPassword);
      }
      setShowAuthModal(false);
    } catch (err) {
      setAuthError(err.message || 'Authentication failed');
    }
  };

  const winCount = matchHistory.filter((m) => m.won).length || user?.wins || 0;
  const lossCount = matchHistory.filter((m) => !m.won && m.opponentType !== 'solo').length || user?.losses || 0;
  const total = winCount + lossCount;
  const winRate = total > 0 ? Math.round((winCount / total) * 100) : 0;

  return (
      <div style={{ maxWidth: 900, margin: '1rem auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Profile Header */}
      <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.2rem' }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #ff5500, #2563eb)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '2rem',
              boxShadow: '0 4px 14px rgba(234, 88, 12, 0.25)',
              color: '#ffffff',
            }}
          >
            👤
          </div>
          <div>
            <h2 style={{ marginBottom: '0.2rem', color: '#0f172a' }}>{user?.username || 'Challenger'}</h2>
            <div style={{ display: 'flex', gap: '0.6rem' }}>
              <span className="badge badge-blue">{user?.isGuest ? 'Guest Account' : 'Verified Member'}</span>
              <span className="badge badge-gold">Win Rate: {winRate}%</span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.8rem' }}>
          {user?.isGuest ? (
            <button onClick={() => setShowAuthModal(true)} className="btn btn-primary" style={{ fontSize: '0.88rem' }}>
              Save / Register Account
            </button>
          ) : (
            <button onClick={logout} className="btn" style={{ fontSize: '0.88rem' }}>
              Log Out
            </button>
          )}
        </div>
      </div>

      {/* Stats Summary Bento */}
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
        <div className="card" style={{ textAlign: 'center', padding: '1.2rem' }}>
          <div style={{ fontSize: '2.2rem', fontWeight: 900, color: '#2563eb' }}>{winCount}</div>
          <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 700 }}>Matches Won</div>
        </div>
        <div className="card" style={{ textAlign: 'center', padding: '1.2rem' }}>
          <div style={{ fontSize: '2.2rem', fontWeight: 900, color: '#dc2626' }}>{lossCount}</div>
          <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 700 }}>Matches Lost</div>
        </div>
        <div className="card" style={{ textAlign: 'center', padding: '1.2rem' }}>
          <div style={{ fontSize: '2.2rem', fontWeight: 900, color: '#ea580c' }}>{titles.length}</div>
          <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 700 }}>Active 7-Day Titles</div>
        </div>
        <div className="card" style={{ textAlign: 'center', padding: '1.2rem' }}>
          <div style={{ fontSize: '2.2rem', fontWeight: 900, color: '#10b981' }}>{matchHistory.length}</div>
          <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 700 }}>Total Recorded</div>
        </div>
      </section>

      {/* ⭐ Personal Best Records (Stored Directly in Profile) */}
      <section>
        <div style={{ marginBottom: '0.8rem' }}>
          <h3 style={{ color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            ⭐ Personal Best Records
          </h3>
          <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
            Your personal record for each game is stored right here in your profile with zero database overhead.
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0.9rem' }}>
          {Object.entries(getAllConfiguredGames()).map(([gId, conf]) => {
            const best = personalBests[gId];
            const hasRecord = best && best.bestValue !== null;

            return (
              <div
                key={gId}
                className="card"
                style={{
                  padding: '1rem 1.2rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.9rem',
                  borderLeft: hasRecord ? '5px solid #ea580c' : '5px solid #cbd5e1',
                  background: hasRecord ? '#fff7ed' : '#ffffff',
                  boxShadow: hasRecord ? '0 4px 12px rgba(234, 88, 12, 0.08)' : 'none',
                }}
              >
                <span style={{ fontSize: '2rem' }}>{conf.icon}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 800, fontSize: '0.92rem', color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {conf.name}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, marginTop: '0.1rem' }}>
                    {conf.type === 'score' ? 'High Score' : conf.type === 'time' ? 'Fastest Clear' : 'Best Streak'}
                  </div>
                  <div style={{ fontSize: '1.15rem', fontWeight: 900, color: hasRecord ? '#c2410c' : '#94a3b8', marginTop: '0.2rem' }}>
                    {hasRecord ? best.display : 'No record yet'}
                  </div>
                  {hasRecord && best.achievedAt && (
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                      Achieved: {formatMatchTime(best.achievedAt)}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* SECTION 1: 🏆 Active 7-Day Rivalry Titles */}
      <section>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem' }}>
          <div>
            <h3 style={{ color: '#ea580c', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              🏆 Active 7-Day Rivalry Titles
            </h3>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
              Staked in 1v1 Title Matches. Click any title to view its exact date and 7-day expiration countdown.
            </span>
          </div>
        </div>

        {titles.length === 0 ? (
          <div
            className="card"
            style={{
              textAlign: 'center',
              color: 'var(--text-secondary)',
              padding: '2.5rem 1.5rem',
              background: '#f8fafc',
            }}
          >
            <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🛡️</div>
            <div style={{ fontWeight: 800, fontSize: '1.05rem', color: '#0f172a' }}>
              {loading ? 'Loading titles…' : profileErrors.titles ? 'Titles could not be loaded' : 'No active 7-day titles yet'}
            </div>
            <div style={{ fontSize: '0.85rem', marginTop: '0.3rem', color: 'var(--text-muted)' }}>
              {profileErrors.titles
                ? 'Please try again when the server is available.'
                : <>Challenge a friend in the Lobby with <strong>"Title Stake ON"</strong> to win and hold bragging rights for 7 days!</>}
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
            {titles.map((t) => (
              <Badge key={t.id || t._id} title={t} type={t.status || (t.winnerName === user?.username ? 'winner' : 'loser')} />
            ))}
          </div>
        )}
      </section>

      {/* SECTION 2: 📜 Match History Feed / Table */}
      <section>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem' }}>
          <div>
            <h3 style={{ color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              📜 Match History Feed
            </h3>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
              Log of all games played (wins, defeats, and practice).
            </span>
          </div>
          {matchHistory.length > 0 && (
            <button
              onClick={handleClearHistory}
              className="btn"
              style={{ fontSize: '0.78rem', padding: '0.35rem 0.8rem' }}
            >
              Clear History
            </button>
          )}
        </div>

        {matchHistory.length === 0 ? (
          <div
            className="card"
            style={{
              textAlign: 'center',
              color: 'var(--text-secondary)',
              padding: '2.5rem 1.5rem',
              background: '#f8fafc',
            }}
          >
            <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🎮</div>
            <div style={{ fontWeight: 800, fontSize: '1.05rem', color: '#0f172a' }}>
              {loading ? 'Loading match history…' : profileErrors.matches ? 'Match history could not be loaded' : 'No matches played yet'}
            </div>
            <div style={{ fontSize: '0.85rem', marginTop: '0.3rem', color: 'var(--text-muted)' }}>
              {profileErrors.matches
                ? 'Please try again when the server is available.'
                : 'Play any Solo logic game or 1v1 battle to build your match history!'}
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            {matchHistory.map((m) => {
              const isWon = m.won;
              const isSolo = m.opponentType === 'solo';
              return (
                <div
                  key={m.id}
                  className="card"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.85rem 1.2rem',
                    borderLeft: isWon ? '5px solid #2563eb' : isSolo ? '5px solid #f59e0b' : '5px solid #dc2626',
                    background: '#ffffff',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <span
                      style={{
                        padding: '0.25rem 0.65rem',
                        borderRadius: '6px',
                        fontSize: '0.75rem',
                        fontWeight: 900,
                        textTransform: 'uppercase',
                        background: isWon ? '#eff6ff' : isSolo ? '#fefce8' : '#fef2f2',
                        color: isWon ? '#1d4ed8' : isSolo ? '#b45309' : '#b91c1c',
                        border: isWon ? '1px solid #93c5fd' : isSolo ? '1px solid #fde047' : '1px solid #fca5a5',
                      }}
                    >
                      {isWon ? 'VICTORY' : isSolo ? 'COMPLETED' : 'DEFEAT'}
                    </span>

                    <div>
                      <div style={{ fontWeight: 800, fontSize: '0.98rem', color: '#0f172a' }}>
                        {m.gameName}
                        <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginLeft: '0.5rem' }}>
                          vs {m.opponentName}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', gap: '0.6rem', marginTop: '0.15rem' }}>
                        <span>Mode: {m.opponentType === 'bot' ? '🤖 Bot Practice' : m.isTitleMatch ? '🏆 7-Day Title Match' : isSolo ? '🧩 Solo Puzzle' : '🤝 Friendly 1v1'}</span>
                        {m.score && <span>• Score: {m.score}</span>}
                      </div>
                    </div>
                  </div>

                  <div style={{ textAlign: 'right', fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                    {formatMatchTime(m.playedAt)}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Auth Modal for Login/Registration */}
      {showAuthModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1000,
            background: 'rgba(15, 23, 42, 0.45)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div className="card" style={{ width: 400, padding: '2.2rem', background: '#ffffff', border: '2px solid #fed7aa', boxShadow: '0 20px 45px rgba(0,0,0,0.15)' }}>
            <h3 style={{ marginBottom: '1rem', color: '#ea580c' }}>{isRegistering ? 'Register Account' : 'Log In'}</h3>
            {authError && <div style={{ color: '#dc2626', fontSize: '0.85rem', marginBottom: '0.8rem', fontWeight: 700 }}>⚠️ {authError}</div>}
            <form onSubmit={handleAuthSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <input
                type="text"
                placeholder="Username"
                value={authUsername}
                onChange={(e) => setAuthUsername(e.target.value)}
                required
                style={{
                  padding: '0.75rem 1rem',
                  background: '#ffffff',
                  color: '#0f172a',
                  border: '2px solid #cbd5e1',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.95rem',
                }}
              />
              <input
                type="password"
                placeholder="Password"
                value={authPassword}
                onChange={(e) => setAuthPassword(e.target.value)}
                required
                style={{
                  padding: '0.75rem 1rem',
                  background: '#ffffff',
                  color: '#0f172a',
                  border: '2px solid #cbd5e1',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.95rem',
                }}
              />
              <button type="submit" className="btn btn-primary" style={{ justifyContent: 'center', padding: '0.8rem', fontSize: '1rem' }}>
                {isRegistering ? 'Create Account' : 'Log In'}
              </button>
            </form>
            <div style={{ marginTop: '1.2rem', textAlign: 'center', fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
              <button
                type="button"
                onClick={() => setIsRegistering(!isRegistering)}
                style={{ background: 'none', border: 'none', color: '#2563eb', cursor: 'pointer', fontWeight: 700, textDecoration: 'underline' }}
              >
                {isRegistering ? 'Already have an account? Log In' : 'Need an account? Register'}
              </button>
            </div>
            <div style={{ marginTop: '0.8rem', textAlign: 'center' }}>
              <button onClick={() => setShowAuthModal(false)} className="btn" style={{ fontSize: '0.85rem', width: '100%', justifyContent: 'center' }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
