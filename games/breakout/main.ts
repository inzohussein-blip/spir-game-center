/** «كاسر الطوب»: حرّك المضرب بإصبعك وخلي الكرة تكسر كل الطوب */
import { clear, COLORS, createGame, rrect, sdk, text, type Level } from '../../packages/spir-kit/index.ts';
import { BRICK_COLS, bounceRect, LIVES, makeBricks, PADDLE, paddleBounce, SPEED, starsFor, type Ball, type Brick } from './logic.ts';

const BRICK_COLORS = [COLORS.pink, COLORS.orange, COLORS.yellow, COLORS.green, COLORS.teal, COLORS.violet];

createGame((g) => {
  let level: Level = 'easy';
  let stage = 1;
  let bricks: Brick[] = [];
  let ball: Ball = { x: 180, y: 400, vx: 0, vy: 0, r: 7 };
  let px = 180;
  let lives = 3;
  let lost = 0;
  let stuck = true;
  let over = false;
  let total = 0;

  const top = 80;
  const side = 14;
  const bw = () => (g.w - side * 2) / BRICK_COLS;
  const bh = 20;
  const paddleY = () => g.h - 90;
  const rectOf = (b: Brick) => ({ x: side + b.col * bw() + 2, y: top + b.row * (bh + 4), w: bw() - 4, h: bh });
  const hud = () => sdk.hud(`المرحلة ${stage}`, `${'♥'.repeat(lives)}`);

  const reset = () => {
    stuck = true;
    ball = { x: px, y: paddleY() - 12, vx: 0, vy: 0, r: 7 };
  };

  const finish = async (won: boolean) => {
    over = true;
    if (won) {
      g.sound('win');
      await g.wait(500);
      sdk.complete({ stars: starsFor(level, lost), score: total, title: 'كسرت كل الطوب!', subtitle: `المرحلة ${stage}${lost ? ` · خسرت ${lost} كرة` : ' بدون ما تخسر ولا كرة'}` });
    } else {
      g.sound('lose');
      await g.wait(500);
      sdk.over({ score: total, title: 'خلصت الكرات', subtitle: `بقى ${bricks.length} طابوگة — جرّب مرة ثانية` });
    }
  };

  const physics = (dt: number) => {
    const s = dt / 1000;
    ball.x += ball.vx * s;
    ball.y += ball.vy * s;
    if (ball.x < ball.r) {
      ball.x = ball.r;
      ball.vx = Math.abs(ball.vx);
    }
    if (ball.x > g.w - ball.r) {
      ball.x = g.w - ball.r;
      ball.vx = -Math.abs(ball.vx);
    }
    if (ball.y < top - 30 + ball.r) {
      ball.y = top - 30 + ball.r;
      ball.vy = Math.abs(ball.vy);
    }
    const pw = PADDLE[level];
    const py = paddleY();
    if (ball.vy > 0 && ball.y + ball.r >= py && ball.y + ball.r <= py + 16 && Math.abs(ball.x - px) <= pw / 2 + ball.r) {
      // تسرع شوية كل ما تنكسر طوب أكثر
      paddleBounce(ball, px, pw, SPEED[level] * (1 + Math.min(0.35, total * 0.008)));
      ball.y = py - ball.r;
      g.sound('tap');
    }
    for (let i = 0; i < bricks.length; i++) {
      if (bounceRect(ball, rectOf(bricks[i]))) {
        bricks[i].hp--;
        if (bricks[i].hp <= 0) {
          bricks.splice(i, 1);
          total++;
          g.sound('ok');
        } else g.sound('move');
        break;
      }
    }
    if (ball.y > g.h + 20) {
      lives--;
      lost++;
      hud();
      sdk.vibrate();
      g.sound('bad');
      if (lives <= 0) void finish(false);
      else reset();
    }
    if (!bricks.length && !over) void finish(true);
  };

  return {
    start(s) {
      level = s.level;
      stage = s.stage;
      bricks = makeBricks(level, stage);
      lives = LIVES[level];
      lost = 0;
      total = 0;
      over = false;
      px = g.w / 2;
      reset();
      hud();
    },
    update(dt) {
      if (over) return;
      if (stuck) {
        ball.x = px;
        ball.y = paddleY() - ball.r - 2;
        return;
      }
      // خطوات صغيرة حتى الكرة ما تعبر من خلال الطوب
      let left = dt;
      while (left > 0 && !over) {
        const d = Math.min(6, left);
        physics(d);
        left -= d;
      }
    },
    down(p) {
      px = Math.max(PADDLE[level] / 2, Math.min(g.w - PADDLE[level] / 2, p.x));
    },
    move(p) {
      px = Math.max(PADDLE[level] / 2, Math.min(g.w - PADDLE[level] / 2, p.x));
    },
    up() {
      if (stuck && !over) {
        stuck = false;
        paddleBounce(ball, px + 8, PADDLE[level], SPEED[level]);
        g.sound('tap');
      }
    },
    draw(c) {
      clear(c, g.w, g.h, COLORS.navy);
      // نقاط القمصان بالخلفية
      c.fillStyle = 'rgba(255,255,255,0.05)';
      for (let y = 10; y < g.h; y += 16) for (let x = 10; x < g.w; x += 16) c.fillRect(x, y, 2, 2);
      for (const b of bricks) {
        const r = rectOf(b);
        rrect(c, r.x, r.y + 3, r.w, r.h, 5);
        c.fillStyle = 'rgba(0,0,0,0.35)';
        c.fill();
        rrect(c, r.x, r.y, r.w, r.h, 5);
        c.fillStyle = BRICK_COLORS[b.color];
        c.fill();
        if (b.hp > 1) {
          c.strokeStyle = '#FFFFFF';
          c.lineWidth = 2.5;
          c.stroke();
        }
      }
      const pw = PADDLE[level];
      rrect(c, px - pw / 2, paddleY() + 3, pw, 14, 7);
      c.fillStyle = '#000000';
      c.fill();
      rrect(c, px - pw / 2, paddleY(), pw, 14, 7);
      c.fillStyle = COLORS.yellow;
      c.fill();
      c.beginPath();
      c.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2);
      c.fillStyle = '#FFFFFF';
      c.fill();
      if (stuck) text(c, 'حرّك المضرب واترك إصبعك حتى تنطلق الكرة', g.w / 2, paddleY() - 60, { size: 13, color: 'rgba(255,255,255,0.8)', weight: 600 });
    },
  };
});
