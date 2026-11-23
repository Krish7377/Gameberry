// ── Engine Contract ──
// Every game engine must export these functions. This module documents the
// interface and provides a helper to validate engines at registration time.
//
// ENGINE API:
//   create(seed, options)       → state        Initial game state
//   apply(state, action)        → { state, events }  Pure state transition
//   status(state)               → { phase, winner?, time?, score?, progress? }
//   inspect(state)              → { label, metrics[] }  DSA Inspector data
//
// STATUS PHASES:
//   'playing'   – game in progress
//   'won'       – current player won
//   'lost'      – current player lost
//   'draw'      – round is drawn
//   'finished'  – game ended (race: compare times/scores)
//
// EVENTS (emitted by apply):
//   'move'      – a valid move was made
//   'win'       – player won
//   'loss'      – player lost
//   'draw'      – round drawn
//   'combo'     – streak/cascade/clutch moment
//   'reveal'    – cells revealed (minesweeper)
//   'merge'     – tiles merged (2048)
//   'eat'       – food eaten (snake)
//   'flip'      – card flipped (memory)
//   'match'     – matching pair found (memory)
//   'invalid'   – invalid action attempted

export function validateEngine(engine) {
  const required = ['create', 'apply', 'status', 'inspect'];
  const missing = required.filter((fn) => typeof engine[fn] !== 'function');
  if (missing.length) {
    throw new Error(`Engine missing required functions: ${missing.join(', ')}`);
  }
  return engine;
}
