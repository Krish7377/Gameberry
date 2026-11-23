// Small Mulberry32 generator. Keep the state explicit so seeded boards replay exactly.
export function createRandom(seed = 1) {
  let state = Number(seed) >>> 0;
  return {
    next() {
      state += 0x6d2b79f5;
      let t = state;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    },
    int(max) { return Math.floor(this.next() * max); },
    getState() { return state >>> 0; },
    setState(value) { state = Number(value) >>> 0; },
  };
}

export function shuffle(items, random) {
  const result = [...items];
  // DSA: Fisher–Yates gives every deck permutation an equal chance in O(n).
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = random.int(i + 1);
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
