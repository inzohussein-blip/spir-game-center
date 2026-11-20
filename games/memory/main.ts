/** «ذاكرة البطاقات»: اقلب بطاقتين، إذا تطابقن يبقن مفتوحات */
import { COLORS, createGame, ease, rrect, sdk, shape, text, type Level, type Point, type Shape } from '../../packages/spir-kit/index.ts';
import { colsFor, makeDeck, PEEK_MS, starsFor } from './logic.ts';

const SHAPES: Shape[] = ['circle', 'triangle', 'star', 'square', 'diamond', 'heart', 'moon', 'drop', 'flower', 'hexagon'];
const TINTS = [COLORS.orange, COLORS.pink, COLORS.yellow, COLORS.green, COLORS.violet, COLORS.red, COLORS.royal, COLORS.teal, '#F28C28', COLORS.navy];

type Card = { sym: number; open: number; matched: boolean };

createGame((g) => {
  let level: Level = 'easy';
  let stage = 1;
  let cards: Card[] = [];
  let picked: number[] = [];
  let moves = 0;
  let busy = false;
  let pairs = 3;
  let message = '';

  let cols = 3;
  let cw = 90;
  let ch = 110;
  let ox = 20;
  let oy = 120;
  const gap = 10;
  const layout = () => {
    cols = colsFor(cards.length);
    const rows = Math.ceil(cards.length / cols);
    cw = Math.min((g.w - 32 - gap * (cols - 1)) / cols, 110);
    ch = cw * 1.25;
    const availH = g.h - 170;
    if (rows * ch + (rows - 1) * gap > availH) {
      ch = (availH - (rows - 1) * gap) / rows;
      cw = ch / 1.25;
    }
    ox = (g.w - (cols * cw + (cols - 1) * gap)) / 2;
    oy = Math.max(90, (g.h - (rows * ch + (rows - 1) * gap)) / 2);
  };
  const rect = (i: number) => {
    // الترتيب من اليمين لليسار
    const col = cols - 1 - (i % cols);
    const row = Math.floor(i / cols);
    return { x: ox + col * (cw + gap), y: oy + row * (ch + gap) };
  };

  const hud = () => sdk.hud(`المرحلة ${stage}`, `${moves} حركة`);

  const flip = (i: number, to: number) => g.anim(180, (t) => (cards[i].open = to ? t : 1 - t), ease.inOut);

  const tap = async (p: Point) => {
    if (busy) return;
    const i = cards.findIndex((_, k) => {
      const r = rect(k);
      return p.x >= r.x && p.x <= r.x + cw && p.y >= r.y && p.y <= r.y + ch;
    });
    if (i < 0 || cards[i].matched || picked.includes(i)) return;
    message = '';
    g.sound('tap');
    picked.push(i);
    await flip(i, 1);
    if (picked.length < 2) return;
    busy = true;
    moves++;
    hud();
    const [a, b] = picked;
    if (cards[a].sym === cards[b].sym) {
      cards[a].matched = cards[b].matched = true;
      g.sound('ok');
      sdk.vibrate();
    } else {
      await g.wait(550);
      g.sound('bad');
      await Promise.all([flip(a, 0), flip(b, 0)]);
    }
    picked = [];
    busy = false;
    if (cards.every((c) => c.matched)) {
      g.sound('win');
      await g.wait(500);
      sdk.complete({ stars: starsFor(pairs, moves), score: moves, moves, title: 'ذاكرة حديد!', subtitle: `خلصت المرحلة ${stage} بـ ${moves} حركة` });
    }
  };

  return {
    async start(s) {
      level = s.level;
      stage = s.stage;
      const deck = makeDeck(level, stage);
      pairs = deck.length / 2;
      cards = deck.map((sym) => ({ sym, open: 0, matched: false }));
      picked = [];
      moves = 0;
      layout();
      hud();
      const peek = PEEK_MS[level];
      if (peek) {
        busy = true;
        message = 'احفظ الصور!';
        await Promise.all(cards.map((_, i) => flip(i, 1)));
        await g.wait(peek);
        await Promise.all(cards.map((_, i) => flip(i, 0)));
        busy = false;
      }
      message = 'اقلب بطاقتين متشابهات';
    },
    down: (p) => void tap(p),
    draw(c) {
      layout();
      c.fillStyle = COLORS.bg;
      c.fillRect(0, 0, g.w, g.h);
      if (message) text(c, message, g.w / 2, oy - 34, { size: 16, color: COLORS.muted, weight: 600 });
      cards.forEach((card, i) => {
        const { x, y } = rect(i);
        // قلب البطاقة: نصغّر العرض لحد الصفر وبعدين نبيّن الوجه الثاني
        const t = card.open;
        const face = t >= 0.5;
        const sx = Math.abs(Math.cos(t * Math.PI));
        const w = cw * sx;
        const cx = x + cw / 2;
        rrect(c, cx - w / 2, y + 3, w, ch, 12);
        c.fillStyle = COLORS.navy;
        c.fill();
        rrect(c, cx - w / 2, y, w, ch, 12);
        c.fillStyle = face ? (card.matched ? '#FFF6C2' : COLORS.card) : COLORS.royal;
        c.fill();
        if (w < 4) return;
        c.save();
        c.translate(cx, y + ch / 2);
        c.scale(sx, 1);
        if (face) {
          shape(c, SHAPES[card.sym], 0, 0, Math.min(cw, ch) * 0.26, TINTS[card.sym]);
        } else {
          // ظهر البطاقة: نقاط القمصان وعلامة صفراء
          c.fillStyle = 'rgba(255,255,255,0.18)';
          for (let yy = -ch / 2 + 10; yy < ch / 2 - 6; yy += 12) for (let xx = -cw / 2 + 10; xx < cw / 2 - 6; xx += 12) {
            c.beginPath();
            c.arc(xx, yy, 1.5, 0, Math.PI * 2);
            c.fill();
          }
          c.fillStyle = COLORS.yellow;
          c.beginPath();
          c.arc(0, 0, Math.min(cw, ch) * 0.14, 0, Math.PI * 2);
          c.fill();
        }
        c.restore();
      });
    },
  };
});
