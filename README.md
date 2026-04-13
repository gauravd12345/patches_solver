# Patches Puzzle Solver

An algorithm and web UI that solves a Patches-style rectangle puzzle in real time.

The goal is to cover the entire grid with non-overlapping rectangular patches, where each patch:

- Matches one clue's shape type (`Square`, `Wide`, `Tall`, or `Any`)
- Matches that clue's exact area
- Contains exactly one clue cell

This project also includes:

- A **custom grid editor** (click-to-place clues)
- A **random solvable grid generator**
- A **grid size selector** (`4x4` to `8x8`)
- **Solve / Hint / Undo** controls

---

## How it works

This implementation models the puzzle as a **state-space search** and solves it using **DFS (Depth-First Search) backtracking**.

1. For each clue, the solver generates every valid rectangle placement that:
   - Fits inside the grid
   - Matches clue shape + area constraints
   - Contains the clue cell
   - Does not contain any other clue cell
2. Clues are ordered by most constrained first (fewest valid placements).
3. DFS tries placements recursively, marking occupied cells.
4. If a branch causes overlap or dead-end, it backtracks.
5. A solution is valid only when **all clues are placed** and the **entire grid is filled**.

DFS is a good fit here because solutions are complete tilings that appear at full search depth, and pruning + backtracking keeps the search practical for interactive puzzle sizes.

---

## Project structure

- `index.html` – app layout
- `styles.css` – responsive two-column UI styling
- `js/app.js` – UI behavior, editor interactions, solve/hint/undo flow
- `js/solver.js` – core DFS/backtracking solver
- `js/puzzles.js` – presets, empty grid helpers, random puzzle generation

---

## Run locally

You can open `index.html` directly in a browser, or serve the folder with any static server.

Example:

```bash
python3 -m http.server 8000
```

Then visit `http://localhost:8000`.

---

## Tech stack

- Frontend: `HTML`, `CSS`, `JavaScript` (vanilla, no framework)
- Runtime tooling: optional local static server (`Node`, `Python`, etc.)

---

## Notes

- Random generation creates a rectangular tiling first, then places one clue per tile, ensuring generated puzzles are solvable by construction.
- The app re-runs the solver after custom edits so you immediately see whether your clue layout is solvable.
