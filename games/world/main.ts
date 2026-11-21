/**
 * «عالم سبير»: خريطة جزيرة تنسحب بالطول، فيها مكان لكل لعبة على طريق متعرّج.
 * سبير يمشي (ينط) للمكان اللي تختاره، وبعدها التطبيق يفتحه.
 * الأماكن تنفتح بالنجوم. البيانات تجي من التطبيق برسالة state.
 */
import { Container, Graphics, Sprite, type Texture } from 'pixi.js';
import { arcadeBuilding, arenaBuilding, candyBuilding, cloud, coin, flower, gardenBuilding, houseBuilding, island, labBuilding, lockBadge, meadowBuilding, ribbon, sea, sparkle, starIcon, tree } from '../../packages/spir-art/index.ts';
import { bake, bakeCat, Cat, createScene, ease, label, send, type Point } from '../../packages/spir-engine/index.ts';
import { LOCATIONS, unlocked, type WorldState } from './locations.ts';

const SPACING = 205;
const TOP = 210;
const BOTTOM = 170;

void createScene(0x6fd0ff, async (s) => {
  const px = s.px;
  const mapH = TOP + BOTTOM + SPACING * (LOCATIONS.length - 1);
  const T = await bake(
    {
      sea: sea(390, mapH + 400),
      island: island(370, mapH - 40),
      lock: lockBadge(),
      star: starIcon(30),
      coin: coin(30),
      ribbon: ribbon(200, '#FF6B5B'),
      ribbonOff: ribbon(200, '#9AA0BC'),
      cloud: cloud(1),
      spark: sparkle(),
      t0: tree(0),
      t1: tree(1),
      t2: tree(2),
      f0: flower('#FF7AB6'),
      f1: flower('#FFC93C'),
      f2: flower('#9B7BFF'),
      ...Object.fromEntries(LOCATIONS.map((l) => [l.id, { house: houseBuilding, 'drop-cat': gardenBuilding, 'trap-cat': meadowBuilding, merge: labBuilding, blocks: candyBuilding, connect4: arenaBuilding, classics: arcadeBuilding }[l.id]!()])),
    } as Record<string, { svg: string; w: number; h: number }>,
    px,
  );
  const spirTex = await bakeCat('orange', px);

  let state: WorldState = { name: '', coins: 0, stars: 0, games: {}, last: 'house' };

  // ---------- الخريطة ----------
  const map = new Container();
  s.world.addChild(map);
  const seaSp = new Sprite(T.sea);
  seaSp.y = -200;
  const islandSp = new Sprite(T.island);
  islandSp.position.set(10, 20);
  const path = new Graphics();
  const decor = new Container();
  const places = new Container();
  places.sortableChildren = true;
  map.addChild(seaSp, islandSp, path, decor, places);

  /** موضع المكان رقم i (0 = تحت) */
  const spot = (i: number) => ({ x: i % 2 === 0 ? 150 : 250, y: mapH - BOTTOM - i * SPACING });

  // الطريق: منحنيات رمل بخط متقطع أبيض
  const drawPath = () => {
    path.clear();
    for (let i = 0; i < LOCATIONS.length - 1; i++) {
      const a = spot(i);
      const b = spot(i + 1);
      const my = (a.y + b.y) / 2;
      path.moveTo(a.x, a.y).bezierCurveTo(a.x, my, b.x, my, b.x, b.y);
    }
    path.stroke({ color: 0x2a2350, width: 34, cap: 'round', join: 'round' });
    for (let i = 0; i < LOCATIONS.length - 1; i++) {
      const a = spot(i);
      const b = spot(i + 1);
      const my = (a.y + b.y) / 2;
      path.moveTo(a.x, a.y).bezierCurveTo(a.x, my, b.x, my, b.x, b.y);
    }
    path.stroke({ color: 0xf5d58a, width: 26, cap: 'round', join: 'round' });
    // نقاط بالنص
    for (let i = 0; i < LOCATIONS.length - 1; i++) {
      const a = spot(i);
      const b = spot(i + 1);
      const my = (a.y + b.y) / 2;
      for (let k = 1; k < 10; k++) {
        const t = k / 10;
        const x = (1 - t) ** 3 * a.x + 3 * (1 - t) ** 2 * t * a.x + 3 * (1 - t) * t ** 2 * b.x + t ** 3 * b.x;
        const y = (1 - t) ** 3 * a.y + 3 * (1 - t) ** 2 * t * my + 3 * (1 - t) * t ** 2 * my + t ** 3 * b.y;
        path.circle(x, y, 3.5).fill({ color: 0xffffff, alpha: 0.8 });
      }
    }
  };
  drawPath();

  // زينة: أشجار وورود بمواضع ثابتة (بعيدة عن الطريق)
  for (let i = 0; i < 26; i++) {
    const y = 120 + ((i * 397) % (mapH - 260));
    const left = i % 2 === 0;
    const x = left ? 34 + ((i * 13) % 40) : 316 + ((i * 17) % 34);
    const sp = new Sprite(i % 3 === 0 ? T[`f${i % 3}`] : T[`t${i % 3}`]);
    sp.anchor.set(0.5, 1);
    sp.position.set(x, y);
    sp.scale.set(i % 3 === 0 ? 1 : 0.75 + ((i * 7) % 5) / 10);
    decor.addChild(sp);
  }

  // ---------- الأماكن ----------
  type PlaceView = { root: Container; building: Sprite; ribbon: Sprite; title: ReturnType<typeof label>; sub: ReturnType<typeof label>; lock: Sprite; need: ReturnType<typeof label>; daily: Container };
  const views: PlaceView[] = LOCATIONS.map((loc, i) => {
    const p = spot(i);
    const root = new Container();
    root.position.set(p.x, p.y);
    root.zIndex = p.y;
    const building = new Sprite(T[loc.id] as Texture);
    building.anchor.set(0.5, 0.82);
    const rb = new Sprite(T.ribbon);
    rb.anchor.set(0.5, 0);
    rb.position.set(0, 28);
    rb.scale.set(0.8);
    const title = label(loc.title, { size: 16, color: 0xffffff, stroke: 0x2a2350, strokeWidth: 5 });
    title.position.set(0, 45);
    const sub = label(loc.sub, { size: 13, color: 0x2a2350, weight: '600' });
    sub.position.set(0, 78);
    const lock = new Sprite(T.lock);
    lock.anchor.set(0.5);
    lock.position.set(0, -62);
    const need = label('', { size: 13, color: 0x2a2350, stroke: 0xffffff, strokeWidth: 4 });
    need.position.set(0, -26);
    const daily = new Container();
    const dBg = new Graphics().roundRect(-62, -16, 124, 32, 16).fill(0xffc93c).stroke({ color: 0x2a2350, width: 3 });
    const dStar = new Sprite(T.star);
    dStar.anchor.set(0.5);
    dStar.position.set(44, 0);
    dStar.scale.set(0.75);
    const dText = label('تحدّي اليوم', { size: 14, color: 0x2a2350 });
    dText.x = -10;
    daily.addChild(dBg, dStar, dText);
    daily.position.set(0, -132);
    root.addChild(building, rb, title, sub, lock, need, daily);
    root.eventMode = 'static';
    root.cursor = 'pointer';
    places.addChild(root);
    return { root, building, ribbon: rb, title, sub, lock, need, daily };
  });

  const refresh = () => {
    LOCATIONS.forEach((loc, i) => {
      const v = views[i];
      const open = unlocked(loc, state);
      v.lock.visible = !open;
      v.need.visible = !open;
      v.need.text = `يحتاج ${loc.need} ★`;
      v.building.alpha = open ? 1 : 0.55;
      v.ribbon.texture = open ? T.ribbon : T.ribbonOff;
      const st = state.games[loc.id];
      v.sub.text = open && st ? `${loc.sub} · ★ ${st}` : loc.sub;
      v.daily.visible = open && state.daily === loc.id;
    });
    coinText.text = String(state.coins);
    starText.text = String(state.stars);
    hello.text = state.name ? `هلا ${state.name}!` : 'عالم سبير';
  };

  // ---------- سبير ----------
  const spir = new Cat(spirTex, { scarf: true });
  spir.scale.set(0.42);
  places.addChild(spir);
  let at = 0;
  const placeSpir = (i: number) => {
    const p = spot(i);
    spir.position.set(p.x + (i % 2 === 0 ? 96 : -96), p.y + 26);
    spir.zIndex = p.y + 30;
  };

  // ---------- غيوم وواجهة علوية ----------
  const clouds: Sprite[] = [];
  for (let k = 0; k < 5; k++) {
    const c = new Sprite(T.cloud);
    c.alpha = 0.9;
    c.scale.set(0.45 + (k % 3) * 0.2);
    c.position.set((k * 97) % 390, 40 + k * 260);
    map.addChild(c);
    clouds.push(c);
  }

  const hudBar = new Container();
  s.ui.addChild(hudBar);
  const hudBg = new Graphics();
  hudBar.addChild(hudBg);
  const hello = label('عالم سبير', { display: true, size: 28, color: 0xffffff, stroke: 0x2a2350, strokeWidth: 7 });
  hello.anchor.set(1, 0.5);
  const pill = (icon: Texture, x: number) => {
    const c = new Container();
    const g = new Graphics().roundRect(-44, -18, 88, 36, 18).fill({ color: 0xffffff }).stroke({ color: 0x2a2350, width: 3 });
    const ic = new Sprite(icon);
    ic.anchor.set(0.5);
    ic.position.set(-26, 0);
    const t = label('0', { size: 17, color: 0x2a2350 });
    t.position.set(10, -1);
    c.addChild(g, ic, t);
    c.position.set(x, 0);
    hudBar.addChild(c);
    return t;
  };
  const coinText = pill(T.coin, 56);
  const starText = pill(T.star, 154);
  hudBar.addChild(hello);

  const bubble = new Container();
  const bubbleBg = new Graphics();
  const bubbleText = label('', { size: 15, color: 0x2a2350, wrap: 170 });
  bubble.addChild(bubbleBg, bubbleText);
  bubble.visible = false;
  places.addChild(bubble);
  const say = (text: string) => {
    bubbleText.text = text;
    const w = Math.min(190, bubbleText.width + 26);
    const h = bubbleText.height + 16;
    bubbleBg.clear().roundRect(-w / 2, -h / 2, w, h, 14).fill(0xffffff).stroke({ color: 0x2a2350, width: 3 });
    bubble.position.set(spir.x, spir.y - 110);
    bubble.zIndex = 99999;
    bubble.visible = true;
    bubble.scale.set(0.3);
    void s.tw.to(bubble.scale, { x: 1, y: 1 }, 280, ease.back);
    void s.tw.wait(2200).then(() => bubbleText.text === text && (bubble.visible = false));
  };

  // ---------- التمرير ----------
  let scrollY = 0;
  let vel = 0;
  let drag: { y0: number; s0: number; moved: boolean; t: number } | null = null;
  const minScroll = () => Math.min(0, s.h - mapH);
  const setScroll = (y: number) => {
    scrollY = Math.max(minScroll(), Math.min(0, y));
    map.y = scrollY;
  };
  const scrollTo = (i: number, ms = 0) => {
    const target = Math.max(minScroll(), Math.min(0, s.h * 0.62 - spot(i).y));
    if (!ms) return setScroll(target);
    const from = scrollY;
    return s.tw.run(ms, (t) => setScroll(from + (target - from) * t), ease.inOut);
  };

  const layout = () => {
    hudBar.position.set(0, 34);
    hudBg.clear().roundRect(8, -24, s.w - 16, 56, 28).fill({ color: 0x2a2350, alpha: 0.32 }).roundRect(8, -28, s.w - 16, 56, 28).fill({ color: 0x4fb8ff, alpha: 0.96 }).stroke({ color: 0x2a2350, width: 3 });
    hello.position.set(s.w - 22, -2);
    setScroll(scrollY);
  };

  // ---------- فتح مكان ----------
  let walking = false;
  const go = async (i: number) => {
    const loc = LOCATIONS[i];
    if (!unlocked(loc, state)) {
      s.audio.play('bump');
      const v = views[i].root;
      const x0 = v.x;
      void s.tw.run(320, (t) => (v.x = x0 + Math.sin(t * Math.PI * 5) * 6 * (1 - t)), ease.linear);
      spir.setMood('surprised');
      say(`اجمع ${loc.need - state.stars} نجوم بعد حتى ينفتح`);
      return;
    }
    if (walking) return;
    walking = true;
    s.audio.play('tap');
    void s.pop(views[i].building, 1.12);
    if (at !== i) {
      spir.setMood('happy');
      const steps = Math.abs(i - at);
      const dir = Math.sign(i - at);
      for (let k = 0; k < steps; k++) {
        const from = { x: spir.x, y: spir.y };
        const nx = at + dir;
        const p = spot(nx);
        const to = { x: p.x + (nx % 2 === 0 ? 96 : -96), y: p.y + 26 };
        spir.lookAt(Math.sign(to.x - from.x), 0);
        void scrollTo(nx, 360);
        s.audio.play('pop');
        await s.tw.run(360, (t) => {
          spir.x = from.x + (to.x - from.x) * t;
          spir.y = from.y + (to.y - from.y) * t - Math.sin(t * Math.PI) * 40;
        }, ease.inOut);
        spir.zIndex = to.y + 30;
        at = nx;
      }
    }
    spir.setMood('happy');
    spir.cheer();
    s.burst(views[i].root.x + map.x, views[i].root.y + map.y - 60, [T.spark], { count: 12, speed: 200, gravity: 200, size: 18 });
    s.audio.play('whoosh');
    await s.tw.wait(380);
    walking = false;
    send({ type: 'open', target: loc.id });
  };

  return {
    start() {
      placeSpir(at);
      scrollTo(at);
      layout();
      refresh();
      s.audio.music(62);
    },
    state(data) {
      const d = data as Partial<WorldState>;
      state = { name: d.name ?? '', coins: d.coins ?? 0, stars: d.stars ?? 0, games: d.games ?? {}, last: d.last ?? state.last, daily: d.daily ?? null };
      const li = LOCATIONS.findIndex((l) => l.id === state.last);
      if (li >= 0 && !walking) {
        at = li;
        placeSpir(at);
        scrollTo(at);
      }
      refresh();
    },
    layout,
    update(dt) {
      spir.update(dt);
      for (const v of views) if (v.daily.visible) v.daily.y = -132 + Math.sin(s.tw.now / 300) * 4;
      for (const c of clouds) {
        c.x -= dt * 0.01;
        if (c.x < -120) c.x = 400;
      }
      if (!drag && Math.abs(vel) > 0.01) {
        setScroll(scrollY + vel * dt);
        vel *= 0.93;
      }
    },
    down(p: Point) {
      drag = { y0: p.y, s0: scrollY, moved: false, t: performance.now() };
      vel = 0;
    },
    move(p: Point) {
      if (!drag) return;
      const dy = p.y - drag.y0;
      if (Math.abs(dy) > 8) drag.moved = true;
      if (drag.moved) {
        const before = scrollY;
        setScroll(drag.s0 + dy);
        const now = performance.now();
        vel = (scrollY - before) / Math.max(1, now - drag.t);
        drag.t = now;
      }
    },
    up(p: Point) {
      const d = drag;
      drag = null;
      if (!d || d.moved) return;
      // ضغطة: أي مكان قريب من النقطة؟
      const my = p.y - map.y;
      let best = -1;
      let bestD = 90;
      LOCATIONS.forEach((_, i) => {
        const sp = spot(i);
        const dist = Math.hypot(p.x - sp.x, my - (sp.y - 30));
        if (dist < bestD) {
          bestD = dist;
          best = i;
        }
      });
      if (best >= 0) void go(best);
      else if (Math.hypot(p.x - spir.x, my - (spir.y - 40)) < 50) {
        spir.setMood('wink');
        s.audio.play('meow');
        say(['هلا! وين نروح اليوم؟', 'أحب الألغاز!', 'يلا نجمع نجوم'][Math.floor(Math.random() * 3)]);
      }
    },
  };
});
