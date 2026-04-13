/**
 * @typedef {import('./solver.js').Clue} Clue
 * @typedef {{ id: string; name: string; size: number; grid: (Clue | null)[][] }} Puzzle
 */

/** @returns {(Clue | null)[][]} */
export function emptyGrid(size) {
  return Array.from({ length: size }, () => Array(size).fill(null));
}

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

/** @type {Puzzle[]} */
export const PUZZLES = [
  { id: "example", name: "Example (reference)", size: 5, grid: EXAMPLE },
  { id: "demo2", name: "Variation", size: 5, grid: DEMO_SECOND },
];

function shapeKind(w, h) {
  if (w === h) return "S";
  if (w > h) return "W";
  return "T";
}

function mulberry32(seed) {
  return function next() {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function randomInt(rng, max) {
  return Math.floor(rng() * max);
}

function shuffle(arr, rng) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = randomInt(rng, i + 1);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function partitionRectangles(size, rng) {
  const tiles = [{ top: 0, left: 0, w: size, h: size }];
  const targetTiles = Math.max(4, Math.min(size * 2 + 1, size * size));

  let guard = 0;
  while (tiles.length < targetTiles && guard < 2000) {
    guard += 1;
    const candidates = tiles
      .map((tile, index) => ({ tile, index }))
      .filter(({ tile }) => tile.w > 1 || tile.h > 1);
    if (candidates.length === 0) break;
    const { tile, index } = candidates[randomInt(rng, candidates.length)];
    const splitVertical = tile.w > 1 && (tile.h === 1 || rng() < 0.5);
    if (splitVertical) {
      const cut = 1 + randomInt(rng, tile.w - 1);
      tiles.splice(index, 1, { top: tile.top, left: tile.left, w: cut, h: tile.h }, { top: tile.top, left: tile.left + cut, w: tile.w - cut, h: tile.h });
    } else {
      const cut = 1 + randomInt(rng, tile.h - 1);
      tiles.splice(index, 1, { top: tile.top, left: tile.left, w: tile.w, h: cut }, { top: tile.top + cut, left: tile.left, w: tile.w, h: tile.h - cut });
    }
  }

  return tiles;
}

/**
 * Generates a solvable puzzle by first generating a rectangular tiling, then
 * choosing exactly one clue per rectangle.
 * @param {number} size
 * @returns {(Clue | null)[][]}
 */
export function generateRandomPuzzle(size) {
  const rng = mulberry32(Date.now() + size * 97);
  const grid = emptyGrid(size);
  const tiles = shuffle(partitionRectangles(size, rng), rng);

  for (const tile of tiles) {
    const clueRow = tile.top + randomInt(rng, tile.h);
    const clueCol = tile.left + randomInt(rng, tile.w);
    grid[clueRow][clueCol] = { kind: shapeKind(tile.w, tile.h), n: tile.w * tile.h };
  }

  return grid;
}
