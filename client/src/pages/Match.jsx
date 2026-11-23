// client/src/pages/Match.jsx — Main Battleground & Series Orchestrator
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { createSeries, recordRound, nextGame, seriesWinner } from '../core/series.js';
import { createStopwatch, createCountdown } from '../core/stopwatch.js';
import { getGame } from '../engines/registry.js';
import { useSound } from '../audio/SoundContext.jsx';
import api from '../net/api.js';
import { socket, sendMove, requestRematch, acceptRematch } from '../net/socket.js';
import { saveRivalryResult } from '../core/rivalryStorage.js';
import { saveMatchRecord } from '../core/matchHistoryStorage.js';
import { recordGameResult } from '../core/personalBestStorage.js';

import SeriesScore from '../components/SeriesScore.jsx';
import Countdown321 from '../components/Countdown321.jsx';
import CrushedStamp from '../components/CrushedStamp.jsx';
import LoserFlash from '../components/LoserFlash.jsx';
import DSAInspector from '../components/DSAInspector.jsx';
import Timer from '../components/Timer.jsx';

// Game View Components (Pure Solo + 1v1 Versus)
import TicTacToeView from '../games/TicTacToeView.jsx';
import ConnectFourView from '../games/ConnectFourView.jsx';
import MemoryView from '../games/MemoryView.jsx';
import MinesweeperView from '../games/MinesweeperView.jsx';
import SudokuView from '../games/SudokuView.jsx';
import SpeedSudokuView from '../games/SpeedSudokuView.jsx';
import Game2048View from '../games/Game2048View.jsx';

