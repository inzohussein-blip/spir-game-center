/**
 * «نزّل البزون» — الإصدار 2 بالمحرك الجديد.
 * بزازين متحركة على لوحة خشب، قطع منزلقة، فتحات ملوّنة، وسبير يشجع من جوه.
 * المنطق (slide / solve) ما تغيّر — بـ logic.ts.
 */
import { Container, Graphics, Sprite, type Texture } from 'pixi.js';
import { badge, boardFrame, cloud, confetti, crate, floorTile, hole, roundBtn, SHAPES, sky, sparkle, THEMES, woodBlock, type ShapeName } from '../../packages/spir-art/index.ts';
import { bake, bakeCat, button, Cat, createScene, ease, label, sdk, type Level, type Point } from '../../packages/spir-engine/index.ts';
import levelsJson from './levels.json';
import { autoDropDir, initialState, slide, solve, starsFor, type Dir, type LevelDef, type Move, type Piece, type State } from './logic.ts';

const LEVELS = levelsJson as unknown as Record<Level, LevelDef[]>;
const COLORS = ['orange', 'pink', 'mint', 'grape'];
const HEX = [0xff9f43, 0xff7ab6, 0x3dd68c, 0x9b7bff];
const HINTS: Record<Level, number> = { easy: Infinity, medium: 3, hard: 0 };
const DELTA: Record<Dir, [number, number]> = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
const CELL_ART = 64;

