/** منطق «بلوكات الشبكة»: شبكة 8×8، ثلاث قطع بكل دفعة، الصف أو العمود الممتلئ ينمسح */
import type { Level } from '../../packages/spir-kit/sdk.ts';

export const SIZE = 8;
export type Piece = { cells: [number, number][]; color: number };

/** القطع: كل قطعة قائمة خانات [x, y] */
const SMALL: [number, number][][] = [
  [[0, 0]],
  [[0, 0], [1, 0]],
  [[0, 0], [0, 1]],
  [[0, 0], [1, 0], [0, 1]],
  [[0, 0], [1, 0], [1, 1]],
  [[0, 0], [1, 0], [0, 1], [1, 1]],
  [[0, 0], [1, 0], [2, 0]],
  [[0, 0], [0, 1], [0, 2]],
];
const BIG: [number, number][][] = [
  [[0, 0], [1, 0], [2, 0], [3, 0]],
  [[0, 0], [0, 1], [0, 2], [0, 3]],
  [[0, 0], [1, 0], [2, 0], [0, 1], [0, 2]],
  [[0, 0], [1, 0], [2, 0], [1, 1]],
  [[0, 0], [0, 1], [1, 1], [2, 1]],
  [[0, 0], [1, 0], [1, 1], [2, 1]],
  [[0, 0], [1, 0], [2, 0], [0, 1], [1, 1], [2, 1], [0, 2], [1, 2], [2, 2]],
  [[0, 0], [1, 0], [2, 0], [3, 0], [4, 0]],
];

/** السهل قطع صغيرة أكثر، والصعب يجيب القطع الكبيرة أكثر */
const BIG_CHANCE: Record<Level, number> = { easy: 0.15, medium: 0.35, hard: 0.5 };

export function randomPiece(level: Level, rand: () => number): Piece {
  const pool = rand() < BIG_CHANCE[level] ? BIG : SMALL;
  return { cells: pool[Math.floor(rand() * pool.length)], color: Math.floor(rand() * 6) };
}

/** الشبكة: -1 فارغة، غيرها رقم اللون */
export type Grid = number[];
export const emptyGrid = (): Grid => new Array(SIZE * SIZE).fill(-1);

export function canPlace(g: Grid, p: Piece, x: number, y: number): boolean {
  return p.cells.every(([dx, dy]) => {
    const cx = x + dx;
    const cy = y + dy;
    return cx >= 0 && cy >= 0 && cx < SIZE && cy < SIZE && g[cy * SIZE + cx] < 0;
  });
}

export function place(g: Grid, p: Piece, x: number, y: number): { grid: Grid; cleared: number[]; lines: number; score: number } {
  const grid = [...g];
  for (const [dx, dy] of p.cells) grid[(y + dy) * SIZE + x + dx] = p.color;
  const rows: number[] = [];
  const cols: number[] = [];
  for (let k = 0; k < SIZE; k++) {
    let row = true;
    let col = true;
    for (let j = 0; j < SIZE; j++) {
      if (grid[k * SIZE + j] < 0) row = false;
      if (grid[j * SIZE + k] < 0) col = false;
    }
    if (row) rows.push(k);
    if (col) cols.push(k);
  }
  const cleared = new Set<number>();
  for (const r of rows) for (let j = 0; j < SIZE; j++) cleared.add(r * SIZE + j);
  for (const cc of cols) for (let j = 0; j < SIZE; j++) cleared.add(j * SIZE + cc);
  for (const i of cleared) grid[i] = -1;
  const lines = rows.length + cols.length;
  // نقطة لكل خانة، و10 لكل خط، ومكافأة إذا انمسح أكثر من خط سوا
  const score = p.cells.length + lines * 10 + (lines > 1 ? (lines - 1) * 10 : 0);
  return { grid, cleared: [...cleared], lines, score };
}

export function fitsAnywhere(g: Grid, p: Piece): boolean {
  for (let y = 0; y < SIZE; y++) for (let x = 0; x < SIZE; x++) if (canPlace(g, p, x, y)) return true;
  return false;
}

export const STARS: Record<Level, [number, number, number]> = { easy: [60, 150, 300], medium: [100, 250, 500], hard: [150, 400, 800] };

export function starsFor(level: Level, score: number) {
  const [a, b, c] = STARS[level];
  return score >= c ? 3 : score >= b ? 2 : score >= a ? 1 : 0;
}
