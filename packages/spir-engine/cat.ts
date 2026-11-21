/**
 * البزون المتحرك (cutout): جسم، ذيل يهتز، راس يتمايل، أذنين، عيون ترمش وتتحرك، وتعابير.
 * المرجع: الحجم الكامل 130×190، ونقطة الأصل بين الرجلين (تحت بالنص).
 */
import { Container, Sprite, type Texture } from 'pixi.js';
import { catBody, catEar, catEye, catHead, catMouth, catTail, scarf, type EyeKind, type MouthKind } from '../spir-art/cat.ts';
import { bake } from './tex.ts';

export type CatTextures = Record<'body' | 'head' | 'ear' | 'tail' | 'scarf' | `eye_${EyeKind}` | `mouth_${MouthKind}`, Texture>;
export type Mood = 'normal' | 'happy' | 'scared' | 'sleepy' | 'wink' | 'surprised';

const cache = new Map<string, Promise<CatTextures>>();

export function bakeCat(color: string, px: number): Promise<CatTextures> {
  const key = `${color}@${px}`;
  let p = cache.get(key);
  if (!p) {
    p = bake(
      {
        body: catBody(color),
        head: catHead(color),
        ear: catEar(color),
        tail: catTail(color),
        scarf: scarf(),
        eye_open: catEye('open'),
        eye_happy: catEye('happy'),
        eye_closed: catEye('closed'),
        eye_scared: catEye('scared'),
        eye_wink: catEye('wink'),
        mouth_smile: catMouth('smile'),
        mouth_open: catMouth('open'),
        mouth_o: catMouth('o'),
        mouth_flat: catMouth('flat'),
      },
      px,
    ) as Promise<CatTextures>;
    cache.set(key, p);
  }
  return p;
}

const MOODS: Record<Mood, [EyeKind, EyeKind, MouthKind]> = {
  normal: ['open', 'open', 'smile'],
  happy: ['happy', 'happy', 'open'],
  scared: ['scared', 'scared', 'o'],
  sleepy: ['closed', 'closed', 'flat'],
  wink: ['open', 'wink', 'smile'],
  surprised: ['open', 'open', 'o'],
};

/** sprite بموضع من رسمة المرجع (أعلى-يسار بالبكسل المرجعي) */
function part(tex: Texture, x: number, y: number, ax = 0, ay = 0) {
  const s = new Sprite(tex);
  s.anchor.set(ax, ay);
  s.position.set(x - 65 + ax * tex.width, y - 188 + ay * tex.height);
  return s;
}

export class Cat extends Container {
  head = new Container();
  body: Sprite;
  tail: Sprite;
  earL: Sprite;
  earR: Sprite;
  eyeL: Sprite;
  eyeR: Sprite;
  mouth: Sprite;
  mood: Mood = 'normal';
  private t = Math.random() * 1000;
  private nextBlink = 1500 + Math.random() * 2500;
  private blinkFor = 0;
  private look = { x: 0, y: 0 };
  private bob = 0;
  /** شدة الحركة الدائمة (تنفّس وتمايل) */
  idle = 1;

  constructor(
    private tx: CatTextures,
    opts: { scarf?: boolean } = {},
  ) {
    super();
    this.tail = part(tx.tail, 78, 78, 0.14, 0.93);
    this.body = part(tx.body, 5, 88, 0.5, 1);
    this.addChild(this.tail, this.body);
    if (opts.scarf) this.addChild(part(tx.scarf, 17, 92));
    // الراس يدور حول الرقبة
    this.head.position.set(0, 110 - 188);
    const hp = (s: Sprite) => {
      s.y -= 110 - 188;
      return s;
    };
    this.earL = hp(part(tx.ear, 8, 4, 0.5, 0.95));
    this.earR = hp(part(tx.ear, 72, 4, 0.5, 0.95));
    this.earL.rotation = -0.2;
    this.earR.scale.x = -1;
    this.earR.rotation = 0.2;
    this.eyeL = hp(part(tx.eye_open, 30, 52, 0.5, 0.5));
    this.eyeR = hp(part(tx.eye_open, 68, 52, 0.5, 0.5));
    this.mouth = hp(part(tx.mouth_smile, 37, 86, 0.5, 0.3));
    this.head.addChild(this.earL, this.earR, hp(part(tx.head, 3, 18)), this.eyeL, this.eyeR, this.mouth);
    this.addChild(this.head);
  }

  setMood(m: Mood) {
    this.mood = m;
    this.applyFace();
  }

  /** يباوع باتجاه (dx, dy) من -1 لـ 1 */
  lookAt(dx: number, dy: number) {
    this.look = { x: Math.max(-1, Math.min(1, dx)), y: Math.max(-1, Math.min(1, dy)) };
  }

  /** نطة فرح صغيرة (المشهد يحرّك y من برا إذا يريد قفزة حقيقية) */
  cheer() {
    this.bob = 1;
  }

  private applyFace(blink = false) {
    const [l, r, m] = MOODS[this.mood];
    const el = blink && l === 'open' ? 'closed' : l;
    const er = blink && r === 'open' ? 'closed' : r;
    this.eyeL.texture = this.tx[`eye_${el}`];
    this.eyeR.texture = this.tx[`eye_${er}`];
    this.mouth.texture = this.tx[`mouth_${m}`];
  }

  update(dt: number) {
    this.t += dt;
    const t = this.t / 1000;
    const k = this.idle;
    // تنفّس
    this.body.scale.set(1 + Math.sin(t * 2.4) * 0.012 * k, 1 - Math.sin(t * 2.4) * 0.02 * k);
    // تمايل الراس والأذنين والذيل
    this.head.rotation = Math.sin(t * 1.3) * 0.04 * k + this.look.x * 0.06;
    this.head.y = 110 - 188 + Math.sin(t * 2.4) * 1.2 * k;
    const twitch = Math.max(0, Math.sin(t * 0.9) - 0.96) * 6;
    this.earL.rotation = -0.2 - twitch * 0.5;
    this.earR.rotation = 0.2 + Math.max(0, Math.sin(t * 0.7 + 2) - 0.96) * 3;
    this.tail.rotation = Math.sin(t * (this.mood === 'happy' ? 7 : 2)) * (this.mood === 'scared' ? 0.05 : 0.18);
    // العيون تتبع الاتجاه
    for (const [eye, bx] of [[this.eyeL, 30 + 16], [this.eyeR, 68 + 16]] as const) {
      eye.x = bx - 65 + this.look.x * 3;
    }
    // رمش
    this.nextBlink -= dt;
    if (this.blinkFor > 0) {
      this.blinkFor -= dt;
      if (this.blinkFor <= 0) this.applyFace(false);
    } else if (this.nextBlink <= 0 && (this.mood === 'normal' || this.mood === 'surprised')) {
      this.blinkFor = 120;
      this.nextBlink = 2000 + Math.random() * 3000;
      this.applyFace(true);
    }
    // نطة فرح
    if (this.bob > 0) {
      this.bob = Math.max(0, this.bob - dt / 450);
      const b = Math.sin((1 - this.bob) * Math.PI);
      this.body.y = -b * 8;
      this.head.y -= b * 14;
    } else this.body.y = 0;
  }
}
