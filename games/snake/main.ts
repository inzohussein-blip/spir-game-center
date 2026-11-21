/** «الأفعى»: اسحب لتغيير الاتجاه، كُل وكبر بدون ما تصطدم */
import { clear, COLORS, createGame, frame, rng, rrect, sdk, swipeDir, text, type Dir, type Level, type Point } from '../../packages/spir-kit/index.ts';
import { newSnake, SIZE, STARS, starsFor, step, STEP_MS, turn, WRAP, type Snake } from './logic.ts';

createGame((g) => {
  let level: Level = 'easy';
  let rand = rng(1).next;
  let snake: Snake = newSnake(rand);
  let queue: Dir[] = [];
  let acc = 0;
  let eaten = 0;
  let started = false;
  let over = false;
  let start: Point | null = null;

  let cs = 22;
  let ox = 20;
  let oy = 120;
  const layout = () => {
    const board = Math.min(g.w - 28, g.h - 190);
    cs = board / SIZE;
    ox = (g.w - board) / 2;
    oy = Math.max(90, (g.h - board) / 2);
  };
  const hud = () => sdk.hud(`الهدف ${STARS[level][2]}`, `أكلت ${eaten}`);

  const die = async () => {
    over = true;
    g.sound('lose');
    sdk.vibrate();
    await g.wait(700);
    const stars = starsFor(level, eaten);
    if (stars > 0) sdk.complete({ stars, score: eaten, title: 'عاشت إيدك!', subtitle: `أكلت ${eaten} وطولها صار ${snake.body.length}` });
    else sdk.over({ score: eaten, title: 'اصطدمت!', subtitle: `أكلت ${eaten} — جرّب مرة ثانية` });
  };

  const steer = (d: Dir) => {
    started = true;
    const last = queue.length ? queue[queue.length - 1] : snake.dir;
    const next = turn(last, d);
    if (next !== last && queue.length < 3) queue.push(next);
  };

  return {
    start(s) {
      level = s.level;
      rand = rng(Date.now() % 100003).next;
      snake = newSnake(rand);
      queue = [];
      acc = 0;
      eaten = 0;
      started = false;
      over = false;
      layout();
      hud();
    },
    update(dt) {
      if (!started || over) return;
      acc += dt;
      // تسرع شوية ويّا كل أكلة
      const ms = Math.max(STEP_MS[level] * 0.6, STEP_MS[level] - eaten * 2);
      while (acc >= ms && !over) {
        acc -= ms;
        if (queue.length) snake = { ...snake, dir: queue.shift() as Dir };
        const r = step(snake, WRAP[level], rand);
        if (r.dead) {
          void die();
          return;
        }
        snake = r.snake;
        if (r.ate) {
          eaten++;
          g.sound('ok');
          hud();
        }
      }
    },
    down: (p) => (start = p),
    move(p) {
      if (!start) return;
      const d = swipeDir(start, p, 16);
      if (d) {
        steer(d);
        start = p;
      }
    },
    up(p) {
      if (start && !swipeDir(start, p, 16) && !started) started = true;
      start = null;
    },
    draw(c) {
      layout();
      clear(c, g.w, g.h);
      const board = cs * SIZE;
      frame(c, ox - 6, oy - 6, board + 12, board + 12, 14, WRAP[level] ? COLORS.green : '#167A43');
      for (let y = 0; y < SIZE; y++) for (let x = 0; x < SIZE; x++) {
        if ((x + y) % 2) continue;
        c.fillStyle = 'rgba(255,255,255,0.06)';
        c.fillRect(ox + x * cs, oy + y * cs, cs, cs);
      }
      // الأكل: تفاحة صفراء
      const f = snake.food;
      const pulse = 1 + 0.08 * Math.sin(g.now / 160);
      c.beginPath();
      c.arc(ox + (f.x + 0.5) * cs, oy + (f.y + 0.5) * cs, cs * 0.36 * pulse, 0, Math.PI * 2);
      c.fillStyle = COLORS.yellow;
      c.fill();
      // الجسم
      snake.body.forEach((b, i) => {
        const shrink = i === 0 ? 0 : Math.min(3, i * 0.15);
        rrect(c, ox + b.x * cs + 1 + shrink, oy + b.y * cs + 1 + shrink, cs - 2 - shrink * 2, cs - 2 - shrink * 2, cs * 0.3);
        c.fillStyle = i === 0 ? COLORS.navy : i % 2 ? '#2A35E0' : COLORS.royal;
        c.fill();
      });
      // العيون
      const h = snake.body[0];
      const look: Record<Dir, [number, number]> = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
      const [lx, ly] = look[snake.dir];
      for (const s of [-1, 1]) {
        const ex = ox + (h.x + 0.5) * cs + (ly ? s * cs * 0.2 : lx * cs * 0.15);
        const ey = oy + (h.y + 0.5) * cs + (lx ? s * cs * 0.2 : ly * cs * 0.15);
        c.beginPath();
        c.arc(ex, ey, cs * 0.12, 0, Math.PI * 2);
        c.fillStyle = '#FFFFFF';
        c.fill();
      }
      if (!started) text(c, 'اسحب بأي اتجاه حتى تبدي', g.w / 2, oy - 30, { size: 15, color: COLORS.muted, weight: 600 });
      else if (WRAP[level]) text(c, 'بالسهل تگدر تعبر من الحيطان', g.w / 2, oy - 30, { size: 13, color: COLORS.muted, weight: 600 });
    },
  };
});
