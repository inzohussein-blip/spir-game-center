/**
 * «بيت سبير»: غرفة يزيّنها اللاعب بأغراض يشتريها بالعملات، وقبعات يلبسها سبير،
 * و«الألبوم» بيه 24 ملصق ينربحون من الألعاب. البيانات (العملات والمشتريات) عند التطبيق.
 */
import { Container, Graphics, Sprite, type Texture } from 'pixi.js';
import { bush, candy, catFace, coin, crate, creature, discCat, discDog, furniture, pill, room, starIcon, stickerFrame } from '../../packages/spir-art/index.ts';
import { bake, bakeCat, button, Cat, createScene, ease, label, send, speechBubble, type Point } from '../../packages/spir-engine/index.ts';
import catalog from './catalog.json';

type Item = { id: string; name: string; price: number; kind: string };
type HouseState = { name: string; coins: number; owned: string[]; wear: string | null; stickers: string[] };

const ITEMS = catalog.items as Item[];
const STICKERS = catalog.stickers as { id: string; name: string }[];

/** مكان كل غرض بالغرفة: x نسبة من العرض، y نسبة من ارتفاع الغرفة (أسفل الغرض) */
const SPOTS: Record<string, { x: number; y: number; s: number; z: number }> = {
  window: { x: 0.26, y: 0.4, s: 0.9, z: 1 },
  painting: { x: 0.74, y: 0.32, s: 0.8, z: 1 },
  shelf: { x: 0.86, y: 0.62, s: 0.8, z: 2 },
  lamp: { x: 0.08, y: 0.64, s: 0.75, z: 2 },
  rug: { x: 0.5, y: 0.95, s: 1.15, z: 3 },
  sofa: { x: 0.52, y: 0.72, s: 0.95, z: 4 },
  bed: { x: 0.22, y: 0.95, s: 0.85, z: 5 },
  cattree: { x: 0.9, y: 0.98, s: 0.75, z: 5 },
  plant: { x: 0.07, y: 0.88, s: 0.8, z: 6 },
  fishbowl: { x: 0.68, y: 0.88, s: 0.7, z: 6 },
  ball: { x: 0.36, y: 0.99, s: 0.7, z: 8 },
  yarn: { x: 0.74, y: 0.99, s: 0.7, z: 8 },
};

