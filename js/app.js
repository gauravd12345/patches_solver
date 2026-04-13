import { PUZZLES, emptyGrid, generateRandomPuzzle } from "./puzzles.js";
import { solvePatches } from "./solver.js";

const PATCH_COLORS = ["#e85d4c", "#e6b422", "#8b5cf6", "#22c55e", "#14b8a6", "#f97316", "#6366f1"];

const gridEl = document.getElementById("grid");
const messageEl = document.getElementById("message");
const puzzleSelect = document.getElementById("puzzle-select");
const sizeSelect = document.getElementById("size-select");
const btnSolve = document.getElementById("btn-solve");
const btnHint = document.getElementById("btn-hint");
const btnUndo = document.getElementById("btn-undo");
const btnRandom = document.getElementById("btn-random");
const btnClear = document.getElementById("btn-clear");
const kindSelect = document.getElementById("kind-select");
const sizeInput = document.getElementById("size-input");
const btnErase = document.getElementById("btn-erase");

/** @type {(Clue | null)[][]} */
let currentClues = structuredClone(PUZZLES[0].grid);
let currentSize = currentClues.length;
/** @type {import('./solver.js').Rect[] | null} */
let fullSolution = null;
/** @type {number[][]} */
let assignment = freshAssignment();
/** @type {import('./solver.js').Rect[]} */
let appliedStack = [];
let eraseMode = false;

/** @typedef {import('./solver.js').Clue} Clue */

function freshAssignment() {
  return Array.from({ length: currentSize }, () => Array(currentSize).fill(-1));
}

function setMessage(text, isError = false) {
  messageEl.textContent = text;
  messageEl.classList.toggle("error", isError);
}

function shapeLabel(kind) {
  if (kind === "S") return "Sq";
  if (kind === "W") return "Wide";
  if (kind === "T") return "Tall";
  return "Any";
}

function recomputeSolution() {
  fullSolution = solvePatches(currentClues);
  appliedStack = [];
  assignment = freshAssignment();
  render();
  if (!fullSolution) {
    setMessage("No solution for this clue layout.", true);
    btnSolve.disabled = true;
    btnHint.disabled = true;
    btnUndo.disabled = true;
  } else {
    setMessage("");
    btnSolve.disabled = false;
    btnHint.disabled = false;
    btnUndo.disabled = true;
  }
}

function render() {
  gridEl.style.gridTemplateColumns = `repeat(${currentSize}, 1fr)`;
  gridEl.style.gridTemplateRows = `repeat(${currentSize}, 1fr)`;
  gridEl.innerHTML = "";
  for (let r = 0; r < currentSize; r++) {
    for (let c = 0; c < currentSize; c++) {
      const cell = document.createElement("div");
      cell.className = "cell";
      cell.dataset.r = String(r);
      cell.dataset.c = String(c);
      const pid = assignment[r][c];
      if (pid >= 0) {
        const fill = document.createElement("div");
        fill.className = "fill";
        fill.style.backgroundColor = PATCH_COLORS[pid % PATCH_COLORS.length];
        cell.appendChild(fill);
      }
      const clue = currentClues[r][c];
      if (clue) {
        const wrap = document.createElement("div");
        wrap.className = "clue-wrap";
        const sl = document.createElement("span");
        sl.className = "shape-label";
        sl.textContent = shapeLabel(clue.kind);
        const num = document.createElement("span");
        num.className = "n";
        num.textContent = String(clue.n);
        wrap.append(sl, num);
        cell.appendChild(wrap);
      }
      gridEl.appendChild(cell);
    }
  }
  const done = appliedStack.length > 0 && appliedStack.length === (fullSolution?.rects.length ?? 0);
  btnUndo.disabled = appliedStack.length === 0;
  btnHint.disabled = !fullSolution || done;
}

function applyRect(rect, patchIndex) {
  for (let r = rect.top; r < rect.top + rect.h; r++) {
    for (let c = rect.left; c < rect.left + rect.w; c++) {
      assignment[r][c] = patchIndex;
    }
  }
}

function unapplyRect(rect) {
  for (let r = rect.top; r < rect.top + rect.h; r++) {
    for (let c = rect.left; c < rect.left + rect.w; c++) {
      assignment[r][c] = -1;
    }
  }
}

function doSolveAll() {
  if (!fullSolution) return;
  assignment = freshApplyAll(fullSolution.rects);
  appliedStack = fullSolution.rects.map((r, i) => r);
  render();
  setMessage("Solved.");
}

function freshApplyAll(rects) {
  const a = freshAssignment();
  rects.forEach((rect, i) => {
    for (let r = rect.top; r < rect.top + rect.h; r++) {
      for (let c = rect.left; c < rect.left + rect.w; c++) {
        a[r][c] = i;
      }
    }
  });
  return a;
}

