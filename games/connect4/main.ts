/**
 * «أربعة بخط» — الإصدار 2: قطع بوجوه بزازين ضد جراوي، لوحة بفتحات، والقطع تطيح وتنط.
 * ضد «بندق» الجرو (الجهاز) أو لاعبين. المنطق (minimax) بـ logic.ts.
 */
import { Container, Graphics, Sprite, type Texture } from 'pixi.js';
import { c4Board, confetti, discCat, discDog, sky, sparkle, THEMES } from '../../packages/spir-art/index.ts';
import { bake, bakeCat, Cat, createScene, ease, label, rng, sdk, speechBubble, type Level, type Point } from '../../packages/spir-engine/index.ts';
import { aiCol, COLS, drop, empty, ROWS, winner, type Board } from './logic.ts';

const CELL_ART = 64;

void createScene(0x62c6ff, async (s) => {
  const px = s.px;
  const T = await bake(
    {
      sky: sky({ ...THEMES[0], name: 'الساحة' }, 390, 900),
      board: c4Board(COLS, ROWS, CELL_ART),
      cat: discCat(CELL_ART),
      dog: discDog(CELL_ART),
      spark: sparkle(),
      ...Object.fromEntries(['#FF6B5B', '#FFC93C', '#3DD68C', '#4FB8FF', '#9B7BFF'].map((c, i) => [`c${i}`, confetti(c)])),
    } as Record<string, { svg: string; w: number; h: number }>,
    px,
  );
  const conf = [0, 1, 2, 3, 4].map((i) => T[`c${i}`]);
  const spir = new Cat(await bakeCat('orange', px), { scarf: true });

  const skySp = new Sprite(T.sky);
  s.bg.addChild(skySp);
  const discs = new Container();
  const boardSp = new Sprite(T.board);
  const winLine = new Graphics();
  const hover = new Sprite(T.cat);
  hover.anchor.set(0.5);
  hover.alpha = 0.85;
  s.world.addChild(discs, boardSp, winLine, hover);
  s.ui.addChild(spir);
  const bubble = speechBubble(s, 220);
  s.ui.addChild(bubble.view);
  const turnText = label('', { size: 20, color: 0xffffff, stroke: 0x2a2350, strokeWidth: 6 });
  s.ui.addChild(turnText);

  let board: Board = empty();
  let turn: 1 | 2 = 1;
  let level: Level = 'medium';
  let players: 1 | 2 = 1;
  let round = 1;
  let busy = false;
  let over = false;
  let rand = rng(1).next;
  let cs = 48;
  let ox = 20;
  let oy = 220;
  const views = new Map<number, Sprite>();
  const pad = () => (14 / CELL_ART) * cs;

  // العمود 0 على اليمين (عربي)
  const colX = (col: number) => ox + pad() + (COLS - 1 - col + 0.5) * cs;
  const rowY = (row: number) => oy + pad() + (row + 0.5) * cs;
  const colAt = (x: number) => {
    const k = Math.floor((x - ox - pad()) / cs);
    return k < 0 || k >= COLS ? -1 : COLS - 1 - k;
  };
  const name = (p: 1 | 2) => (players === 2 ? (p === 1 ? 'البزون' : 'الجرو') : p === 1 ? 'إنت' : 'بندق');

  const layout = () => {
    cs = Math.min(54, (s.w - 28) / (COLS + 28 / CELL_ART));
    const bw = cs * COLS + pad() * 2;
    const bh = cs * ROWS + pad() * 2;
    ox = (s.w - bw) / 2;
    oy = Math.max(170, (s.h - bh) / 2 - 20);
    boardSp.position.set(ox, oy);
    boardSp.width = bw;
    boardSp.height = bh * ((ROWS * CELL_ART + 36) / (ROWS * CELL_ART + 28));
    skySp.width = s.w;
    skySp.height = s.h;
    for (const [i, v] of views) {
      v.position.set(colX(i % COLS), rowY(Math.floor(i / COLS)));
      v.width = v.height = cs * 0.92;
    }
    hover.width = hover.height = cs * 0.92;
    hover.y = oy - cs * 0.55;
    turnText.position.set(s.w / 2, oy - cs * 1.4);
    spir.scale.set(0.45);
    spir.position.set(64, Math.min(s.h - 8, oy + bh + 140));
    bubble.view.position.set(spir.x + 130, spir.y - 110);
  };

  const hud = () => {
    sdk.hud(players === 2 ? `دور ${name(turn)}` : `الجولة ${round}`, players === 2 ? `الجولة ${round}` : turn === 1 ? 'دورك' : 'بندق يفكر');
    turnText.text = over ? '' : players === 2 ? `دور ${name(turn)}` : turn === 1 ? 'دورك! اختار عمود' : 'بندق يفكر…';
    hover.texture = (turn === 1 ? T.cat : T.dog) as Texture;
  };

  const play = async (col: number) => {
    const d = drop(board, col, turn);
    if (!d) return false;
    const sp = new Sprite((turn === 1 ? T.cat : T.dog) as Texture);
    sp.anchor.set(0.5);
    sp.width = sp.height = cs * 0.92;
    sp.position.set(colX(col), oy - cs * 0.6);
    discs.addChild(sp);
    views.set(d.row * COLS + col, sp);
    s.audio.play('whoosh');
    const y0 = sp.y;
    const y1 = rowY(d.row);
    await s.tw.run(180 + d.row * 55, (t) => (sp.y = y0 + (y1 - y0) * t), ease.bounce);
    s.audio.play('bump');
    board = d.board;
    return true;
  };

  const end = async () => {
    const w = winner(board);
    if (!w) return false;
    over = true;
    hover.visible = false;
    if (w !== 'draw') {
      const pts = w.line.map((i) => ({ x: colX(i % COLS), y: rowY(Math.floor(i / COLS)) }));
      await s.tw.run(420, (t) => {
        const e = pts[0];
        const f = pts[3];
        winLine.clear().moveTo(e.x, e.y).lineTo(e.x + (f.x - e.x) * t, e.y + (f.y - e.y) * t).stroke({ color: 0xffffff, width: 7, cap: 'round', alpha: 0.85 });
      });
      for (const i of w.line) {
        const v = views.get(i);
        if (v) void s.pop(v, 1.25, 400);
      }
    }
    turnText.text = '';
    hud();
    if (w === 'draw') {
      spir.setMood('surprised');
      s.audio.play('star');
      bubble.say('تعادل! اللوحة تعبّت');
      await s.tw.wait(1200);
      sdk.complete({ stars: 1, score: 0, title: 'تعادل!', subtitle: 'تعبّت اللوحة' });
    } else if (players === 2 || w.p === 1) {
      spir.setMood('happy');
      s.audio.play('win');
      s.burst(s.w / 2, oy, conf, { count: 44, speed: 400, gravity: 700, size: 13, spread: Math.PI * 0.9, up: 100 });
      for (let k = 0; k < 3; k++) void s.tw.wait(k * 360).then(() => spir.cheer());
      bubble.say(players === 2 ? `فاز ${name(w.p)}!` : 'غلبت بندق!');
      await s.tw.wait(1400);
      sdk.complete({ stars: 3, score: 1, title: players === 2 ? `فاز ${name(w.p)}!` : 'فزت!', subtitle: players === 2 ? `الجولة ${round}` : 'رتّبت أربعة قبل بندق' });
    } else {
      spir.setMood('surprised');
      s.audio.play('lose');
      bubble.say('بندق فاز! انتبه للخطوط المايلة');
      await s.tw.wait(1400);
      sdk.over({ score: 0, title: 'فاز بندق', subtitle: 'انتبه للخطوط المايلة!' });
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
      s.audio.play('bump');
      return;
    }
    if (await end()) return;
    turn = turn === 1 ? 2 : 1;
    hud();
    if (players === 1) {
      await s.tw.wait(380);
      await play(aiCol(board, 2, level, rand));
      if (await end()) return;
      turn = 1;
      hud();
    }
    busy = false;
  };

  return {
    start(st) {
      level = st.level;
      players = st.players;
      round = st.stage;
      board = empty();
      turn = 1;
      busy = false;
      over = false;
      rand = rng(Date.now() % 100003).next;
      for (const v of views.values()) v.destroy();
      views.clear();
      winLine.clear();
      hover.visible = true;
      layout();
      hud();
      spir.setMood('normal');
      bubble.say(players === 2 ? 'البزون ضد الجرو! أول واحد يرتّب أربعة' : 'إنت البزون الأصفر. رتّب أربعة قبل بندق', 3000);
      s.audio.music(62);
    },
    layout,
    update(dt) {
      spir.update(dt);
      hover.y = oy - cs * 0.55 + Math.sin(s.tw.now / 250) * 3;
    },
    move(p) {
      const col = colAt(p.x);
      if (col >= 0 && !busy) hover.x = colX(col);
    },
    down(p) {
      const col = colAt(p.x);
      if (col >= 0 && !busy) hover.x = colX(col);
    },
    up: (p) => void tap(p),
  };
});
