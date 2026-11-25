// A tiny seeded random generator (mulberry32) so a ?seed=N run of the game
// always deals the same orders: replays and screenshots stay reproducible.
export function createRandom(seed) {
  let state = (seed >>> 0) || 0x9e3779b9;
  function next() {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
  function intBelow(n) {
    return Math.floor(next() * n);
  }
  /** Pick one entry of `items` with the matching `weights`. */
  function weighted(items, weights) {
    let total = 0;
    for (const w of weights) total += w;
    let roll = next() * total;
    for (let i = 0; i < items.length; i += 1) {
      roll -= weights[i];
      if (roll < 0) return items[i];
    }
    return items[items.length - 1];
  }
  return { next, intBelow, weighted };
}
