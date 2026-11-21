/** «أربعة بخط»: نزّل القطع، أول واحد يرتّب أربعة يفوز */
import { clear, COLORS, createGame, ease, frame, rng, sdk, text, type Level, type Point } from '../../packages/spir-kit/index.ts';
import { aiCol, COLS, drop, empty, ROWS, winner, type Board } from './logic.ts';

const COLOR = { 1: COLORS.yellow, 2: COLORS.red } as const;

createGame((g) => {
  let board: Board = empty();
  let turn: 1 | 2 = 1;
  let level: Level = 'medium';
  let players: 1 | 2 = 1;
  let round = 1;
  let busy = false;
  let over = false;
  let line: number[] | null = null;
  let falling: { col: number; row: number; y: number; p: 1 | 2 } | null = null;
  let hover = -1;
  let rand = rng(1).next;

  let cs = 44;
  let ox = 20;
  let oy = 150;
  const layout = () => {
    cs = Math.min((g.w - 32) / COLS, (g.h - 230) / ROWS);
    ox = (g.w - cs * COLS) / 2;
    oy = Math.max(120, (g.h - cs * ROWS) / 2 + 10);
  };
  // العمود 0 على اليمين (عربي)
  const colX = (col: number) => ox + (COLS - 1 - col + 0.5) * cs;
  const colAt = (x: number) => {
    const k = Math.floor((x - ox) / cs);
    return k < 0 || k >= COLS ? -1 : COLS - 1 - k;
  };
  const name = (p: 1 | 2) => (players === 2 ? (p === 1 ? 'الأصفر' : 'الأحمر') : p === 1 ? 'إنت' : 'الجهاز');
  const hud = () => sdk.hud(players === 2 ? `دور ${name(turn)}` : `الجولة ${round}`, players === 2 ? `الجولة ${round}` : turn === 1 ? 'دورك' : 'الجهاز يفكر');

  const play = async (col: number) => {
    const d = drop(board, col, turn);
    if (!d) return false;
    falling = { col, row: d.row, y: -1, p: turn };
    g.sound('move');
    const f = falling;
    await g.anim(120 + d.row * 45, (t) => (f.y = -1 + (d.row + 1) * t), ease.bounce);
    falling = null;
    board = d.board;
    g.sound('tap');
    return true;
  };

  const end = async () => {
    const w = winner(board);
    if (!w) return false;
    over = true;
    if (w !== 'draw') line = w.line;
    await g.wait(900);
    if (w === 'draw') {
      g.sound('ok');
      sdk.complete({ stars: 1, score: 0, title: 'تعادل!', subtitle: 'تعبّت اللوحة' });
    } else if (players === 2 || w.p === 1) {
      g.sound('win');
      sdk.complete({ stars: 3, score: 1, title: players === 2 ? `فاز ${name(w.p)}!` : 'فزت!', subtitle: players === 2 ? `الجولة ${round}` : 'رتّبت أربعة قبل الجهاز' });
    } else {
      g.sound('lose');
      sdk.over({ score: 0, title: 'فاز الجهاز', subtitle: 'انتبه للخطوط المايلة!' });
    }
    return true;
  };

  const tap = async (p: Point) => {
    if (busy || over) return;
    const col = colAt(p.x);
    if (col < 0) return;
    busy = true;
    if (!(await play(col))) {
      busy = false;
      g.sound('bad');
      return;
    }
    if (await end()) return;
    turn = turn === 1 ? 2 : 1;
    hud();
    if (players === 1) {
      await g.wait(250);
      await play(aiCol(board, 2, level, rand));
      if (await end()) return;
      turn = 1;
      hud();
    }
    busy = false;
  };

  const disc = (c: CanvasRenderingContext2D, x: number, y: number, r: number, p: 1 | 2, glow: boolean) => {
    c.beginPath();
    c.arc(x, y, r, 0, Math.PI * 2);
    c.fillStyle = COLOR[p];
    c.fill();
    c.beginPath();
    c.arc(x, y, r * 0.62, 0, Math.PI * 2);
    c.strokeStyle = 'rgba(11,16,51,0.18)';
    c.lineWidth = 3;
    c.stroke();
    if (glow) {
      c.beginPath();
      c.arc(x, y, r + 3, 0, Math.PI * 2);
      c.strokeStyle = COLORS.navy;
      c.lineWidth = 4;
      c.stroke();
    }
  };

  return {
    start(s) {
      level = s.level;
      players = s.players;
      round = s.stage;
      board = empty();
      turn = 1;
      busy = false;
      over = false;
      line = null;
      rand = rng(Date.now() % 100003).next;
      layout();
      hud();
    },
    down(p) {
      hover = colAt(p.x);
    },
    up(p) {
      hover = -1;
      void tap(p);
    },
    draw(c) {
      layout();
      clear(c, g.w, g.h);
      const msg = over ? '' : players === 2 ? `دور ${name(turn)}` : turn === 1 ? 'دورك — اضغط عمود' : 'الجهاز يفكر…';
      text(c, msg, g.w / 2, oy - 62, { size: 17, color: turn === 1 ? '#B58900' : COLORS.red });
      if (hover >= 0 && !busy && !over) disc(c, colX(hover), oy - 26, cs * 0.38, turn, false);
      if (falling) disc(c, colX(falling.col), oy + (falling.y + 0.5) * cs, cs * 0.4, falling.p, false);
      frame(c, ox - 8, oy - 8, cs * COLS + 16, cs * ROWS + 16, 16);
      for (let r = 0; r < ROWS; r++) for (let col = 0; col < COLS; col++) {
        const v = board[r * COLS + col];
        const x = colX(col);
        const y = oy + (r + 0.5) * cs;
        if (v) disc(c, x, y, cs * 0.4, v as 1 | 2, !!line?.includes(r * COLS + col));
        else {
          c.beginPath();
          c.arc(x, y, cs * 0.4, 0, Math.PI * 2);
          c.fillStyle = COLORS.bg;
          c.fill();
        }
      }
    },
  };
});
