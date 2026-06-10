# sokoban.

A minimalist Sokoban with procedural puzzle generation, organic theming,
and Minesweeper-style high scores. No build step, no dependencies.

Built by Claude Fable 5.

## Run

Any static server works (ES modules need http://, not file://):

```sh
python3 -m http.server 8000     # or: npx serve
open http://localhost:8000
```

## How puzzles are made

1. An organic room is carved with a drunkard's walk; pillars are dropped
   into open areas (corners are what make Sokoban hard).
2. Boxes start *on* the goals and are pulled apart with a scored beam
   search. Pull-reachable states are always pushable back, so every
   puzzle is solvable by construction.
3. A move-optimal A* solver (push-distance heuristic, dead-square
   pruning) verifies the level and rates difficulty from the optimal
   solution: `pushes + 3·box-switches + 2·log2(search nodes)`.
4. Attempts repeat (in a Web Worker) until a candidate lands in the
   requested difficulty band, or the time budget expires and the closest
   candidate wins. The actual rating is shown as a chip in the HUD.

Typical generation times: easy/medium < 1s, hard < 5s, expert 5–15s.

## Keys

| key | action |
| --- | --- |
| arrows / `wasd` / `hjkl` | move |
| `z` / `u` (`cmd-z`) | undo |
| `y` / `shift-z` | redo |
| `r` | reset puzzle |
| `p` / `space` | pause (when timer is on) |
| `enter` | new puzzle |
| `t` / `g` / `?` | theme / scores / help |

## High scores

Kept per category (difficulty · size · boxes) in localStorage: best time
and best moves-vs-optimal, Minesweeper style.

## Extending the rules

`js/rules.js` defines a small ruleset interface (`tryMove`, `isSolved`).
Register a new entry in `RULESETS` and pass its id to `new Game(puzzle, id)`
to add Sokoban variants without touching the engine or renderer.

## Dev

```sh
node test/calibrate.mjs [runs]   # generator/solver calibration + sanity
```
