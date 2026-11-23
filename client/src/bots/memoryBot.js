/**
 * Memory Bot — Simulates human memory with an LRU Cache (HashMap + DoublyLinkedList).
 * Difficulty sets cache capacity: Easy: 4, Medium: 8, Hard: 16.
 */

// DSA: LRU Cache combining HashMap for O(1) lookup and DoublyLinkedList for O(1) recency eviction.
import { HashMap, DoublyLinkedList } from '../dsa/structures.js';

class LRUCache {
  constructor(capacity) {
    this.capacity = capacity;
    this.map = new HashMap();
    this.list = new DoublyLinkedList();
    this.nodeMap = new Map(); // node reference map
  }

  get(face) {
    if (!this.map.has(face)) return null;
    return this.map.get(face);
  }

  set(face, index) {
    let indices = this.map.get(face) || [];
    if (!indices.includes(index)) {
      indices.push(index);
    }
    this.map.set(face, indices);

    // Eviction if exceeds capacity
    if (this.map.size > this.capacity) {
      const oldestFace = this.list.tail?.value;
      if (oldestFace) {
        this.list.popBack();
        this.map.delete(oldestFace);
      }
    }
    this.list.pushFront(face);
  }

  delete(face) {
    this.map.delete(face);
  }
}

export function createBotMemory(difficulty = 'medium') {
  const cap = difficulty === 'easy' ? 4 : difficulty === 'medium' ? 8 : 16;
  return new LRUCache(cap);
}

export function getMove(state, difficulty = 'medium', botMemory = null) {
  // If waiting for mismatch to resolve, do not generate a move
  if (state.lockUntilMismatchResolved) return null;

  const memory = botMemory || createBotMemory(difficulty);

  // Update bot's memory with whatever is currently visible
  for (let i = 0; i < state.deck.length; i++) {
    const card = state.cardMap.get(i);
    if (card && card.isFlipped && !card.isMatched) {
      memory.set(card.face, i);
    }
  }

  // 1. If one card is already flipped, see if we know where its match is
  if (state.flippedIndices.length === 1) {
    const firstIdx = state.flippedIndices[0];
    const firstCard = state.cardMap.get(firstIdx);
    const known = memory.get(firstCard.face);
    if (known) {
      const partner = known.find(idx => idx !== firstIdx);
      if (partner !== undefined) {
        const partnerCard = state.cardMap.get(partner);
        if (partnerCard && !partnerCard.isMatched) {
          return { type: 'flip', index: partner };
        }
      }
    }
  }

  // 2. If no card is flipped, see if we remember ANY matching pair
  if (state.flippedIndices.length === 0) {
    for (const [face, indices] of memory.map.entries()) {
      if (indices.length >= 2) {
        const c1 = state.cardMap.get(indices[0]);
        const c2 = state.cardMap.get(indices[1]);
        if (c1 && c2 && !c1.isMatched && !c2.isMatched) {
          return { type: 'flip', index: indices[0] };
        }
      }
    }
  }

  // 3. Fallback: pick a random unflipped, unmatched card
  const candidates = [];
  for (let i = 0; i < state.deck.length; i++) {
    const c = state.cardMap.get(i);
    if (c && !c.isFlipped && !c.isMatched) {
      candidates.push(i);
    }
  }

  if (candidates.length === 0) return { type: 'flip', index: 0 };
  const chosen = candidates[Math.floor(Math.random() * candidates.length)];
  return { type: 'flip', index: chosen };
}