export default function Match() {
  const location = useLocation();
  const navigate = useNavigate();
  const params = useParams();
  const { playSound } = useSound();

  const urlGameId = params.gameId;
  const isUrlSolo = urlGameId ? getGame(urlGameId).modeType === 'solo' : false;

  const rawConfig = location.state || {
    format: 1,
    titleMode: false,
    games: [urlGameId || 'tic-tac-toe'],
    players: isUrlSolo
      ? [{ id: 'p1', username: 'Player 1' }]
      : [
          { id: 'p1', username: 'Player 1' },
          { id: 'bot_med', username: 'RoboRival MEDIUM', isBot: true, botDifficulty: 'medium' },
        ],
    isOnline: false,
    isSolo: isUrlSolo,
  };

  const isSolo = Boolean(rawConfig.isSolo);
  const isOnline = Boolean(rawConfig.isOnline);
  const myPlayerIndex = rawConfig.myPlayerIndex !== undefined ? rawConfig.myPlayerIndex : 0;
  const isBotOpponent = Boolean(rawConfig.players?.[1]?.isBot);

  const config = {
    ...rawConfig,
    format: isSolo ? 1 : rawConfig.format || 1,
    games: rawConfig.games?.length ? rawConfig.games : ['tic-tac-toe'],
    titleMode: isBotOpponent || isSolo ? false : Boolean(rawConfig.titleMode),
  };

  const [series, setSeries] = useState(() => createSeries(config));
  const [roundPhase, setRoundPhase] = useState('countdown'); // 'countdown', 'playing', 'round-end', 'series-end'

  const initialGameId = nextGame(series) || config.games[0] || 'tic-tac-toe';
  const [currentGameId, setCurrentGameId] = useState(initialGameId);

  // Dynamic Browser Tab Title
  useEffect(() => {
    const game = getGame(currentGameId);
    document.title = `Play ${game.name} — Rivalry Arena`;
  }, [currentGameId]);
  const [engineInstance, setEngineInstance] = useState(() => getGame(initialGameId).engine);
  const [engineState, setEngineState] = useState(() => {
    const game = getGame(initialGameId);
    const roundSeed = config.seed || Date.now();
    if (initialGameId === 'speed-sudoku') {
      return game.engine.create(roundSeed, { size: 4, timeLimitMs: 60000 });
    }
    return game.engine.create(roundSeed);
  });

  const [winnerOverlay, setWinnerOverlay] = useState(null); // 'crushed', 'loser', null
  const [rematchOffer, setRematchOffer] = useState(null); // name of requester if rematch requested

  // Stopwatch / timer ref
  const stopwatchRef = useRef(createStopwatch());
  const countdownRef = useRef(null);

  // Load and start new round
  const startRound = useCallback((gameId) => {
    const game = getGame(gameId);
    setEngineInstance(game.engine);
    const roundSeed = (config.seed || Date.now()) + series.round * 100;

    let initial = null;
    if (gameId === 'speed-sudoku') {
      countdownRef.current = createCountdown(60000);
      initial = game.engine.create(roundSeed, { size: 4, timeLimitMs: 60000 });
      countdownRef.current.start();
    } else {
      stopwatchRef.current.reset();
      initial = game.engine.create(roundSeed);
      stopwatchRef.current.start();
    }

    setEngineState(initial);
    setRoundPhase('playing');
  }, [config.seed, series.round]);

  // Restart whole match / series (Rematch)
  const resetAndRestartMatch = useCallback(() => {
    setWinnerOverlay(null);
    setRematchOffer(null);
    const freshSeries = createSeries(config);
    setSeries(freshSeries);
    const firstGame = nextGame(freshSeries) || config.games?.[0] || 'tic-tac-toe';
    setCurrentGameId(firstGame);

    // Pre-initialize fresh engine state for the new match
    const game = getGame(firstGame);
    setEngineInstance(game.engine);
    const roundSeed = Date.now();
    const initial =
      firstGame === 'speed-sudoku'
        ? game.engine.create(roundSeed, { size: 4, timeLimitMs: 60000 })
        : game.engine.create(roundSeed);
    setEngineState(initial);
    setRoundPhase('countdown');
  }, [config]);

  // Handle engine action from UI, Bot, or Remote Socket
  const handleEngineAction = useCallback((action, isRemote = false) => {
    if (!engineInstance || !engineState) return;

    // Turn-based Online validation: Only allow action if it's your turn or came from remote
    const game = getGame(currentGameId);
    if (isOnline && game.format === 'turn-based' && !isRemote) {
      if (engineState.currentPlayer !== myPlayerIndex) {
        console.warn('Blocked move: Not your turn!');
        return;
      }
    }

    // Normalize action object in case type is omitted
    let normalized = action;
    if (action && !action.type) {
      if (action.row !== undefined && action.col !== undefined && action.val !== undefined) {
        normalized = { type: 'move', ...action };
      } else if (action.row !== undefined && action.col !== undefined) {
        normalized = { type: 'move', ...action };
      } else if (action.col !== undefined) {
        normalized = { type: 'drop', ...action };
      } else if (action.index !== undefined) {
        normalized = { type: 'flip', ...action };
      } else if (action.dir !== undefined) {
        normalized = { type: 'move', ...action };
      }
    }

    const result = engineInstance.apply(engineState, normalized);
    const nextState = (result && result.state) ? result.state : result;
    const events = (result && result.events) || [];

    if (!nextState) return;
    setEngineState({ ...nextState });

    // In online mode, broadcast local move to opponent
    if (isOnline && !isRemote && config.roomCode) {
      sendMove(config.roomCode, currentGameId, normalized);
    }

    // Play sounds mapped to events
    for (const evt of events) {
      if (evt.type === 'win') playSound('win_nikal');
      else if (evt.type === 'loss') playSound('loss_khatam');
      else if (evt.type === 'combo') playSound('combo_hype');
      else if (evt.type === 'move') playSound('slide');
    }

    // Check round status
    const currentStatus = engineInstance.status(nextState);
    if (
      currentStatus &&
      (currentStatus.phase === 'won' ||
        currentStatus.phase === 'lost' ||
        currentStatus.phase === 'draw' ||
        currentStatus.phase === 'finished')
    ) {
      handleRoundFinish(currentStatus, nextState);
    }
  }, [engineInstance, engineState, currentGameId, isOnline, myPlayerIndex, config.roomCode, playSound]);

  const handleRoundFinish = (status, finalState = engineState) => {
    if (countdownRef.current) countdownRef.current.pause();
    else stopwatchRef.current.pause();

    let roundWinner = null;
    if (status.phase === 'won') {
      roundWinner =
        status.winner !== null && status.winner !== undefined && status.winner !== 'self'
          ? status.winner
          : finalState.currentPlayer;
    } else if (status.phase === 'lost') {
      roundWinner = 1 - finalState.currentPlayer;
    } else if (status.phase === 'draw') {
      roundWinner = 'draw';
    } else if (status.phase === 'finished') {
      roundWinner = status.winner;
    }

    const elapsed = stopwatchRef.current.elapsed();

    const roundResult = {
      game: currentGameId,
      winner: roundWinner,
      time: elapsed,
    };

    const nextSeries = recordRound(series, roundResult);
    setSeries(nextSeries);

    if (nextSeries.complete) {
      handleSeriesComplete(nextSeries);
    } else {
      setRoundPhase('round-end');
    }
  };

  const handleSeriesComplete = async (completedSeries) => {
    setRoundPhase('series-end');
    const winnerIdx = seriesWinner(completedSeries);
    const userWon = winnerIdx === myPlayerIndex;
    const isTitleMatch = !isBotOpponent && !isSolo && Boolean(config.titleMode);
    const opponentPlayer = config.players ? config.players[1 - myPlayerIndex] : null;

    // In Solo mode: play victory sound & record personal best
    if (isSolo) {
      playSound('win_nikal');
      recordGameResult({
        gameId: currentGameId,
        gameName: getGame(currentGameId)?.name,
        score: engineState?.score || 0,
        timeMs: stopwatchRef.current,
        won: true,
      });
      saveMatchRecord({
        gameName: getGame(currentGameId)?.name || 'Solo Puzzle',
        gameId: currentGameId,
        opponentName: 'Solo Practice',
        opponentType: 'solo',
        isTitleMatch: false,
        won: true,
        score: currentGameId === '2048' ? `${engineState?.score || 0} pts` : 'Completed',
        durationSec: Math.round(stopwatchRef.current / 1000),
      });
      return;
    }

    // Record game outcome for personal best streak / time
    recordGameResult({
      gameId: currentGameId,
      gameName: getGame(currentGameId)?.name,
      score: engineState?.score || 0,
      timeMs: stopwatchRef.current,
      won: userWon,
    });

    // Record every 1v1 match (bot, friend, title) to user's local Match History
    saveMatchRecord({
      gameName: getGame(currentGameId)?.name || 'Battle Arena',
      gameId: currentGameId,
      opponentName: opponentPlayer?.username || (isBotOpponent ? 'RoboRival' : 'Opponent'),
      opponentType: isBotOpponent ? 'bot' : 'human',
      isTitleMatch,
      won: userWon,
      score: `${completedSeries.wins[0]} - ${completedSeries.wins[1]}`,
      durationSec: Math.round(stopwatchRef.current / 1000),
    });

    // In 1v1: Sound & Overlays
    if (userWon) {
      playSound('win_nikal');
      // STRICT: CRUSHED! 7-day title overlay appears ONLY when titleMode was explicitly enabled in 1v1 Human match
      if (isTitleMatch) {
        setWinnerOverlay('crushed');
      }
    } else if (winnerIdx !== null && winnerIdx !== 'draw') {
      playSound('loss_khatam');
      // STRICT: Loser flash overlay appears ONLY in human-vs-human title matches
      if (isTitleMatch) {
        setWinnerOverlay('loser');
      }
    }

    // STRICT: Save 7-Day Rivalry Title ONLY if Human-vs-Human AND titleMode === true
    if (isTitleMatch && winnerIdx !== null && winnerIdx !== 'draw' && config.players?.length >= 2) {
      const winner = config.players[winnerIdx];
      const loser = config.players[1 - winnerIdx];
      saveRivalryResult({
        winnerName: winner?.username || 'Winner',
        winnerId: winner?.id || 'p1',
        loserName: loser?.username || 'Opponent',
        loserId: loser?.id || 'p2',
        gameName: getGame(currentGameId)?.name || 'Battle Arena',
        score: `${completedSeries.wins[0]} - ${completedSeries.wins[1]}`,
      });

      // Persist title match to server
      try {
        await api.post('/matches', {
          players: config.players,
          mode: 'title',
          format: completedSeries.format,
          games: completedSeries.results,
          finalScore: completedSeries.wins,
          winner: config.players[winnerIdx]?.id || 'p1',
          titleMode: true,
        });
      } catch (e) {
        console.warn('[series] could not persist title match to server:', e.message);
      }
    } else if (!isSolo) {
      // Friendly match or Bot match: save to server history without title staking
      try {
        await api.post('/matches', {
          players: config.players,
          mode: isBotOpponent ? 'bot' : 'friendly',
          format: completedSeries.format,
          games: completedSeries.results,
          finalScore: completedSeries.wins,
          winner: winnerIdx !== null && winnerIdx !== 'draw' ? config.players[winnerIdx]?.id : null,
          titleMode: false,
        });
      } catch (e) {
        // Offline mode fallback
      }
    }
  };

  // Bot AI loop for turn-based games
  useEffect(() => {
    if (roundPhase !== 'playing' || !engineState || !engineInstance || isOnline || isSolo) return;

    const game = getGame(currentGameId);
    const isBotMatch = config.players[1]?.isBot;
    const botDifficulty = config.players[1]?.botDifficulty || 'medium';

    if (!isBotMatch) return;

    // Turn-based Bot Moves (when player 1 is the bot)
    if (game.format === 'turn-based' && engineState.currentPlayer === 1 && engineState.phase === 'playing') {
      if (engineState.lockUntilMismatchResolved) return;

      const timer = setTimeout(() => {
        if (!game.bot?.getMove) return;
        const botMove = game.bot.getMove(engineState, botDifficulty);
        if (botMove) {
          handleEngineAction(botMove);
        }
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [engineState, roundPhase, currentGameId, isOnline, isSolo, config.players, engineInstance, handleEngineAction]);

  // Online Socket listeners for opponent moves and rematch
  useEffect(() => {
    if (!isOnline) return;

    function onOpponentMove(data) {
      if (data && data.gameId === currentGameId && data.action) {
        handleEngineAction(data.action, true /* fromRemote */);
      }
    }

    function onRematchOffered(data) {
      setRematchOffer(data?.from || 'Opponent');
    }

    function onRematchStart() {
      resetAndRestartMatch();
    }

    socket.on('opponent-move', onOpponentMove);
    socket.on('rematch-offered', onRematchOffered);
    socket.on('rematch-start', onRematchStart);

    return () => {
      socket.off('opponent-move', onOpponentMove);
      socket.off('rematch-offered', onRematchOffered);
      socket.off('rematch-start', onRematchStart);
    };
  }, [isOnline, currentGameId, handleEngineAction, resetAndRestartMatch]);

  // Rematch action trigger
  const handleRematchClick = () => {
    if (isOnline) {
      requestRematch(config.roomCode);
      alert('Rematch challenge sent to opponent! Waiting for acceptance...');
    } else {
      resetAndRestartMatch();
    }
  };

  const handleAcceptRematch = () => {
    if (isOnline && config.roomCode) {
      acceptRematch(config.roomCode);
    }
    resetAndRestartMatch();
  };

  // Turn check for online match
  const isMyTurn = !isOnline || engineState?.currentPlayer === myPlayerIndex;
  const isBoardDisabled = roundPhase !== 'playing' || !isMyTurn;

  // Views mapping
  const renderGameView = () => {
    if (!engineState) return null;

    switch (currentGameId) {
      case 'tic-tac-toe':
        return <TicTacToeView state={engineState} onAction={handleEngineAction} disabled={isBoardDisabled} />;
      case 'connect-four':
        return <ConnectFourView state={engineState} onAction={handleEngineAction} disabled={isBoardDisabled} />;
      case 'memory':
        return <MemoryView state={engineState} onAction={handleEngineAction} disabled={isBoardDisabled} />;
      case 'minesweeper':
        return <MinesweeperView state={engineState} onAction={handleEngineAction} disabled={roundPhase !== 'playing'} />;
      case 'sudoku':
        return <SudokuView state={engineState} onAction={handleEngineAction} disabled={roundPhase !== 'playing'} />;
      case 'speed-sudoku':
        return <SpeedSudokuView state={engineState} onAction={handleEngineAction} disabled={roundPhase !== 'playing'} />;
      case '2048':
        return <Game2048View state={engineState} onAction={handleEngineAction} disabled={roundPhase !== 'playing'} />;
      default:
        return <div>Select a game to begin</div>;
    }
  };

  const winnerIdx = seriesWinner(series);
  const winnerPlayer = winnerIdx !== null && winnerIdx !== 'draw' ? config.players[winnerIdx] : null;

  return (
    <div style={{ maxWidth: 860, margin: '0 auto', display: 'flex', flexDirection: 'column' }}>
      {/* 3-2-1 Countdown Overlay */}
      {roundPhase === 'countdown' && (
        <Countdown321 onComplete={() => startRound(currentGameId)} />
      )}

      {/* Series Victory CRUSHED! Overlay with auto-dismiss and close button */}
      {winnerOverlay === 'crushed' && (
        <CrushedStamp
          winnerName={config.players[winnerIdx]?.username || 'Player 1'}
          loserName={config.players[1 - winnerIdx]?.username || 'Opponent'}
          onDismiss={() => setWinnerOverlay(null)}
        />
      )}

      {/* Defeat Flash Overlay */}
      {winnerOverlay === 'loser' && (
        <LoserFlash onComplete={() => setWinnerOverlay(null)} />
      )}

      {/* Online Rematch Offer Banner */}
      {rematchOffer && (
        <div
          style={{
            padding: '1rem 1.4rem',
            background: '#eff6ff',
            border: '2px solid #93c5fd',
            borderRadius: '16px',
            marginBottom: '1rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 4px 14px rgba(37, 99, 235, 0.12)',
          }}
        >
          <div style={{ fontWeight: 800, color: '#1d4ed8', fontSize: '1rem' }}>
            ⚔️ {rematchOffer} has challenged you to a REMATCH!
          </div>
          <div style={{ display: 'flex', gap: '0.8rem' }}>
            <button onClick={handleAcceptRematch} className="btn btn-blue" style={{ padding: '0.5rem 1.4rem' }}>
              ✓ Accept Rematch
            </button>
            <button onClick={() => setRematchOffer(null)} className="btn btn-danger" style={{ padding: '0.5rem 1.2rem' }}>
              ✕ Decline
            </button>
          </div>
        </div>
      )}

      {/* Header Series Scoreboard */}
      <SeriesScore
        series={series}
        p1Name={config.players[0]?.username}
        p2Name={config.players[1]?.username}
        isSolo={isSolo}
      />

      {/* Active Game Banner & Timer */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1rem',
        }}
      >
        <div>
          <h2 style={{ fontSize: '1.4rem' }}>{getGame(currentGameId).name}</h2>
          <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 600 }}>
            {getGame(currentGameId).format.toUpperCase()} MODE
          </span>
          {isOnline && getGame(currentGameId).format === 'turn-based' && (
            <div
              style={{
                marginTop: '0.2rem',
                fontSize: '0.85rem',
                fontWeight: 700,
                color: isMyTurn ? 'var(--p1-blue-bright)' : 'var(--text-muted)',
              }}
            >
              {isMyTurn ? '🔵 YOUR TURN TO MOVE' : '⏳ Waiting for opponent move...'}
            </div>
          )}
        </div>

        <Timer
          stopwatch={stopwatchRef.current}
          countdown={countdownRef.current}
          isRunning={roundPhase === 'playing'}
        />
      </div>

      {/* The Active Game Canvas / Board */}
      <div
        className="card"
        style={{
          minHeight: '460px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
        }}
      >
        {renderGameView()}

        {/* Round End Modal (Only between rounds in multi-round series) */}
        {roundPhase === 'round-end' && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(255, 255, 255, 0.96)',
              backdropFilter: 'blur(10px)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 'var(--radius)',
              gap: '1.2rem',
              zIndex: 100,
              border: '3px solid #fed7aa',
              boxShadow: '0 12px 35px rgba(234, 88, 12, 0.15)',
            }}
          >
            <h3 style={{ fontSize: '1.9rem', color: '#0f172a', fontWeight: 900 }}>Round {series.round} Complete!</h3>
            <div style={{ fontSize: '1.3rem', color: '#ea580c', fontWeight: 800 }}>
              Series Score: {series.wins[0]} - {series.wins[1]}
            </div>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button
                onClick={() => {
                  const next = nextGame(series);
                  if (next) {
                    setCurrentGameId(next);
                    setRoundPhase('countdown');
                  }
                }}
                className="btn btn-primary"
                style={{ padding: '0.75rem 2.2rem', fontWeight: 800, fontSize: '1rem' }}
              >
                Next Round ➔
              </button>
              <button
                onClick={() => navigate('/lobby')}
                className="btn"
                style={{ padding: '0.75rem 1.6rem' }}
              >
                🏠 Return to Lobby
              </button>
            </div>
          </div>
        )}

        {/* Match Finished / Series End Dialog: Exactly TWO Options: Rematch or Go to Lobby */}
        {roundPhase === 'series-end' && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(255, 255, 255, 0.97)',
              backdropFilter: 'blur(12px)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 'var(--radius)',
              gap: '1.5rem',
              zIndex: 100,
              padding: '2rem',
              textAlign: 'center',
              border: '3px solid #fed7aa',
              boxShadow: '0 14px 40px rgba(234, 88, 12, 0.18)',
            }}
          >
            <div>
              <div
                className="badge badge-orange"
                style={{ marginBottom: '0.8rem', fontSize: '0.9rem', padding: '0.4rem 1.2rem' }}
              >
                {!isBotOpponent && !isSolo && config.titleMode
                  ? '🏆 7-DAY TITLE MATCH COMPLETED'
                  : isBotOpponent
                  ? '🤖 BOT PRACTICE COMPLETED'
                  : isSolo
                  ? '🧩 SOLO PUZZLE COMPLETED'
                  : '🤝 FRIENDLY MATCH COMPLETED'}
              </div>
              <h2 style={{ fontSize: '2.5rem', marginBottom: '0.4rem', color: '#0f172a', fontWeight: 900 }}>
                {isSolo
                  ? 'Puzzle Completed!'
                  : winnerPlayer
                  ? `${winnerPlayer.username} Victorious!`
                  : 'Battle Ended in a Draw!'}
              </h2>
              {!isSolo && (
                <div style={{ fontSize: '1.3rem', color: '#ea580c', fontWeight: 800 }}>
                  Final Score: {series.wins[0]} - {series.wins[1]}
                </div>
              )}
            </div>

            {/* Exactly TWO Main Post-Match Buttons */}
            <div style={{ display: 'flex', gap: '1.2rem', flexWrap: 'wrap', justifyContent: 'center' }}>
              <button
                onClick={handleRematchClick}
                className="btn btn-primary"
                style={{ padding: '0.85rem 2.5rem', fontSize: '1.05rem', fontWeight: 800 }}
              >
                ⚔️ Rematch
              </button>
              <button
                onClick={() => navigate('/lobby')}
                className="btn"
                style={{
                  padding: '0.85rem 2.2rem',
                  fontSize: '1.05rem',
                  fontWeight: 700,
                  background: '#ffffff',
                }}
              >
                🏠 Return to Lobby
              </button>
            </div>

            {/* Optional Title Badge link if human-vs-human title mode was enabled */}
            {!isBotOpponent && !isSolo && config.titleMode && (
              <button
                onClick={() => navigate('/profile')}
                className="btn btn-gold"
                style={{ marginTop: '0.5rem', padding: '0.5rem 1.4rem', fontSize: '0.85rem' }}
              >
                🏆 View Reclaimed Titles in Profile ➔
              </button>
            )}
          </div>
        )}
      </div>

      {/* Live Academic DSA Inspector */}
      <DSAInspector
        engine={engineInstance}
        state={engineState}
        gameTitle={getGame(currentGameId).name}
        gameId={currentGameId}
      />
    </div>
  );
}
