/** عناصر واجهة داخل المشهد: نص عربي، وأزرار «حلوى» تنضغط وتنط */
import { Container, Graphics, Sprite, Text, type Texture } from 'pixi.js';
import { ease } from './tween.ts';
import { FONT_BODY, FONT_DISPLAY } from './fonts.ts';
import type { Scene } from './scene.ts';

export function label(str: string, o: { size?: number; color?: number; display?: boolean; weight?: '600' | '800'; stroke?: number; strokeWidth?: number; shadow?: boolean; wrap?: number; align?: 'center' | 'right' | 'left' } = {}) {
  const t = new Text({
    text: str,
    style: {
      fontFamily: o.display ? FONT_DISPLAY : FONT_BODY,
      fontSize: o.size ?? 18,
      fontWeight: o.display ? '400' : (o.weight ?? '800'),
      fill: o.color ?? 0x1e1b3a,
      align: o.align ?? 'center',
      ...(o.stroke !== undefined ? { stroke: { color: o.stroke, width: o.strokeWidth ?? 6, join: 'round' as const } } : {}),
      ...(o.shadow ? { dropShadow: { color: 0x1e1b3a, alpha: 0.35, blur: 0, distance: 3, angle: Math.PI / 2 } } : {}),
      ...(o.wrap ? { wordWrap: true, wordWrapWidth: o.wrap } : {}),
      padding: 6,
    },
    resolution: Math.min(3, (window.devicePixelRatio || 1) * 1.6),
  });
  t.anchor.set(0.5);
  return t;
}

export type Button = Container & { setText: (s: string) => void; setEnabled: (on: boolean) => void; setBase: (k: number) => void };

/** زر: صورة خلفية (من spir-art) + نص، ينضغط بالضغط ويرجع بنطة */
export function button(s: Scene, tex: Texture, text: string, onTap: () => void, o: { size?: number; color?: number; icon?: Texture; w?: number; h?: number } = {}): Button {
  const c = new Container() as Button;
  const bg = new Sprite(tex);
  bg.anchor.set(0.5);
  if (o.w) bg.width = o.w;
  if (o.h) bg.height = o.h;
  c.addChild(bg);
  const t = label(text, { size: o.size ?? 18, color: o.color ?? 0x1e1b3a });
  t.y = -2;
  c.addChild(t);
  if (o.icon) {
    const ic = new Sprite(o.icon);
    ic.anchor.set(0.5);
    ic.x = bg.width / 2 - 26;
    c.addChild(ic);
    t.x = -10;
  }
  let enabled = true;
  /** الحجم الأصلي (قبل الضغط) — حتى الزر يرجع لنفس حجمه */
  let base = 1;
  c.eventMode = 'static';
  c.cursor = 'pointer';
  c.on('pointerdown', (e) => {
    e.stopPropagation();
    if (!enabled) return;
    s.audio.unlock();
    s.tw.kill(c);
    c.scale.set(base * 0.92);
  });
  const release = (fire: boolean) => {
    if (!enabled) return;
    void s.tw.run(240, (k) => c.scale.set(base * (0.92 + 0.08 * k + Math.sin(k * Math.PI) * 0.06)), undefined, c);
    if (fire) {
      s.audio.play('tap');
      onTap();
    }
  };
  c.on('pointerup', (e) => {
    e.stopPropagation();
    release(true);
  });
  c.on('pointerupoutside', () => release(false));
  c.setText = (str) => (t.text = str);
  /** حجم الزر الأساسي (بدل scale.set حتى الضغط يرجع له) */
  c.setBase = (k) => {
    base = k;
    c.scale.set(k);
  };
  c.setEnabled = (on) => {
    enabled = on;
    c.alpha = on ? 1 : 0.45;
  };
  return c;
}

/** فقاعة كلام (لسبير): تطلع بنطة وتختفي بعد مدة */
export function speechBubble(s: Scene, maxW = 210) {
  const c = new Container();
  const bg = new Graphics();
  const t = label('', { size: 16, color: 0x2a2350, wrap: maxW - 26 });
  c.addChild(bg, t);
  c.visible = false;
  let token = 0;
  const say = (text: string, ms = 2600, tail: 'left' | 'right' = 'left') => {
    const my = ++token;
    t.text = text;
    const w = Math.min(maxW, t.width + 28);
    const h = t.height + 18;
    bg.clear().roundRect(-w / 2, -h / 2, w, h, 16).fill(0xffffff).stroke({ color: 0x2a2350, width: 3 });
    const tx = tail === 'left' ? -w / 2 + 28 : w / 2 - 28;
    bg.poly([tx - 10, h / 2 - 2, tx + (tail === 'left' ? -14 : 14), h / 2 + 14, tx + 10, h / 2 - 2]).fill(0xffffff);
    bg.moveTo(tx - 10, h / 2).lineTo(tx + (tail === 'left' ? -14 : 14), h / 2 + 14).lineTo(tx + 10, h / 2).stroke({ color: 0x2a2350, width: 3 });
    c.visible = true;
    c.scale.set(0.3);
    void s.tw.to(c.scale, { x: 1, y: 1 }, 300, ease.back);
    if (ms > 0) void s.tw.wait(ms).then(() => my === token && (c.visible = false));
  };
  const hide = () => {
    token++;
    c.visible = false;
  };
  return { view: c, say, hide };
}
