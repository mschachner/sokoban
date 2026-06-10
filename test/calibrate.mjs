// Calibration + sanity harness for the generator/solver pipeline.
// Run: node test/calibrate.mjs [runsPerConfig]
import { generate, SIZES } from '../js/generator.js';
import { Game } from '../js/engine.js';

const runs = Number(process.argv[2] ?? 4);
const configs = [
  { difficulty: 'easy', size: 'm', boxes: 2 },
  { difficulty: 'easy', size: 'm', boxes: 3 },
  { difficulty: 'medium', size: 'm', boxes: 3 },
  { difficulty: 'medium', size: 'l', boxes: 4 },
  { difficulty: 'hard', size: 'l', boxes: 4 },
  { difficulty: 'hard', size: 'l', boxes: 5 },
  { difficulty: 'expert', size: 'xl', boxes: 5 },
  { difficulty: 'expert', size: 'xl', boxes: 6 },
];

function sanity(p) {
  const n = p.w * p.h;
  const occ = new Set();
  const checks = [
    [!p.walls[p.player], 'player on floor'],
    [p.boxes.every((b) => !p.walls[b]), 'boxes on floor'],
    [p.boxes.every((b) => (occ.has(b) ? false : (occ.add(b), true))), 'boxes distinct'],
    [!occ.has(p.player), 'player not on box'],
    [p.goals.length === p.boxes.length, 'goal count'],
    [p.boxes.every((b) => !p.goals.includes(b)), 'no box starts solved'],
    [p.walls.length === n, 'walls size'],
    [p.optimal.moves >= p.optimal.pushes && p.optimal.pushes > 0, 'optimal sane'],
  ];
  for (const [ok, name] of checks) if (!ok) throw new Error('sanity failed: ' + name);
  // engine smoke test: undo/redo round-trip
  const g = new Game(p);
  for (const d of ['up', 'left', 'down', 'right', 'up', 'right']) g.move(d);
  const m = g.moves;
  while (g.undo());
  if (g.moves !== 0) throw new Error('undo broken');
  while (g.redo());
  if (g.moves !== m) throw new Error('redo broken');
}

let failures = 0;
for (const cfg of configs) {
  const scores = [];
  const times = [];
  const ratings = {};
  let misses = 0;
  for (let i = 0; i < runs; i++) {
    const t0 = Date.now();
    const p = generate({ ...cfg, seed: (Date.now() ^ (i * 7919)) >>> 0 });
    const dt = Date.now() - t0;
    if (!p) {
      misses++;
      continue;
    }
    sanity(p);
    times.push(dt);
    scores.push(p.score);
    ratings[p.rating] = (ratings[p.rating] ?? 0) + 1;
    if (p.rating !== cfg.difficulty) failures++;
  }
  const avg = (a) => (a.length ? Math.round(a.reduce((x, y) => x + y, 0) / a.length) : '-');
  console.log(
    `${cfg.difficulty.padEnd(7)} ${SIZES[cfg.size].label.padEnd(11)} ${cfg.boxes} boxes | ` +
      `scores [${scores.join(', ')}] avg=${avg(scores)} | ` +
      `gen ms avg=${avg(times)} max=${Math.max(0, ...times)} | ` +
      `ratings ${JSON.stringify(ratings)}${misses ? ` | MISSES=${misses}` : ''}`
  );
}
console.log(failures === 0 ? 'all runs hit requested band' : `${failures} runs off-band (best-effort)`);
