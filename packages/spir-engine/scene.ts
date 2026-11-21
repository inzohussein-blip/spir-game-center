/**
 * spir-engine: مشهد Pixi جاهز للألعاب والمشاهد (الخريطة، البيت).
 * - عرض منطقي ثابت 390، والارتفاع حسب الشاشة (s.h)، ودقة عالية بأي جهاز.
 * - طبقات: bg (الخلفية) · world (اللعب) · fx (جزيئات) · ui (الأزرار والنصوص).
 * - ساعة وحركات توقف ويّا الإيقاف، وصوت، واهتزاز شاشة، وجزيئات.
 */
import 'pixi.js/unsafe-eval';
import { Application, Container, Sprite, Texture, type FederatedPointerEvent } from 'pixi.js';
import { listen, send, type HostMessage, type Settings } from '../spir-kit/sdk.ts';
import { Audio } from './audio.ts';
import { loadFonts } from './fonts.ts';
import { ease, Tweens } from './tween.ts';

export const W = 390;

export type Point = { x: number; y: number };

export type SceneDef = {
  /** تبدي/تعيد الجولة — مع كل رسالة start */
  start(settings: Settings): void | Promise<void>;
  /** بيانات من التطبيق (للخريطة والبيت) */
  state?(data: unknown): void;
  update?(dt: number): void;
  /** تغيّر حجم الشاشة: أعد ترتيب العناصر */
  layout?(): void;
  down?(p: Point, e: FederatedPointerEvent): void;
  move?(p: Point, e: FederatedPointerEvent): void;
  up?(p: Point, e: FederatedPointerEvent): void;
};

type Particle = { s: Sprite; vx: number; vy: number; vr: number; g: number; life: number; age: number; fade: boolean; shrink: boolean };

export class Scene {
  app = new Application();
  root = new Container();
  bg = new Container();
  world = new Container();
  fx = new Container();
  ui = new Container();
  tw = new Tweens();
  audio = new Audio();
  w = W;
  h = 800;
  scale = 1;
  /** دقة الرسم (للرسوم المتجهة): نسبة البكسل × التكبير */
  px = 2;
  paused = false;
  settings: Settings = { level: 'easy', stage: 1, sound: true, players: 1 };
  private parts: Particle[] = [];
  private shakeT = 0;
  private shakeMag = 0;
  private def: SceneDef | null = null;

  async init(background: number) {
    document.documentElement.style.cssText = 'margin:0;height:100%;overscroll-behavior:none';
    document.body.style.cssText = 'margin:0;height:100%;overflow:hidden;touch-action:none;user-select:none;-webkit-user-select:none;-webkit-tap-highlight-color:transparent;background:#' + background.toString(16).padStart(6, '0');
    await loadFonts();
    await this.app.init({
      preference: 'webgl',
      resizeTo: window,
      background,
      antialias: true,
      resolution: Math.min(window.devicePixelRatio || 1, 2),
      autoDensity: true,
    });
    document.body.appendChild(this.app.canvas);
    this.app.canvas.style.display = 'block';
    this.root.addChild(this.bg, this.world, this.fx, this.ui);
    this.app.stage.addChild(this.root);
    this.fit();
    window.addEventListener('resize', () => {
      this.fit();
      this.def?.layout?.();
    });
  }

  private fit() {
    const sw = this.app.screen.width;
    const sh = this.app.screen.height;
    this.scale = sw / W;
    this.h = sh / this.scale;
    this.root.scale.set(this.scale);
    this.px = Math.min(3, (window.devicePixelRatio || 1) * this.scale);
  }

