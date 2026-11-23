// DSA: Dynamic array shuffled with Fisher–Yates O(n); HashMap for O(1) card states and streak lookup.
import { HashMap } from '../dsa/structures.js';
import { createRandom, shuffle } from '../core/random.js';

const EMOJI_POOL = [
  '⚡', '🔥', '💎', '🚀', '⭐', '👾', '🎯', '👑',
  '🍕', '🎸', '🎲', '🦄', '🏆', '⚓', '🔮', '🪐',
  '🦊', '🐉', '🌈', '🧨', '🛡️', '⚔️', '🗝️', '🔔',
];

export function create(seed, options = {}) {
  const rng = createRandom(seed);
  const size = options.size === 6 ? 6 : 4; // 4x4 (8 pairs) or 6x6 (18 pairs)
  const pairCount = (size * size) / 2;

  const selectedFaces = EMOJI_POOL.slice(0, pairCount);
  const rawCards = [];
  for (let i = 0; i < pairCount; i++) {
    rawCards.push({ id: i * 2, face: selectedFaces[i] });
    rawCards.push({ id: i * 2 + 1, face: selectedFaces[i] });
  }

  // DSA: Fisher–Yates dynamic array shuffle O(n)
  const deck = shuffle(rawCards, rng);

  // DSA: HashMap holds each card state keyed by card index for O(1) state query.
  const cardMap = new HashMap();
  deck.forEach((card, idx) => {
    cardMap.set(idx, {
      index: idx,
      id: card.id,
      face: card.face,
      isFlipped: false,
      isMatched: false,
    });
  });

  // DSA: HashMap holds combo streaks per player
  const streakMap = new HashMap();
  streakMap.set(0, 0);
  streakMap.set(1, 0);

  return {
    size,
    deck,
    cardMap,
    streakMap,
    flippedIndices: [],
    matchedPairs: 0,
    totalPairs: pairCount,
    currentPlayer: 0,
    scores: [0, 0],
    phase: 'playing',
    winner: null,
    lockUntilMismatchResolved: false,
    rng,
  };
}

export function apply(state, action) {
  const events = [];

  if (action.type === 'resolveMismatch') {
    if (state.flippedIndices.length === 2 && state.lockUntilMismatchResolved) {
      const [idx1, idx2] = state.flippedIndices;
      const c1 = state.cardMap.get(idx1);
      const c2 = state.cardMap.get(idx2);
      if (c1) c1.isFlipped = false;
      if (c2) c2.isFlipped = false;
      state.flippedIndices = [];
      state.lockUntilMismatchResolved = false;
      state.currentPlayer = 1 - state.currentPlayer;
    }
    return { ...state, events };
  }

  if (action.type === 'flip') {
    if (state.phase !== 'playing') return { ...state, events };

    // Self-healing: If previous mismatch was pending, automatically resolve it now
    if (state.lockUntilMismatchResolved) {
      if (state.flippedIndices.length === 2) {
        const [old1, old2] = state.flippedIndices;
        const c1 = state.cardMap.get(old1);
        const c2 = state.cardMap.get(old2);
        if (c1) c1.isFlipped = false;
        if (c2) c2.isFlipped = false;
        state.currentPlayer = 1 - state.currentPlayer;
      }
      state.flippedIndices = [];
      state.lockUntilMismatchResolved = false;
    }

    const { index } = action;
    if (index < 0 || index >= state.deck.length) return { ...state, events };

    const card = state.cardMap.get(index);
    if (!card || card.isFlipped || card.isMatched) return { ...state, events };

    // Flip this card
    card.isFlipped = true;
    state.flippedIndices.push(index);
    events.push({ type: 'flip', index, face: card.face, player: state.currentPlayer });

    // If two cards flipped, check match
    if (state.flippedIndices.length === 2) {
      const [idx1, idx2] = state.flippedIndices;
      const c1 = state.cardMap.get(idx1);
      const c2 = state.cardMap.get(idx2);

      if (c1.face === c2.face) {
        // Matched!
        c1.isMatched = true;
        c2.isMatched = true;
        state.matchedPairs += 1;
        state.scores[state.currentPlayer] += 1;
        state.flippedIndices = [];

        // Increase streak
        const currentStreak = (state.streakMap.get(state.currentPlayer) || 0) + 1;
        state.streakMap.set(state.currentPlayer, currentStreak);

        events.push({ type: 'match', indices: [idx1, idx2], face: c1.face, player: state.currentPlayer });

        if (currentStreak >= 3) {
          events.push({ type: 'combo', kind: 'streak', streak: currentStreak, player: state.currentPlayer });
        }

        // Check if all matched
        if (state.matchedPairs >= state.totalPairs) {
          state.phase = 'finished';
          if (state.scores[0] > state.scores[1]) state.winner = 0;
          else if (state.scores[1] > state.scores[0]) state.winner = 1;
          else state.winner = 'draw';
          events.push({ type: state.winner === 'draw' ? 'draw' : 'win', winner: state.winner });
        }
        // Player gets another turn on match!
      } else {
        // Mismatch — reset streak for this player
        state.streakMap.set(state.currentPlayer, 0);
        state.lockUntilMismatchResolved = true;
        events.push({ type: 'mismatch', indices: [idx1, idx2], player: state.currentPlayer });
      }
    }

    return { ...state, events };
  }

  return { ...state, events };
}

export function status(state) {
  return {
    phase: state.phase,
    winner: state.winner,
    currentPlayer: state.currentPlayer,
    scores: [...state.scores],
    matchedPairs: state.matchedPairs,
    totalPairs: state.totalPairs,
    progress: Math.floor((state.matchedPairs / state.totalPairs) * 100),
  };
}

export function inspect(state) {
  return {
    deckSize: state.deck.length,
    matchedPairs: state.matchedPairs,
    totalPairs: state.totalPairs,
    p0Streak: state.streakMap.get(0) || 0,
    p1Streak: state.streakMap.get(1) || 0,
    cardMapCount: state.cardMap.size,
    loadFactor: state.cardMap.loadFactor,
  };
}
