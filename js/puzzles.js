/**
 * @typedef {import('./solver.js').Clue} Clue
 */

/** 5×5 example matching the reference layout (one clue per patch). */
export const EXAMPLE = /** @type {(Clue | null)[][]} */ ([
  [{ kind: "W", n: 3 }, null, null, { kind: "S", n: 4 }, null],
  [{ kind: "T", n: 4 }, { kind: "T", n: 8 }, null, null, null],
  [null, null, null, { kind: "T", n: 6 }, null],
  [null, null, null, null, null],
  [null, null, null, null, null],
]);

/** Slightly mixed clue positions — still uniquely solvable with same tiling. */
export const DEMO_SECOND = /** @type {(Clue | null)[][]} */ ([
  [{ kind: "W", n: 3 }, null, null, null, { kind: "S", n: 4 }],
  [{ kind: "T", n: 4 }, null, { kind: "T", n: 8 }, null, null],
  [null, null, null, null, null],
  [null, null, null, null, null],
  [null, null, null, { kind: "T", n: 6 }, null],
]);

export const PUZZLES = [
  { id: "example", name: "Example (reference)", grid: EXAMPLE },
  { id: "demo2", name: "Variation", grid: DEMO_SECOND },
];
