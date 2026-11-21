/**
 * «دمج المخلوقات» — الإصدار 2: بدل الأرقام، 11 مخلوق «سبيرات» يكبرون بالدمج.
 * المنطق (moveTrace / spawn / canMove) بـ logic.ts.
 */
import { Container, Sprite, type Texture } from 'pixi.js';
import { boardFrame, cloud, confetti, creature, CREATURES, mergeCell, sky, sparkle, THEMES, tierTile } from '../../packages/spir-art/index.ts';
import { bake, bakeCat, Cat, createScene, ease, label, rng, sdk, speechBubble, type Level, type Point } from '../../packages/spir-engine/index.ts';
import { swipeDir } from '../../packages/spir-kit/input.ts';
import { canMove, moveTrace, SIZE, spawn, starsFor, TARGET, tierOf, type Grid } from './logic.ts';

void createScene(0x8fb8ff, async (s) => {
  const px = s.px;
  const tiers = CREATURES.map((_, i) => i);
  const T = await bake(
    {
      sky: sky(THEMES[2], 390, 900),
      frame: boardFrame(400, 408, '#7B5CFF'),
      cell: mergeCell(96, '#EDE6FF'),
      cloud: cloud(1),
      spark: sparkle(),
      sparkW: sparkle('#FFFFFF'),
      ...Object.fromEntries(tiers.map((t) => [`cr${t}`, creature(t, 96)])),
      ...Object.fromEntries(tiers.map((t) => [`tile${t}`, tierTile(t, 96)])),
      ...Object.fromEntries(['#FF6B5B', '#FFC93C', '#3DD68C', '#4FB8FF', '#9B7BFF'].map((c, i) => [`c${i}`, confetti(c)])),
    } as Record<string, { svg: string; w: number; h: number }>,
    px,
  );
  const conf = [0, 1, 2, 3, 4].map((i) => T[`c${i}`]);
  const spir = new Cat(await bakeCat('orange', px), { scarf: true });

  const skySp = new Sprite(T.sky);
  s.bg.addChild(skySp);
  const cl = new Sprite(T.cloud);
  cl.scale.set(0.6);
  cl.position.set(20, 60);
  s.bg.addChild(cl);

  const frame = new Sprite(T.frame);
  const cells = new Container();
  const tilesLayer = new Container();
  s.world.addChild(frame, cells, tilesLayer);

  // الهدف فوق
  const goal = new Container();
  const goalLabel = label('الهدف', { size: 15, color: 0x2a2350 });
  const goalIcon = new Sprite();
  goalIcon.anchor.set(0.5);
  const goalName = label('', { size: 18, color: 0xffffff, stroke: 0x2a2350, strokeWidth: 6 });
  goal.addChild(goalLabel, goalIcon, goalName);
  s.ui.addChild(goal);

  s.ui.addChild(spir);
  const bubble = speechBubble(s, 230);
  s.ui.addChild(bubble.view);

  let grid: Grid = new Array(SIZE * SIZE).fill(0);
  let views: (Container | null)[] = new Array(SIZE * SIZE).fill(null);
  let score = 0;
  let moves = 0;
  let level: Level = 'easy';
  let rand = rng(1).next;
  let busy = false;
  let over = false;
  let seen = new Set<number>();
  let start: Point | null = null;
  let cs = 80;
  let ox = 20;
  let oy = 200;
  const gap = 8;

  const cellPos = (i: number) => ({ x: ox + (i % SIZE) * (cs + gap) + cs / 2, y: oy + Math.floor(i / SIZE) * (cs + gap) + cs / 2 });

  const makeTile = (v: number) => {
    const t = tierOf(v);
    const c = new Container();
    const bg = new Sprite(T[`tile${t}`] as Texture);
    bg.anchor.set(0.5, 0.48);
    bg.width = cs;
    bg.height = cs * (101 / 96);
    const cr = new Sprite(T[`cr${t}`] as Texture);
    cr.anchor.set(0.5);
    cr.width = cr.height = cs * 1.02;
    c.addChild(bg, cr);
    return c;
  };

  const rebuild = (pops: Set<number>, spawned: number | null) => {
    for (const v of views) v?.destroy({ children: true });
    views = grid.map((v, i) => {
      if (!v) return null;
      const tile = makeTile(v);
      const p = cellPos(i);
      tile.position.set(p.x, p.y);
      tilesLayer.addChild(tile);
      if (pops.has(i)) void s.pop(tile, 1.25, 280);
      if (i === spawned) {
        tile.scale.set(0);
        void s.tw.run(240, (k) => tile.scale.set(k), ease.back);
      }
      return tile;
    });
  };

  const layout = () => {
    cs = Math.min(86, (s.w - 40 - gap * (SIZE - 1)) / SIZE);
    const board = cs * SIZE + gap * (SIZE - 1);
    ox = (s.w - board) / 2;
    oy = Math.max(170, (s.h - board) / 2 - 10);
    frame.position.set(ox - 16, oy - 16);
    frame.width = board + 32;
    frame.height = board + 40;
    skySp.width = s.w;
    skySp.height = s.h;
    cells.removeChildren().forEach((c) => c.destroy());
    for (let i = 0; i < SIZE * SIZE; i++) {
      const sp = new Sprite(T.cell);
      sp.anchor.set(0.5);
      const p = cellPos(i);
      sp.position.set(p.x, p.y);
      sp.width = sp.height = cs;
      cells.addChild(sp);
    }
    goal.position.set(s.w / 2, oy - 82);
    goalLabel.position.set(70, -4);
    goalIcon.position.set(0, -6);
    goalIcon.width = goalIcon.height = 64;
    goalName.position.set(-80, -4);
    spir.scale.set(0.46);
    spir.position.set(64, Math.min(s.h - 8, oy + board + 140));
    bubble.view.position.set(spir.x + 130, spir.y - 110);
    for (const v of views) v?.destroy({ children: true });
    views = new Array(SIZE * SIZE).fill(null);
    rebuild(new Set(), null);
  };

  const hud = () => sdk.hud(`الهدف: ${CREATURES[tierOf(TARGET[level])].name}`, `${score} نقطة`);
  const maxTile = () => Math.max(...grid);

  const finish = async (reached: boolean) => {
    over = true;
    const stars = starsFor(level, maxTile());
    if (reached || stars > 0) {
      spir.setMood('happy');
      s.audio.play('win');
      s.burst(s.w / 2, oy, conf, { count: 44, speed: 400, gravity: 700, size: 13, spread: Math.PI * 0.9, up: 100 });
      for (let k = 0; k < 3; k++) void s.tw.wait(k * 360).then(() => spir.cheer());
    } else {
      spir.setMood('surprised');
      s.audio.play('lose');
    }
    await s.tw.wait(1200);
    const top = CREATURES[tierOf(maxTile())].name;
    if (reached) sdk.complete({ stars: 3, score, moves, title: `وصلت لـ «${CREATURES[tierOf(TARGET[level])].name}»!`, subtitle: `${score} نقطة بـ ${moves} حركة` });
    else if (stars > 0) sdk.complete({ stars, score, moves, title: 'انسدت اللوحة', subtitle: `أكبر مخلوق: «${top}» · ${score} نقطة` });
    else sdk.over({ score, title: 'انسدت اللوحة', subtitle: `أكبر مخلوق: «${top}» — حاول تجمعهم بزاوية` });
  };

  const doMove = async (dir: 'up' | 'down' | 'left' | 'right') => {
    if (busy || over) return;
    const r = moveTrace(grid, dir);
    if (!r.moved) {
      s.audio.play('bump');
      s.shake(3, 140);
      return;
    }
    busy = true;
    moves++;
    s.audio.play('slide');
    // نحرّك المربعات القديمة لأماكنها الجديدة
    const anims = r.steps.map((st) => {
      const v = views[st.from];
      if (!v) return Promise.resolve();
      const a = { x: v.x, y: v.y };
      const b = cellPos(st.to);
      if (st.merged) v.zIndex = -1;
      return s.tw.run(110, (t) => v.position.set(a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t), ease.out);
    });
    await Promise.all(anims);
    grid = r.grid;
    score += r.score;
    const merged = new Set(r.steps.filter((st) => st.merged).map((st) => st.to));
    const sp = spawn(grid, rand);
    if (sp) grid = sp.grid;
    rebuild(merged, sp?.at ?? null);
    if (merged.size) {
      s.audio.play('merge');
      for (const i of merged) {
        const p = cellPos(i);
        s.burst(p.x, p.y, [T.spark, T.sparkW], { count: 8, speed: 160, gravity: 200, size: 12, life: 600 });
        const t = tierOf(grid[i]);
        if (!seen.has(t)) {
          seen.add(t);
          if (t >= 3) {
            spir.setMood('surprised');
            bubble.say(`واو! طلع «${CREATURES[t].name}»`, 1800);
            s.audio.play('star');
            void s.tw.wait(900).then(() => spir.setMood('normal'));
          }
        }
      }
    }
    hud();
    busy = false;
    if (maxTile() >= TARGET[level]) await finish(true);
    else if (!canMove(grid)) await finish(false);
  };

  return {
    start(st) {
      level = st.level;
      rand = rng(st.stage * 4099 + (Date.now() % 997)).next;
      grid = new Array(SIZE * SIZE).fill(0);
      for (let k = 0; k < 2; k++) grid = spawn(grid, rand)?.grid ?? grid;
      score = 0;
      moves = 0;
      over = false;
      busy = false;
      seen = new Set([0, 1]);
      goalIcon.texture = T[`cr${tierOf(TARGET[level])}`] as Texture;
      goalName.text = `«${CREATURES[tierOf(TARGET[level])].name}»`;
      layout();
      spir.setMood('normal');
      bubble.say(level === 'easy' ? 'اسحب حتى يندمجون ويكبرون' : `وصّلهم لـ «${CREATURES[tierOf(TARGET[level])].name}»`, 3000);
      s.audio.music(60);
      hud();
    },
    layout,
    update(dt) {
      spir.update(dt);
      cl.x -= dt * 0.006;
      if (cl.x < -100) cl.x = 400;
      const k = 1 + Math.sin(s.tw.now / 400) * 0.05;
      goalIcon.scale.set((64 / goalIcon.texture.width) * k);
    },
    down: (p) => (start = p),
    up(p) {
      if (!start) return;
      const d = swipeDir(start, p, 22);
      start = null;
      if (d) void doMove(d);
    },
  };
});
