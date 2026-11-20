/**
 * spir-kit: محرك صغير فوق Canvas 2D.
 * - اللوحة عرضها المنطقي 360 دائماً، والارتفاع حسب الشاشة (g.h)، وتتكبر لأي جهاز بدقة عالية.
 * - حلقة لعب بـ requestAnimationFrame تتوقف عند الإيقاف.
 * - لمس/ماوس بواجهة وحدة (down/move/up) بإحداثيات منطقية.
 * - حركات ناعمة (anim) وأصوات بسيطة مولّدة (sound) بدون ملفات.
 */
import { listen, sdk, type Settings } from './sdk.ts';

export const WIDTH = 360;

export type Point = { x: number; y: number };

export type GameDef = {
  /** تبدي/تعيد المرحلة. تنستدعى مع كل رسالة start من التطبيق */
  start(settings: Settings): void;
  update?(dt: number): void;
  draw(c: CanvasRenderingContext2D): void;
  down?(p: Point): void;
  move?(p: Point): void;
  up?(p: Point): void;
};

type Anim = { t0: number; ms: number; fn: (t: number) => void; ease: (t: number) => number; done: () => void };

export const ease = {
  linear: (t: number) => t,
  out: (t: number) => 1 - (1 - t) ** 3,
  inOut: (t: number) => (t < 0.5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2),
  back: (t: number) => 1 + 2.70158 * (t - 1) ** 3 + 1.70158 * (t - 1) ** 2,
  bounce: (t: number) => {
    const n = 7.5625;
    const d = 2.75;
    if (t < 1 / d) return n * t * t;
    if (t < 2 / d) return n * (t -= 1.5 / d) * t + 0.75;
    if (t < 2.5 / d) return n * (t -= 2.25 / d) * t + 0.9375;
    return n * (t -= 2.625 / d) * t + 0.984375;
  },
};

class Kit {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  w = WIDTH;
  h = 640;
  scale = 1;
  paused = false;
  /** الوقت منذ بداية اللعبة (ms) — يوقف ويّا الإيقاف */
  now = 0;
  soundOn = true;
  settings: Settings = { level: 'medium', stage: 1, sound: true, players: 1 };
  private anims: Anim[] = [];
  private audio: AudioContext | null = null;
  private def: GameDef | null = null;
  private last = 0;