  run(def: SceneDef) {
    this.def = def;
    const stage = this.app.stage;
    stage.eventMode = 'static';
    stage.hitArea = this.app.screen;
    const local = (e: FederatedPointerEvent): Point => {
      const p = this.root.toLocal(e.global);
      return { x: p.x, y: p.y };
    };
    stage.on('pointerdown', (e) => {
      this.audio.unlock();
      if (!this.paused) def.down?.(local(e), e);
    });
    stage.on('globalpointermove', (e) => !this.paused && def.move?.(local(e), e));
    stage.on('pointerup', (e) => !this.paused && def.up?.(local(e), e));
    stage.on('pointerupoutside', (e) => !this.paused && def.up?.(local(e), e));

    listen((m: HostMessage) => {
      if (m.type === 'start') {
        this.settings = m.settings;
        this.audio.setOn(m.settings.sound);
        this.paused = false;
        this.tw.clear();
        void def.start(m.settings);
      } else if (m.type === 'pause') this.paused = true;
      else if (m.type === 'resume') this.paused = false;
      else if (m.type === 'sound') this.audio.setOn(m.on);
      else if (m.type === 'state') def.state?.(m.data);
    });

    this.app.ticker.add((t) => {
      if (this.paused) return;
      const dt = Math.min(50, t.deltaMS);
      this.tw.step(dt);
      this.stepParticles(dt);
      def.update?.(dt);
      if (this.shakeT > 0) {
        this.shakeT -= dt;
        const k = Math.max(0, this.shakeT / 300) * this.shakeMag;
        this.world.position.set((Math.random() - 0.5) * k, (Math.random() - 0.5) * k);
      } else this.world.position.set(0, 0);
    });

    // فتح الملف مباشرة (بدون تطبيق): نبدي بإعدادات افتراضية للتجربة
    if (!window.ReactNativeWebView && window.parent === window) setTimeout(() => void def.start(this.settings), 0);
    send({ type: 'ready' });
  }

  shake(mag = 8, ms = 300) {
    this.shakeMag = mag;
    this.shakeT = ms;
  }

  /** انفجار جزيئات من نقطة */
  burst(x: number, y: number, textures: Texture[], o: { count?: number; speed?: number; gravity?: number; life?: number; size?: number; spread?: number; up?: number } = {}) {
    const n = o.count ?? 16;
    for (let i = 0; i < n; i++) {
      const s = new Sprite(textures[i % textures.length]);
      s.anchor.set(0.5);
      s.position.set(x, y);
      const sz = (o.size ?? 14) * (0.6 + Math.random() * 0.8);
      s.width = sz;
      s.height = sz * (s.texture.height / s.texture.width);
      // spread: زاوية الانتشار حول الاتجاه لفوق (بدونها: بكل الاتجاهات)
      const a = o.spread === undefined ? Math.random() * Math.PI * 2 : -Math.PI / 2 + (Math.random() - 0.5) * o.spread;
      const sp = (o.speed ?? 260) * (0.4 + Math.random() * 0.8);
      this.fx.addChild(s);
      this.parts.push({ s, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - (o.up ?? 120), vr: (Math.random() - 0.5) * 8, g: o.gravity ?? 600, life: (o.life ?? 900) * (0.7 + Math.random() * 0.6), age: 0, fade: true, shrink: true });
    }
  }

  private stepParticles(dt: number) {
    const s = dt / 1000;
    this.parts = this.parts.filter((p) => {
      p.age += dt;
      p.vy += p.g * s;
      p.s.x += p.vx * s;
      p.s.y += p.vy * s;
      p.s.rotation += p.vr * s;
      const k = 1 - p.age / p.life;
      if (p.fade) p.s.alpha = Math.min(1, k * 2);
      if (k <= 0) {
        p.s.destroy();
        return false;
      }
      return true;
    });
  }

  /** «نطة» لطيفة: يكبر ويرجع */
  pop(obj: Container, k = 1.18, ms = 260) {
    const sx = obj.scale.x;
    const sy = obj.scale.y;
    return this.tw.run(ms, (t) => {
      const b = 1 + (k - 1) * Math.sin(t * Math.PI);
      obj.scale.set(sx * b, sy * b);
    }, ease.linear, obj);
  }

  /** انضغاط وتمدد (squash & stretch) */
  squash(obj: Container, ms = 300) {
    const sx = obj.scale.x;
    const sy = obj.scale.y;
    return this.tw.run(ms, (t) => {
      const w = Math.sin(t * Math.PI * 2) * (1 - t) * 0.18;
      obj.scale.set(sx * (1 + w), sy * (1 - w));
    }, ease.linear, obj);
  }
}

/** ينشئ المشهد ويربطه بالتطبيق */
export async function createScene(background: number, make: (s: Scene) => SceneDef | Promise<SceneDef>): Promise<Scene> {
  const s = new Scene();
  await s.init(background);
  s.run(await make(s));
  return s;
}
