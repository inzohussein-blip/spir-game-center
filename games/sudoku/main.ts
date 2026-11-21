/** «سودوكو»: اختار خانة، بعدين اختار الرقم. الغلط يبين بالأحمر */
import { button, clear, COLORS, createGame, frame, hit, sdk, text, type Level } from '../../packages/spir-kit/index.ts';
import { makePuzzle, starsFor, type Grid, type Spec } from './logic.ts';

createGame((g) => {
  let level: Level = 'easy';
  let stage = 1;
  let spec: Spec = { n: 4, bw: 2, bh: 2, clues: [8, 6] };
  let given: Grid = [];
  let grid: Grid = [];
  let solution: Grid = [];
  let wrong = new Set<number>();
  let sel = -1;
  let mistakes = 0;
  let over = false;

  let cs = 40;
  let ox = 20;
  let oy = 110;
  const layout = () => {
    const board = Math.min(g.w - 28, g.h - 250);
    cs = board / spec.n;
    ox = (g.w - board) / 2;
    oy = Math.max(80, (g.h - board - 130) / 2);
  };
  const padKey = (v: number) => {
    const perRow = spec.n <= 6 ? spec.n : 5;
    const w = Math.min(56, (g.w - 32 - (perRow - 1) * 8) / perRow);
    const idx = v - 1;
    const row = Math.floor(idx / perRow);
    const col = idx % perRow;
    const rowCount = Math.min(perRow, spec.n - row * perRow);
    const total = rowCount * w + (rowCount - 1) * 8;
    return { x: g.w - (g.w - total) / 2 - (col + 1) * w - col * 8, y: oy + cs * spec.n + 24 + row * (w + 8), w, h: w, label: String(v) };
  };
  const eraseBtn = () => {
    const last = padKey(spec.n);
    return { x: g.w / 2 - 60, y: last.y + last.h + 12, w: 120, h: 38, label: 'امسح' };
  };
  const hud = () => sdk.hud(`المرحلة ${stage}`, `${mistakes} غلط`);

  const enter = async (v: number) => {
    if (sel < 0 || given[sel] || over) return;
    if (v === 0) {
      grid[sel] = 0;
      wrong.delete(sel);
      return;
    }
    grid[sel] = v;
    if (v !== solution[sel]) {
      wrong.add(sel);
      mistakes++;
      g.sound('bad');
      sdk.vibrate();
      hud();
    } else {
      wrong.delete(sel);
      g.sound('tap');
    }
    if (grid.every((x, i) => x === solution[i])) {
      over = true;
      g.sound('win');
      await g.wait(500);
      sdk.complete({ stars: starsFor(mistakes), score: mistakes, title: 'حليتها!', subtitle: mistakes ? `بـ ${mistakes} غلط` : 'بدون ولا غلط' });
    }
  };

  return {
    start(s) {
      level = s.level;
      stage = s.stage;
      const p = makePuzzle(level, stage);
      spec = p.spec;
      given = p.puzzle;
      grid = [...p.puzzle];
      solution = p.solution;
      wrong = new Set();
      sel = grid.indexOf(0);
      mistakes = 0;
      over = false;
      layout();
      hud();
    },
    down(p) {
      layout();
      const cx = Math.floor((p.x - ox) / cs);
      const cy = Math.floor((p.y - oy) / cs);
      if (cx >= 0 && cy >= 0 && cx < spec.n && cy < spec.n) {
        // العمود 0 على اليسار مثل أي سودوكو (الأرقام تتقرا بأي اتجاه)
        sel = cy * spec.n + cx;
        g.sound('tap');
        return;
      }
      for (let v = 1; v <= spec.n; v++) if (hit(padKey(v), p.x, p.y)) return void enter(v);
      if (hit(eraseBtn(), p.x, p.y)) void enter(0);
    },
    draw(c) {
      layout();
      clear(c, g.w, g.h);
      const n = spec.n;
      frame(c, ox - 6, oy - 6, cs * n + 12, cs * n + 12, 12, COLORS.navy);
      const sr = sel >= 0 ? Math.floor(sel / n) : -1;
      const sc = sel >= 0 ? sel % n : -1;
      const sameVal = sel >= 0 ? grid[sel] : 0;
      for (let i = 0; i < n * n; i++) {
        const r = Math.floor(i / n);
        const col = i % n;
        const x = ox + col * cs;
        const y = oy + r * cs;
        let bg: string = COLORS.card;
        if (r === sr || col === sc) bg = '#EEF0FF';
        if (sameVal && grid[i] === sameVal) bg = '#FFF6C2';
        if (i === sel) bg = COLORS.yellow;
        c.fillStyle = bg;
        c.fillRect(x + 0.5, y + 0.5, cs - 1, cs - 1);
        if (grid[i]) text(c, String(grid[i]), x + cs / 2, y + cs / 2 + 1, { size: cs * 0.5, weight: given[i] ? 700 : 600, color: wrong.has(i) ? COLORS.red : given[i] ? COLORS.navy : COLORS.royal });
      }
      // خطوط المربعات
      c.strokeStyle = COLORS.navy;
      c.lineWidth = 2.5;
      for (let k = 0; k <= n; k += spec.bw) {
        c.beginPath();
        c.moveTo(ox + k * cs, oy);
        c.lineTo(ox + k * cs, oy + n * cs);
        c.stroke();
      }
      for (let k = 0; k <= n; k += spec.bh) {
        c.beginPath();
        c.moveTo(ox, oy + k * cs);
        c.lineTo(ox + n * cs, oy + k * cs);
        c.stroke();
      }
      for (let v = 1; v <= n; v++) {
        const b = padKey(v);
        const left = n - grid.filter((x, i) => x === v && x === solution[i]).length;
        button(c, { ...b, primary: true, disabled: left === 0 });
      }
      button(c, eraseBtn());
      if (sel >= 0 && given[sel]) text(c, 'هذا الرقم ثابت — اختار خانة فارغة', g.w / 2, oy - 26, { size: 13, color: COLORS.muted, weight: 600 });
    },
  };
});
