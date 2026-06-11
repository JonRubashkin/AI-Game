// rng.js — one deterministic PRNG (mulberry32). ALL randomness flows through this.
// State is a single 32-bit integer so it can be saved/restored in game state, giving
// identical replays for identical seeds + identical choices.

export function hashSeed(input) {
  // Accept a number or a string seed; produce a 32-bit integer.
  if (typeof input === 'number' && Number.isFinite(input)) return input >>> 0;
  const str = String(input);
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return (h >>> 0) || 1;
}

// Create an RNG instance from an integer state. Tracks call count for debug.
export function createRng(stateInt) {
  let a = stateInt >>> 0;
  let calls = 0;
  const next = () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    calls++;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const rng = {
    next,
    float: (min, max) => min + next() * (max - min),
    int: (min, max) => Math.floor(min + next() * (max - min + 1)),
    chance: (p) => next() < p,
    pick: (arr) => arr[Math.floor(next() * arr.length)],
    // Fisher-Yates using this generator (returns a new array)
    shuffle: (arr) => {
      const out = arr.slice();
      for (let i = out.length - 1; i > 0; i--) {
        const j = Math.floor(next() * (i + 1));
        [out[i], out[j]] = [out[j], out[i]];
      }
      return out;
    },
    // weighted pick: items is [{...,weight}] -> returns chosen item
    weighted: (items, weightFn = (x) => x.weight) => {
      const total = items.reduce((s, x) => s + Math.max(0, weightFn(x)), 0);
      if (total <= 0) return items[0];
      let r = next() * total;
      for (const it of items) {
        r -= Math.max(0, weightFn(it));
        if (r <= 0) return it;
      }
      return items[items.length - 1];
    },
    getState: () => a >>> 0,
    getCalls: () => calls,
  };
  return rng;
}

export function randomSeed() {
  return Math.floor(Math.random() * 0xffffffff) >>> 0;
}
