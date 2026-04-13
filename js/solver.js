/**
 * @typedef {'S' | 'W' | 'T' | 'A'} ShapeKind
 * @typedef {{ kind: ShapeKind; n: number }} Clue
 * @typedef {{ top: number; left: number; w: number; h: number }} Rect
 */

/**
 * @param {ShapeKind} kind
 * @param {number} w
 * @param {number} h
 * @param {number} n
 */
function dimensionsMatch(kind, w, h, n) {
  if (w * h !== n) return false;
  if (kind === "S") return w === h;
  if (kind === "W") return w > h;
  if (kind === "T") return h > w;
  if (kind === "A") return true;
  return false;
}

/**
 * All rectangles for one clue at (cr,cc): shape + area fit, clue inside rect,
 * and every cell in the rect is either clueless or only this cell is the clue.
 * @param {(Clue | null)[][]} clues
 * @param {number} cr
 * @param {number} cc
 * @returns {Rect[]}
 */
export function placementsForClue(clues, cr, cc) {
  const rows = clues.length;
  const cols = clues[0].length;
  const clue = clues[cr][cc];
  if (!clue) return [];

  /** @type {Rect[]} */
  const out = [];
  for (let h = 1; h <= rows; h++) {
    for (let w = 1; w <= cols; w++) {
      if (!dimensionsMatch(clue.kind, w, h, clue.n)) continue;
      for (let top = 0; top <= rows - h; top++) {
        for (let left = 0; left <= cols - w; left++) {
          if (cr < top || cr >= top + h || cc < left || cc >= left + w) continue;
          let otherClues = 0;
          for (let r = top; r < top + h; r++) {
            for (let c = left; c < left + w; c++) {
              if (clues[r][c] && (r !== cr || c !== cc)) otherClues++;
            }
          }
          if (otherClues > 0) continue;
          out.push({ top, left, w, h });
        }
      }
    }
  }
  return out;
}

/**
 * @param {(Clue | null)[][]} clues
 * @returns {{ rects: Rect[] } | null}
 */
export function solvePatches(clues) {
  const rows = clues.length;
  const cols = clues[0].length;

  /** @type [number, number][] */
  const clueCells = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (clues[r][c]) clueCells.push([r, c]);
    }
  }

  const key = (r, c) => `${r},${c}`;
  /** @type Map<string, Rect[]> */
  const options = new Map();
  for (const [r, c] of clueCells) {
    options.set(key(r, c), placementsForClue(clues, r, c));
  }

  clueCells.sort((a, b) => (options.get(key(...a))?.length ?? 0) - (options.get(key(...b))?.length ?? 0));

  /** @type boolean[][] */
  const occ = Array.from({ length: rows }, () => Array(cols).fill(false));
  /** @type Rect[] */
  const rects = [];

  function canPlace(rect) {
    for (let r = rect.top; r < rect.top + rect.h; r++) {
      for (let c = rect.left; c < rect.left + rect.w; c++) {
        if (occ[r][c]) return false;
      }
    }
    return true;
  }

  function applyRect(rect) {
    for (let r = rect.top; r < rect.top + rect.h; r++) {
      for (let c = rect.left; c < rect.left + rect.w; c++) {
        occ[r][c] = true;
      }
    }
  }

  function unapplyRect(rect) {
    for (let r = rect.top; r < rect.top + rect.h; r++) {
      for (let c = rect.left; c < rect.left + rect.w; c++) {
        occ[r][c] = false;
      }
    }
  }

  function allFilled() {
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (!occ[r][c]) return false;
      }
    }
    return true;
  }

  function dfs(i) {
    if (i === clueCells.length) {
      return allFilled() ? { rects: [...rects] } : null;
    }
    const [cr, cc] = clueCells[i];
    const opts = options.get(key(cr, cc)) ?? [];
    for (const rect of opts) {
      if (!canPlace(rect)) continue;
      applyRect(rect);
      rects.push(rect);
      const sol = dfs(i + 1);
      if (sol) return sol;
      rects.pop();
      unapplyRect(rect);
    }
    return null;
  }

  return dfs(0);
}
