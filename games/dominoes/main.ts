/** «دومينو» ضد الجهاز: اضغط قطعة تطابق أحد الأطراف */
import { button, clear, COLORS, createGame, hit, rng, rrect, sdk, text, type Level, type Point } from '../../packages/spir-kit/index.ts';
import { aiMove, blockedResult, deal, ends, handPips, place, playable, sidesFor, starsFor, type Chain, type RoundEnd, type Side, type Tile } from './logic.ts';

/** نقاط الوجه حسب الرقم (مواضع على شبكة 3×3) */
const PIPS: Record<number, [number, number][]> = {
  0: [], 1: [[1, 1]], 2: [[0, 0], [2, 2]], 3: [[0, 0], [1, 1], [2, 2]], 4: [[0, 0], [2, 0], [0, 2], [2, 2]],
  5: [[0, 0], [2, 0], [1, 1], [0, 2], [2, 2]], 6: [[0, 0], [2, 0], [0, 1], [2, 1], [0, 2], [2, 2]],
};

createGame((g) => {
  let level: Level = 'medium';
  let stage = 1;
  let player: Tile[] = [];
  let ai: Tile[] = [];
  let stock: Tile[] = [];
  let chain: Chain = [];
  let turn: 'player' | 'ai' = 'player';
  let passes = 0;
  let busy = false;
  let over = false;
  let choose: Tile | null = null;
  let message = '';
  let rand = rng(1).next;

  const hud = () => sdk.hud(`الجولة ${stage}`, `المخزن ${stock.length}`);

  /** يرسم قطعة بالعرض (أفقية) أو بالطول */
  const tile = (c: CanvasRenderingContext2D, t: Tile, x: number, y: number, s: number, vertical: boolean, o: { dim?: boolean; glow?: boolean; back?: boolean } = {}) => {
    const w = vertical ? s : s * 2;
    const h = vertical ? s * 2 : s;
    c.save();
    c.globalAlpha = o.dim ? 0.45 : 1;
    rrect(c, x, y + 2, w, h, s * 0.18);
    c.fillStyle = COLORS.navy;
    c.fill();
    rrect(c, x, y, w, h, s * 0.18);
    c.fillStyle = o.back ? COLORS.royal : '#FFFFFF';
    c.fill();
    if (o.glow) {
      c.strokeStyle = COLORS.yellow;
      c.lineWidth = 3;
      c.stroke();
    }
    if (!o.back) {
      c.strokeStyle = COLORS.border;
      c.lineWidth = 1.5;
      c.beginPath();
      if (vertical) {
        c.moveTo(x + s * 0.15, y + s);
        c.lineTo(x + s * 0.85, y + s);
      } else {
        c.moveTo(x + s, y + s * 0.15);
        c.lineTo(x + s, y + s * 0.85);
      }
      c.stroke();
      t.forEach((v, half) => {
        const bx = vertical ? x : x + half * s;
        const by = vertical ? y + half * s : y;
        for (const [px, py] of PIPS[v]) {
          c.beginPath();
          c.arc(bx + s * (0.25 + px * 0.25), by + s * (0.25 + py * 0.25), s * 0.08, 0, Math.PI * 2);
          c.fillStyle = COLORS.navy;
          c.fill();
        }
      });
    }
    c.restore();
  };

  // مواضع قطع اللاعب
  const handLayout = () => {
    const s = Math.min(26, (g.w - 24) / (Math.max(player.length, 7) * 1.25));
    const total = player.length * s * 1.25;
    return player.map((t, i) => ({ t, x: g.w / 2 + total / 2 - (i + 1) * s * 1.25 + s * 0.125, y: g.h - s * 2 - 70, s }));
  };
  const sideBtns = () => [
    { x: g.w / 2 + 6, y: g.h - 230, w: 130, h: 40, label: 'على البداية', side: 'start' as Side },
    { x: g.w / 2 - 136, y: g.h - 230, w: 130, h: 40, label: 'على النهاية', side: 'end' as Side },
  ];

  const finish = async (end: RoundEnd) => {
    over = true;
    await g.wait(800);
    const stars = starsFor(end);
    const score = end.winner === 'player' ? handPips(ai) : 0;
    if (end.winner === 'player') {
      g.sound('win');
      sdk.complete({ stars, score, title: end.how === 'domino' ? 'دومينو! فزت' : 'فزت بالأقل', subtitle: end.how === 'domino' ? `خلّصت قطعك · ربحت ${score} نقطة` : `انسدت، ومجموعك أقل (${handPips(player)} ضد ${handPips(ai)})` });
    } else if (end.winner === 'draw') {
      g.sound('ok');
      sdk.complete({ stars: 1, score: 0, title: 'تعادل!', subtitle: 'انسدت ومجموعكم نفس الشي' });
    } else {
      g.sound('lose');
      sdk.over({ score: 0, title: 'فاز الجهاز', subtitle: end.how === 'domino' ? 'الجهاز خلّص قطعه أول' : `انسدت، ومجموعه أقل (${handPips(ai)} ضد ${handPips(player)})` });
    }
  };

  /** إذا ما عنده قطعة تنلعب: يسحب لحد ما يلگى أو يخلص المخزن. يرجع true إذا مرّر */
  const drawUntilPlayable = async (who: 'player' | 'ai') => {
    const hand = () => (who === 'player' ? player : ai);
    while (!playable(chain, hand()).length && stock.length) {
      const t = stock.pop() as Tile;
      if (who === 'player') player = [...player, t];
      else ai = [...ai, t];
      message = who === 'player' ? 'ما عندك قطعة — سحبت من المخزن' : 'الجهاز سحب من المخزن';
      g.sound('move');
      hud();
      await g.wait(350);
    }
    return !playable(chain, hand()).length;
  };

  const afterMove = async (who: 'player' | 'ai'): Promise<boolean> => {
    if ((who === 'player' ? player : ai).length === 0) {
      await finish({ winner: who, how: 'domino' });
      return true;
    }
    return false;
  };

  const aiTurn = async () => {
    turn = 'ai';
    await g.wait(600);
    if (await drawUntilPlayable('ai')) {
      passes++;
      message = 'الجهاز مرّر';
      if (passes >= 2) return finish(blockedResult(player, ai));
    } else {
      const m = aiMove(chain, ai, level, rand);
      if (m) {
        chain = place(chain, m.tile, m.side);
        ai = ai.filter((t) => t !== m.tile);
        passes = 0;
        message = '';
        g.sound('tap');
        if (await afterMove('ai')) return;
      }
    }
    turn = 'player';
    await playerCheck();
  };

  /** بداية دور اللاعب: إذا ما عنده شي ينلعب يسحب أو يمرّر تلقائياً */
  const playerCheck = async () => {
    if (await drawUntilPlayable('player')) {
      passes++;
      message = 'ما عندك قطعة والمخزن خلص — مرّرت';
      if (passes >= 2) return finish(blockedResult(player, ai));
      await g.wait(700);
      return aiTurn();
    }
    busy = false;
  };

  const playTile = async (t: Tile, side: Side) => {
    busy = true;
    choose = null;
    chain = place(chain, t, side);
    player = player.filter((x) => x !== t);
    passes = 0;
    message = '';
    g.sound('tap');
    if (await afterMove('player')) return;
    await aiTurn();
  };

  return {
    start(s) {
      level = s.level;
      stage = s.stage;
      rand = rng(stage * 9973 + (Date.now() % 1000)).next;
      const d = deal(Math.floor(rand() * 1e9));
      player = d.player;
      ai = d.ai;
      stock = d.stock;
      chain = [];
      passes = 0;
      over = false;
      busy = false;
      choose = null;
      // اللي يبدي يتبادل كل جولة
      turn = stage % 2 === 1 ? 'player' : 'ai';
      message = turn === 'player' ? 'إنت تبدي — اضغط أي قطعة' : 'الجهاز يبدي';
      hud();
      if (turn === 'ai') {
        busy = true;
        void aiTurn();
      }
    },
    down(p: Point) {
      if (busy || over || turn !== 'player') return;
      if (choose) {
        for (const b of sideBtns()) if (hit(b, p.x, p.y)) return void playTile(choose, b.side);
      }
      for (const h of handLayout()) {
        if (p.x >= h.x && p.x <= h.x + h.s && p.y >= h.y && p.y <= h.y + h.s * 2) {
          const sides = sidesFor(chain, h.t);
          if (!sides.length) {
            g.sound('bad');
            message = 'هاي القطعة ما تركب على الأطراف';
            return;
          }
          const e = ends(chain);
          if (sides.length === 1 || (e && e[0] === e[1])) return void playTile(h.t, sides[0]);
          choose = h.t;
          message = 'وين تحطها؟';
          g.sound('tap');
          return;
        }
      }
      choose = null;
    },
    draw(c) {
      clear(c, g.w, g.h, '#1C8B4A');
      // قماش الطاولة
      c.fillStyle = 'rgba(255,255,255,0.05)';
      for (let y = 8; y < g.h; y += 14) for (let x = 8; x < g.w; x += 14) c.fillRect(x, y, 2, 2);
      // قطع الجهاز (مقلوبة)
      const bs = 14;
      ai.forEach((_, i) => tile(c, [0, 0], g.w / 2 + (ai.length * bs * 1.2) / 2 - (i + 1) * bs * 1.2, 16, bs, true, { back: true }));
      text(c, `الجهاز: ${ai.length} قطع`, g.w / 2, 60, { size: 12, color: 'rgba(255,255,255,0.85)', weight: 600 });
      // السلسلة: تلتف على صفوف
      if (chain.length) {
        const s = chain.length > 16 ? 16 : chain.length > 10 ? 19 : 22;
        const per = Math.floor((g.w - 20) / (s * 2 + 3));
        const rows = Math.ceil(chain.length / per);
        const top = Math.max(84, (g.h - 300) / 2 - rows * (s + 8) / 2 + 40);
        chain.forEach((t, i) => {
          const row = Math.floor(i / per);
          const inRow = Math.min(per, chain.length - row * per);
          const k = i % per;
          const rowW = inRow * (s * 2 + 3);
          const x = (g.w - rowW) / 2 + k * (s * 2 + 3);
          const isEnd = i === 0 || i === chain.length - 1;
          tile(c, t, x, top + row * (s + 10), s, false, { glow: isEnd && !!choose });
        });
      } else text(c, 'الطاولة فاضية', g.w / 2, g.h / 2 - 60, { size: 15, color: 'rgba(255,255,255,0.7)' });
      const e = ends(chain);
      if (e) text(c, `الأطراف: ${e[0]} و ${e[1]}`, g.w / 2, g.h - 300, { size: 14, color: '#FFFFFF' });
      if (message) text(c, message, g.w / 2, g.h - 270, { size: 14, color: COLORS.yellow });
      if (choose) for (const b of sideBtns()) button(c, { ...b, primary: true });
      // قطع اللاعب
      const can = new Set(turn === 'player' && !busy ? playable(chain, player) : []);
      for (const h of handLayout()) tile(c, h.t, h.x, h.y - (h.t === choose ? 10 : 0), h.s, true, { dim: !can.has(h.t), glow: h.t === choose });
      text(c, `قطعك: ${player.length} · المخزن: ${stock.length}`, g.w / 2, g.h - 30, { size: 12, color: 'rgba(255,255,255,0.85)', weight: 600 });
    },
  };
});
