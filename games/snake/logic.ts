/** منطق «الأفعى»: شبكة مربعة، كل خطوة تتقدم، الأكل يطوّلها. بالسهل الحيطان تعبر للجهة الثانية */
import type { Level } from '../../packages/spir-kit/sdk.ts';
import { DELTA, type Dir } from '../../packages/spir-kit/input.ts';

export const SIZE = 14;
export type Cell = { x: number; y: number };
export type Snake = { body: Cell[]; dir: Dir; food: Cell };

export const STEP_MS: Record<Level, number> = { easy: 210, medium: 150, hard: 105 };
export const WRAP: Record<Level, boolean> = { easy: true, medium: false, hard: false };
export const STARS: Record<Level, [number, number, number]> = { easy: [4, 10, 18], medium: [6, 14, 24], hard: [8, 18, 30] };

const opposite: Record<Dir, Dir> = { up: 'down', down: 'up', left: 'right', right: 'left' };

/** تغيير الاتجاه: ما يگدر يرجع على نفسه */
export const turn = (cur: Dir, next: Dir) => (opposite[cur] === next ? cur : next);

export function placeFood(body: Cell[], rand: () => number): Cell {
  const free: Cell[] = [];
  for (let y = 0; y < SIZE; y++) for (let x = 0; x < SIZE; x++) if (!body.some((b) => b.x === x && b.y === y)) free.push({ x, y });
  return free[Math.floor(rand() * free.length)];
}

export function newSnake(rand: () => number): Snake {
  const mid = Math.floor(SIZE / 2);
  const body = [{ x: mid, y: mid }, { x: mid + 1, y: mid }, { x: mid + 2, y: mid }];
  return { body, dir: 'left', food: placeFood(body, rand) };
}

export function step(s: Snake, wrap: boolean, rand: () => number): { snake: Snake; ate: boolean; dead: boolean } {
  const [dx, dy] = DELTA[s.dir];
  let x = s.body[0].x + dx;
  let y = s.body[0].y + dy;
  if (wrap) {
    x = (x + SIZE) % SIZE;
    y = (y + SIZE) % SIZE;
  } else if (x < 0 || y < 0 || x >= SIZE || y >= SIZE) return { snake: s, ate: false, dead: true };
  const ate = x === s.food.x && y === s.food.y;
  // الذيل يتحرك إذا ما أكلت، فالخانة اللي جاي يطلع منها مسموحة
  const rest = ate ? s.body : s.body.slice(0, -1);
  if (rest.some((b) => b.x === x && b.y === y)) return { snake: s, ate: false, dead: true };
  const body = [{ x, y }, ...rest];
  return { snake: { ...s, body, food: ate ? placeFood(body, rand) : s.food }, ate, dead: false };
}

export function starsFor(level: Level, eaten: number) {
  const [a, b, c] = STARS[level];
  return eaten >= c ? 3 : eaten >= b ? 2 : eaten >= a ? 1 : 0;
}
