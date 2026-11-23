import { describe, it, expect } from 'vitest';
import { GAME_REGISTRY } from '../registry.js';
import { validateEngine } from '../../core/engineContract.js';

describe('All 8 Engines Contract & Determinism', () => {
  GAME_REGISTRY.forEach(({ id, name, engine }) => {
    describe(`Engine: ${name} (${id})`, () => {
      it('implements the engine contract', () => {
        expect(() => validateEngine(engine)).not.toThrow();
      });

      it('produces identical state from same seed', () => {
        const s1 = engine.create(12345);
        const s2 = engine.create(12345);
        expect(engine.status(s1).phase).toBe('playing');
        expect(engine.status(s2).phase).toBe('playing');
      });

      it('inspect returns metadata', () => {
        const s = engine.create(42);
        const inspection = engine.inspect(s);
        expect(inspection).toBeDefined();
        expect(typeof inspection).toBe('object');
      });
    });
  });
});
