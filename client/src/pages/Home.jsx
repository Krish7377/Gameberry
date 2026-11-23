// client/src/pages/Home.jsx — Landing Page with Bright Warm Theme
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { getVersusGames, getSoloGames } from '../engines/registry.js';
import GameCard from '../components/GameCard.jsx';

export default function Home() {
  const navigate = useNavigate();
  const versusGames = getVersusGames();
  const soloGames = getSoloGames();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem', paddingBottom: '3rem' }}>
      {/* Bright Warm Hero Banner */}
      <section
        style={{
          textAlign: 'center',
          padding: '3.5rem 1.5rem 2.5rem',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          background: 'linear-gradient(180deg, rgba(255, 247, 237, 0.8) 0%, rgba(254, 242, 242, 0.5) 60%, rgba(248, 250, 252, 0) 100%)',
          borderRadius: '24px',
          border: '2px solid #fed7aa',
          boxShadow: '0 10px 30px rgba(234, 88, 12, 0.06)',
        }}
      >
        <div
          className="badge badge-orange"
          style={{ marginBottom: '1.2rem', fontSize: '0.9rem', padding: '0.45rem 1.4rem', fontWeight: 800 }}
        >
          🔥 7 PURE DSA ENGINES • WARM ORANGE-RED RIVALRY • PURE LOGIC
        </div>

        <h1
          style={{
            fontSize: '3.8rem',
            background: 'linear-gradient(135deg, #ff5500 0%, #ea580c 35%, #dc2626 70%, #2563eb 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            lineHeight: 1.15,
            marginBottom: '1.2rem',
            letterSpacing: '0.02em',
          }}
        >
          BATTLE, SOLVE & CRUSH YOUR RIVALS
        </h1>

        <p
          style={{
            maxWidth: '740px',
            color: 'var(--text-secondary)',
            fontSize: '1.18rem',
            lineHeight: 1.6,
            marginBottom: '2.2rem',
          }}
        >
          An arena engineered for computer science demonstration. Play 1v1 turn-based rivalries and pure solo puzzles powered by custom Stacks, Queues, HashMaps, and Binary Heaps — with real-time academic DSA metrics.
        </p>

        <div style={{ display: 'flex', gap: '1.2rem', flexWrap: 'wrap', justifyContent: 'center' }}>
          <button
            onClick={() => navigate('/lobby')}
            className="btn btn-primary"
            style={{ padding: '0.9rem 2.6rem', fontSize: '1.1rem', fontWeight: 800 }}
          >
            ⚔️ Enter 1v1 Battle Arena
          </button>
          <button
            onClick={() => navigate('/play/2048', {
              state: {
                format: 1,
                titleMode: false,
                games: ['2048'],
                players: [{ id: 'p1', username: 'Player 1' }],
                isSolo: true,
              },
            })}
            className="btn btn-gold"
            style={{ padding: '0.9rem 2.6rem', fontSize: '1.1rem' }}
          >
            🧩 Play 2048 Solo
          </button>
        </div>
      </section>

      {/* 1v1 Rivalry Arenas Section */}
      <section>
        <div style={{ marginBottom: '1.4rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.7rem' }}>
            <span className="badge badge-orange">1v1 VERSUS</span>
            <h2 style={{ fontSize: '2rem', color: '#0f172a' }}>1v1 Rivalry Arenas</h2>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginTop: '0.3rem' }}>
            Turn-based strategy and head-to-head races. Play against Bots (Easy/Medium/Hard), local friends, or live online rooms.
          </p>
        </div>

        <div className="grid-games">
          {versusGames.map((game) => (
            <GameCard key={game.id} game={game} />
          ))}
        </div>
      </section>

      {/* Solo Arcade & Speed Puzzles Section */}
      <section>
        <div style={{ marginBottom: '1.4rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.7rem' }}>
            <span className="badge badge-gold">SOLO ARCADE</span>
            <h2 style={{ fontSize: '2rem', color: '#0f172a' }}>Solo Speed & Logic Puzzles</h2>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginTop: '0.3rem' }}>
            Pure solo gameplay with high scores, stopwatch timers, and DSA algorithm benchmarks.
          </p>
        </div>

        <div className="grid-games">
          {soloGames.map((game) => (
            <GameCard key={game.id} game={game} />
          ))}
        </div>
      </section>

      {/* Academic DSA Map Info Card */}
      <section
        className="card"
        style={{
          borderLeft: '6px solid #ea580c',
          background: '#ffffff',
          boxShadow: '0 8px 25px rgba(234, 88, 12, 0.06)',
        }}
      >
        <h3 style={{ color: '#ea580c', marginBottom: '0.6rem', fontSize: '1.35rem' }}>
          🎓 Academic Viva & Professor Evaluation Ready
        </h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.98rem', lineHeight: 1.6 }}>
          Every engine is written in pure JavaScript with zero UI dependencies. Open the live <strong>DSA Inspector</strong> during any match to inspect <strong>LIFO Undo/Redo Stacks</strong> (Tic-Tac-Toe, 2048), <strong>FIFO Queues</strong> (Minesweeper BFS flood-fill), <strong>O(1) HashMaps</strong> (Sudoku conflict validator, room presence), and <strong>Priority Queue Binary Heaps</strong> (Personal Best score rankings).
        </p>
      </section>
    </div>
  );
}
