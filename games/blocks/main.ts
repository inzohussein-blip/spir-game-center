/** «بلوكات الشبكة»: اسحب القطع للشبكة، وكل صف أو عمود يتعبّى ينمسح */
import { clear, COLORS, createGame, ease, frame, rng, rrect, sdk, text, type Level, type Point } from '../../packages/spir-kit/index.ts';
import { canPlace, emptyGrid, fitsAnywhere, place, randomPiece, SIZE, STARS, starsFor, type Grid, type Piece } from './logic.ts';

const PALETTE = [COLORS.orange, COLORS.pink, COLORS.green, COLORS.violet, COLORS.teal, COLORS.yellow];

createGame((g) => {
  let grid: Grid = emptyGrid();
  let tray: (Piece | null)[] = [];
  let score = 0;
  let level: Level = 'easy';
  let rand = rng(1).next;
  let over = false;
  let drag: { i: number; at: Point; grab: Point } | null = null;
  const fade = new Map<number, { color: number; t: number }>();

  let cs = 38;
  let ox = 20;
  let oy = 110;
  let trayY = 500;
  const layout = () => {
    const board = Math.min(g.w - 32, g.h - 260);
    cs = board / SIZE;
    ox = (g.w - board) / 2;
    oy = Math.max(80, (g.h - board - 150) / 2 + 20);
    trayY = oy + board + 34;
  };
  const traySlot = (i: number) => ({ x: g.w - (i + 1) * (g.w / 3) + g.w / 6, y: trayY + 50 });
  const dims = (p: Piece) => ({ w: Math.max(...p.cells.map((c) => c[0])) + 1, h: Math.max(...p.cells.map((c) => c[1])) + 1 });

  const hud = () => sdk.hud(`الهدف ${STARS[level][2]}`, `${score} نقطة`);

  const refill = () => {
    if (tray.every((p) => !p)) tray = [0, 1, 2].map(() => randomPiece(level, rand));
  };

  const checkEnd = async () => {
    const left = tray.filter((p): p is Piece => !!p);
    if (left.some((p) => fitsAnywhere(grid, p))) return;
    over = true;
    await g.wait(600);
    const stars = starsFor(level, score);
    if (stars > 0) {
      g.sound('win');
      sdk.complete({ stars, score, title: 'ما بقى مكان!', subtitle: `جمعت ${score} نقطة` });
    } else {
      g.sound('lose');
      sdk.over({ score, title: 'ما بقى مكان', subtitle: `جمعت ${score} — حاول تخلي مكان للقطع الكبيرة` });
    }
  };

  /** مكان القطعة بالشبكة من مكان الإصبع (القطعة مرسومة فوق الإصبع شوية) */
  const cellFor = (d: { i: number; at: Point; grab: Point }) => {
    const p = tray[d.i];
    if (!p) return null;
    const { w, h } = dims(p);
    const left = d.at.x - (w * cs) / 2;
    const top = d.at.y - h * cs - 40;
    return { x: Math.round((left - ox) / cs), y: Math.round((top - oy) / cs) };
  };

  return {
    start(s) {
      level = s.level;
      rand = rng(s.stage * 6151 + (Date.now() % 1009)).next;
      grid = emptyGrid();
      tray = [null, null, null];
      refill();
      score = 0;
      over = false;
      drag = null;
      layout();
      hud();
    },
    down(p) {
      if (over) return;
      for (let i = 0; i < 3; i++) {
        const sl = traySlot(i);
        if (tray[i] && Math.abs(p.x - sl.x) < g.w / 6 && Math.abs(p.y - sl.y) < 60) {
          drag = { i, at: p, grab: p };
          g.sound('tap');
        }
      }
    },
    move(p) {
      if (drag) drag.at = p;
    },
    up() {
      if (!drag) return;
      const d = drag;
      drag = null;
      const piece = tray[d.i];
      const cell = cellFor(d);
      if (!piece || !cell || !canPlace(grid, piece, cell.x, cell.y)) {
        g.sound('bad');
        return;
      }
      const r = place(grid, piece, cell.x, cell.y);
      tray[d.i] = null;
      score += r.score;
      if (r.lines) {
        g.sound('win');
        sdk.vibrate();
        // نرسم الخانات الممسوحة تختفي
        const before = [...grid];
        for (const [dx, dy] of piece.cells) before[(cell.y + dy) * SIZE + cell.x + dx] = piece.color;
        for (const i of r.cleared) fade.set(i, { color: before[i], t: 0 });
        void g.anim(300, (t) => fade.forEach((f) => (f.t = t)), ease.linear).then(() => fade.clear());
      } else g.sound('move');
      grid = r.grid;
      refill();
      hud();
      void checkEnd();
    },
    draw(c) {
      layout();
      clear(c, g.w, g.h);
      frame(c, ox - 6, oy - 6, cs * SIZE + 12, cs * SIZE + 12, 14);
      const ghost = drag ? cellFor(drag) : null;
      const dp = drag ? tray[drag.i] : null;
      const ok = !!(dp && ghost && canPlace(grid, dp, ghost.x, ghost.y));
      for (let i = 0; i < SIZE * SIZE; i++) {
        const x = ox + (i % SIZE) * cs;
        const y = oy + Math.floor(i / SIZE) * cs;
        const v = grid[i];
        const f = fade.get(i);
        rrect(c, x + 2, y + 2, cs - 4, cs - 4, 6);
        if (f !== undefined) {
          c.globalAlpha = 1 - f.t;
          c.fillStyle = PALETTE[f.color];
          c.fill();
          c.globalAlpha = 1;
        } else {
          c.fillStyle = v >= 0 ? PALETTE[v] : 'rgba(255,255,255,0.12)';
          c.fill();
        }
      }
      if (dp && ghost && ok) {
        for (const [dx, dy] of dp.cells) {
          rrect(c, ox + (ghost.x + dx) * cs + 2, oy + (ghost.y + dy) * cs + 2, cs - 4, cs - 4, 6);
          c.fillStyle = 'rgba(255,214,10,0.55)';
          c.fill();
        }
      }
      // القطع تحت
      tray.forEach((p, i) => {
        if (!p || (drag && drag.i === i)) return;
        const { w, h } = dims(p);
        const s = Math.min(cs * 0.55, 90 / Math.max(w, h));
        const sl = traySlot(i);
        const fits = fitsAnywhere(grid, p);
        c.globalAlpha = fits ? 1 : 0.35;
        for (const [dx, dy] of p.cells) {
          rrect(c, sl.x - (w * s) / 2 + dx * s + 1, sl.y - (h * s) / 2 + dy * s + 1, s - 2, s - 2, 4);
          c.fillStyle = PALETTE[p.color];
          c.fill();
        }
        c.globalAlpha = 1;
      });
      if (drag && dp) {
        const { w, h } = dims(dp);
        for (const [dx, dy] of dp.cells) {
          rrect(c, drag.at.x - (w * cs) / 2 + dx * cs + 2, drag.at.y - h * cs - 40 + dy * cs + 2, cs - 4, cs - 4, 6);
          c.fillStyle = PALETTE[dp.color];
          c.fill();
        }
      }
      if (!drag && score === 0) text(c, 'اسحب القطع للشبكة', g.w / 2, oy - 30, { size: 15, color: COLORS.muted, weight: 600 });
    },
  };
});