void createScene(0x62c6ff, async (s) => {
  const px = s.px;
  // ---------- الرسوم الثابتة ----------
  const T = await bake(
    {
      crate: crate(CELL_ART),
      h1: woodBlock(1, false, CELL_ART),
      h2: woodBlock(2, false, CELL_ART),
      h3: woodBlock(3, false, CELL_ART),
      v2: woodBlock(2, true, CELL_ART),
      v3: woodBlock(3, true, CELL_ART),
      undo: roundBtn(58, '#FFFFFF', 'undo'),
      hint: roundBtn(58, '#FFC93C', 'hint'),
      spark: sparkle(),
      sparkW: sparkle('#FFFFFF'),
      ...Object.fromEntries(COLORS.map((c, i) => [`hole_${c}`, hole(c, SHAPES[i] as ShapeName, CELL_ART)])),
      ...Object.fromEntries(COLORS.map((c, i) => [`badge_${c}`, badge(c, SHAPES[i] as ShapeName)])),
      ...Object.fromEntries(['#FF6B5B', '#FFC93C', '#3DD68C', '#4FB8FF', '#9B7BFF', '#FF7AB6'].map((c, i) => [`conf${i}`, confetti(c)])),
    } as Record<string, { svg: string; w: number; h: number }>,
    px,
  );
  const confTex = [0, 1, 2, 3, 4, 5].map((i) => T[`conf${i}`]);
  const catTex = await Promise.all(COLORS.map((c) => bakeCat(c, px)));
  const spirTex = await bakeCat('orange', px);

  // ---------- عناصر المشهد ----------
  const skySprite = new Sprite();
  s.bg.addChild(skySprite);
  const clouds: { sp: Sprite; v: number }[] = [];
  const boardLayer = new Container();
  const frameSprite = new Sprite();
  const floor = new Container();
  const holesLayer = new Container();
  const pieces = new Container();
  pieces.sortableChildren = true;
  boardLayer.addChild(frameSprite, floor, holesLayer, pieces);
  s.world.addChild(boardLayer);
  const hintArrow = new Graphics();
  s.world.addChild(hintArrow);

  const spir = new Cat(spirTex, { scarf: true });
  s.ui.addChild(spir);
  const bubble = new Container();
  const bubbleBg = new Graphics();
  const bubbleText = label('', { size: 16, color: 0x2a2350, wrap: 190 });
  bubble.addChild(bubbleBg, bubbleText);
  s.ui.addChild(bubble);

  const undoBtn = button(s, T.undo, '', () => undo());
  const hintBtn = button(s, T.hint, '', () => showHint());
  const hintCount = label('', { size: 14, color: 0xffffff, stroke: 0x2a2350, strokeWidth: 5 });
  hintBtn.addChild(hintCount);
  hintCount.position.set(20, -20);
  s.ui.addChild(undoBtn, hintBtn);

  // ---------- حالة اللعبة ----------
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
  let cell = 64;
  let bx = 0;
  let by = 0;
  let catViews: Cat[] = [];
  let blockViews: Sprite[] = [];
  let drag: { piece: Piece; start: Point } | null = null;

  const pos = (x: number, y: number) => ({ x: bx + x * cell, y: by + y * cell });

  const say = (text: string, ms = 2600) => {
    bubbleText.text = text;
    const w = Math.min(210, bubbleText.width + 28);
    const h = bubbleText.height + 18;
    bubbleBg.clear().roundRect(-w / 2, -h / 2, w, h, 16).fill(0xffffff).stroke({ color: 0x2a2350, width: 3 });
    bubbleBg.moveTo(-w / 2 + 30, h / 2 - 1).lineTo(-w / 2 + 18, h / 2 + 14).lineTo(-w / 2 + 46, h / 2 - 1).fill(0xffffff);
    bubble.visible = true;
    bubble.scale.set(0.2);
    void s.tw.to(bubble.scale, { x: 1, y: 1 }, 320, ease.back);
    const mine = text;
    if (ms > 0) void s.tw.wait(ms).then(() => bubbleText.text === mine && (bubble.visible = false));
  };

  const hud = () => {
    const t = level === 'hard' && !timeUp ? ` · ${Math.ceil(timeLeft)} ث` : '';
    sdk.hud(`المرحلة ${stage} · ${THEMES[themeIdx()].name}`, `${moves} حركة${t}`);
  };
  const themeIdx = () => Math.floor((stage - 1) / 10) % THEMES.length;

  // ---------- البناء والترتيب ----------
  const layout = () => {
    const ft = floorTex;
    if (!ft) return;
    const size = def.size;
    const maxBoard = Math.min(s.w - 36, s.h - 250);
    cell = Math.min(80, maxBoard / size);
    const board = cell * size;
    bx = (s.w - board) / 2;
    by = Math.max(70, (s.h - board) / 2 - 40);
    frameSprite.position.set(bx - 14, by - 14);
    frameSprite.width = board + 28;
    frameSprite.height = board + 36;
    floor.removeChildren().forEach((c) => c.destroy());
    holesLayer.removeChildren().forEach((c) => c.destroy());
    for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
      const t = new Sprite(ft);
      const p = pos(x, y);
      t.position.set(p.x, p.y);
      t.width = cell;
      t.height = cell;
      floor.addChild(t);
    }
    for (const h of def.holes) {
      const sp = new Sprite(T[`hole_${COLORS[h.color]}`]);
      sp.anchor.set(0.5);
      const p = pos(h.x + 0.5, h.y + 0.5);
      sp.position.set(p.x, p.y);
      sp.width = sp.height = cell;
      holesLayer.addChild(sp);
    }
    for (const w of def.walls) {
      const sp = new Sprite(T.crate);
      const p = pos(w.x, w.y);
      sp.position.set(p.x, p.y);
      sp.width = sp.height = cell;
      sp.zIndex = w.y * 10 + 5;
      pieces.addChild(sp);
    }
    placePieces();
    const bottom = by + board + 30;
    spir.scale.set(0.62);
    spir.position.set(70, Math.min(s.h - 12, bottom + 128));
    bubble.position.set(spir.x + 120, spir.y - 130);
    undoBtn.position.set(s.w - 60, Math.min(s.h - 60, bottom + 62));
    hintBtn.position.set(s.w - 140, undoBtn.y);
    skySprite.width = s.w;
    skySprite.height = s.h;
  };

  let floorTex: Texture | null = null;

  const blockTex = (w: number, h: number) => (w > 1 ? T[`h${w}`] : h > 1 ? T[`v${h}`] : T.h1);

  const placePieces = () => {
    for (const v of catViews) v.destroy({ children: true });
    for (const v of blockViews) v.destroy();
    catViews = state.cats.map((c) => {
      const cat = new Cat(catTex[c.color]);
      const b = new Sprite(T[`badge_${COLORS[c.color]}`]);
      b.anchor.set(0.5);
      b.position.set(0, -72);
      b.scale.set(1.6);
      cat.head.addChild(b);
      cat.scale.set((cell * 1.05) / 190);
      cat.visible = c.x >= 0;
      pieces.addChild(cat);
      return cat;
    });
    blockViews = state.blocks.map((b) => {
      const sp = new Sprite(blockTex(b.w, b.h));
      sp.width = b.w * cell;
      sp.height = b.h * cell;
      pieces.addChild(sp);
      return sp;
    });
    state.cats.forEach((_, i) => syncCat(i));
    state.blocks.forEach((_, i) => syncBlock(i));
  };

  const syncCat = (i: number, ox = 0, oy = 0) => {
    const c = state.cats[i];
    const v = catViews[i];
    if (!v || c.x < 0) return;
    const p = pos(c.x + 0.5 + ox, c.y + 1 + oy);
    v.position.set(p.x, p.y - cell * 0.08);
    v.zIndex = (c.y + oy) * 10 + 8;
  };
  const syncBlock = (i: number, ox = 0, oy = 0) => {
    const b = state.blocks[i];
    const p = pos(b.x + ox, b.y + oy);
    blockViews[i].position.set(p.x, p.y);
    blockViews[i].zIndex = (b.y + oy + b.h - 1) * 10 + 4;
  };

  // ---------- الحركة ----------
  const viewOf = (p: Piece) => (p.kind === 'cat' ? catViews[p.i] : blockViews[p.i]);

  const doMove = async (piece: Piece, dir: Dir) => {
    const res = slide(def, state, piece, dir);
    const view = viewOf(piece);
    if (!res) {
      // ما يتحرك: هزّة صغيرة «لا»
      s.audio.play('bump');
      const x0 = view.x;
      void s.tw.run(260, (t) => (view.x = x0 + Math.sin(t * Math.PI * 4) * 5 * (1 - t)), ease.linear);
      if (piece.kind === 'cat') catViews[piece.i].setMood('surprised');
      return;
    }
    busy = true;
    hint = null;
    hintArrow.clear();
    history.push(state);
    moves++;
    hud();
    s.audio.play('slide');
    const [ux, uy] = DELTA[dir];
    const ms = Math.min(110 * res.steps + 60, 520);
    if (piece.kind === 'cat') {
      const cat = catViews[piece.i];
      cat.setMood('surprised');
      cat.lookAt(ux, uy);
      await s.tw.run(ms, (t) => syncCat(piece.i, ux * res.steps * t, uy * res.steps * t), ease.inOut);
      if (res.fell) {
        // يطيح بالفتحة: يدور ويصغر
        cat.setMood('happy');
        s.audio.play('meow');
        const sx = cat.scale.x;
        const y0 = cat.y;
        await s.tw.run(420, (t) => {
          cat.scale.set(sx * (1 - t * 0.95));
          cat.rotation = t * Math.PI * 1.5;
          cat.y = y0 - cell * 0.35 * t;
        }, ease.inQuad);
        cat.visible = false;
        s.audio.play('drop');
        const hp = pos(state.cats[piece.i].x + ux * res.steps + 0.5, state.cats[piece.i].y + uy * res.steps + 0.5);
        s.burst(hp.x, hp.y, [T.spark, T.sparkW], { count: 18, speed: 220, gravity: 300, size: 16 });
        sdk.vibrate();
        spir.setMood('happy');
        spir.cheer();
        void s.tw.wait(900).then(() => !done && spir.setMood('normal'));
      } else {
        s.audio.play('bump');
        void s.squash(cat);
        cat.setMood('normal');
        cat.lookAt(0, 0);
      }
    } else {
      await s.tw.run(ms, (t) => syncBlock(piece.i, ux * res.steps * t, uy * res.steps * t), ease.inOut);
      s.audio.play('bump');
      if (res.steps >= 3) s.shake(4, 180);
    }
    state = res.state;
    if (piece.kind === 'block') syncBlock(piece.i);
    else syncCat(piece.i);
    busy = false;
    if (state.cats.every((c) => c.x < 0)) await finish();
  };

  const finish = async () => {
    done = true;
    spir.setMood('happy');
    s.audio.play('win');
    const cx = s.w / 2;
    s.burst(cx, by - 10, confTex, { count: 46, speed: 420, gravity: 700, size: 14, spread: Math.PI * 0.9, up: 120 });
    for (let k = 0; k < 4; k++) void s.tw.wait(k * 350).then(() => spir.cheer());
    await s.tw.wait(1100);
    const stars = starsFor(def.par, moves, timeUp);
    sdk.complete({
      stars,
      score: moves,
      moves,
      timeUp,
      title: timeUp ? 'خلصتها!' : moves <= def.par ? 'حل مثالي!' : 'عاشت إيدك!',
      subtitle: timeUp ? `خلص الوقت، بس كمّلت المرحلة ${stage}` : `المرحلة ${stage} بـ ${moves} حركة (الأفضل ${def.par})`,
    });
  };

  const undo = () => {
    const prev = history.pop();
    if (!prev || busy || done) return;
    state = prev;
    moves++;
    hint = null;
    hintArrow.clear();
    placePieces();
    s.audio.play('whoosh');
    hud();
  };

  const showHint = () => {
    if (hintsLeft <= 0 || busy || done) return;
    const sol = solve(def, state, 150_000);
    if (!sol?.length) {
      spir.setMood('surprised');
      say('ارجع خطوة، من هنا صعبة');
      return;
    }
    hint = sol[0];
    if (hintsLeft !== Infinity) hintsLeft--;
    refreshHintBtn();
    spir.setMood('wink');
    say('جرّب هاي الحركة', 1800);
    s.audio.play('star');
  };

  const refreshHintBtn = () => {
    hintBtn.visible = HINTS[level] > 0;
    hintCount.text = hintsLeft === Infinity ? '' : String(hintsLeft);
    hintBtn.setEnabled(hintsLeft > 0);
  };

  const drawHint = () => {
    hintArrow.clear();
    if (!hint) return;
    const p = hint.piece.kind === 'cat' ? state.cats[hint.piece.i] : state.blocks[hint.piece.i];
    const w = hint.piece.kind === 'block' ? state.blocks[hint.piece.i].w : 1;
    const h = hint.piece.kind === 'block' ? state.blocks[hint.piece.i].h : 1;
    const [ux, uy] = DELTA[hint.dir];
    const pulse = 0.5 + 0.5 * Math.sin(s.tw.now / 160);
    const c = pos(p.x + w / 2 + ux * (w / 2 + 0.15 + pulse * 0.15), p.y + h / 2 + uy * (h / 2 + 0.15 + pulse * 0.15));
    const a = Math.atan2(uy, ux);
    const pt = (dx: number, dy: number) => [c.x + Math.cos(a) * dx - Math.sin(a) * dy, c.y + Math.sin(a) * dx + Math.cos(a) * dy];
    const [x1, y1] = pt(18, 0);
    const [x2, y2] = pt(-10, -16);
    const [x3, y3] = pt(-10, 16);
    hintArrow.poly([x1, y1, x2, y2, x3, y3]).fill(0xffc93c).stroke({ color: 0x2a2350, width: 4, join: 'round' });
  };

  // ---------- اللمس ----------
  const pieceAt = (p: Point): Piece | null => {
    const cx = Math.floor((p.x - bx) / cell);
    const cy = Math.floor((p.y - by) / cell);
    const ci = state.cats.findIndex((c) => c.x === cx && c.y === cy);
    if (ci >= 0) return { kind: 'cat', i: ci };
    const bi = state.blocks.findIndex((b) => cx >= b.x && cx < b.x + b.w && cy >= b.y && cy < b.y + b.h);
    return bi >= 0 ? { kind: 'block', i: bi } : null;
  };

  return {
    async start(st) {
      level = st.level;
      const list = LEVELS[level];
      stage = Math.min(Math.max(1, st.stage), list.length);
      def = list[stage - 1];
      state = initialState(def);
      history = [];
      moves = 0;
      hintsLeft = HINTS[level];
      hint = null;
      hintArrow.clear();
      timeLeft = def.time ?? 0;
      timeUp = false;
      done = false;
      busy = false;
      bubble.visible = false;
      const theme = THEMES[themeIdx()];
      const art = await bake({ sky: sky(theme, 390, 900), floor: floorTile(theme.tile, CELL_ART), frame: boardFrame(400, 408, theme.night ? '#5B46C9' : '#7B5CFF'), cloud: cloud(1, !!theme.night) }, px);
      skySprite.texture = art.sky;
      floorTex = art.floor;
      frameSprite.texture = art.frame;
      for (const c of clouds) c.sp.destroy();
      clouds.length = 0;
      for (let k = 0; k < 4; k++) {
        const sp = new Sprite(art.cloud);
        sp.scale.set(0.5 + Math.random() * 0.5);
        sp.position.set(Math.random() * s.w, 20 + Math.random() * 180);
        s.bg.addChild(sp);
        clouds.push({ sp, v: 6 + Math.random() * 10 });
      }
      layout();
      refreshHintBtn();
      spir.setMood('normal');
      // دخول: البزازين تنط لمكانها
      catViews.forEach((v, i) => {
        const sc = v.scale.x;
        v.scale.set(0);
        void s.tw.wait(120 * i).then(() => s.tw.run(420, (t) => v.scale.set(sc * t), ease.back));
      });
      if (level === 'easy' && stage <= 2) say('اسحب البزون لفتحة لونه', 3500);
      else if (level === 'hard') say('بالصعب أكو وقت، يلا بسرعة', 2200);
      s.audio.music(theme.night ? 57 : 60);
      hud();
    },
    layout,
    update(dt) {
      spir.update(dt);
      for (const v of catViews) if (v.visible) v.update(dt);
      for (const c of clouds) {
        c.sp.x -= (c.v * dt) / 1000;
        if (c.sp.x < -150) c.sp.x = s.w + 20;
      }
      drawHint();
      undoBtn.setEnabled(history.length > 0 && !busy);
      if (level !== 'hard' || done || timeUp) return;
      const before = Math.ceil(timeLeft);
      timeLeft -= dt / 1000;
      if (timeLeft <= 0) {
        timeUp = true;
        spir.setMood('surprised');
        say('خلص الوقت، كمّل بدون نجوم');
        s.audio.play('lose');
        hud();
      } else if (Math.ceil(timeLeft) !== before) hud();
    },
    down(p) {
      if (done || busy) return;
      const piece = pieceAt(p);
      if (!piece) return;
      drag = { piece, start: p };
      const v = viewOf(piece);
      void s.tw.to(v.scale, { x: v.scale.x * 1.06, y: v.scale.y * 1.06 }, 90);
      if (piece.kind === 'cat') catViews[piece.i].setMood('surprised');
      s.audio.play('tap');
    },
    up(p) {
      if (!drag) return;
      const { piece, start } = drag;
      drag = null;
      const v = viewOf(piece);
      if (piece.kind === 'cat') v.scale.set((cell * 1.05) / 190);
      else {
        const b = state.blocks[piece.i];
        v.width = b.w * cell;
        v.height = b.h * cell;
      }
      const dx = p.x - start.x;
      const dy = p.y - start.y;
      if (Math.hypot(dx, dy) < 14) {
        if (piece.kind === 'cat') {
          const d = level === 'easy' ? autoDropDir(def, state, piece.i) : null;
          if (d) void doMove(piece, d);
          else {
            catViews[piece.i].setMood('wink');
            s.audio.play('meow');
            void s.pop(catViews[piece.i], 1.1);
          }
        }
        return;
      }
      const dir: Dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : dy > 0 ? 'down' : 'up';
      void doMove(piece, dir);
    },
  };
});

