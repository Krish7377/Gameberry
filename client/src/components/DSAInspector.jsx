// client/src/components/DSAInspector.jsx — Interactive Game Engine & DSA Concept Inspector
// Explains the data structures, how they work during gameplay, and complexity (no interview questions)
import React, { useState } from 'react';

const GAME_DSA_GUIDE = {
  'tic-tac-toe': {
    name: 'Tic-Tac-Toe',
    primaryDSA: '1D Flattened Array / Bitboard (9 cells)',
    algorithm: 'Minimax with Alpha-Beta Pruning + Precomputed 8-Line Win Check',
    timeComplexity: 'Move Placement: O(1) | Win Check: O(1) (8 lines) | AI Minimax: O(b^d) ≤ 9! pruned to <3,000 states',
    spaceComplexity: 'O(1) auxiliary space (9 cells) + O(d) recursion stack depth ≤ 9',
    concepts: [
      '1D Contiguous Array Representation (Index = Row × 3 + Col)',
      'Precomputed Lookup Tables for Instant Win Detection',
      'Minimax Decision Tree for Unbeatable Bot Intelligence',
    ],
    howItWorks: [
      'Grid in Memory: Instead of a nested 2D array, the 3×3 board is stored as a single 9-element 1D array. Tapping row r, col c maps directly to index (r × 3 + c) in O(1) time with optimal CPU cache alignment.',
      'Instant Win Verification: When a player marks a cell, the engine checks 8 pre-calculated winning triplets (3 rows, 3 columns, 2 diagonals) in O(1) time without looping.',
      'AI Tree Search: The RoboRival bot evaluates a game tree of future states using Minimax with Alpha-Beta pruning, discarding inferior moves instantly to play an optimal game with zero lag.',
    ],
    whyChosen:
      'A 1D array eliminates nested pointer indirection and guarantees O(1) memory access, while precomputed win triplets avoid redundant board scans on every turn.',
  },
  'connect-four': {
    name: 'Connect Four',
    primaryDSA: '7 Column-Wise LIFO Stacks (CustomStack) on 6×7 Grid',
    algorithm: 'LIFO Physical Gravity Simulation + 4-Directional Raycast Win Check',
    timeComplexity: 'Disc Drop: O(1) push | Win Check: O(1) bounded raycast (scans 4 rays ≤ 3 steps)',
    spaceComplexity: 'O(R × C) = 42 cells total + 7 column stack pointers (O(1) auxiliary space)',
    concepts: [
      'LIFO Stacks (Last-In-First-Out) for Gravity Physics',
      'Directional Vector Raycasting (4 Axis Rays)',
      'Stack Push & Pop for Fast AI Backtracking',
    ],
    howItWorks: [
      'Gravity Physics via Stacks: Each of the 7 columns acts as an independent LIFO Stack. Dropping a disc calls stack.push(player), instantly placing the disc into the lowest open row in O(1) time without looping from the top.',
      'Localized Raycast Win Check: After dropping a disc at (r, c), the engine radiates outward in 4 vector directions (horizontal, vertical, diagonal-up, diagonal-down) up to 3 cells. If 4 consecutive matching discs are found, victory is confirmed in O(1) steps.',
      'AI Backtracking with Pop: When the AI simulates future disc drops, it pushes discs onto columns and simply pops them off when backtracking, eliminating the need to clone the 42-cell board.',
    ],
    whyChosen:
      'Stacks naturally mirror the physical gravity of Connect Four. Discs settle at the lowest slot in O(1), and localized raycasting avoids re-scanning the entire 42-cell board on each move.',
  },
  'memory-cards': {
    name: 'Memory Card Flip',
    primaryDSA: 'Array Permutation + Transient Selection Buffer (Size 2) + Card State Bitmask',
    algorithm: 'Fisher-Yates O(n) In-Place Random Shuffle + Self-Healing Transition Lock',
    timeComplexity: 'Shuffle: O(n) | Card Flip: O(1) | Pair Comparison: O(1) | Match Resolution: O(1)',
    spaceComplexity: 'O(n) auxiliary space for card objects (icon, flipped, matched flags)',
    concepts: [
      'Fisher-Yates Algorithm for Unbiased Random Card Shuffling',
      'Transient 2-Card Selection Buffer',
      'State-Machine Lock to Prevent Fast-Clicking Glitches',
    ],
    howItWorks: [
      'Unbiased Card Shuffle: At match start, card pairs are shuffled using the Fisher-Yates algorithm. It walks backwards from the last index, swapping each card with a random prior index in O(n) time, ensuring every permutation is equally likely.',
      'Transient Selection Buffer: Clicking card 1 stores its index in a temporary buffer of size 2. Clicking card 2 compares their icon IDs in O(1) time.',
      'Self-Healing State Lock: If the two cards match, their matched flags become true and the player scores. If they mismatch, a lock prevents clicks during the preview and self-heals on the next interaction to prevent game freezes.',
    ],
    whyChosen:
      'Fisher-Yates provides mathematical uniformity without bias, while a size-2 selection buffer handles pair resolution cleanly with minimal memory overhead.',
  },
  'minesweeper': {
    name: 'Minesweeper Race',
    primaryDSA: '2D Adjacency Matrix + FIFO Queue (CustomQueue) for Breadth-First Search (BFS)',
    algorithm: 'Iterative BFS Flood Fill + 8-Neighbor Moore Convolution + First-Click Safe Guarantee',
    timeComplexity: 'BFS Cascade Reveal: O(V + E) where V = R × C and E ≤ 8V | Neighbor Calculation: O(1) per tile',
    spaceComplexity: 'O(V) FIFO queue capacity in worst-case cascade reveal + O(R × C) grid memory',
    concepts: [
      'FIFO Queue (First-In-First-Out) for Level-Order Wave Expansion',
      'Breadth-First Search (BFS) Flood Fill',
      '8-Neighbor Moore Convolution for Surrounding Mine Counts',
    ],
    howItWorks: [
      'First-Click Safe Guarantee: On the player\'s first click, if the tile is a mine, the engine relocates it to an open corner and recomputes neighbor counts in O(M) time so you never lose on turn one.',
      'Iterative BFS Flood Fill: Clicking a blank cell (0 neighboring mines) pushes it into a FIFO Queue. The engine dequeues tiles one by one, reveals them, and enqueues their unrevealed safe neighbors in concentric waves.',
      'Queue vs Recursion Safety: Using an explicit FIFO Queue prevents "Maximum call stack size exceeded" browser crashes that happen with deep recursive flood fill on large grids.',
    ],
    whyChosen:
      'An iterative FIFO Queue ensures smooth, non-blocking cascade reveals across the board without stack overflow risk, exploring safe tiles in linear O(V + E) time.',
  },
  '2048': {
    name: '2048 Sliding Puzzle',
    primaryDSA: '4×4 2D Matrix Grid + Dynamic Sliding Vectors',
    algorithm: 'Two-Pointer In-Place Array Compaction & Single-Pass Adjacent Tile Merging',
    timeComplexity: 'Slide & Merge Move: O(N²) = O(16) = O(1) | Spawn Random Tile: O(empty cells) ≤ 16',
    spaceComplexity: 'O(1) auxiliary space (fixed 4×4 board)',
    concepts: [
      'Two-Pointer Technique for In-Place Array Compaction',
      'Single-Pass Merge Rule (No Tile Merges Twice in One Swipe)',
      'Matrix Rotation for 4-Directional Movement Reuse',
    ],
    howItWorks: [
      'Two-Pointer Compaction: When swiping left, a read pointer skips zeroes while a write pointer packs nonzero tiles into the leftmost slots in a single O(N) pass per row.',
      'Single-Pass Merge Rule: If two adjacent compacted tiles share the same value (e.g. [4, 4]), they merge into 8. The write pointer advances past the merged tile so it cannot merge again in the same turn.',
      'Direction Mapping: Rather than writing 4 separate sliding algorithms, columns and rows are rotated, processed through the core left-slide compaction, and rotated back with zero code duplication.',
    ],
    whyChosen:
      'The two-pointer technique compacts and merges tiles in a single pass of length N, running in O(1) time for the 4×4 board without temporary array allocations.',
  },
  'speed-sudoku': {
    name: 'Speed Sudoku',
    primaryDSA: 'Compact 4×4 / 6×6 2D Matrix + Bitmask Integer Sets',
    algorithm: 'Constraint Satisfaction Backtracking + Bitwise Conflict Detection',
    timeComplexity: 'Cell Conflict Check: O(1) bitwise lookup | DFS Backtracking: O(b^m)',
    spaceComplexity: 'O(N²) board cells + O(N) row/column/box bitmask registers',
    concepts: [
      'Integer Bitmasks for O(1) Digit Uniqueness Checking',
      'Constraint Satisfaction Problem (CSP) Invariant Checks',
      'Real-Time Conflict Highlighting Without Full Board Scans',
    ],
    howItWorks: [
      'Bitmask Uniqueness Check: Each row, column, and subgrid maintains a bit field where bit k represents whether digit k is present. Testing if a digit already exists evaluates (mask & (1 << digit)) in a single CPU instruction.',
      'Instant Conflict Detection: Because validation runs in O(1) time via bitwise operators rather than scanning all 36 cells with nested loops, the game delivers silky 60 FPS speed solving.',
      'Subgrid Coordinate Mapping: Determining which sub-box a cell belongs to uses integer division Math.floor(r / boxRows) * boxCols + Math.floor(c / boxCols) in O(1) time.',
    ],
    whyChosen:
      'Bitmask integer registers reduce row, column, and box validation to instantaneous bitwise AND operations, giving zero input latency during high-speed puzzle solving.',
  },
  'sudoku': {
    name: 'Sudoku (9×9 Classic)',
    primaryDSA: '9×9 2D Board + Row, Column, and 3×3 Box Bitmasks',
    algorithm: 'Constraint Satisfaction Problem (CSP) + Recursive DFS Backtracking with Constraint Propagation',
    timeComplexity: 'Move Placement: O(1) | Bitwise Validation: O(1) | Full Solver: Worst-case O(9^m), pruned to <5ms',
    spaceComplexity: 'O(81) = O(1) fixed space + O(m) recursion stack depth ≤ 81',
    concepts: [
      '9-Bit Binary Registers (Bits 1–9 represent digits 1–9)',
      'Depth-First Search (DFS) with Constraint Propagation',
      'Exact Cover Problem Modeling',
    ],
    howItWorks: [
      'Region Constraint Registers: The 81-cell board is governed by 27 regions (9 rows, 9 columns, 9 boxes). Each region is tracked by a 9-bit integer register.',
      'O(1) Digit Validation: Entering a digit sets its corresponding bit. Checking for duplicates takes a single bitwise operation, giving instant feedback when a number conflicts.',
      'Constraint Propagation Solver: When generating puzzles, the engine uses depth-first backtracking with constraint propagation to eliminate invalid choices upfront, ensuring every puzzle has a guaranteed unique solution.',
    ],
    whyChosen:
      'Bitmask registers allow 27 regional constraints to be validated simultaneously with bitwise logic, making move placement O(1) and puzzle solving ultra-fast.',
  },
};

