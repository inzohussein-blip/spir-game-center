/** «إكس أو»: ضد الجهاز أو لاعبين على نفس الجهاز */
import { COLORS, createGame, ease, rng, rrect, sdk, text, type Level, type Point } from '../../packages/spir-kit/index.ts';
import { aiMove, empty, winner, type Board } from './logic.ts';

createGame((g) => {
  let board: Board = empty();
  let turn: 'X' | 'O' = 'X';
  let level: Level = 'medium';
  let players: 1 | 2 = 1;
  let round = 1;
  let busy = false;
  let over = false;
  let winLine: number[] | null = null;
  let lineT = 0;
  const pop = new Map<number, number>();
  let rand = rng(1).next;

  let size = 300;
  let ox = 30;
  let oy = 150;
  const layout = () => {
    size = Math.min(g.w - 40, g.h - 220);
    ox = (g.w - size) / 2;
    oy = Math.max(110, (g.h - size) / 2);
  };
  const cellOf = (p: Point) => {
    const cx = Math.floor(((p.x - ox) / size) * 3);
    const cy = Math.floor(((p.y - oy) / size) * 3);
    return cx >= 0 && cy >= 0 && cx < 3 && cy < 3 ? cy * 3 + cx : -1;
  };
  const label = (m: 'X' | 'O') => (players === 2 ? (m === 'X' ? 'اللاعب الأزرق' : 'اللاعب البرتقالي') : m === 'X' ? 'إنت' : 'الجهاز');
  const hud = () => sdk.hud(players === 2 ? `دور ${label(turn)}` : `الجولة ${round}`, players === 2 ? `الجولة ${round}` : turn === 'X' ? 'دورك' : 'دور الجهاز');

  const place = (i: number) => {
    board[i] = turn;
    g.sound(turn === 'X' ? 'tap' : 'move');
    void g.anim(220, (t) => pop.set(i, t), ease.back);
  };

  const end = async () => {
    const w = winner(board);
    if (!w) return false;
    over = true;
    if (w !== 'draw') {
      winLine = w.line;
      await g.anim(350, (t) => (lineT = t));
    }
    await g.wait(500);
    if (w === 'draw') {
      g.sound('ok');
      sdk.complete({ stars: 1, score: 0, title: 'تعادل!', subtitle: 'محد فاز هالجولة' });
    } else if (players === 2) {
      g.sound('win');
      sdk.complete({ stars: 3, score: 1, title: `فاز ${label(w.mark)}!`, subtitle: `الجولة ${round}` });
    } else if (w.mark === 'X') {
      g.sound('win');
      sdk.complete({ stars: 3, score: 1, title: 'فزت!', subtitle: level === 'hard' ? 'غلبت الجهاز بالصعب!' : `غلبت الجهاز بالجولة ${round}` });
    } else {
      g.sound('lose');
      sdk.over({ score: 0, title: 'فاز الجهاز', subtitle: 'جرّب مرة ثانية' });
    }
    return true;
  };

  const tap = async (p: Point) => {
    if (busy || over) return;
    const i = cellOf(p);
    if (i < 0 || board[i]) return;
    busy = true;
    place(i);
    if (await end()) return;
    turn = turn === 'X' ? 'O' : 'X';
    hud();
    if (players === 1) {
      await g.wait(380);
      place(aiMove(board, 'O', level, rand));
      if (await end()) return;
      turn = 'X';
      hud();
    }
    busy = false;
  };

  const drawX = (c: CanvasRenderingContext2D, x: number, y: number, r: number) => {
    c.strokeStyle = COLORS.royal;
    c.lineWidth = r * 0.28;
    c.lineCap = 'round';
    c.beginPath();
    c.moveTo(x - r, y - r);
    c.lineTo(x + r, y + r);
    c.moveTo(x + r, y - r);
    c.lineTo(x - r, y + r);
    c.stroke();
  };
  const drawO = (c: CanvasRenderingContext2D, x: number, y: number, r: number) => {
    c.strokeStyle = COLORS.orange;
    c.lineWidth = r * 0.28;
    c.beginPath();
    c.arc(x, y, r, 0, Math.PI * 2);
    c.stroke();
  };

  return {
    start(s) {
      level = s.level;
      players = s.players;
      round = s.stage;
      board = empty();
      turn = 'X';
      busy = false;
      over = false;
      winLine = null;
      lineT = 0;
      pop.clear();
      rand = rng(Date.now() % 100000).next;
      layout();
      hud();
    },
    down: (p) => void tap(p),
    draw(c) {
      layout();
      c.fillStyle = COLORS.bg;
      c.fillRect(0, 0, g.w, g.h);
      const who = over ? '' : players === 2 ? `دور ${label(turn)}` : turn === 'X' ? 'دورك — إنت الأزرق' : 'الجهاز يفكر…';
      text(c, who, g.w / 2, oy - 40, { size: 17, color: turn === 'X' ? COLORS.royal : COLORS.orange });
      rrect(c, ox - 10, oy - 10 + 4, size + 20, size + 20, 20);
      c.fillStyle = COLORS.navy;
      c.fill();
      rrect(c, ox - 10, oy - 10, size + 20, size + 20, 20);
      c.fillStyle = COLORS.card;
      c.fill();
      const cs = size / 3;
      c.strokeStyle = COLORS.border;
      c.lineWidth = 4;
      c.lineCap = 'round';
      c.beginPath();
      for (let k = 1; k < 3; k++) {
        c.moveTo(ox + k * cs, oy + 12);
        c.lineTo(ox + k * cs, oy + size - 12);
        c.moveTo(ox + 12, oy + k * cs);
        c.lineTo(ox + size - 12, oy + k * cs);
      }
      c.stroke();
      board.forEach((m, i) => {
        if (!m) return;
        const x = ox + (i % 3 + 0.5) * cs;
        const y = oy + (Math.floor(i / 3) + 0.5) * cs;
        const r = cs * 0.28 * (pop.get(i) ?? 1);
        if (m === 'X') drawX(c, x, y, r);
        else drawO(c, x, y, r);
      });
      if (winLine) {
        const a = winLine[0];
        const b = winLine[2];
        const ax = ox + (a % 3 + 0.5) * cs;
        const ay = oy + (Math.floor(a / 3) + 0.5) * cs;
        const bx = ox + (b % 3 + 0.5) * cs;
        const by = oy + (Math.floor(b / 3) + 0.5) * cs;
        c.strokeStyle = COLORS.yellow;
        c.lineWidth = 12;
        c.beginPath();
        c.moveTo(ax, ay);
        c.lineTo(ax + (bx - ax) * lineT, ay + (by - ay) * lineT);
        c.stroke();
      }
    },
  };
});
