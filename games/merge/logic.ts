/** منطق «دمج الأرقام»: شبكة 4×4، السحب يزحلق كل الأرقام، والمتشابهة تندمج مرة وحدة بكل حركة */
import type { Level } from '../../packages/spir-kit/sdk.ts';
import type { Dir } from '../../packages/spir-kit/input.ts';

export const SIZE = 4;
export type Grid = number[]; // 0 = فارغة

export const TARGET: Record<Level, number> = { easy: 256, medium: 1024, hard: 2048 };

/** يزحلق صف واحد لليسار ويدمج. يرجع الصف الجديد والنقاط ومواضع الدمج */
export function slideRow(row: number[]): { row: number[]; score: number; merged: number[] } {
  const vals = row.filter((v) => v > 0);
  const out: number[] = [];
  const merged: number[] = [];
  let score = 0;
  for (let i = 0; i < vals.length; i++) {
    if (i + 1 < vals.length && vals[i] === vals[i + 1]) {
      out.push(vals[i] * 2);
      score += vals[i] * 2;
      merged.push(out.length - 1);
      i++;
    } else out.push(vals[i]);
  }
  while (out.length < row.length) out.push(0);
  return { row: out, score, merged };
}

const lineIdx = (dir: Dir, k: number): number[] => {
  const r: number[] = [];
  for (let j = 0; j < SIZE; j++) {
    if (dir === 'left') r.push(k * SIZE + j);
    if (dir === 'right') r.push(k * SIZE + (SIZE - 1 - j));
    if (dir === 'up') r.push(j * SIZE + k);
    if (dir === 'down') r.push((SIZE - 1 - j) * SIZE + k);
  }
  return r;
};

export function move(g: Grid, dir: Dir): { grid: Grid; score: number; moved: boolean; merged: number[] } {
  const grid = [...g];
  let score = 0;
  const merged: number[] = [];
  for (let k = 0; k < SIZE; k++) {
    const idx = lineIdx(dir, k);
    const res = slideRow(idx.map((i) => g[i]));
    idx.forEach((i, j) => (grid[i] = res.row[j]));
    score += res.score;
    for (const m of res.merged) merged.push(idx[m]);
  }
  return { grid, score, moved: grid.some((v, i) => v !== g[i]), merged };
}

export function spawn(g: Grid, rand: () => number): { grid: Grid; at: number } | null {
  const free = g.flatMap((v, i) => (v ? [] : [i]));
  if (!free.length) return null;
  const at = free[Math.floor(rand() * free.length)];
  const grid = [...g];
  grid[at] = rand() < 0.9 ? 2 : 4;
  return { grid, at };
}

export const canMove = (g: Grid) => (['up', 'down', 'left', 'right'] as Dir[]).some((d) => move(g, d).moved);

/** النجوم إذا انسدت اللوحة قبل الهدف: نص الهدف = نجمتين، ربع الهدف = نجمة */
export function starsFor(level: Level, maxTile: number) {
  const t = TARGET[level];
  return maxTile >= t ? 3 : maxTile >= t / 2 ? 2 : maxTile >= t / 4 ? 1 : 0;
}
