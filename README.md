# ⚔️ Rivalry Arena

> **A competitive gaming arena designed to make Data Structures and Algorithms (DSA) visible, interactive, and academically demonstrable.**

---

## 🚀 Quick Start (One Command)

```bash
# 1. Install dependencies (already completed)
npm install

# 2. Run both Client & Server concurrently
npm run dev
```

- **Client:** `http://localhost:5173`
- **Server:** `http://localhost:3001` (with automatic in-memory fallback if MongoDB is not running)
- **Run Tests:** `npm test` (52/52 passing)

---

## 🏛️ Core Design Principles

1. **Pure Game Engines:** Every game's logic lives in a standalone JavaScript module (`client/src/engines/`) with **zero React and zero timers**, driven by seeded Mulberry32 pseudorandomness. State updates are pure functions `(state, action) => { state, events }`.
2. **Universal Series State Machine:** Orchestrates Best-of-2 (sudden death), Best-of-3, and Best-of-5 matches, draw replays (up to twice with swapped starter), round win pips, and title minting.
3. **Thin Sync Layer:** Socket.io relays moves and race completion percentages without heavy physics sync.
4. **Resilient Dual Storage:** Seamlessly connects to MongoDB Atlas URI via `.env`, or operates offline using custom in-memory data structures (`HashMap`, `PriorityQueue`) so lab presentations never fail.

---

## 📊 Complete DSA Matrix (Inspector & Viva Guide)

| Data Structure | Where Implemented | Why Chosen & Complexity | DSA Inspector Live Metric |
|---|---|---|---|
| **Doubly Linked List** | Snake body; Match history | $O(1)$ head insertion (`pushFront`) and $O(1)$ tail eviction (`popBack`). Prevents costly $O(n)$ array reallocations. | Body length, head coordinate, tail coordinate |
| **Stack** | Tic-Tac-Toe undo/redo; 2048 snapshots; Connect Four columns | Naturally models LIFO history. $O(1)$ push/pop. Connect Four uses 7 column stacks where disc drops push onto the stack. | Stack depth, capacity |
| **Queue** | Minesweeper BFS flood-fill; Snake input buffer; Series game queue | FIFO ordering: $O(1)$ enqueue/dequeue. Stepped BFS reveal expands zero-clue cascades outward in waves. | Current queue size, peak queue size, cells visited |
| **HashMap** | Title cache; Sudoku duplicate checker; Memory card states; Snake collision | $O(1)$ average time lookups using FNV-1a hash algorithm. Guarantees instantaneous conflict checks without scanning rows/cols. | Entry count, bucket size, load factor |
| **Priority Queue (Binary Heap)** | Top-10 Speed Board Leaderboards | $O(\log k)$ insert, $O(1)$ peek. Capped binary max/min-heap efficiently tracks the top 10 fastest times without sorting all entries. | Heap size, root time |
| **2D Array / Matrix** | Board representations for all 8 games | Direct $O(1)$ coordinate addressing `grid[row][col]`. | Grid dimensions, active coordinates |
| **Dynamic Array** | Memory deck; Fisher–Yates shuffle | Shuffles deck in $O(n)$ time giving every permutation equal probability. | Deck size, matched pair count |
| **Algorithms** | - Recursive Backtracking (Sudoku generation)<br>- Minimax with $\alpha$-$\beta$ pruning (Tic-Tac-Toe & Connect Four bots)<br>- BFS Pathfinding (Snake bot & Minesweeper) | Academic algorithmic demonstrations with selectable depths and heuristic prunings. | Recursion depth, search depth, branches pruned |

---

## 🎮 The 8 Playable Games

1. **Tic-Tac-Toe (Strategy, Turn-Based):** 3×3 matrix, undo/redo stacks, replay stepping, clutch block detection, minimax bot (Easy, Medium, Hard).
2. **Connect Four (Strategy, Turn-Based):** 7 column stacks, 2D display projection, hover landing ghost, bounce animation, $\alpha$-$\beta$ pruning bot (depths 2, 4, 6).
3. **Memory Card Flip (Arcade, Turn-Based):** Fisher–Yates shuffled deck, HashMap card states, 3-in-a-row combo hype sound, LRU Cache bot simulation (Easy: 4 cards, Medium: 8 cards, Hard: 16 cards).
4. **Minesweeper (Puzzle, Race):** Seeded mines with pre-revealed safe opening, BFS queue flood-fill cascade, rule-based worklist bot.
5. **Sudoku 9×9 (Puzzle, Race):** Randomized backtracking generator with unique solution verification, $O(1)$ row/column/box conflict HashMaps, paced ghost bot.
6. **Speed Sudoku 4×4 & 6×6 (Puzzle, Race):** Parameterized subgrids ($2\times2$ and $2\times3$), high-precision countdown timer, DNF on timeout.
7. **2048 (Arcade, Race):** Row compress-merge-compress reduction, limited snapshot undo stack (max 3, preserves PRNG state), touch/swipe support.
8. **Snake Arena (Arcade, Race):** Doubly linked list body, $O(1)$ HashMap self-collision grid, 2-turn input queue, BFS shortest-path bot.

---

## 🏆 Title Rivalry Rules

- **Minting Authority:** Titles are minted strictly on the server upon series completion.
- **Duration:** Active for **7 days**.
- **Pair Limit:** Exactly **one active title** per winner–loser pair. Winning again renews the 7-day timer.
- **Reclaiming Honor:** If the loser beats the title holder in a Title Series, the old title is marked `reclaimed` and hidden; a new title is minted for the challenger.
- **Profile Badges:**
  - 🏆 **"Crushed [Name]"**: Live countdown timer showing badge validity.
  - 💀 **"Crushed by [Name]"**: Shows series summary with a prominent **"Rematch to Reclaim Honor"** button.

---

## 🎓 Professor Viva & Demo Walkthrough (5-Minute Script)

1. **Start Muted:** Point out that audio starts muted by default for clean presentation.
2. **Showcase `client/src/dsa/structures.js`:** Walk through the custom implementations of `Stack`, `Queue`, `DoublyLinkedList`, `HashMap`, and `PriorityQueue`. Show the 52/52 passing unit tests (`npm test`).
3. **Play Tic-Tac-Toe & Open DSA Inspector:** Show moves pushing onto the undo stack and popping onto the redo stack. Point out the $O(1)$ guarantees.
4. **Play Minesweeper:** Click the board to trigger the BFS Queue ripple cascade; show peak queue size in the Inspector.
5. **Play Snake Arena:** Show the Doubly Linked List length and $O(1)$ HashMap collision tracking in the Inspector.
6. **Play a Best-of-3 Title Match vs RoboRival:** Win the series to showcase the **CRUSHED!** stamp animation and confetti, then navigate to Profile to see the live 7-day countdown badge.
