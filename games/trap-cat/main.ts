/** «حاصر البزون»: الرسم واللمس — المنطق بـ logic.ts */
import { catHead, COLORS, createGame, ease, rng, sdk, text, type Level, type Point } from '../../packages/spir-kit/index.ts';
import { catMove, makeBoard, neighbors, starsFor, xy, type Board } from './logic.ts';

createGame((g) => {
  let board: Board = makeBoard('easy', 1);
  let level: Level = 'easy';
  let stage = 1;
  let moves = 0;
  let busy = false;
  let over = false;
  let rand = rng(1).next;
  // مكان البزون المرسوم (يتحرك بنعومة) وحالته
  let catPos = { x: 0, y: 0 };
  let catScale = 1;
  let catAlpha = 1;
  let mood: 'normal' | 'scared' | 'sleepy' = 'normal';
  const pops = new Map<number, number>();
  let message = 'سدّ الطريق قبل ما يهرب البزون';

  // هندسة اللوحة
  let cell = 30;
  let r = 13;
  let top = 100;
  const left = 14;
  const layout = () => {
    cell = (g.w - left * 2) / (board.n + 0.5);
    r = cell * 0.44;
    const rowH = cell * 0.88;
    const boardH = rowH * (board.n - 1) + r * 2;
    top = Math.max(70, (g.h - boardH) / 2 + 10) + r;
  };
  const center = (i: number) => {
    const { x, y } = xy(board.n, i);
    return { x: left + r + x * cell + (y % 2 ? cell / 2 : 0), y: top + y * cell * 0.88 };
  };

  const hud = () => sdk.hud(`المرحلة ${stage}`, `${moves} حركة`);

  const finishWin = async () => {
    over = true;
    mood = 'sleepy';
    g.sound('win');
    sdk.vibrate();
    message = 'حاصرته! البزون استسلم';
    await g.wait(900);
    sdk.complete({ stars: starsFor(level, moves), score: moves, moves, title: 'حاصرته!', subtitle: `خلصت المرحلة ${stage} بـ ${moves} حركة` });
  };

  const finishLose = async (from: { x: number; y: number }) => {
    over = true;
    mood = 'normal';
    g.sound('meow');
    message = 'هرب البزون!';
    // يطلع برا اللوحة باتجاه الحافة
    const dx = from.x < g.w / 2 ? -1 : 1;
    const start = { ...catPos };
    await g.anim(500, (t) => {
      catPos = { x: start.x + dx * 120 * t, y: start.y - 40 * Math.sin(t * Math.PI) };
      catAlpha = 1 - t;
    });
    await g.wait(300);
    sdk.over({ score: moves, title: 'هرب البزون!', subtitle: 'جرّب تسد الطريق من وكت' });
  };

  const catTurn = async () => {
    const m = catMove(board, level, rand);
    if (m.kind === 'trapped') return finishWin();
    if (m.kind === 'escape') return finishLose(center(board.cat));
    const from = center(board.cat);
    const to = center(m.to);
    board.cat = m.to;
    mood = neighbors(board.n, m.to).filter((i) => !board.blocked[i]).length <= 2 ? 'scared' : 'normal';
    await g.anim(220, (t) => {
      catPos = { x: from.x + (to.x - from.x) * t, y: from.y + (to.y - from.y) * t - Math.sin(t * Math.PI) * 10 };
    }, ease.inOut);
    // بعد حركته: إذا انحصر هسه نفوز مباشرة
    const after = catMove(board, level, () => 0.99);
    if (after.kind === 'trapped') await finishWin();
  };

  const tap = async (p: Point) => {
    if (busy || over) return;
    let hitI = -1;
    for (let i = 0; i < board.n * board.n; i++) {
      const c = center(i);
      if ((c.x - p.x) ** 2 + (c.y - p.y) ** 2 <= (r + 3) ** 2) hitI = i;
    }
    if (hitI < 0 || board.blocked[hitI] || hitI === board.cat) {
      if (hitI === board.cat) g.sound('meow');
      return;
    }
    busy = true;
    board.blocked[hitI] = true;
    moves++;
    hud();
    g.sound('tap');
    void g.anim(260, (t) => pops.set(hitI, t), ease.back).then(() => pops.delete(hitI));
    message = '';
    await g.wait(120);
    await catTurn();
    busy = false;
  };

  return {
    start(s) {
      level = s.level;
      stage = s.stage;
      board = makeBoard(level, stage);
      rand = rng(stage * 31 + 7).next;
      moves = 0;
      busy = false;
      over = false;
      mood = 'normal';
      catAlpha = 1;
      message = level === 'easy' ? 'اضغط الدوائر حتى تسد الطريق' : 'سدّ الطريق قبل ما يهرب البزون';
      layout();
      catPos = center(board.cat);
      catScale = 0;
      void g.anim(400, (t) => (catScale = t), ease.back);
      hud();
    },
    down: (p) => void tap(p),
    draw(c) {
      layout();
      c.fillStyle = COLORS.bg;
      c.fillRect(0, 0, g.w, g.h);
      if (message) text(c, message, g.w / 2, top - r - 34, { size: 15, color: COLORS.muted, weight: 600 });
      for (let i = 0; i < board.n * board.n; i++) {
        const { x, y } = center(i);
        const blocked = board.blocked[i];
        const pop = pops.get(i);
        const rr = blocked && pop !== undefined ? r * (0.6 + 0.4 * pop) : r;
        if (blocked) {
          c.beginPath();
          c.arc(x, y + 2.5, rr, 0, Math.PI * 2);
          c.fillStyle = COLORS.navy;
          c.fill();
        }
        c.beginPath();
        c.arc(x, y, rr, 0, Math.PI * 2);
        c.fillStyle = blocked ? COLORS.royal : COLORS.card;
        c.fill();
        if (!blocked) {
          c.lineWidth = 2;
          c.strokeStyle = COLORS.border;
          c.stroke();
        }
      }
      // البزون
      c.save();
      c.globalAlpha = catAlpha;
      const cr = r * 1.15 * catScale;
      if (cr > 0.5) catHead(c, catPos.x, catPos.y - r * 0.15, cr, COLORS.yellow, { scared: mood === 'scared', sleepy: mood === 'sleepy' });
      c.restore();
    },
  };
});