function doHint() {
  if (!fullSolution) return;
  const next = fullSolution.rects[appliedStack.length];
  if (!next) return;
  const idx = appliedStack.length;
  applyRect(next, idx);
  appliedStack.push(next);
  render();
  if (appliedStack.length === fullSolution.rects.length) {
    setMessage("Solved.");
  } else {
    setMessage(`Placed patch ${appliedStack.length} of ${fullSolution.rects.length}.`);
  }
}

function doUndo() {
  if (appliedStack.length === 0) return;
  const last = appliedStack.pop();
  if (last) unapplyRect(last);
  render();
  setMessage(appliedStack.length ? `${appliedStack.length} patch(es) on the board.` : "");
}

function cloneGrid(grid) {
  return grid.map((row) => row.map((cell) => (cell ? { ...cell } : null)));
}

function maxAreaForSize(size) {
  return size * size;
}

function syncAreaInput() {
  sizeInput.max = String(maxAreaForSize(currentSize));
  if (+sizeInput.value > maxAreaForSize(currentSize)) {
    sizeInput.value = String(maxAreaForSize(currentSize));
  }
}

function loadGrid(grid, message = "") {
  currentClues = cloneGrid(grid);
  currentSize = currentClues.length;
  sizeSelect.value = String(currentSize);
  syncAreaInput();
  recomputeSolution();
  if (message) {
    setMessage(message, false);
  }
}

function refreshPuzzleSelect() {
  puzzleSelect.innerHTML = "";
  const matching = PUZZLES.filter((p) => p.size === currentSize);
  for (const [i, p] of matching.entries()) {
    const o = document.createElement("option");
    o.value = String(i);
    o.textContent = p.name;
    puzzleSelect.appendChild(o);
  }
  const custom = document.createElement("option");
  custom.value = "custom";
  custom.textContent = "Custom";
  puzzleSelect.appendChild(custom);
}

function loadPresetByIndex(index) {
  const matching = PUZZLES.filter((p) => p.size === currentSize);
  const puzzle = matching[index];
  if (!puzzle) {
    loadGrid(emptyGrid(currentSize), "Custom grid ready.");
    puzzleSelect.value = "custom";
    return;
  }
  loadGrid(puzzle.grid);
}

function clearClues() {
  loadGrid(emptyGrid(currentSize), "Custom grid ready.");
  puzzleSelect.value = "custom";
}

function makeRandomGrid() {
  for (let attempt = 0; attempt < 30; attempt++) {
    const grid = generateRandomPuzzle(currentSize);
    if (solvePatches(grid)) {
      loadGrid(grid, "Random solvable grid generated.");
      puzzleSelect.value = "custom";
      return;
    }
  }
  setMessage("Could not generate a solvable random grid right now. Try again.", true);
}

function applyEditorToCell(r, c) {
  if (eraseMode) {
    currentClues[r][c] = null;
  } else {
    const area = Math.max(1, Math.min(maxAreaForSize(currentSize), Number(sizeInput.value) || 1));
    sizeInput.value = String(area);
    currentClues[r][c] = { kind: kindSelect.value, n: area };
  }
  puzzleSelect.value = "custom";
  recomputeSolution();
  if (!fullSolution) {
    setMessage("Clue updated, but this grid currently has no solution.", true);
  } else {
    setMessage("Custom grid updated.");
  }
}

function initSelects() {
  currentSize = Number(sizeSelect.value);
  refreshPuzzleSelect();
  puzzleSelect.addEventListener("change", () => {
    if (puzzleSelect.value === "custom") {
      setMessage("Custom editing mode.");
      return;
    }
    loadPresetByIndex(+puzzleSelect.value);
  });
  sizeSelect.addEventListener("change", () => {
    currentSize = Number(sizeSelect.value);
    refreshPuzzleSelect();
    clearClues();
  });
}

gridEl.addEventListener("click", (event) => {
  const cell = event.target.closest(".cell");
  if (!cell) return;
  applyEditorToCell(+cell.dataset.r, +cell.dataset.c);
});

btnSolve.addEventListener("click", doSolveAll);
btnHint.addEventListener("click", doHint);
btnUndo.addEventListener("click", doUndo);
btnRandom.addEventListener("click", makeRandomGrid);
btnClear.addEventListener("click", clearClues);
btnErase.addEventListener("click", () => {
  eraseMode = !eraseMode;
  btnErase.classList.toggle("active", eraseMode);
  setMessage(eraseMode ? "Erase mode enabled." : "Erase mode disabled.");
});

initSelects();
syncAreaInput();
loadPresetByIndex(0);
