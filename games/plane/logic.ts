/** منطق «الطيارة الطايرة»: جاذبية، كل ضغطة ترفع الطيارة، وأبراج بيها فتحات لازم تعبر منها */
import type { Level } from '../../packages/spir-kit/sdk.ts';

export type Tuning = { gravity: number; lift: number; speed: number; gap: number; spacing: number };

export const TUNING: Record<Level, Tuning> = {
  easy: { gravity: 900, lift: 300, speed: 120, gap: 190, spacing: 230 },
  medium: { gravity: 1100, lift: 340, speed: 150, gap: 160, spacing: 210 },
  hard: { gravity: 1250, lift: 370, speed: 180, gap: 138, spacing: 195 },
};

export const STARS: Record<Level, [number, number, number]> = { easy: [3, 8, 15], medium: [5, 12, 22], hard: [8, 16, 30] };

export type Tower = { x: number; gapY: number; passed: boolean };
export type Plane = { y: number; vy: number };

export const TOWER_W = 58;

export function newTower(x: number, height: number, gap: number, rand: () => number): Tower {
  const margin = 70;
  const gapY = margin + gap / 2 + rand() * Math.max(0, height - margin * 2 - gap);
  return { x, gapY, passed: false };
}

/** خطوة فيزياء للطيارة */
export function fly(p: Plane, dt: number, t: Tuning): Plane {
  const vy = Math.min(600, p.vy + t.gravity * dt);
  return { y: p.y + vy * dt, vy };
}

/** هل الطيارة (دائرة نصف قطرها r عند x) تصطدم بالبرج؟ */
export function hits(px: number, p: Plane, r: number, tower: Tower, gap: number): boolean {
  if (px + r < tower.x || px - r > tower.x + TOWER_W) return false;
  return p.y - r < tower.gapY - gap / 2 || p.y + r > tower.gapY + gap / 2;
}

export function starsFor(level: Level, passed: number) {
  const [a, b, c] = STARS[level];
  return passed >= c ? 3 : passed >= b ? 2 : passed >= a ? 1 : 0;
}
