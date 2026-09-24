/** 32-bit FNV-1a hash of a string, used to turn a question id into a PRNG seed. */
function fnv1a(value: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < value.length; i++) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash;
}

/** mulberry32: a tiny seeded PRNG returning floats in [0, 1). */
function mulberry32(seed: number): () => number {
  let state = seed;
  return (): number => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * The options in a stable shuffled order derived from `seed` (the question id): a Fisher–Yates
 * shuffle driven by mulberry32 over the FNV-1a hash of the seed. Pure and deterministic, so the
 * same question always shows the same order; the input array is never mutated.
 */
export function orderOptions<T extends { id: string }>(options: T[], seed: string): T[] {
  const ordered = [...options];
  const random = mulberry32(fnv1a(seed));
  for (let i = ordered.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [ordered[i], ordered[j]] = [ordered[j], ordered[i]];
  }
  return ordered;
}
