// A small seeded random number generator (mulberry32): the same seed gives the
// same escape, which is what makes the screenshot scenes repeatable and the
// daily run fair. Everything random in the world comes through one of these.

export function createRandom(seed) {
  let a = seed | 0;
  return function random() {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** A whole number from min to max, inclusive, from `random`. */
export function pickInt(random, min, max) {
  return min + Math.floor(random() * (max - min + 1));
}

/** A number between min (inclusive) and max (exclusive), from `random`. */
export function pickFloat(random, min, max) {
  return min + random() * (max - min);
}

/** One entry of `list`, picked by `random`. */
export function pickOne(random, list) {
  return list[Math.floor(random() * list.length)];
}
