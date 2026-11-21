/** منطق «كاسر الطوب»: توليد الطوب لكل مرحلة، واصطدام الكرة بالمستطيلات */
import type { Level } from '../../packages/spir-kit/sdk.ts';
import { rng } from '../../packages/spir-kit/rng.ts';

export const STAGES = 20;
export const BRICK_COLS = 8;

export type Brick = { col: number; row: number; hp: number; color: number };

export const LIVES: Record<Level, number> = { easy: 5, medium: 3, hard: 3 };
export const PADDLE: Record<Level, number> = { easy: 96, medium: 76, hard: 60 };
export const SPEED: Record<Level, number> = { easy: 250, medium: 310, hard: 370 };

/** طوب المرحلة: الصفوف تزيد، وأشكال بفراغات، وطوب يحتاج ضربتين بالمتوسط والصعب */
export function makeBricks(level: Level, stage: number): Brick[] {
  const r = rng(stage * 2713 + 17);
  const rows = Math.min(8, 3 + Math.floor((stage - 1) / 3));
  const pattern = (stage - 1) % 4;
  const out: Brick[] = [];
  for (let row = 0; row < rows; row++) for (let col = 0; col < BRICK_COLS; col++) {
    const mirror = Math.min(col, BRICK_COLS - 1 - col);
    let on = true;
    if (pattern === 1) on = (row + mirror) % 2 === 0 || row === 0;
    if (pattern === 2) on = mirror >= row % 4;
    if (pattern === 3) on = r.next() > 0.25 || row === 0;
    if (!on) continue;
    const tough = level !== 'easy' && stage >= 4 && (row === 0 || (level === 'hard' && row % 3 === 0));
    out.push({ col, row, hp: tough ? 2 : 1, color: row % 6 });
  }
  return out;
}

export type Rect = { x: number; y: number; w: number; h: number };
export type Ball = { x: number; y: number; vx: number; vy: number; r: number };

/** إذا الكرة تتقاطع ويّا المستطيل: نعكس السرعة على المحور الأقل تداخل */
export function bounceRect(b: Ball, rc: Rect): boolean {
  const cx = Math.max(rc.x, Math.min(b.x, rc.x + rc.w));
  const cy = Math.max(rc.y, Math.min(b.y, rc.y + rc.h));
  const dx = b.x - cx;
  const dy = b.y - cy;
  if (dx * dx + dy * dy > b.r * b.r) return false;
  const overlapX = Math.min(b.x + b.r - rc.x, rc.x + rc.w - (b.x - b.r));
  const overlapY = Math.min(b.y + b.r - rc.y, rc.y + rc.h - (b.y - b.r));
  if (overlapX < overlapY) {
    b.vx = b.x < rc.x + rc.w / 2 ? -Math.abs(b.vx) : Math.abs(b.vx);
  } else {
    b.vy = b.y < rc.y + rc.h / 2 ? -Math.abs(b.vy) : Math.abs(b.vy);
  }
  return true;
}

/** الارتداد من المضرب: الزاوية حسب مكان الضربة (الطرف = زاوية أكبر) */
export function paddleBounce(b: Ball, paddleX: number, paddleW: number, speed: number) {
  const off = Math.max(-1, Math.min(1, (b.x - paddleX) / (paddleW / 2)));
  const angle = off * (Math.PI / 3);
  b.vx = Math.sin(angle) * speed;
  b.vy = -Math.cos(angle) * speed;
}

export function starsFor(level: Level, livesLost: number) {
  return livesLost === 0 ? 3 : livesLost <= (level === 'easy' ? 2 : 1) ? 2 : 1;
}