  constructor() {
    document.documentElement.style.cssText = 'margin:0;height:100%;background:#EEF0FF;overscroll-behavior:none';
    document.body.style.cssText = 'margin:0;height:100%;overflow:hidden;touch-action:none;user-select:none;-webkit-user-select:none;-webkit-tap-highlight-color:transparent';
    this.canvas = document.createElement('canvas');
    this.canvas.style.cssText = 'display:block;width:100%;height:100%';
    document.body.appendChild(this.canvas);
    const ctx = this.canvas.getContext('2d');
    if (!ctx) throw new Error('canvas 2d unavailable');
    this.ctx = ctx;
    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 3);
    const cw = window.innerWidth || WIDTH;
    const ch = window.innerHeight || 640;
    this.scale = cw / WIDTH;
    this.h = ch / this.scale;
    this.canvas.width = Math.round(cw * dpr);
    this.canvas.height = Math.round(ch * dpr);
    this.ctx.setTransform(dpr * this.scale, 0, 0, dpr * this.scale, 0, 0);
  }

  run(def: GameDef) {
    this.def = def;
    const toP = (e: PointerEvent): Point => {
      const r = this.canvas.getBoundingClientRect();
      return { x: (e.clientX - r.left) / this.scale, y: (e.clientY - r.top) / this.scale };
    };
    this.canvas.addEventListener('pointerdown', (e) => {
      this.unlockAudio();
      if (this.paused) return;
      this.canvas.setPointerCapture?.(e.pointerId);
      def.down?.(toP(e));
    });
    this.canvas.addEventListener('pointermove', (e) => !this.paused && def.move?.(toP(e)));
    this.canvas.addEventListener('pointerup', (e) => !this.paused && def.up?.(toP(e)));

    listen((m) => {
      if (m.type === 'start') {
        this.settings = m.settings;
        this.soundOn = m.settings.sound;
        this.anims = [];
        this.paused = false;
        def.start(m.settings);
      } else if (m.type === 'pause') this.paused = true;
      else if (m.type === 'resume') {
        this.paused = false;
        this.last = performance.now();
      } else if (m.type === 'sound') this.soundOn = m.on;
    });

    const frame = (t: number) => {
      const dt = Math.min(50, t - (this.last || t));
      this.last = t;
      if (!this.paused) {
        this.now += dt;
        this.stepAnims();
        def.update?.(dt);
      }
      this.ctx.clearRect(0, 0, this.w, this.h);
      def.draw(this.ctx);
      requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
    // بدون تطبيق (فتح الملف مباشرة للتجربة): نبدي بإعدادات افتراضية
    if (!window.ReactNativeWebView && window.parent === window) {
      setTimeout(() => def.start(this.settings), 0);
    }
    sdk.ready();
  }

  /** حركة ناعمة: fn تستلم t من 0 لـ 1 */
  anim(ms: number, fn: (t: number) => void, e: (t: number) => number = ease.out): Promise<void> {
    return new Promise((done) => {
      this.anims.push({ t0: this.now, ms, fn, ease: e, done });
      fn(0);
    });
  }

  wait(ms: number) {
    return this.anim(ms, () => {}, ease.linear);
  }

  get animating() {
    return this.anims.length > 0;
  }

  private stepAnims() {
    const keep: Anim[] = [];
    for (const a of this.anims) {
      const t = Math.min(1, (this.now - a.t0) / a.ms);
      a.fn(a.ease(t));
      if (t >= 1) a.done();
      else keep.push(a);
    }
    // for..of يمر هم على الحركات اللي انضافت أثناء done()، فكلها بـ keep
    this.anims = keep;
  }

  // ---------- الصوت ----------
  private unlockAudio() {
    if (!this.audio) {
      const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (AC) this.audio = new AC();
    }
    if (this.audio?.state === 'suspended') void this.audio.resume();
  }

  tone(freq: number, ms: number, o: { type?: OscillatorType; vol?: number; to?: number; delay?: number } = {}) {
    if (!this.soundOn || !this.audio) return;
    const a = this.audio;
    const t = a.currentTime + (o.delay ?? 0) / 1000;
    const osc = a.createOscillator();
    const g = a.createGain();
    osc.type = o.type ?? 'sine';
    osc.frequency.setValueAtTime(freq, t);
    if (o.to) osc.frequency.exponentialRampToValueAtTime(o.to, t + ms / 1000);
    g.gain.setValueAtTime(o.vol ?? 0.12, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + ms / 1000);
    osc.connect(g).connect(a.destination);
    osc.start(t);
    osc.stop(t + ms / 1000 + 0.02);
  }

  sound(name: 'tap' | 'move' | 'ok' | 'bad' | 'win' | 'lose' | 'meow' | 'drop') {
    switch (name) {
      case 'tap':
        return this.tone(660, 70, { type: 'triangle', vol: 0.08 });
      case 'move':
        return this.tone(320, 90, { type: 'triangle', vol: 0.07, to: 420 });
      case 'ok':
        this.tone(660, 90, { type: 'triangle' });
        return this.tone(990, 120, { type: 'triangle', delay: 80 });
      case 'bad':
        return this.tone(220, 180, { type: 'square', vol: 0.05, to: 160 });
      case 'win':
        [523, 659, 784, 1046].forEach((f, i) => this.tone(f, 160, { type: 'triangle', delay: i * 110 }));
        return;
      case 'lose':
        [392, 330, 262].forEach((f, i) => this.tone(f, 220, { type: 'triangle', delay: i * 160 }));
        return;
      case 'meow':
        this.tone(700, 160, { type: 'sine', to: 1100, vol: 0.1 });
        return this.tone(1100, 260, { type: 'sine', to: 600, vol: 0.1, delay: 150 });
      case 'drop':
        return this.tone(900, 260, { type: 'sine', to: 200, vol: 0.1 });
    }
  }
}

let kit: Kit | null = null;

/** ينشئ اللعبة ويربطها بالتطبيق. يرجع أدوات المحرك (g.w، g.h، g.anim، g.sound…) */
export function createGame(make: (g: Kit) => GameDef): Kit {
  kit = new Kit();
  kit.run(make(kit));
  return kit;
}

export type { Kit };
