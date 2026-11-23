import { describe, it, expect } from 'vitest';
import { GAME_REGISTRY } from '../registry.js';
import { createSeries, recordRound, seriesWinner } from '../../core/series.js';

describe('Engine apply & Bot Move Contract Verification', () => {
  it('verifies Tic-Tac-Toe apply and bot moves', () => {
    const ttt = GAME_REGISTRY.find(g => g.id === 'tic-tac-toe');
    let s = ttt.engine.create(123);
    expect(ttt.engine.status(s).phase).toBe('playing');

    // Player 0 move
    const res1 = ttt.engine.apply(s, { type: 'move', row: 1, col: 1 });
    const s1 = res1.state || res1;
    expect(s1.board[1][1]).toBe(0);
    expect(ttt.engine.status(s1).phase).toBe('playing');

    // Bot move
    const botMove = ttt.bot.getMove(s1, 'medium');
    expect(botMove).toBeDefined();
    expect(botMove.type).toBe('move');
    expect(botMove.row).toBeDefined();
    expect(botMove.col).toBeDefined();

    // Apply bot move
    const res2 = ttt.engine.apply(s1, botMove);
    const s2 = res2.state || res2;
    expect(s2.board[botMove.row][botMove.col]).toBe(1);
    expect(ttt.engine.status(s2).phase).toBe('playing');
  });

  it('verifies Connect Four apply and bot moves', () => {
    const c4 = GAME_REGISTRY.find(g => g.id === 'connect-four');
    let s = c4.engine.create(456);

    const res1 = c4.engine.apply(s, { type: 'drop', col: 3 });
    const s1 = res1.state || res1;
    expect(c4.engine.status(s1).phase).toBe('playing');

    const botMove = c4.bot.getMove(s1, 'medium');
    expect(botMove).toBeDefined();
    expect(botMove.type).toBe('drop');
    expect(typeof botMove.col).toBe('number');

    const res2 = c4.engine.apply(s1, botMove);
    const s2 = res2.state || res2;
    expect(c4.engine.status(s2).phase).toBe('playing');
  });

  it('verifies Single Round Match (Best of 1) in Series', () => {
    const series = createSeries({
      games: ['tic-tac-toe'],
      format: 1,
      players: [{ id: 'p1', username: 'Alice' }, { id: 'p2', username: 'Bob' }],
      titleMode: false,
    });

    expect(series.format).toBe(1);
    expect(series.complete).toBe(false);

    // Player 0 wins round 1
    const next = recordRound(series, {
      game: 'tic-tac-toe',
      winner: 0,
      time: 12000,
    });

    expect(next.complete).toBe(true);
    expect(seriesWinner(next)).toBe(0);
  });

  it('verifies Memory Card Flip auto-resolution and bot safety', () => {
    const memory = GAME_REGISTRY.find(g => g.id === 'memory');
    let s = memory.engine.create(789, { size: 4 });
    expect(s.currentPlayer).toBe(0);
    expect(s.flippedIndices.length).toBe(0);

    // Player 0 flips card 0
    let res = memory.engine.apply(s, { type: 'flip', index: 0 });
    let s1 = res.state || res;
    expect(s1.flippedIndices.length).toBe(1);

    // Find a card that does NOT match card 0
    const card0 = s1.cardMap.get(0);
    let mismatchIdx = 1;
    for (let i = 1; i < s1.deck.length; i++) {
      if (s1.cardMap.get(i).face !== card0.face) {
        mismatchIdx = i;
        break;
      }
    }

    // Player 0 flips mismatching card
    res = memory.engine.apply(s1, { type: 'flip', index: mismatchIdx });
    let s2 = res.state || res;
    expect(s2.flippedIndices.length).toBe(2);
    expect(s2.lockUntilMismatchResolved).toBe(true);

    // Bot safety: Bot should refuse to move while mismatch is locked
    const botMoveDuringLock = memory.bot.getMove(s2, 'medium');
    expect(botMoveDuringLock).toBeNull();

    // Self-healing: If player or timer triggers flip on next card, mismatch is resolved automatically
    res = memory.engine.apply(s2, { type: 'resolveMismatch' });
    let s3 = res.state || res;
    expect(s3.lockUntilMismatchResolved).toBe(false);
    expect(s3.flippedIndices.length).toBe(0);
    expect(s3.currentPlayer).toBe(1); // Turn switched to Player 1 / Bot!
  });
});
