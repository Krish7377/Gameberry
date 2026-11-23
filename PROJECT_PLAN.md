# Rivalry Arena — Full Project Plan & Roadmap

A competitive web gaming arena designed to showcase core Data Structures and Algorithms (DSA) through pure JavaScript game engines, a Best-of-N series state machine, title rivalry mechanics ("Crushed" / "Crushed by"), and a real-time DSA Inspector.

---

## 1. Architectural Principles

1. **Pure Game Engines:**
   - Every game engine lives in a standalone JavaScript module with **zero React and zero timers**.
   - State transitions are pure functions: `(state, action, random) => { nextState, events }`.
   - Seeded pseudorandom generator (Mulberry32) guarantees 100% deterministic replays and identical race boards.
   - Bots and server can reuse the exact same engine logic.
2. **Series & Rivalry Layer:**
   - One universal state machine drives Best-of-2, Best-of-3, and Best-of-5 series.
   - Tracks round-by-round wins, sudden-death deciders, draw replays, and mints 7-day server-verified rivalry titles.
3. **Thin Online Synchronization:**
   - Turn-based: Socket.io relays validated action payloads.
   - Race: Both players receive the identical seed; clients stream progress percentages and report final millisecond timestamps.
   - No complex physics sync or continuous delta compression required.

---

## 2. Starter Kit Changes & Fixes

| Area | Initial Starter Issue | Production Rule |
|---|---|---|
| **Title Minting** | Any client could POST and mint a title | Server mints titles only upon series completion |
| **Guest Authentication** | Freeform username could hijack accounts | Persistent UUID/token stored in localStorage + optional password/JWT |
| **Series Storage** | 1 database record per individual game | 1 `MatchRecord` per series containing all round history |
| **Leaderboards** | 1 player could flood top 10; variants mixed | Unique 1 best time per player per board key (e.g. `minesweeper:9x9`) |
| **Title Lifecycle** | Instant deletion on expiration | Kept for rivalry timeline; soft-deleted / cleaned up after 30 days |
| **Architecture** | React views mixed with game rules | Full separation into `engines/` (pure logic) and `games/` (React UI) |

---

## 3. Data Structures & Algorithms (DSA) Matrix

Every data structure has an explicit academic purpose, visible in the in-game **DSA Inspector**:

| Structure / Algo | Implementation in Rivalry Arena | DSA Inspector Metrics |
|---|---|---|
| **Doubly Linked List** | Snake body (O(1) head add, tail pop); match history feed & rivalry timeline | Node count, head/tail coordinates, traversal pointers |
| **Stack** | Tic-Tac-Toe undo/redo stacks; 2048 snapshot undo (max 3); Connect Four 7 column stacks | Stack depth, peek element, capacity |
| **Queue** | Minesweeper BFS flood-fill worklist; Snake input buffer; Series game queue & bot search worklists | Current queue size, peak queue size, cells visited count |
| **HashMap** | `userId -> active titles` cache (O(1)); Sudoku row/column/box conflict sets; Memory card states & combo streaks; Snake occupied cells | Entries, bucket count, load factor, collision count |
| **Priority Queue (Binary Heap)** | Top-10 Leaderboard Min/Max Binary Heap; fast retrieval of $k$-best times | Heap size, insertion rank $O(\log k)$, root value |
| **2D Array / Matrix** | Board state for all 8 games | Dimensions, coordinate access, cell touched |
| **Dynamic Array** | Fisher-Yates deck shuffle, leaderboards output | Array length, reallocations |
| **Algorithms** | - Sudoku: Recursive Backtracking<br>- Tic-Tac-Toe / Connect4: Minimax w/ alpha-beta<br>- Minesweeper / Snake: BFS flood fill & pathfinding | Recursion depth, search depth, branches pruned, visited set size |

---

## 4. The Eight Games Catalog

- **Tic-Tac-Toe (Turn-based):** 3x3 array, undo/redo stacks, replay stepping, minimax bot (Easy/Medium/Hard).
- **Connect Four (Turn-based):** 7 column stacks, 2D projection, 4-direction win check, alpha-beta bot (depth 2/4/6).
- **Memory Card Flip (Turn-based vs, timed solo):** Fisher-Yates shuffle, HashMap card state & combo streaks, LRU cache bot.
- **Minesweeper (Race):** Seeded mines with pre-revealed safe opening, BFS queue flood fill ripple, rule-based solver bot.
- **Sudoku 9x9 (Race):** Backtracking generator with unique solution guarantee, O(1) row/col/box duplicate hash checks, paced ghost bot.
- **Speed Sudoku 4x4 & 6x6 (Race against countdown):** 2x2 and 2x3 box geometries, instant conflict highlights, paced ghost bot.
- **2048 (Race):** Compress-merge-compress row reduction, transpose/reverse reuse, snapshot undo stack with PRNG state, expectimax bot.
- **Snake Arena (Race):** Doubly linked list body, O(1) hash collision grid, 2-turn input queue, BFS pathfinding food bot.

---

## 5. Series & Title Rules

- **Winning Condition:** First to strict majority ($2$ of $3$, $3$ of $5$).
- **Best-of-2:** If tied $1-1$, one sudden-death decider round is queued.
- **Drawn Rounds:** Replayed up to twice with swapped first player. After 2 draws, round is voided and an extra round is added.
- **Rivalry Titles:**
  - Exactly **one active title** per winner–loser pair.
  - Title expires in **7 days** unless renewed by winning another Title series against the same player.
  - If the loser wins a Title series, the old title is marked `reclaimed` and hidden; a new title is minted.
  - Leaving an active Title series forfeits the match (30s disconnect threshold online).
- **Bot Profiles:** RoboRival Easy, Medium, and Hard have persistent profiles, enabling full solo demos.

---

## 6. Build Order

1. **Step 1: Foundation and fixes** — One-command start, env files, engine contract, seeded generator, stopwatch, heap, tests for every DSA class, and starter-zip fixes.
2. **Step 2: Accounts and profiles** — Guest token, register/login, bot profiles, profile shell.
3. **Step 3: Title rules on the server** — Pure rules, series model, routes, HashMap cache and expiry, with tests.
4. **Step 4: The playable slice** — Title/Stake lobby, series machine, results, CRUSHED! animation, Tic-Tac-Toe and Connect Four with bots. *(Milestone: full Best-of-3 title match vs bot).*
5. **Step 5: Minesweeper**
6. **Step 6: Sudoku and Speed Sudoku**
7. **Step 7: Memory and 2048**
8. **Step 8: Snake Arena** *(Milestone: all eight games playable locally).*
9. **Step 9: Solo speed mode and leaderboards**
10. **Step 10: Online play**
11. **Step 11: Polish** (Audio, soundboard, animations, responsive layout).
12. **Step 12: Hardening** (Seed script, full tests, README, Viva report).
