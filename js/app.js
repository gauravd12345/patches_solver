import { PUZZLES } from "./puzzles.js";
import { solvePatches } from "./solver.js";

const ROWS = 5;
const COLS = 5;

const PATCH_COLORS = ["#e85d4c", "#e6b422", "#8b5cf6", "#22c55e", "#14b8a6", "#f97316", "#6366f1"];

const gridEl = document.getElementById("grid");
const messageEl = document.getElementById("message");
const puzzleSelect = document.getElementById("puzzle-select");
const btnSolve = document.getElementById("btn-solve");
const btnHint = document.getElementById("btn-hint");
const btnUndo = document.getElementById("btn-undo");

/** @type {(Clue | null)[][]} */
let currentClues = structuredClone(PUZZLES[0].grid);
/** @type {import('./solver.js').Rect[] | null} */
let fullSolution = null;
/** @type {number[][]} */
let assignment = freshAssignment();
/** @type {import('./solver.js').Rect[]} */
let appliedStack = [];

/** @typedef {import('./solver.js').Clue} Clue */

function freshAssignment() {
  return Array.from({ length: ROWS }, () => Array(COLS).fill(-1));
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
  gridEl.innerHTML = "";
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const cell = document.createElement("div");
      cell.className = "cell";
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

function initSelect() {
  PUZZLES.forEach((p, i) => {
    const o = document.createElement("option");
    o.value = String(i);
    o.textContent = p.name;
    puzzleSelect.appendChild(o);
  });
  puzzleSelect.addEventListener("change", () => {
    const i = +puzzleSelect.value;
    currentClues = structuredClone(PUZZLES[i].grid);
    recomputeSolution();
  });
}

btnSolve.addEventListener("click", doSolveAll);
btnHint.addEventListener("click", doHint);
btnUndo.addEventListener("click", doUndo);

initSelect();
recomputeSolution();
