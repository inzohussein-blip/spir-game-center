/** «نزّل البزون»: الرسم واللمس — المنطق بـ logic.ts والمراحل بـ levels.json */
import { button, catHead, COLORS, createGame, ease, hit, rrect, sdk, shape, text, type Level, type Point, type Shape } from '../../packages/spir-kit/index.ts';
import levelsJson from './levels.json';
import { autoDropDir, initialState, slide, solve, starsFor, type Dir, type LevelDef, type Move, type Piece, type State } from './logic.ts';

const LEVELS = levelsJson as unknown as Record<Level, LevelDef[]>;
/** لون وشكل كل بزون (الشكل يميّز اللون لعمى الألوان) */
const CAT_COLORS = [COLORS.orange, COLORS.pink, COLORS.green, COLORS.violet];
const CAT_SHAPES: Shape[] = ['circle', 'triangle', 'star', 'diamond'];
const HINTS: Record<Level, number> = { easy: Infinity, medium: 3, hard: 0 };

createGame((g) => {
  let level: Level = 'easy';
  let stage = 1;
  let def: LevelDef = LEVELS.easy[0];
  let state: State = initialState(def);
  let history: State[] = [];
  let moves = 0;
  let hintsLeft = 0;
  let hint: Move | null = null;
  let timeLeft = 0;
  let timeUp = false;
  let done = false;
  let busy = false;
  // الرسم: إزاحة القطعة المتحركة وحجم البزون الطايح
  let anim: { piece: Piece; dx: number; dy: number; fall: number } | null = null;
  let drag: { piece: Piece; start: Point } | null = null;
  let banner = '';

  // الهندسة
  let cell = 50;
  let ox = 20;
  let oy = 100;
  const layout = () => {
    const board = Math.min(g.w - 32, g.h - 210);
    cell = board / def.size;
    ox = (g.w - board) / 2;
    oy = Math.max(84, (g.h - board) / 2 - 20);
  };
  const btnUndo = () => ({ x: g.w / 2 + 6, y: oy + cell * def.size + 26, w: 120, h: 42, label: 'تراجع' });
  const btnHint = () => ({ x: g.w / 2 - 126, y: oy + cell * def.size + 26, w: 120, h: 42, label: hintsLeft === Infinity ? 'تلميح' : `تلميح (${hintsLeft})` });

  const hud = () => {
    const t = level === 'hard' && !timeUp ? ` · ${Math.ceil(timeLeft)} ث` : '';
    sdk.hud(`المرحلة ${stage}`, `${moves} حركة${t}`);
  };

  const pieceAt = (p: Point): Piece | null => {
    const cx = Math.floor((p.x - ox) / cell);
    const cy = Math.floor((p.y - oy) / cell);
    const ci = state.cats.findIndex((c) => c.x === cx && c.y === cy);
    if (ci >= 0) return { kind: 'cat', i: ci };
    const bi = state.blocks.findIndex((b) => cx >= b.x && cx < b.x + b.w && cy >= b.y && cy < b.y + b.h);
    return bi >= 0 ? { kind: 'block', i: bi } : null;
  };

  const doMove = async (piece: Piece, dir: Dir) => {
    const res = slide(def, state, piece, dir);
    if (!res) {
      g.sound('bad');
      return;
    }
    busy = true;
    hint = null;
    history.push(state);
    moves++;
    hud();
    g.sound('move');
    const [ux, uy] = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] }[dir];
    const a = { piece, dx: 0, dy: 0, fall: 0 };
    anim = a;
    await g.anim(Math.min(90 * res.steps, 400), (t) => {
      a.dx = ux * res.steps * t;
      a.dy = uy * res.steps * t;
    }, ease.inOut);
    if (res.fell) {
      g.sound('meow');
      sdk.vibrate();
      await g.anim(320, (t) => (a.fall = t), ease.linear);
      g.sound('drop');
    }
    state = res.state;
    anim = null;
    busy = false;
    if (state.cats.every((c) => c.x < 0)) await finish();
  };

  const finish = async () => {
    done = true;
    g.sound('win');
    await g.wait(500);
    const stars = starsFor(def.par, moves, timeUp);
    sdk.complete({
      stars,
      score: moves,
      moves,
      timeUp,
      title: timeUp ? 'خلصتها!' : moves <= def.par ? 'حل مثالي!' : 'عاشت إيدك!',
      subtitle: timeUp ? `خلص الوقت، بس كمّلت المرحلة ${stage}` : `خلصت المرحلة ${stage} بـ ${moves} حركة (الأفضل ${def.par})`,
    });
  };

  const undo = () => {
    const prev = history.pop();
    if (!prev || busy) return;
    state = prev;
    moves++;
    hint = null;
    g.sound('tap');
    hud();
  };

  const showHint = () => {
    if (hintsLeft <= 0 || busy) return;
    const sol = solve(def, state, 150_000);
    if (!sol?.length) {
      banner = 'ارجع خطوة — من هنا صعب تنحل';
      return;
    }
    hint = sol[0];
    if (hintsLeft !== Infinity) hintsLeft--;
    g.sound('ok');
  };

  return {
    start(s) {
      level = s.level;
      const list = LEVELS[level];
      stage = Math.min(Math.max(1, s.stage), list.length);
      def = list[stage - 1];
      state = initialState(def);
      history = [];
      moves = 0;
      hintsLeft = HINTS[level];
      hint = null;
      timeLeft = def.time ?? 0;
      timeUp = false;
      done = false;
      busy = false;
      anim = null;
      banner = level === 'easy' && stage <= 2 ? 'اسحب البزون لفتحة لونه' : '';
      layout();
      hud();
    },
    update(dt) {
      if (level !== 'hard' || done || timeUp) return;
      const before = Math.ceil(timeLeft);
      timeLeft -= dt / 1000;
      if (timeLeft <= 0) {
        timeUp = true;
        banner = 'خلص الوقت — كمّل بدون نجوم';
        g.sound('bad');
        hud();
      } else if (Math.ceil(timeLeft) !== before) hud();
    },
    down(p) {
      if (done || busy) return;
      if (hit(btnUndo(), p.x, p.y)) return undo();
      if (HINTS[level] > 0 && hit(btnHint(), p.x, p.y)) return showHint();
      const piece = pieceAt(p);
      if (piece) drag = { piece, start: p };
    },
    up(p) {
      if (!drag) return;
      const { piece, start } = drag;
      drag = null;
      const dx = p.x - start.x;
      const dy = p.y - start.y;
      if (Math.hypot(dx, dy) < 14) {
        // ضغطة: بالسهل البزون يروح لوحده لفتحته إذا الطريق مفتوح
        if (piece.kind === 'cat') {
          const d = level === 'easy' ? autoDropDir(def, state, piece.i) : null;
          if (d) void doMove(piece, d);
          else g.sound('meow');
        }
        return;
      }
      banner = '';
      const dir: Dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : dy > 0 ? 'down' : 'up';
      void doMove(piece, dir);
    },
    draw(c) {
      layout();
      c.fillStyle = COLORS.bg;
      c.fillRect(0, 0, g.w, g.h);
      const size = def.size;
      // اللوحة
      rrect(c, ox - 8, oy - 8 + 4, cell * size + 16, cell * size + 16, 18);
      c.fillStyle = COLORS.navy;
      c.fill();
      rrect(c, ox - 8, oy - 8, cell * size + 16, cell * size + 16, 18);
      c.fillStyle = COLORS.royal;
      c.fill();
      for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
        rrect(c, ox + x * cell + 2, oy + y * cell + 2, cell - 4, cell - 4, 8);
        c.fillStyle = (x + y) % 2 ? '#F4F5FF' : COLORS.card;
        c.fill();
      }
      // الفتحات
      for (const h of def.holes) {
        const cx = ox + (h.x + 0.5) * cell;
        const cy = oy + (h.y + 0.5) * cell;
        c.beginPath();
        c.arc(cx, cy, cell * 0.36, 0, Math.PI * 2);
        c.fillStyle = COLORS.navy;
        c.fill();
        c.lineWidth = cell * 0.08;
        c.strokeStyle = CAT_COLORS[h.color];
        c.stroke();
        shape(c, CAT_SHAPES[h.color], cx, cy, cell * 0.13, CAT_COLORS[h.color]);
      }
      // الصناديق
      for (const w of def.walls) {
        const x = ox + w.x * cell + 3;
        const y = oy + w.y * cell + 3;
        rrect(c, x, y, cell - 6, cell - 6, 8);
        c.fillStyle = COLORS.navy;
        c.fill();
        c.strokeStyle = 'rgba(255,255,255,0.25)';
        c.lineWidth = 2;
        c.beginPath();
        c.moveTo(x + 8, y + 8);
        c.lineTo(x + cell - 14, y + cell - 14);
        c.moveTo(x + cell - 14, y + 8);
        c.lineTo(x + 8, y + cell - 14);
        c.stroke();
      }
      const off = (p: Piece) => (anim && anim.piece.kind === p.kind && anim.piece.i === p.i ? anim : null);
      // القطع المنزلقة
      state.blocks.forEach((b, i) => {
        const a = off({ kind: 'block', i });
        const x = ox + (b.x + (a?.dx ?? 0)) * cell + 4;
        const y = oy + (b.y + (a?.dy ?? 0)) * cell + 4;
        const w = b.w * cell - 8;
        const h = b.h * cell - 8;
        rrect(c, x, y + 3, w, h, 10);
        c.fillStyle = '#5B64C9';
        c.fill();
        rrect(c, x, y, w, h, 10);
        c.fillStyle = '#9AA3F0';
        c.fill();
        // خطوط تبيّن اتجاه الحركة
        c.strokeStyle = 'rgba(255,255,255,0.7)';
        c.lineWidth = 3;
        c.lineCap = 'round';
        c.beginPath();
        if (b.w > 1) {
          c.moveTo(x + 14, y + h / 2);
          c.lineTo(x + w - 14, y + h / 2);
        } else if (b.h > 1) {
          c.moveTo(x + w / 2, y + 14);
          c.lineTo(x + w / 2, y + h - 14);
        } else {
          c.arc(x + w / 2, y + h / 2, 4, 0, Math.PI * 2);
        }
        c.stroke();
      });
      // البزازين
      state.cats.forEach((cat, i) => {
        if (cat.x < 0) return;
        const a = off({ kind: 'cat', i });
        const cx = ox + (cat.x + 0.5 + (a?.dx ?? 0)) * cell;
        const cy = oy + (cat.y + 0.55 + (a?.dy ?? 0)) * cell;
        const scale = 1 - (a?.fall ?? 0);
        if (scale <= 0.02) return;
        c.save();
        c.translate(cx, cy);
        c.rotate((a?.fall ?? 0) * Math.PI);
        catHead(c, 0, 0, cell * 0.33 * scale, CAT_COLORS[cat.color], { scared: !!a && !a.fall });
        shape(c, CAT_SHAPES[cat.color], 0, -cell * 0.2 * scale, cell * 0.07 * scale, '#FFFFFF');
        c.restore();
      });
      // التلميح: سهم أصفر على القطعة
      if (hint) {
        const p = hint.piece.kind === 'cat' ? state.cats[hint.piece.i] : state.blocks[hint.piece.i];
        const w = hint.piece.kind === 'block' ? state.blocks[hint.piece.i].w : 1;
        const h = hint.piece.kind === 'block' ? state.blocks[hint.piece.i].h : 1;
        const cx = ox + (p.x + w / 2) * cell;
        const cy = oy + (p.y + h / 2) * cell;
        const [ux, uy] = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] }[hint.dir];
        const pulse = 0.5 + 0.5 * Math.sin(g.now / 150);
        c.save();
        c.translate(cx + ux * cell * (0.45 + 0.1 * pulse), cy + uy * cell * (0.45 + 0.1 * pulse));
        c.rotate(Math.atan2(uy, ux));
        c.beginPath();
        c.moveTo(14, 0);
        c.lineTo(-8, -12);
        c.lineTo(-8, 12);
        c.closePath();
        c.fillStyle = COLORS.yellow;
        c.strokeStyle = COLORS.navy;
        c.lineWidth = 3;
        c.fill();
        c.stroke();
        c.restore();
      }
      if (banner) text(c, banner, g.w / 2, oy - 34, { size: 15, color: timeUp ? COLORS.red : COLORS.muted, weight: 600 });
      button(c, { ...btnUndo(), disabled: history.length === 0 });
      if (HINTS[level] > 0) button(c, { ...btnHint(), primary: true, disabled: hintsLeft <= 0 });
    },
  };
});
