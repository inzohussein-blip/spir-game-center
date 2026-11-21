/**
 * «حاصر البزون» — الإصدار 2: مرج عشب سداسي، شجيرات تنبت، والبزون المشاكس «ميشو» ينط ويحاول يهرب.
 * سبير يشجع من جوه. المنطق (BFS وحركة البزون) بـ logic.ts ما تغيّر.
 */
import { Container, Graphics, Sprite } from 'pixi.js';
import { bush, cloud, confetti, hexGrass, sky, sparkle, THEMES } from '../../packages/spir-art/index.ts';
import { bake, bakeCat, Cat, createScene, ease, rng, sdk, speechBubble, type Level, type Point } from '../../packages/spir-engine/index.ts';
import { catMove, makeBoard, neighbors, starsFor, xy, type Board } from './logic.ts';

void createScene(0x62c6ff, async (s) => {
  const px = s.px;
  const T = await bake(
    {
      sky: sky(THEMES[0], 390, 900),
      hex: hexGrass(64),
      bush: bush(64),
      cloud: cloud(1),
      spark: sparkle(),
      leaf: sparkle('#3DD68C'),
      ...Object.fromEntries(['#FF6B5B', '#FFC93C', '#3DD68C', '#4FB8FF', '#9B7BFF'].map((c, i) => [`c${i}`, confetti(c)])),
    } as Record<string, { svg: string; w: number; h: number }>,
    px,
  );
  const conf = [0, 1, 2, 3, 4].map((i) => T[`c${i}`]);
  const mishoTex = await bakeCat('gray', px);
  const spirTex = await bakeCat('orange', px);

  const skySp = new Sprite(T.sky);
  s.bg.addChild(skySp);
  const clouds = [0, 1, 2].map((k) => {
    const c = new Sprite(T.cloud);
    c.scale.set(0.5 + k * 0.15);
    c.position.set(k * 140, 40 + k * 60);
    s.bg.addChild(c);
    return c;
  });
  const ground = new Graphics();
  s.world.addChild(ground);
  const board = new Container();
  board.sortableChildren = true;
  s.world.addChild(board);

  const misho = new Cat(mishoTex);
  board.addChild(misho);
  const spir = new Cat(spirTex, { scarf: true });
  s.ui.addChild(spir);
  const bubble = speechBubble(s, 240);
  s.ui.addChild(bubble.view);
  /** نص سبير (فارغ = اخفِ الفقاعة) */
  const tip = { set text(v: string) { if (v) bubble.say(v, 3200); else bubble.hide(); } };

  let b: Board = makeBoard('easy', 1);
  let level: Level = 'easy';
  let stage = 1;
  let moves = 0;
  let busy = false;
  let over = false;
  let rand = rng(1).next;
  let cell = 32;
  const left = 12;
  let top = 200;
  let hexes: Sprite[] = [];
  const bushes = new Map<number, Sprite>();

  const center = (i: number) => {
    const { x, y } = xy(b.n, i);
    return { x: left + cell * 0.5 + x * cell + (y % 2 ? cell / 2 : 0), y: top + y * cell * 0.87 };
  };

  const layout = () => {
    cell = (s.w - left * 2) / (b.n + 0.5);
    const h = cell * 0.87 * (b.n - 1) + cell;
    top = Math.max(110, (s.h - h) / 2 - 30) + cell / 2;
    skySp.width = s.w;
    skySp.height = s.h;
    const gh = cell * 0.87 * (b.n - 1) + cell;
    ground.clear().roundRect(4, top - cell / 2 - 6, s.w - 8, gh + 18, 26).fill({ color: 0x2a2350, alpha: 0.35 });
    ground.roundRect(4, top - cell / 2 - 12, s.w - 8, gh + 18, 26).fill(0x2fa866).stroke({ color: 0x2a2350, width: 4 });
    hexes.forEach((hx, i) => {
      const c = center(i);
      hx.position.set(c.x, c.y);
      hx.width = cell * 1.08;
      hx.height = cell * 1.08;
    });
    for (const [i, sp] of bushes) {
      const c = center(i);
      sp.position.set(c.x, c.y + cell * 0.35);
      sp.width = sp.height = cell * 1.12;
    }
    const m = center(b.cat);
    misho.position.set(m.x, m.y + cell * 0.3);
    misho.scale.set((cell * 1.5) / 190);
    spir.scale.set(0.5);
    spir.position.set(66, Math.min(s.h - 10, top + h + 120));
    bubble.view.position.set(spir.x + 140, spir.y - 120);
  };

  const hud = () => sdk.hud(`المرحلة ${stage}`, `${moves} حركة`);

  const growBush = (i: number, animate: boolean) => {
    const sp = new Sprite(T.bush);
    sp.anchor.set(0.5, 0.85);
    const c = center(i);
    sp.position.set(c.x, c.y + cell * 0.35);
    sp.zIndex = c.y + 1;
    board.addChild(sp);
    bushes.set(i, sp);
    const full = cell * 1.12;
    if (!animate) {
      sp.width = sp.height = full;
      return;
    }
    sp.width = sp.height = 1;
    void s.tw.run(340, (t) => (sp.width = sp.height = Math.max(1, full * t)), ease.back);
    s.burst(c.x, c.y, [T.leaf], { count: 6, speed: 120, gravity: 300, size: 10, life: 500 });
  };

  const win = async () => {
    over = true;
    misho.setMood('sleepy');
    spir.setMood('happy');
    s.audio.play('win');
    s.burst(s.w / 2, top, conf, { count: 40, speed: 380, gravity: 700, size: 13, spread: Math.PI * 0.9, up: 100 });
    for (let k = 0; k < 3; k++) void s.tw.wait(k * 380).then(() => spir.cheer());
    tip.text = 'حاصرته! ميشو استسلم';
    await s.tw.wait(1300);
    sdk.complete({ stars: starsFor(level, moves), score: moves, moves, title: 'حاصرته!', subtitle: `المرحلة ${stage} بـ ${moves} حركة` });
  };

  const lose = async () => {
    over = true;
    misho.setMood('wink');
    spir.setMood('surprised');
    s.audio.play('meow');
    tip.text = 'هرب ميشو! هاهاها';
    const c = center(b.cat);
    const dx = c.x < s.w / 2 ? -1 : 1;
    const dy = c.y < top + cell * 4 ? -1 : 1;
    const x0 = misho.x;
    const y0 = misho.y;
    await s.tw.run(700, (t) => {
      misho.x = x0 + dx * 160 * t;
      misho.y = y0 + dy * 60 * t - Math.abs(Math.sin(t * Math.PI * 3)) * 26;
      misho.alpha = 1 - t * 0.6;
    }, ease.linear);
    s.audio.play('lose');
    await s.tw.wait(400);
    sdk.over({ score: moves, title: 'هرب ميشو!', subtitle: 'سدّ الطريق اللي يمشي بيه من وكت' });
  };

  const catTurn = async () => {
    const m = catMove(b, level, rand);
    if (m.kind === 'trapped') return win();
    if (m.kind === 'escape') return lose();
    const from = center(b.cat);
    const to = center(m.to);
    b.cat = m.to;
    misho.lookAt(Math.sign(to.x - from.x), Math.sign(to.y - from.y));
    const freeAround = neighbors(b.n, m.to).filter((i) => !b.blocked[i]).length;
    misho.setMood(freeAround <= 2 ? 'scared' : 'normal');
    s.audio.play('pop');
    await s.tw.run(260, (t) => {
      misho.x = from.x + (to.x - from.x) * t;
      misho.y = from.y + cell * 0.3 + (to.y - from.y) * t - Math.sin(t * Math.PI) * cell * 0.7;
    }, ease.inOut);
    misho.zIndex = to.y + 2;
    void s.squash(misho, 220);
    if (catMove(b, level, () => 0.99).kind === 'trapped') await win();
    else if (freeAround <= 2 && !over) tip.text = 'قربت! ميشو خايف';
  };

  const tap = async (p: Point) => {
    if (busy || over) return;
    let hit = -1;
    let best = cell * 0.55;
    for (let i = 0; i < b.n * b.n; i++) {
      const c = center(i);
      const d = Math.hypot(c.x - p.x, c.y - p.y);
      if (d < best) {
        best = d;
        hit = i;
      }
    }
    if (hit < 0) return;
    if (hit === b.cat) {
      s.audio.play('meow');
      misho.setMood('wink');
      void s.pop(misho, 1.1);
      return;
    }
    if (b.blocked[hit]) {
      s.audio.play('bump');
      return;
    }
    busy = true;
    tip.text = '';
    b.blocked[hit] = true;
    moves++;
    hud();
    s.audio.play('tap');
    growBush(hit, true);
    await s.tw.wait(140);
    await catTurn();
    busy = false;
  };

  return {
    start(st) {
      level = st.level;
      stage = st.stage;
      b = makeBoard(level, stage);
      rand = rng(stage * 31 + 7).next;
      moves = 0;
      busy = false;
      over = false;
      for (const h of hexes) h.destroy();
      for (const sp of bushes.values()) sp.destroy();
      bushes.clear();
      layout();
      hexes = Array.from({ length: b.n * b.n }, (_, i) => {
        const sp = new Sprite(T.hex);
        sp.anchor.set(0.5);
        const c = center(i);
        sp.position.set(c.x, c.y);
        sp.width = sp.height = cell * 1.08;
        sp.zIndex = -1000;
        board.addChild(sp);
        return sp;
      });
      b.blocked.forEach((on, i) => on && growBush(i, false));
      misho.alpha = 1;
      misho.setMood('normal');
      spir.setMood('normal');
      layout();
      misho.zIndex = center(b.cat).y + 2;
      misho.scale.set(0);
      void s.tw.run(420, (t) => misho.scale.set(((cell * 1.5) / 190) * t), ease.back);
      tip.text = level === 'easy' && stage <= 2 ? 'اضغط العشب حتى تنبت شجيرة وتسد الطريق' : 'لا تخلي ميشو يوصل للحافة!';
      s.audio.music(64);
      hud();
    },
    layout,
    update(dt) {
      misho.update(dt);
      spir.update(dt);
      for (const c of clouds) {
        c.x -= dt * 0.008;
        if (c.x < -120) c.x = 400;
      }
    },
    down: (p) => void tap(p),
  };
});
