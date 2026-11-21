import type { Point } from './engine.ts';

export type Dir = 'up' | 'down' | 'left' | 'right';
export const DELTA: Record<Dir, [number, number]> = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };

/** اتجاه السحب من نقطة لنقطة، أو null إذا السحب أقصر من الحد */
export function swipeDir(a: Point, b: Point, min = 18): Dir | null {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  if (Math.hypot(dx, dy) < min) return null;
  return Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : dy > 0 ? 'down' : 'up';
}
