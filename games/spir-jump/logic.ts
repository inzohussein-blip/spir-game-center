/**
 * «قفزة سبير»: مولّد المراحل (منطق صافي — يتفحص بالاختبارات).
 * المرحلة شبكة صفوف (12 صف × عرض متغيّر) من قطع (segments) بترتيب ثابت لكل مرحلة:
 *   '.' فارغ · '#' أرض · '=' منصة خشب (تنزل عليها من فوق) · 'f' سمكة · '*' نجمة كبيرة (3 بكل مرحلة)
 *   'e' عدو (مخلوق يمشي) · 'b' فطر نطّ · 'P' البداية · 'G' علم النهاية
 * القواعد: أي فراغ بالأرض ≤ 3 خانات، وتغيّر ارتفاع الأرض ≤ 2 بالخطوة، والمنصات ≤ 3 فوق الأرض —
 * حتى كل شي ينوصله بقفزة وحدة (القفزة ≈ 3.3 خانة طول و 4 خانات عرض).
 */
import { rng } from '../../packages/spir-kit/rng.ts';
import type { Level } from '../../packages/spir-kit/sdk.ts';

export const ROWS = 12;
export const STAGES = 10;
export const MAX_GAP = 3;
export const MAX_RISE = 2;
export const MAX_PLAT = 3;

export type Grid = string[][];

export const LIVES: Record<Level, number> = { easy: 5, medium: 3, hard: 2 };
export const ENEMY_SPEED: Record<Level, number> = { easy: 45, medium: 70, hard: 95 };

export function makeLevel(stage: number): { grid: Grid; width: number } {
  const r = rng(stage * 7349 + 11);
  const segs = 8 + stage; // المراحل تطول
  const cols: string[][] = [];
  let h = 3; // ارتفاع الأرض (عدد خانات من تحت)
  const col = (height: number) => {
    const c = new Array<string>(ROWS).fill('.');
    for (let y = ROWS - height; y < ROWS; y++) c[y] = '#';
    cols.push(c);
    return c;
  };
  const top = () => ROWS - h - 1; // الخانة الفارغة فوق الأرض مباشرة
  // بداية مريحة
  for (let i = 0; i < 4; i++) col(h);
  cols[1][top()] = 'P';
  let starsLeft = 3;
  const starEvery = Math.floor(segs / 3);
  for (let sIdx = 0; sIdx < segs; sIdx++) {
    const wantStar = starsLeft > 0 && sIdx > 0 && sIdx % starEvery === 0;
    const kinds = ['flat', 'gap', 'step', 'plat', 'enemy', 'bounce'];
    // المراحل الأولى أسهل: فراغات وأعداء أقل
    const kind = stage <= 2 && sIdx % 3 !== 0 ? r.pick(['flat', 'step', 'plat']) : r.pick(kinds);
    if (kind === 'flat' || kind === 'enemy') {
      const w = r.int(4, 6);
      for (let i = 0; i < w; i++) {
        const c = col(h);
        if (i % 2 === 1) c[top() - 1] = 'f';
      }
      if (kind === 'enemy') cols[cols.length - 3][top()] = 'e';
      if (wantStar) {
        cols[cols.length - 2][top() - 2] = '*';
        starsLeft--;
      }
    } else if (kind === 'gap') {
      col(h);
      const gw = Math.min(MAX_GAP, 1 + Math.floor(r.next() * Math.min(3, 1 + stage / 3)));
      for (let i = 0; i < gw; i++) {
        const c = col(0);
        c[ROWS - h - 3] = i === Math.floor(gw / 2) && wantStar ? '*' : 'f';
      }
      if (wantStar) starsLeft--;
      col(h);
      col(h);
    } else if (kind === 'step') {
      const dh = r.pick([-2, -1, 1, 2]);
      h = Math.max(2, Math.min(6, h + dh));
      for (let i = 0; i < r.int(3, 5); i++) col(h);
      if (wantStar) {
        cols[cols.length - 2][top() - 2] = '*';
        starsLeft--;
      }
    } else if (kind === 'plat') {
      const w = 6;
      const start = cols.length;
      for (let i = 0; i < w; i++) col(h);
      const py = top() - MAX_PLAT + 1; // صف المنصة
      for (let i = 1; i < 4; i++) {
        cols[start + i][py] = '=';
        cols[start + i][py - 1] = i === 2 && wantStar ? '*' : 'f';
      }
      if (wantStar) starsLeft--;
    } else if (kind === 'bounce') {
      for (let i = 0; i < 4; i++) col(h);
      cols[cols.length - 3][top()] = 'b';
      cols[cols.length - 3][Math.max(0, top() - 6)] = wantStar ? '*' : 'f';
      if (wantStar) starsLeft--;
    }
  }
  // أي نجوم باقية: على آخر الطريق
  while (starsLeft > 0) {
    col(h);
    cols[cols.length - 1][top() - 2] = '*';
    col(h);
    starsLeft--;
  }
  for (let i = 0; i < 5; i++) col(h);
  cols[cols.length - 3][top()] = 'G';
  // من أعمدة لصفوف
  const grid: Grid = Array.from({ length: ROWS }, (_, y) => cols.map((c) => c[y]));
  return { grid, width: cols.length };
}

/** ارتفاع الأرض بكل عمود (0 = فراغ) */
export function groundHeights(grid: Grid): number[] {
  const w = grid[0].length;
  return Array.from({ length: w }, (_, x) => {
    let h = 0;
    for (let y = ROWS - 1; y >= 0 && grid[y][x] === '#'; y--) h++;
    return h;
  });
}

export const count = (grid: Grid, ch: string) => grid.reduce((a, row) => a + row.filter((c) => c === ch).length, 0);

export function starsFor(starsCollected: number) {
  return Math.max(1, Math.min(3, starsCollected));
}
