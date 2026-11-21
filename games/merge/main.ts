/** «دمج الأرقام»: اسحب بأي اتجاه، الأرقام المتشابهة تندمج. وصل للهدف حسب الصعوبة */
import { clear, COLORS, createGame, ease, frame, rng, rrect, sdk, swipeDir, text, type Level, type Point } from '../../packages/spir-kit/index.ts';
import { canMove, move, SIZE, spawn, starsFor, TARGET, type Grid } from './logic.ts';

/** ألوان المربعات حسب الرقم */
const TILE: Record<number, [string, string]> = {
  2: ['#FFFFFF', COLORS.navy], 4: ['#E3E6FF', COLORS.navy], 8: ['#FFD60A', COLORS.navy], 16: ['#F7A928', COLORS.navy],
  32: ['#E8590C', '#FFFFFF'], 64: ['#D92D20', '#FFFFFF'], 128: ['#E0398B', '#FFFFFF'], 256: ['#6B3FD6', '#FFFFFF'],
  512: ['#1A23C9', '#FFFFFF'], 1024: ['#0F9B8E', '#FFFFFF'], 2048: ['#1C8B4A', '#FFFFFF'],
};

createGame((g) => {
  let grid: Grid = new Array(SIZE * SIZE).fill(0);
  let score = 0;
  let moves = 0;
  let level: Level = 'easy';
  let rand = rng(1).next;
  let busy = false;
  let over = false;
  let start: Point | null = null;
  const pop = new Map<number, number>();

  let size = 320;
  let ox = 20;
  let oy = 140;
  const layout = () => {
    size = Math.min(g.w - 32, g.h - 200);
    ox = (g.w - size) / 2;
    oy = Math.max(110, (g.h - size) / 2);
  };
  const max = () => Math.max(...grid);
  const hud = () => sdk.hud(`الهدف ${TARGET[level]}`, `${score} نقطة`);

  const animPop = (i: number) => void g.anim(200, (t) => pop.set(i, t), ease.back).then(() => pop.delete(i));

  const finish = async (reached: boolean) => {
    over = true;
    await g.wait(500);
    const stars = starsFor(level, max());
    if (reached) {
      g.sound('win');
      sdk.complete({ stars: 3, score, moves, title: `وصلت ${TARGET[level]}!`, subtitle: `${score} نقطة بـ ${moves} حركة` });
    } else if (stars > 0) {
      g.sound('ok');
      sdk.complete({ stars, score, moves, title: 'انسدت اللوحة', subtitle: `أكبر رقم ${max()} · ${score} نقطة` });
    } else {
      g.sound('lose');
      sdk.over({ score, title: 'انسدت اللوحة', subtitle: `أكبر رقم ${max()} — حاول تجمع بزاوية وحدة` });
    }
  };

  const doMove = async (dir: 'up' | 'down' | 'left' | 'right') => {
    if (busy || over) return;
    const r = move(grid, dir);
    if (!r.moved) return;
    busy = true;
    grid = r.grid;
    score += r.score;
    moves++;
    g.sound(r.merged.length ? 'ok' : 'move');
    r.merged.forEach(animPop);
    const sp = spawn(grid, rand);
    if (sp) {
      grid = sp.grid;
      animPop(sp.at);
    }
    hud();
    await g.wait(90);
    busy = false;
    if (max() >= TARGET[level]) await finish(true);
    else if (!canMove(grid)) await finish(false);
  };

  return {
    start(s) {
      level = s.level;
      rand = rng(s.stage * 4099 + Date.now() % 997).next;
      grid = new Array(SIZE * SIZE).fill(0);
      for (let k = 0; k < 2; k++) grid = spawn(grid, rand)?.grid ?? grid;
      score = 0;
      moves = 0;
      over = false;
      busy = false;
      layout();
      hud();
    },
    down: (p) => (start = p),
    up(p) {
      if (!start) return;
      const d = swipeDir(start, p, 24);
      start = null;
      if (d) void doMove(d);
    },
    draw(c) {
      layout();
      clear(c, g.w, g.h);
      text(c, `اسحب حتى تجمع الأرقام — وصل ${TARGET[level]}`, g.w / 2, oy - 36, { size: 15, color: COLORS.muted, weight: 600 });
      frame(c, ox - 8, oy - 8, size + 16, size + 16, 18);
      const gap = 8;
      const cs = (size - gap * (SIZE - 1)) / SIZE;
      for (let i = 0; i < SIZE * SIZE; i++) {
        const x = ox + (i % SIZE) * (cs + gap);
        const y = oy + Math.floor(i / SIZE) * (cs + gap);
        const v = grid[i];
        if (!v) {
          rrect(c, x, y, cs, cs, 10);
          c.fillStyle = 'rgba(255,255,255,0.14)';
          c.fill();
          continue;
        }
        const k = 0.8 + 0.2 * (pop.get(i) ?? 1);
        const w = cs * k;
        const [bg, fg] = TILE[v] ?? [COLORS.navy, COLORS.yellow];
        rrect(c, x + (cs - w) / 2, y + (cs - w) / 2, w, w, 10);
        c.fillStyle = bg;
        c.fill();
        const fs = v < 100 ? cs * 0.42 : v < 1000 ? cs * 0.34 : cs * 0.27;
        text(c, String(v), x + cs / 2, y + cs / 2 + 2, { size: fs, color: fg, weight: 700 });
      }
    },
  };
});
