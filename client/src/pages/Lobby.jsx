// client/src/pages/Lobby.jsx — Pre-Match Lobby, Series Configuration & Online Waiting Room
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getVersusGames, getSoloGames, getGame } from '../engines/registry.js';
import { useAuth } from '../net/AuthContext.jsx';
import { socket, syncUser, createRoom, joinRoom, leaveRoom } from '../net/socket.js';
import { getActiveRivalries, clearRivalry } from '../core/rivalryStorage.js';

export default function Lobby() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const versusGames = getVersusGames();
  const preselectedGame = location.state?.selectedGame;
  const initialOpponent = location.state?.opponentType || 'bot';

  const [opponentType, setOpponentType] = useState(initialOpponent); // 'bot', 'local', 'online'
  const [botDifficulty, setBotDifficulty] = useState('medium'); // 'easy', 'medium', 'hard'
  const [format, setFormat] = useState(1); // 1 (Single match), 2, 3, 5
  const [titleMode, setTitleMode] = useState(false);
  const [selectedGames, setSelectedGames] = useState(
    preselectedGame && versusGames.some((g) => g.id === preselectedGame)
      ? [preselectedGame]
      : ['tic-tac-toe']
  );

  // Online Room State
  const [roomState, setRoomState] = useState(null); // room object from socket
  const [isHost, setIsHost] = useState(false);
  const [joinCodeInput, setJoinCodeInput] = useState('');
  const [joinError, setJoinError] = useState('');
  const [countdown, setCountdown] = useState(null); // 3, 2, 1 countdown before match starts
  const [copiedCode, setCopiedCode] = useState(false);

  // Active Rivalry Grudges & Titles
  const [rivalries, setRivalries] = useState(() => getActiveRivalries());

  useEffect(() => {
    setRivalries(getActiveRivalries());
  }, [user]);

  const currentName = user?.username || 'Player 1';
  // Grudge where current user is the loser
  const activeGrudge = rivalries.find(
    (r) =>
      r.loserName?.toLowerCase() === currentName.toLowerCase() ||
      r.loserId === user?._id ||
      r.loserName?.toLowerCase() === 'player 1' ||
      r.loserName?.toLowerCase() === 'challenger'
  );
  // Title where current user is the reigning winner
  const reigningTitle = rivalries.find(
    (r) =>
      r.winnerName?.toLowerCase() === currentName.toLowerCase() ||
      r.winnerId === user?._id
  );

  const handleRevengeChallenge = (record) => {
    if (!record) return;
    const opponentLower = (record.winnerName || '').toLowerCase();
    if (opponentLower.includes('bot') || opponentLower.includes('roborival')) {
      setOpponentType('bot');
      if (opponentLower.includes('easy')) setBotDifficulty('easy');
      else if (opponentLower.includes('hard')) setBotDifficulty('hard');
      else setBotDifficulty('medium');
    } else {
      setOpponentType('local');
    }

    const matchedGame = versusGames.find(
      (g) => g.name.toLowerCase() === (record.gameName || '').toLowerCase()
    );
    if (matchedGame) {
      setSelectedGames([matchedGame.id]);
    }
    setTitleMode(true);
  };

  const handleDismissGrudge = (id) => {
    clearRivalry(id);
    setRivalries(getActiveRivalries());
  };

  // Sync user with socket on mount
  useEffect(() => {
    if (user) {
      syncUser(user);
    }
  }, [user]);

  // Socket room listeners
  useEffect(() => {
    function onRoomUpdated(data) {
      if (data && data.room) {
        setRoomState(data.room);
      }
    }

    function onCountdownStart(data) {
      if (data && data.room) {
        setRoomState(data.room);
        let count = data.countdownSec || 3;
        setCountdown(count);

        const timer = setInterval(() => {
          count -= 1;
          if (count > 0) {
            setCountdown(count);
          } else {
            clearInterval(timer);
            setCountdown(0);
            // Navigate both players to match
            navigate('/play', {
              state: {
                format: data.room.seriesConfig?.format || 1,
                titleMode: data.room.seriesConfig?.titleMode || false,
                games: data.room.seriesConfig?.games || ['tic-tac-toe'],
                players: [
                  { id: data.room.host.id, username: data.room.host.username },
                  { id: data.room.guest.id, username: data.room.guest.username },
                ],
                isOnline: true,
                roomCode: data.room.code,
                myPlayerIndex: isHost ? 0 : 1,
                seed: data.seed || Date.now(),
              },
            });
          }
        }, 1000);
      }
    }

    function onRoomClosed(data) {
      alert(data?.reason || 'Room was closed by the host.');
      setRoomState(null);
      setIsHost(false);
      setCountdown(null);
    }

    socket.on('room-updated', onRoomUpdated);
    socket.on('match-countdown-start', onCountdownStart);
    socket.on('room-closed', onRoomClosed);

    return () => {
      socket.off('room-updated', onRoomUpdated);
      socket.off('match-countdown-start', onCountdownStart);
      socket.off('room-closed', onRoomClosed);
    };
  }, [isHost, navigate]);

  const handleSelectOpponentType = (type) => {
    setOpponentType(type);
    if (type === 'bot') {
      setTitleMode(false); // Bot matches never stake titles
    }
  };

  const toggleGame = (id) => {
    setSelectedGames((prev) => {
      if (prev.includes(id)) {
        if (prev.length === 1) return prev; // Keep at least one
        return prev.filter((g) => g !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  const handleCreateRoom = () => {
    const pName = user?.username || `Player_${Math.random().toString(36).substring(2, 6)}`;
    createRoom(
      {
        format,
        titleMode: titleMode,
        games: selectedGames,
        hostName: pName,
      },
      (res) => {
        if (res.success) {
          setIsHost(true);
          setRoomState(res.room);
        } else {
          alert('Could not create room: ' + (res.error || 'Server error'));
        }
      }
    );
  };

  const handleJoinRoom = () => {
    if (!joinCodeInput.trim()) return;
    setJoinError('');
    const pName = user?.username || `Player_${Math.random().toString(36).substring(2, 6)}`;
    joinRoom(joinCodeInput.trim().toUpperCase(), pName, (res) => {
      if (res.success) {
        setIsHost(false);
        setRoomState(res.room);
      } else {
        setJoinError(res.error || 'Room not found. Check the code.');
      }
    });
  };

  const handleCancelRoom = () => {
    if (roomState?.code) {
      leaveRoom(roomState.code, () => {});
    }
    setRoomState(null);
    setIsHost(false);
    setCountdown(null);
  };

  const copyRoomCode = () => {
    if (roomState?.code) {
      navigator.clipboard.writeText(roomState.code);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const handleStartLocalOrBotMatch = () => {
    const isBot = opponentType === 'bot';
    const effectiveTitleMode = isBot ? false : titleMode;

    const p1 = { id: user?._id || 'p1', username: user?.username || 'Player 1' };
    const p2 = isBot
      ? {
          id: `bot_${botDifficulty}`,
          username: `RoboRival ${botDifficulty.toUpperCase()}`,
          isBot: true,
          botDifficulty,
        }
      : { id: 'p2_local', username: 'Player 2 (Local)' };

    navigate('/play', {
      state: {
        format,
        titleMode: effectiveTitleMode,
        games: selectedGames,
        players: [p1, p2],
        isOnline: false,
      },
    });
  };

  // ── Render Dedicated Waiting Room View ──
  if (roomState) {
    const hasGuest = Boolean(roomState.guest);

    return (
      <div style={{ maxWidth: 660, margin: '2rem auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div className="card" style={{ textAlign: 'center', padding: '2.5rem 2rem', background: '#ffffff', border: '2px solid #fed7aa' }}>
          <div className="badge badge-orange" style={{ marginBottom: '1rem', fontSize: '0.85rem' }}>
            🌐 ONLINE BATTLE ROOM
          </div>

          <h2 style={{ fontSize: '2rem', marginBottom: '0.5rem', color: '#0f172a' }}>Room Ready!</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginBottom: '1.5rem' }}>
            Share this 4-letter code with your friend to enter the arena.
          </p>

          {/* Large Glowing Room Code */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '1.2rem',
              padding: '1rem 2.4rem',
              background: '#fff7ed',
              border: '3px dashed #ea580c',
              borderRadius: '18px',
              boxShadow: '0 8px 24px rgba(234, 88, 12, 0.15)',
              marginBottom: '1.8rem',
            }}
          >
            <span
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '3rem',
                letterSpacing: '0.22em',
                color: '#ea580c',
                fontWeight: 900,
              }}
            >
              {roomState.code}
            </span>
            <button
              onClick={copyRoomCode}
              className="btn btn-primary"
              style={{ padding: '0.55rem 1.2rem', fontSize: '0.9rem' }}
            >
              {copiedCode ? '✓ Copied!' : '📋 Copy'}
            </button>
          </div>

          {/* Players Slot Row */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr auto 1fr',
              alignItems: 'center',
              gap: '1rem',
              background: '#f8fafc',
              padding: '1.4rem',
              borderRadius: '16px',
              border: '2px solid #e2e8f0',
              marginBottom: '1.8rem',
            }}
          >
            {/* Player 1 (Blue) */}
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '0.78rem', color: '#2563eb', fontWeight: 800, marginBottom: '0.2rem' }}>
                PLAYER 1 (BLUE) {isHost ? '(YOU)' : ''}
              </div>
              <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#0f172a' }}>
                👑 {roomState.host?.username || 'Host'}
              </div>
              <span className="badge badge-blue" style={{ marginTop: '0.4rem', fontSize: '0.72rem' }}>
                READY
              </span>
            </div>

            {/* VS Badge */}
            <div
              style={{
                fontSize: '1.5rem',
                fontFamily: 'var(--font-display)',
                fontWeight: 900,
                color: '#ea580c',
              }}
            >
              VS
            </div>

            {/* Player 2 (Red) */}
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '0.78rem', color: '#dc2626', fontWeight: 800, marginBottom: '0.2rem' }}>
                PLAYER 2 (RED) {!isHost ? '(YOU)' : ''}
              </div>
              {hasGuest ? (
                <>
                  <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#0f172a' }}>
                    ⚔️ {roomState.guest?.username || 'Guest'}
                  </div>
                  <span className="badge badge-red" style={{ marginTop: '0.4rem', fontSize: '0.72rem' }}>
                    CONNECTED!
                  </span>
                </>
              ) : (
                <>
                  <div style={{ fontSize: '0.95rem', color: 'var(--text-muted)', fontStyle: 'italic', fontWeight: 600 }}>
                    Waiting for friend...
                  </div>
                  <div
                    style={{
                      display: 'inline-block',
                      marginTop: '0.4rem',
                      width: 14,
                      height: 14,
                      borderRadius: '50%',
                      background: '#f59e0b',
                      boxShadow: '0 0 10px #f59e0b',
                    }}
                  />
                </>
              )}
            </div>
          </div>

          {/* Countdown Overlay when Opponent has Connected */}
          {countdown !== null && (
            <div
              style={{
                padding: '1.4rem',
                background: '#fff7ed',
                border: '2px solid #ea580c',
                borderRadius: '16px',
                marginBottom: '1.5rem',
                boxShadow: '0 8px 25px rgba(234, 88, 12, 0.2)',
              }}
            >
              <div style={{ fontSize: '1.15rem', fontWeight: 900, color: '#c2410c', marginBottom: '0.3rem' }}>
                BOTH PLAYERS CONNECTED!
              </div>
              <div
                style={{
                  fontSize: '3.5rem',
                  fontFamily: 'var(--font-display)',
                  color: '#ea580c',
                  fontWeight: 900,
                }}
              >
                {countdown > 0 ? countdown : 'BATTLE!'}
              </div>
              <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                Launching match synchronized...
              </div>
            </div>
          )}

          {/* Series Config Summary */}
          <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1.6rem' }}>
            <strong>Settings:</strong>{' '}
            {roomState.seriesConfig?.format === 1
              ? 'Single Round (1 Match)'
              : `Best of ${roomState.seriesConfig?.format}`}{' '}
            • {roomState.seriesConfig?.titleMode ? '🏆 Title Match' : '🛡️ Friendly'} • Games:{' '}
            {roomState.seriesConfig?.games?.map((gid) => getGame(gid)?.name).join(', ')}
          </div>

          {/* Cancel Button */}
          <button
            onClick={handleCancelRoom}
            className="btn btn-red"
            style={{ padding: '0.7rem 2.2rem' }}
          >
            ❌ Leave Room & Return to Lobby
          </button>
        </div>
      </div>
    );
  }

  // ── Render Normal Lobby Configuration ──
  return (
    <div style={{ maxWidth: 860, margin: '1rem auto', display: 'flex', flexDirection: 'column', gap: '1.8rem' }}>
      <div>
        <h2 style={{ fontSize: '2.4rem', color: '#0f172a' }}>1v1 Battle Lobby</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', marginTop: '0.2rem' }}>
          Configure your opponent, series format, and battle pool. Solo puzzles (2048 & Sudoku) are available in Solo Mode.
        </p>
      </div>

      {/* Active Rivalry Grudge / Crushed Title Alert */}
      {activeGrudge && (
        <div
          className="card"
          style={{
            border: '2px solid #ef4444',
            background: 'linear-gradient(135deg, #fef2f2 0%, #ffffff 100%)',
            boxShadow: '0 10px 25px rgba(239, 68, 68, 0.15)',
            padding: '1.4rem 1.8rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1.2rem',
          }}
        >
          <div>
            <div className="badge badge-red" style={{ marginBottom: '0.4rem', fontSize: '0.82rem' }}>
              💀 CRUSHED TITLE ACTIVE (7 DAYS)
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#0f172a' }}>
              You were crushed by{' '}
              <span style={{ color: '#ef4444' }}>
                {activeGrudge.winnerName}
              </span>
            </div>
            <div style={{ fontSize: '0.92rem', color: 'var(--text-secondary)', marginTop: '0.3rem' }}>
              Conquered in <strong>{activeGrudge.gameName}</strong> ({activeGrudge.score}). Settle the grudge to reclaim your honor!
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.8rem', alignItems: 'center' }}>
            <button
              onClick={() => handleRevengeChallenge(activeGrudge)}
              className="btn btn-red"
              style={{ padding: '0.75rem 1.8rem', fontWeight: 800, fontSize: '0.95rem' }}
            >
              ⚔️ Reclaim Title — Challenge {activeGrudge.winnerName}!
            </button>
            <button
              onClick={() => handleDismissGrudge(activeGrudge.id)}
              className="btn"
              style={{ padding: '0.55rem 0.9rem', fontSize: '0.85rem' }}
              title="Dismiss grudge notice"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Reigning Champion Title Banner */}
      {reigningTitle && !activeGrudge && (
        <div
          className="card"
          style={{
            border: '2px solid #f59e0b',
            background: 'linear-gradient(135deg, #fffbeb 0%, #ffffff 100%)',
            boxShadow: '0 10px 25px rgba(245, 158, 11, 0.15)',
            padding: '1.4rem 1.8rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1.2rem',
          }}
        >
          <div>
            <div className="badge badge-gold" style={{ marginBottom: '0.4rem', fontSize: '0.82rem' }}>
              👑 REIGNING TITLE CHAMPION
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#0f172a' }}>
              You crushed{' '}
              <span style={{ color: '#d97706' }}>
                {reigningTitle.loserName}
              </span>
            </div>
            <div style={{ fontSize: '0.92rem', color: 'var(--text-secondary)', marginTop: '0.3rem' }}>
              Conquered in <strong>{reigningTitle.gameName}</strong> ({reigningTitle.score}). Title is active for 7 days!
            </div>
          </div>
          <button
            onClick={() => handleRevengeChallenge(reigningTitle)}
            className="btn btn-gold"
            style={{ padding: '0.75rem 1.8rem', fontWeight: 800 }}
          >
            ⚔️ Defend Your Title Again
          </button>
        </div>
      )}

      {/* Opponent Selection */}
      <div className="card">
        <h3 style={{ marginBottom: '1rem', color: '#2563eb' }}>1. Select Opponent Mode</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
          <button
            onClick={() => handleSelectOpponentType('bot')}
            className={`btn ${opponentType === 'bot' ? 'btn-blue' : ''}`}
            style={{ justifyContent: 'center', padding: '0.9rem', fontSize: '1rem' }}
          >
            🤖 Bot (RoboRival)
          </button>
          <button
            onClick={() => handleSelectOpponentType('local')}
            className={`btn ${opponentType === 'local' ? 'btn-blue' : ''}`}
            style={{ justifyContent: 'center', padding: '0.9rem', fontSize: '1rem' }}
          >
            👥 Local Pass & Play
          </button>
          <button
            onClick={() => handleSelectOpponentType('online')}
            className={`btn ${opponentType === 'online' ? 'btn-blue' : ''}`}
            style={{ justifyContent: 'center', padding: '0.9rem', fontSize: '1rem' }}
          >
            🌐 Online Friend
          </button>
        </div>

        {/* Bot Difficulty Selector */}
        {opponentType === 'bot' && (
          <div style={{ marginTop: '1.2rem', display: 'flex', gap: '0.8rem', alignItems: 'center' }}>
            <span style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', fontWeight: 700 }}>
              AI Difficulty:
            </span>
            {['easy', 'medium', 'hard'].map((lvl) => (
              <button
                key={lvl}
                onClick={() => setBotDifficulty(lvl)}
                className="btn"
                style={{
                  fontSize: '0.88rem',
                  padding: '0.45rem 1.1rem',
                  borderColor: botDifficulty === lvl ? '#2563eb' : '#cbd5e1',
                  background: botDifficulty === lvl ? '#eff6ff' : '#ffffff',
                  color: botDifficulty === lvl ? '#1d4ed8' : 'var(--text-primary)',
                  fontWeight: botDifficulty === lvl ? 800 : 600,
                  boxShadow: botDifficulty === lvl ? '0 2px 8px rgba(37, 99, 235, 0.2)' : 'none',
                }}
              >
                {lvl.toUpperCase()}
              </button>
            ))}
          </div>
        )}

        {/* Online Room Join / Create Options */}
        {opponentType === 'online' && (
          <div
            style={{
              marginTop: '1.4rem',
              padding: '1.4rem',
              background: '#fff7ed',
              borderRadius: '16px',
              border: '2px solid #fed7aa',
            }}
          >
            <div style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '0.8rem', color: '#c2410c' }}>
              Have a 4-letter room code from a friend?
            </div>
            <div style={{ display: 'flex', gap: '0.8rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <input
                type="text"
                placeholder="ROOM CODE"
                value={joinCodeInput}
                onChange={(e) => setJoinCodeInput(e.target.value.toUpperCase())}
                maxLength={4}
                style={{
                  width: 160,
                  padding: '0.65rem 0.9rem',
                  fontSize: '1.2rem',
                  textAlign: 'center',
                  fontWeight: 900,
                  letterSpacing: '0.22em',
                  background: '#ffffff',
                  color: '#ea580c',
                  border: '2px solid #ea580c',
                  borderRadius: 'var(--radius-sm)',
                  boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.06)',
                }}
              />
              <button
                onClick={handleJoinRoom}
                className="btn btn-primary"
                style={{ padding: '0.65rem 1.5rem', fontSize: '0.95rem' }}
              >
                Join Room ➔
              </button>
            </div>
            {joinError && (
              <div style={{ marginTop: '0.6rem', color: '#ef4444', fontSize: '0.88rem', fontWeight: 700 }}>
                ⚠️ {joinError}
              </div>
            )}
            <div style={{ marginTop: '0.8rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Or configure your series settings below and click <strong>"Create Online Room"</strong> to get your code.
            </div>
          </div>
        )}
      </div>

      {/* Series Format & Title Stake */}
      <div className="card">
        <h3 style={{ marginBottom: '1rem', color: '#ea580c' }}>2. Format & Stake Mode</h3>
        <div style={{ display: 'flex', gap: '2.5rem', flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', fontWeight: 700 }}>
              Series Length:
            </div>
            <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
              {[1, 2, 3, 5].map((num) => (
                <button
                  key={num}
                  onClick={() => setFormat(num)}
                  className="btn"
                  style={{
                    padding: '0.45rem 1.2rem',
                    borderColor: format === num ? '#ea580c' : '#cbd5e1',
                    background: format === num ? '#fff7ed' : '#ffffff',
                    color: format === num ? '#c2410c' : 'var(--text-primary)',
                    fontWeight: format === num ? 800 : 600,
                    boxShadow: format === num ? '0 2px 8px rgba(234, 88, 12, 0.2)' : 'none',
                  }}
                >
                  {num === 1 ? 'Single Match (1 Round)' : `Best of ${num}`} {num === 2 ? '(Sudden Death)' : ''}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', fontWeight: 700 }}>
              Rivalry Title:
            </div>
            {opponentType === 'bot' ? (
              <div
                style={{
                  padding: '0.55rem 1rem',
                  borderRadius: 'var(--radius-sm)',
                  background: '#f1f5f9',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.85rem',
                  color: 'var(--text-secondary)',
                  fontWeight: 600,
                }}
              >
                🛡️ AI Practice Match (Titles disabled against bots)
              </div>
            ) : (
              <button
                onClick={() => setTitleMode(!titleMode)}
                className={`btn ${titleMode ? 'btn-gold' : ''}`}
                style={{ padding: '0.45rem 1.2rem', fontWeight: 800 }}
              >
                {titleMode ? '🏆 Title Stake ON (7-Day Badge)' : '🛡️ Friendly (No Title Staked)'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 1v1 Games Selection Pool - Removed Tic-Tac-Toe Only button */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem' }}>
          <div>
            <h3 style={{ color: '#ea580c' }}>3. 1v1 Battle Games Pool</h3>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Selected games will be played in turn-based order or multi-round series.
            </span>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={() => setSelectedGames(versusGames.map((g) => g.id))}
              className="btn"
              style={{ fontSize: '0.8rem', padding: '0.35rem 0.9rem' }}
            >
              Select All 1v1
            </button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.9rem' }}>
          {versusGames.map((g) => {
            const isSelected = selectedGames.includes(g.id);
            return (
              <div
                key={g.id}
                onClick={() => toggleGame(g.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.8rem',
                  padding: '0.8rem 1.1rem',
                  borderRadius: 'var(--radius-sm)',
                  border: isSelected ? '2px solid #ea580c' : '2px solid #e2e8f0',
                  background: isSelected ? '#fff7ed' : '#ffffff',
                  cursor: 'pointer',
                  boxShadow: isSelected ? '0 4px 12px rgba(234, 88, 12, 0.15)' : 'none',
                  transition: 'all 0.15s ease',
                }}
              >
                <span style={{ fontSize: '1.5rem' }}>{g.icon}</span>
                <div>
                  <div style={{ fontWeight: isSelected ? 800 : 600, color: isSelected ? '#c2410c' : 'var(--text-primary)', fontSize: '0.95rem' }}>
                    {g.name}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                    {g.format.toUpperCase()}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Start Button */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
        {opponentType === 'online' ? (
          <button
            onClick={handleCreateRoom}
            className="btn btn-primary"
            style={{ padding: '0.95rem 2.8rem', fontSize: '1.15rem', fontWeight: 800 }}
          >
            Create Online Room ➔
          </button>
        ) : (
          <button
            onClick={handleStartLocalOrBotMatch}
            className="btn btn-primary"
            style={{ padding: '0.95rem 2.8rem', fontSize: '1.15rem', fontWeight: 800 }}
          >
            Start Battle ➔
          </button>
        )}
      </div>
    </div>
  );
}
