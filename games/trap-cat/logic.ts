/**
 * منطق «حاصر البزون»: شبكة سداسية (صفوف مزاحة odd-r) n×n.
 * اللاعب يسد خانة، والبزون يتحرك خطوة باتجاه أقرب حافة (BFS).
 * الفوز: ماكو طريق للحافة. الخسارة: البزون على الحافة بدوره → يهرب.
 */
import type { Level } from '../../packages/spir-kit/sdk.ts';
import { rng } from '../../packages/spir-kit/rng.ts';

export const N = 11;

export type Board = { n: number; blocked: boolean[]; cat: number };

export const idx = (n: number, x: number, y: number) => y * n + x;
export const xy = (n: number, i: number) => ({ x: i % n, y: Math.floor(i / n) });

export function neighbors(n: number, i: number): number[] {
  const { x, y } = xy(n, i);
  const odd = y % 2 === 1;
  const d = odd
    ? [[-1, 0], [1, 0], [0, -1], [1, -1], [0, 1], [1, 1]]
    : [[-1, 0], [1, 0], [-1, -1], [0, -1], [-1, 1], [0, 1]];
  const out: number[] = [];
  for (const [dx, dy] of d) {
    const nx = x + dx;
    const ny = y + dy;
    if (nx >= 0 && ny >= 0 && nx < n && ny < n) out.push(idx(n, nx, ny));
  }
  return out;
}

export const isEdge = (n: number, i: number) => {
  const { x, y } = xy(n, i);
  return x === 0 || y === 0 || x === n - 1 || y === n - 1;
};

/** المسافة من كل خانة لأقرب حافة مفتوحة (BFS من كل خانات الحافة). -1 = ماكو طريق */
export function distToEdge(b: Board): Int16Array {
  const dist = new Int16Array(b.n * b.n).fill(-1);
  const q: number[] = [];
  for (let i = 0; i < b.n * b.n; i++) {
    if (!b.blocked[i] && isEdge(b.n, i)) {
      dist[i] = 0;
      q.push(i);
    }
  }
  for (let h = 0; h < q.length; h++) {
    const cur = q[h];
    for (const nb of neighbors(b.n, cur)) {
      if (!b.blocked[nb] && dist[nb] < 0) {
        dist[nb] = dist[cur] + 1;
        q.push(nb);
      }
    }
  }
  return dist;
}

export type CatMove = { kind: 'escape' } | { kind: 'trapped' } | { kind: 'move'; to: number };

/** عشوائية البزون حسب الصعوبة: بالسهل يغلط أكثر */
const MISTAKE: Record<Level, number> = { easy: 0.35, medium: 0.12, hard: 0 };

export function catMove(b: Board, level: Level, rand: () => number): CatMove {
  const dist = distToEdge(b);
  if (dist[b.cat] < 0) return { kind: 'trapped' };
  if (isEdge(b.n, b.cat)) return { kind: 'escape' };
  const free = neighbors(b.n, b.cat).filter((i) => !b.blocked[i]);
  const reachable = free.filter((i) => dist[i] >= 0);
  if (rand() < MISTAKE[level] && free.length > 0) {
    return { kind: 'move', to: free[Math.floor(rand() * free.length)] };
  }
  const best = Math.min(...reachable.map((i) => dist[i]));
  const options = reachable.filter((i) => dist[i] === best);
  if (level === 'hard' && options.length > 1) {
    // بالصعب: يختار الخانة اللي بيها طرق أكثر (أصعب تنسد)
    const score = (i: number) => neighbors(b.n, i).filter((j) => !b.blocked[j] && dist[j] >= 0 && dist[j] < best).length;
    options.sort((a, c) => score(c) - score(a));
    return { kind: 'move', to: options[0] };
  }
  return { kind: 'move', to: options[Math.floor(rand() * options.length)] };
}

const BASE_BLOCKS: Record<Level, number> = { easy: 20, medium: 14, hard: 10 };

/** عدد الخانات المسدودة بالبداية: يقل كل 5 مراحل */
export const startBlocks = (level: Level, stage: number) => Math.max(BASE_BLOCKS[level] - 6, BASE_BLOCKS[level] - Math.floor((stage - 1) / 5));

/** لوحة المرحلة: نفس المرحلة = نفس اللوحة (بذرة ثابتة) */
export function makeBoard(level: Level, stage: number): Board {
  const n = N;
  const r = rng(stage * 7919 + level.length * 104729);
  const blocked = new Array<boolean>(n * n).fill(false);
  const cat = idx(n, Math.floor(n / 2), Math.floor(n / 2));
  let count = startBlocks(level, stage);
  while (count > 0) {
    const i = r.int(0, n * n - 1);
    if (i === cat || blocked[i] || neighbors(n, cat).includes(i)) continue;
    blocked[i] = true;
    count--;
  }
  return { n, blocked, cat };
}

const PAR: Record<Level, [number, number]> = { easy: [9, 15], medium: [11, 18], hard: [13, 22] };

export function starsFor(level: Level, moves: number) {
  const [three, two] = PAR[level];
  return moves <= three ? 3 : moves <= two ? 2 : 1;
}