void createScene(0xffd9a8, async (s) => {
  const px = s.px;
  const T = await bake(
    {
      room: room(390, 520),
      coin: coin(30),
      tabOn: pill(150, 46, '#FFC93C'),
      tabOff: pill(150, 46, '#FFFFFF'),
      frameOn: stickerFrame(84, true),
      frameOff: stickerFrame(84, false),
      ...Object.fromEntries(ITEMS.map((it) => [`it_${it.id}`, furniture(it.id)])),
      ...Object.fromEntries(Array.from({ length: 11 }, (_, i) => [`st_cr-${i}`, creature(i, 80)])),
      ...Object.fromEntries(['orange', 'pink', 'mint', 'blue', 'grape', 'gray'].map((c) => [`st_cat-${c}`, catFace(c, 'open', 'smile')])),
      'st_disc-cat': discCat(80),
      'st_disc-dog': discDog(80),
      st_bush: bush(80),
      st_crate: crate(80),
      st_candy: candy('#FF7AB6', 80),
      st_coin: coin(80),
      st_star: starIcon(80),
    } as Record<string, { svg: string; w: number; h: number }>,
    px,
  );
  const spir = new Cat(await bakeCat('orange', px), { scarf: true });

  let state: HouseState = { name: '', coins: 0, owned: [], wear: null, stickers: [] };
  let tab: 'house' | 'album' = 'house';
  let greeted = false;

  // ---------- الغرفة ----------
  const roomLayer = new Container();
  const roomSp = new Sprite(T.room);
  const items = new Container();
  items.sortableChildren = true;
  roomLayer.addChild(roomSp, items, spir);
  s.world.addChild(roomLayer);
  const hat = new Sprite();
  hat.anchor.set(0.5, 1);
  spir.head.addChild(hat);
  const bubble = speechBubble(s, 220);
  s.ui.addChild(bubble.view);

  // ---------- المتجر ----------
  const shop = new Container();
  const shopBg = new Graphics();
  const shopList = new Container();
  const shopMask = new Graphics();
  shopList.mask = shopMask;
  shop.addChild(shopBg, shopList, shopMask);
  s.ui.addChild(shop);

  // ---------- الألبوم ----------
  const album = new Container();
  s.ui.addChild(album);

  // ---------- الأعلى: التبويبات والعملات ----------
  const top = new Container();
  s.ui.addChild(top);
  const tabHouse = button(s, T.tabOn, 'البيت', () => setTab('house'), { size: 18 });
  const tabAlbum = button(s, T.tabOff, 'الألبوم', () => setTab('album'), { size: 18 });
  const coinBox = new Container();
  const coinBg = new Graphics().roundRect(-48, -20, 96, 40, 20).fill(0xffffff).stroke({ color: 0x2a2350, width: 3 });
  const coinIc = new Sprite(T.coin);
  coinIc.anchor.set(0.5);
  coinIc.x = -28;
  const coinText = label('0', { size: 18 });
  coinText.x = 10;
  coinBox.addChild(coinBg, coinIc, coinText);
  top.addChild(tabHouse, tabAlbum, coinBox);

  let roomH = 520;
  let shopY = 600;
  let shopScroll = 0;
  let shopDrag: { x0: number; s0: number; moved: boolean } | null = null;
  const CARD = 104;

  const setTab = (t: 'house' | 'album') => {
    tab = t;
    (tabHouse.children[0] as Sprite).texture = t === 'house' ? T.tabOn : T.tabOff;
    (tabAlbum.children[0] as Sprite).texture = t === 'album' ? T.tabOn : T.tabOff;
    roomLayer.visible = shop.visible = t === 'house';
    album.visible = t === 'album';
    bubble.hide();
    if (t === 'album') drawAlbum();
  };

  const drawRoom = () => {
    items.removeChildren().forEach((c) => c.destroy());
    for (const it of ITEMS) {
      const spot = SPOTS[it.id];
      if (!spot || !state.owned.includes(it.id)) continue;
      const sp = new Sprite(T[`it_${it.id}`] as Texture);
      sp.anchor.set(0.5, 1);
      sp.scale.set(spot.s);
      sp.position.set(spot.x * s.w, spot.y * roomH);
      sp.zIndex = spot.z;
      items.addChild(sp);
    }
    hat.visible = !!state.wear;
    if (state.wear) {
      hat.texture = T[`it_${state.wear}`] as Texture;
      hat.position.set(0, -78);
      hat.scale.set(state.wear === 'hat-flower' ? 0.8 : 1);
      if (state.wear === 'hat-flower') hat.position.set(28, -60);
    }
  };

  const drawShop = () => {
    shopList.removeChildren().forEach((c) => c.destroy({ children: true }));
    ITEMS.forEach((it, i) => {
      const c = new Container();
      c.position.set(s.w - 16 - CARD / 2 - i * CARD + shopScroll, 0);
      const owned = state.owned.includes(it.id);
      const bg = new Graphics().roundRect(-CARD / 2 + 5, -54, CARD - 10, 116, 18).fill({ color: 0x2a2350, alpha: 0.25 }).roundRect(-CARD / 2 + 5, -58, CARD - 10, 116, 18).fill(owned ? 0xe5f6ec : 0xffffff).stroke({ color: 0x2a2350, width: 3 });
      const ic = new Sprite(T[`it_${it.id}`] as Texture);
      ic.anchor.set(0.5);
      const k = Math.min(62 / ic.texture.width, 52 / ic.texture.height);
      ic.scale.set(k);
      ic.y = -18;
      const nm = label(it.name, { size: 13, weight: '600' });
      nm.y = 22;
      const price = label(owned ? (it.kind === 'hat' ? (state.wear === it.id ? 'شيل' : 'البس') : 'عندك ✓') : `${it.price}`, { size: 14, color: owned ? 0x22a86a : state.coins >= it.price ? 0x2a2350 : 0xd92d20 });
      price.y = 42;
      c.addChild(bg, ic, nm, price);
      if (!owned) {
        const ci = new Sprite(T.coin);
        ci.anchor.set(0.5);
        ci.scale.set(0.55);
        ci.position.set(price.width / 2 + 10, 42);
        c.addChild(ci);
      }
      shopList.addChild(c);
    });
  };

  const tapItem = (it: Item) => {
    const owned = state.owned.includes(it.id);
    if (owned && it.kind === 'hat') {
      const wear = state.wear === it.id ? null : it.id;
      state = { ...state, wear };
      send({ type: 'save', key: 'wear', data: wear });
      s.audio.play('pop');
      spir.setMood('wink');
      spir.cheer();
      drawRoom();
      drawShop();
      return;
    }
    if (owned) {
      bubble.say(`${it.name} عندك بالبيت`, 1600);
      return;
    }
    if (state.coins < it.price) {
      s.audio.play('bump');
      spir.setMood('surprised');
      bubble.say(`تحتاج ${it.price - state.coins} عملة بعد. العب وارجع!`, 2200);
      return;
    }
    // الشراء: التطبيق ينقص العملات ويرجّع الحالة الجديدة
    send({ type: 'save', key: 'buy', data: it.id });
    state = { ...state, coins: state.coins - it.price, owned: [...state.owned, it.id], wear: it.kind === 'hat' ? it.id : state.wear };
    s.audio.play('coin');
    void s.tw.wait(120).then(() => s.audio.play('unlock'));
    spir.setMood('happy');
    spir.cheer();
    bubble.say(`واو! ${it.name} جديد!`, 1800);
    coinText.text = String(state.coins);
    drawRoom();
    drawShop();
    const spot = SPOTS[it.id];
    if (spot) {
      const sp = items.children[items.children.length - 1] as Sprite | undefined;
      const target = items.children.find((c) => Math.abs(c.x - spot.x * s.w) < 1 && Math.abs(c.y - spot.y * roomH) < 1) ?? sp;
      if (target) {
        const sc = target.scale.x;
        target.scale.set(0.01);
        void s.tw.run(420, (t) => target.scale.set(sc * t), ease.back);
        s.burst(target.x, target.y - 40, [T.coin], { count: 8, speed: 220, gravity: 500, size: 16 });
      }
    }
  };

  const drawAlbum = () => {
    album.removeChildren().forEach((c) => c.destroy({ children: true }));
    const cols = 4;
    const size = Math.min(84, (s.w - 32) / cols - 6, (s.h - 190) / 6 - 26);
    const count = state.stickers.length;
    const title = label(`ملصقاتي ${count}/${STICKERS.length}`, { display: true, size: 26, color: 0xffffff, stroke: 0x2a2350, strokeWidth: 7 });
    title.position.set(s.w / 2, 118);
    album.addChild(title);
    STICKERS.forEach((st, i) => {
      const have = state.stickers.includes(st.id);
      const x = s.w - 16 - (i % cols + 0.5) * ((s.w - 32) / cols);
      const y = 170 + Math.floor(i / cols) * (size + 26) + size / 2;
      const fr = new Sprite(have ? T.frameOn : T.frameOff);
      fr.anchor.set(0.5);
      fr.width = size;
      fr.height = size * (89 / 84);
      fr.position.set(x, y);
      album.addChild(fr);
      const art = new Sprite(T[`st_${st.id}`] as Texture);
      art.anchor.set(0.5);
      art.scale.set((size * 0.68) / Math.max(art.texture.width, art.texture.height));
      art.position.set(x, y - 2);
      if (!have) {
        art.tint = 0x2a2350;
        art.alpha = 0.18;
      }
      album.addChild(art);
      const nm = label(have ? st.name : '؟', { size: 12, weight: '600', color: have ? 0x2a2350 : 0x8a8fa8 });
      nm.position.set(x, y + size / 2 + 10);
      album.addChild(nm);
    });
    const hint = label('تربح ملصقات لما تفوز بألعاب العالم', { size: 14, weight: '600', color: 0x5b4a9a });
    hint.position.set(s.w / 2, Math.min(s.h - 20, 170 + 6 * (size + 26) + 10));
    album.addChild(hint);
  };

  const layout = () => {
    roomH = Math.min(520, s.h * 0.66);
    roomSp.width = s.w;
    roomSp.height = roomH;
    spir.scale.set(0.62);
    spir.position.set(s.w * 0.5, roomH * 0.93);
    spir.zIndex = 7;
    bubble.view.position.set(s.w * 0.5 + 60, roomH * 0.93 - 150);
    shopY = roomH + 12;
    shopBg.clear().roundRect(8, shopY, s.w - 16, s.h - shopY - 8, 26).fill(0xfff7ea).stroke({ color: 0x2a2350, width: 4 });
    shopMask.clear().rect(12, shopY, s.w - 24, s.h - shopY - 8).fill(0xffffff);
    shopList.position.set(0, shopY + 30 + Math.min(80, (s.h - shopY - 40) / 2));
    top.position.set(0, 40);
    tabHouse.position.set(s.w - 78, 0);
    tabAlbum.position.set(s.w - 200, 0);
    tabHouse.setBase(0.76);
    tabAlbum.setBase(0.76);
    coinBox.position.set(58, 0);
    coinText.text = String(state.coins);
    drawRoom();
    drawShop();
    if (tab === 'album') drawAlbum();
  };

  return {
    start() {
      layout();
      setTab('house');
      spir.setMood('happy');
      s.audio.music(67);
    },
    state(data) {
      const d = data as Partial<HouseState>;
      const first = !greeted;
      greeted = true;
      state = { name: d.name ?? '', coins: d.coins ?? 0, owned: d.owned ?? [], wear: d.wear ?? null, stickers: d.stickers ?? [] };
      layout();
      if (first) bubble.say(state.owned.length ? 'هلا بيك بالبيت!' : 'البيت فاضي… نشتري أغراض؟', 2600);
    },
    layout,
    update(dt) {
      spir.update(dt);
    },
    down(p: Point) {
      if (tab !== 'house' || p.y < shopY) {
        if (tab === 'house' && Math.hypot(p.x - spir.x, p.y - (spir.y - 60)) < 60) {
          spir.setMood('wink');
          s.audio.play('meow');
          spir.cheer();
        }
        return;
      }
      shopDrag = { x0: p.x, s0: shopScroll, moved: false };
    },
    move(p: Point) {
      if (!shopDrag) return;
      const dx = p.x - shopDrag.x0;
      if (Math.abs(dx) > 8) shopDrag.moved = true;
      if (shopDrag.moved) {
        const max = Math.max(0, ITEMS.length * CARD - (s.w - 32));
        shopScroll = Math.max(0, Math.min(max, shopDrag.s0 + dx));
        shopList.children.forEach((c, i) => (c.x = s.w - 16 - CARD / 2 - i * CARD + shopScroll));
      }
    },
    up(p: Point) {
      const d = shopDrag;
      shopDrag = null;
      if (!d || d.moved) return;
      const i = Math.floor((s.w - 16 - p.x + shopScroll) / CARD);
      const it = ITEMS[i];
      if (it) tapItem(it);
    },
  };
});