export default function DSAInspector({ engine, state, gameTitle, gameId }) {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('concepts'); // 'concepts' | 'live'

  if (!engine || !state) return null;

  // Determine game key
  const normalizedKey = (gameId || gameTitle || '').toLowerCase().replace(/\s+/g, '-');
  const dsaInfo =
    GAME_DSA_GUIDE[normalizedKey] ||
    Object.values(GAME_DSA_GUIDE).find((g) => normalizedKey.includes(g.name.toLowerCase())) ||
    GAME_DSA_GUIDE['tic-tac-toe'];

  // Metrics from engine
  const metrics = open && engine.inspect ? engine.inspect(state) : null;

  return (
    <div
      style={{
        marginTop: '1.8rem',
        border: '2px solid #fed7aa',
        borderRadius: 'var(--radius)',
        background: '#ffffff',
        overflow: 'hidden',
        boxShadow: '0 8px 25px rgba(234, 88, 12, 0.08)',
      }}
    >
      {/* Top Banner Header */}
      <div
        onClick={() => setOpen(!open)}
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '0.95rem 1.4rem',
          cursor: 'pointer',
          background: 'linear-gradient(90deg, #fff7ed 0%, #ffffff 100%)',
          borderBottom: open ? '2px solid #fed7aa' : 'none',
          userSelect: 'none',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.7rem' }}>
          <span style={{ fontSize: '1.35rem' }}>📊</span>
          <div>
            <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#0f172a' }}>
              DSA ENGINE INSPECTOR: {dsaInfo.name}
            </div>
            <div style={{ fontSize: '0.78rem', color: '#ea580c', fontWeight: 700 }}>
              Primary Structure: {dsaInfo.primaryDSA.split('+')[0].trim()}
            </div>
          </div>
        </div>
        <button
          type="button"
          className="btn"
          style={{
            fontSize: '0.8rem',
            padding: '0.35rem 0.9rem',
            borderColor: '#fdba74',
            color: '#c2410c',
            background: '#ffffff',
            fontWeight: 800,
          }}
        >
          {open ? '▲ Close DSA Guide' : '▶ Open DSA Guide (How It Works)'}
        </button>
      </div>

      {open && (
        <div style={{ padding: '1.4rem', display: 'flex', flexDirection: 'column', gap: '1.2rem', background: '#ffffff' }}>
          {/* Sub Navigation Tabs */}
          <div style={{ display: 'flex', gap: '0.6rem', borderBottom: '2px solid #f1f5f9', paddingBottom: '0.6rem' }}>
            <button
              onClick={() => setActiveTab('concepts')}
              className="btn"
              style={{
                fontSize: '0.82rem',
                padding: '0.4rem 1rem',
                fontWeight: 800,
                borderColor: activeTab === 'concepts' ? '#ea580c' : '#cbd5e1',
                background: activeTab === 'concepts' ? '#fff7ed' : '#ffffff',
                color: activeTab === 'concepts' ? '#c2410c' : 'var(--text-secondary)',
              }}
            >
              🧠 DSA Concepts & Engine Architecture
            </button>
            <button
              onClick={() => setActiveTab('live')}
              className="btn"
              style={{
                fontSize: '0.82rem',
                padding: '0.4rem 1rem',
                fontWeight: 800,
                borderColor: activeTab === 'live' ? '#2563eb' : '#cbd5e1',
                background: activeTab === 'live' ? '#eff6ff' : '#ffffff',
                color: activeTab === 'live' ? '#1d4ed8' : 'var(--text-secondary)',
              }}
            >
              ⚡ Live Engine State (Runtime Metrics)
            </button>
          </div>

          {activeTab === 'concepts' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
              {/* Architecture Rationale Banner */}
              <div
                style={{
                  background: 'linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)',
                  border: '2px solid #fed7aa',
                  borderRadius: '12px',
                  padding: '1.1rem 1.3rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
                  <span style={{ fontSize: '1.2rem' }}>💡</span>
                  <strong style={{ color: '#9a3412', fontSize: '0.92rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Why this Data Structure was Chosen:
                  </strong>
                </div>
                <p style={{ color: '#7c2d12', fontSize: '0.9rem', lineHeight: 1.55, fontWeight: 600, margin: 0 }}>
                  "{dsaInfo.whyChosen}"
                </p>
              </div>

              {/* Technical Complexity Summary Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '0.9rem' }}>
                <div style={{ background: '#f8fafc', padding: '0.85rem 1rem', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                  <span style={{ fontSize: '0.74rem', color: '#64748b', fontWeight: 800, textTransform: 'uppercase' }}>
                    📦 Primary Data Structure:
                  </span>
                  <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#0f172a', marginTop: '0.25rem' }}>
                    {dsaInfo.primaryDSA}
                  </div>
                </div>

                <div style={{ background: '#f8fafc', padding: '0.85rem 1rem', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                  <span style={{ fontSize: '0.74rem', color: '#64748b', fontWeight: 800, textTransform: 'uppercase' }}>
                    ⚙️ Core Algorithm:
                  </span>
                  <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#2563eb', marginTop: '0.25rem' }}>
                    {dsaInfo.algorithm}
                  </div>
                </div>

                <div style={{ background: '#f8fafc', padding: '0.85rem 1rem', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                  <span style={{ fontSize: '0.74rem', color: '#64748b', fontWeight: 800, textTransform: 'uppercase' }}>
                    ⏱️ Time Complexity:
                  </span>
                  <div style={{ fontSize: '0.84rem', fontWeight: 700, color: '#16a34a', marginTop: '0.25rem', fontFamily: 'monospace' }}>
                    {dsaInfo.timeComplexity}
                  </div>
                </div>

                <div style={{ background: '#f8fafc', padding: '0.85rem 1rem', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                  <span style={{ fontSize: '0.74rem', color: '#64748b', fontWeight: 800, textTransform: 'uppercase' }}>
                    💾 Space Complexity:
                  </span>
                  <div style={{ fontSize: '0.84rem', fontWeight: 700, color: '#dc2626', marginTop: '0.25rem', fontFamily: 'monospace' }}>
                    {dsaInfo.spaceComplexity}
                  </div>
                </div>
              </div>

              {/* Core Concepts Used */}
              <div>
                <h4 style={{ color: '#0f172a', fontSize: '0.92rem', marginBottom: '0.5rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  🧩 Core Concepts Used in this Game:
                </h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {dsaInfo.concepts.map((concept, idx) => (
                    <span
                      key={idx}
                      style={{
                        padding: '0.4rem 0.85rem',
                        borderRadius: '8px',
                        background: '#eff6ff',
                        border: '1px solid #bfdbfe',
                        color: '#1d4ed8',
                        fontSize: '0.82rem',
                        fontWeight: 700,
                      }}
                    >
                      ✓ {concept}
                    </span>
                  ))}
                </div>
              </div>

              {/* How it Works Step-by-Step */}
              <div>
                <h4 style={{ color: '#0f172a', fontSize: '0.92rem', marginBottom: '0.6rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  ⚙️ How the Data Structures Work During Gameplay:
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                  {dsaInfo.howItWorks.map((step, idx) => (
                    <div
                      key={idx}
                      style={{
                        background: '#ffffff',
                        border: '1px solid #e2e8f0',
                        borderRadius: '10px',
                        padding: '0.85rem 1.1rem',
                        display: 'flex',
                        gap: '0.8rem',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
                      }}
                    >
                      <span
                        style={{
                          width: '24px',
                          height: '24px',
                          borderRadius: '50%',
                          background: '#ea580c',
                          color: '#ffffff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 900,
                          fontSize: '0.78rem',
                          flexShrink: 0,
                          marginTop: '0.1rem',
                        }}
                      >
                        {idx + 1}
                      </span>
                      <div style={{ color: 'var(--text-secondary)', fontSize: '0.86rem', lineHeight: 1.5, fontWeight: 500 }}>
                        {step}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'live' && (
            <div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '0.6rem' }}>
                Active game runtime state inspected directly from the JavaScript/Java DSA engine:
              </div>
              {metrics ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.8rem' }}>
                  {Object.entries(metrics).map(([key, val]) => (
                    <div
                      key={key}
                      style={{
                        background: '#f8fafc',
                        border: '1px solid #e2e8f0',
                        borderRadius: '10px',
                        padding: '0.65rem 0.9rem',
                      }}
                    >
                      <div style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>
                        {key}
                      </div>
                      <div
                        style={{
                          fontFamily: 'monospace',
                          fontSize: '0.95rem',
                          color: '#2563eb',
                          fontWeight: 700,
                          marginTop: '0.2rem',
                          wordBreak: 'break-all',
                        }}
                      >
                        {typeof val === 'object' ? JSON.stringify(val) : String(val)}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  No metrics available for active game engine state.
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
