/**
 * «بلوكات الحلوى» — الإصدار 2: حلوى لامعة، انفجارات ملوّنة، وكومبو.
 * المنطق (canPlace / place / fitsAnywhere) بـ logic.ts.
 */
import { Container, Graphics, Sprite, type Texture } from 'pixi.js';
import { boardFrame, candy, CANDY, cloud, sky, sparkle, THEMES } from '../../packages/spir-art/index.ts';
import { bake, bakeCat, Cat, createScene, ease, label, rng, sdk, speechBubble, type Level, type Point } from '../../packages/spir-engine/index.ts';
import { canPlace, emptyGrid, fitsAnywhere, place, randomPiece, SIZE, STARS, starsFor, type Grid, type Piece } from './logic.ts';

const PRAISE = ['حلو!', 'رائع!', 'خرافي!', 'بطل!!'];

void createScene(0xffd6e8, async (s) => {
  const px = s.px;
  const T = await bake(
    {
      sky: sky({ ...THEMES[1], skyTop: '#FF9EC8', skyBottom: '#FFE9F3', hill1: '#FFC2DC', hill2: '#FF9EC8', ground: '#FF7AB6', sea: false, noSun: true }, 390, 900),
      frame: boardFrame(400, 408, '#FF7AB6'),
      cloud: cloud(1),
      spark: sparkle(),
      sparkW: sparkle('#FFFFFF'),
      ...Object.fromEntries(CANDY.map((c, i) => [`k${i}`, candy(c, 64)])),
    } as Record<string, { svg: string; w: number; h: number }>,
    px,
  );
  const kTex = CANDY.map((_, i) => T[`k${i}`] as Texture);
  const spir = new Cat(await bakeCat('orange', px), { scarf: true });

  const skySp = new Sprite(T.sky);
  s.bg.addChild(skySp);
  const frame = new Sprite(T.frame);
  const gridBg = new Graphics();
  const cellsLayer = new Container();
  const ghost = new Container();
  const trayLayer = new Container();
  const dragLayer = new Container();
  s.world.addChild(frame, gridBg, cellsLayer, ghost, trayLayer, dragLayer);
  s.ui.addChild(spir);
  const bubble = speechBubble(s, 200);
  s.ui.addChild(bubble.view);
  const praise = label('', { display: true, size: 46, color: 0xffffff, stroke: 0x2a2350, strokeWidth: 9 });
  praise.visible = false;
  s.ui.addChild(praise);
  const scoreText = label('0', { display: true, size: 40, color: 0xffffff, stroke: 0x2a2350, strokeWidth: 8 });
  s.ui.addChild(scoreText);

  let grid: Grid = emptyGrid();
  let views: (Sprite | null)[] = [];
  let tray: (Piece | null)[] = [null, null, null];
  let trayViews: (Container | null)[] = [null, null, null];
  let score = 0;
  let combo = 0;
  let level: Level = 'easy';
  let rand = rng(1).next;
  let over = false;
  let cs = 40;
  let ox = 20;
  let oy = 200;
  let trayY = 600;
  let drag: { i: number; view: Container; at: Point } | null = null;

  const dims = (p: Piece) => ({ w: Math.max(...p.cells.map((c) => c[0])) + 1, h: Math.max(...p.cells.map((c) => c[1])) + 1 });
  const slotX = (i: number) => s.w - (i + 0.5) * (s.w / 3);

  const pieceView = (p: Piece, size: number) => {
    const c = new Container();
    const { w, h } = dims(p);
    for (const [dx, dy] of p.cells) {
      const sp = new Sprite(kTex[p.color]);
      sp.width = sp.height = size;
      sp.position.set((dx - w / 2) * size, (dy - h / 2) * size);
      c.addChild(sp);
    }
    return c;
  };

  const drawCells = () => {
    for (const v of views) {
      if (!v) continue;
      s.tw.kill(v);
      v.destroy();
    }
    views = grid.map((v, i) => {
      if (v < 0) return null;
      const sp = new Sprite(kTex[v]);
      sp.position.set(ox + (i % SIZE) * cs, oy + Math.floor(i / SIZE) * cs);
      sp.width = sp.height = cs;
      cellsLayer.addChild(sp);
      return sp;
    });
  };

  const drawTray = () => {
    trayViews.forEach((v) => {
      if (!v) return;
      s.tw.kill(v);
      v.destroy({ children: true });
    });
    trayViews = tray.map((p, i) => {
      if (!p) return null;
      const { w, h } = dims(p);
      const size = Math.min(cs * 0.62, 92 / Math.max(w, h));
      const v = pieceView(p, size);
      v.position.set(slotX(i), trayY);
      v.alpha = fitsAnywhere(grid, p) ? 1 : 0.35;
      trayLayer.addChild(v);
      return v;
    });
  };

  const layout = () => {
    const board = Math.min(s.w - 36, s.h - 330);
    cs = board / SIZE;
    ox = (s.w - board) / 2;
    oy = Math.max(150, (s.h - board - 180) / 2 + 40);
    trayY = oy + board + 92;
    frame.position.set(ox - 14, oy - 14);
    frame.width = board + 28;
    frame.height = board + 36;
    gridBg.clear();
    for (let i = 0; i < SIZE * SIZE; i++) gridBg.roundRect(ox + (i % SIZE) * cs + 2, oy + Math.floor(i / SIZE) * cs + 2, cs - 4, cs - 4, cs * 0.2).fill({ color: 0xffffff, alpha: 0.22 });
    skySp.width = s.w;
    skySp.height = s.h;
    spir.scale.set(0.4);
    spir.position.set(56, oy - 22);
    bubble.view.position.set(spir.x + 128, spir.y - 70);
    scoreText.position.set(s.w - 70, oy - 60);
    drawCells();
    drawTray();
  };

  const hud = () => sdk.hud(`الهدف ${STARS[level][2]}`, `${score} نقطة`);

  const refill = () => {
    if (tray.every((p) => !p)) {
      tray = [0, 1, 2].map(() => randomPiece(level, rand));
      drawTray();
      trayViews.forEach((v, i) => {
        if (!v) return;
        v.x = s.w + 80;
        void s.tw.wait(i * 70).then(() => s.tw.to(v, { x: slotX(i) }, 320, ease.back));
      });
      s.audio.play('whoosh');
    }
  };

  const cellFor = (p: Piece, at: Point) => {
    const { w, h } = dims(p);
    const left = at.x - (w * cs) / 2;
    const top = at.y - h * cs - 50;
    return { x: Math.round((left - ox) / cs), y: Math.round((top - oy) / cs) };
  };

  const end = async () => {
    over = true;
    const stars = starsFor(level, score);
    await s.tw.wait(500);
    if (stars > 0) {
      spir.setMood('happy');
      s.audio.play('win');
      s.burst(s.w / 2, oy, kTex, { count: 40, speed: 380, gravity: 700, size: 18, spread: Math.PI * 0.9, up: 100 });
      await s.tw.wait(900);
      sdk.complete({ stars, score, title: 'ما بقى مكان!', subtitle: `جمعت ${score} نقطة` });
    } else {
      spir.setMood('surprised');
      s.audio.play('lose');
      await s.tw.wait(700);
      sdk.over({ score, title: 'ما بقى مكان', subtitle: `${score} نقطة — خلي مكان للقطع الكبيرة` });
    }
  };

  const showPraise = (lines: number) => {
    praise.text = PRAISE[Math.min(PRAISE.length - 1, lines - 1 + (combo > 1 ? 1 : 0))];
    praise.visible = true;
    praise.position.set(s.w / 2, oy + (SIZE * cs) / 2);
    praise.scale.set(0.2);
    praise.alpha = 1;
    void s.tw.run(700, (t) => {
      praise.scale.set(0.2 + Math.min(1, t * 3) * 0.9);
      praise.y = oy + (SIZE * cs) / 2 - t * 40;
      praise.alpha = t > 0.7 ? 1 - (t - 0.7) / 0.3 : 1;
    }, ease.out).then(() => (praise.visible = false));
  };

  /** القطعة تتبع الإصبع، وظل أبيض بالمكان اللي راح تنحط بيه */
  const moveDrag = (p: Point) => {
    if (!drag) return;
    drag.at = p;
    const piece = tray[drag.i];
    if (!piece) return;
    const { h } = dims(piece);
    drag.view.position.set(p.x, p.y - (h * cs) / 2 - 50);
    ghost.removeChildren().forEach((c) => c.destroy());
    const c = cellFor(piece, p);
    if (canPlace(grid, piece, c.x, c.y)) {
      for (const [dx, dy] of piece.cells) {
        ghost.addChild(new Graphics().roundRect(ox + (c.x + dx) * cs + 2, oy + (c.y + dy) * cs + 2, cs - 4, cs - 4, cs * 0.2).fill({ color: 0xffffff, alpha: 0.55 }));
      }
    }
  };

  return {
    start(st) {
      level = st.level;
      rand = rng(st.stage * 6151 + (Date.now() % 1009)).next;
      grid = emptyGrid();
      tray = [null, null, null];
      score = 0;
      combo = 0;
      over = false;
      layout();
      refill();
      scoreText.text = '0';
      spir.setMood('normal');
      bubble.say('اسحب الحلوى للوحة وعبّي صف كامل', 3000);
      s.audio.music(65);
      hud();
    },
    layout,
    update(dt) {
      spir.update(dt);
    },
    down(p) {
      if (over) return;
      for (let i = 0; i < 3; i++) {
        const piece = tray[i];
        const v = trayViews[i];
        if (!piece || !v) continue;
        if (Math.abs(p.x - slotX(i)) < s.w / 6 && Math.abs(p.y - trayY) < 70) {
          v.visible = false;
          const dv = pieceView(piece, cs);
          dragLayer.addChild(dv);
          drag = { i, view: dv, at: p };
          s.audio.play('tap');
          moveDrag(p);
        }
      }
    },
    move: (p) => moveDrag(p),
    up() {
      if (!drag) return;
      const d = drag;
      drag = null;
      ghost.removeChildren().forEach((c) => c.destroy());
      d.view.destroy({ children: true });
      const piece = tray[d.i];
      const tv = trayViews[d.i];
      if (!piece) return;
      const c = cellFor(piece, d.at);
      if (!canPlace(grid, piece, c.x, c.y)) {
        if (tv) tv.visible = true;
        s.audio.play('bump');
        return;
      }
      const r = place(grid, piece, c.x, c.y);
      tray[d.i] = null;
      if (tv) {
        s.tw.kill(tv);
        tv.destroy({ children: true });
      }
      trayViews[d.i] = null;
      // نرسم القطعة بمكانها قبل المسح
      const before = [...grid];
      for (const [dx, dy] of piece.cells) before[(c.y + dy) * SIZE + c.x + dx] = piece.color;
      grid = before;
      drawCells();
      for (const [dx, dy] of piece.cells) {
        const v = views[(c.y + dy) * SIZE + c.x + dx];
        if (v) void s.pop(v, 1.15, 180);
      }
      s.audio.play('pop');
      score += r.score;
      if (r.lines) {
        combo++;
        s.audio.play('clear');
        sdk.vibrate();
        s.shake(5 + r.lines * 2, 260);
        showPraise(r.lines);
        for (const i of r.cleared) {
          const v = views[i];
          if (!v) continue;
          const col = grid[i];
          s.burst(v.x + cs / 2, v.y + cs / 2, [kTex[col], T.spark], { count: 3, speed: 260, gravity: 900, size: cs * 0.45, life: 700 });
          void s.tw.run(220, (t) => {
            v.alpha = 1 - t;
            v.scale.set((cs / v.texture.width) * (1 + t * 0.4));
          }, ease.out);
        }
        spir.setMood('happy');
        spir.cheer();
        void s.tw.wait(800).then(() => !over && spir.setMood('normal'));
        void s.tw.wait(240).then(() => {
          grid = r.grid;
          drawCells();
        });
      } else {
        combo = 0;
        grid = r.grid;
      }
      scoreText.text = String(score);
      void s.pop(scoreText, 1.2);
      hud();
      refill();
      void s.tw.wait(260).then(() => {
        drawTray();
        if (!tray.filter((x): x is Piece => !!x).some((x) => fitsAnywhere(grid, x))) void end();
      });
    },
  };
});
