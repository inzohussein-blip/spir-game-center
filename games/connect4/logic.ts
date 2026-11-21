/** منطق «أربعة بخط»: 7 أعمدة × 6 صفوف، والخصم الآلي Minimax ويّا تقليم ألفا-بيتا */
import type { Level } from '../../packages/spir-kit/sdk.ts';

export const COLS = 7;
export const ROWS = 6;
export type Cell = 0 | 1 | 2; // 0 فارغة، 1 اللاعب، 2 الجهاز/اللاعب الثاني
export type Board = Cell[]; // index = row * COLS + col، الصف 0 فوق

export const empty = (): Board => new Array<Cell>(COLS * ROWS).fill(0);

/** أوطى صف فارغ بالعمود، أو -1 إذا مليان */
export function dropRow(b: Board, col: number): number {
  for (let r = ROWS - 1; r >= 0; r--) if (b[r * COLS + col] === 0) return r;
  return -1;
}

export function drop(b: Board, col: number, p: 1 | 2): { board: Board; row: number } | null {
  const row = dropRow(b, col);
  if (row < 0) return null;
  const board = [...b];
  board[row * COLS + col] = p;
  return { board, row };
}

const DIRS = [[1, 0], [0, 1], [1, 1], [1, -1]];

export function winner(b: Board): { p: 1 | 2; line: number[] } | 'draw' | null {
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
    const p = b[r * COLS + c];
    if (!p) continue;
    for (const [dc, dr] of DIRS) {
      const line = [0, 1, 2, 3].map((k) => [r + dr * k, c + dc * k]);
      if (line.every(([rr, cc]) => rr >= 0 && rr < ROWS && cc >= 0 && cc < COLS && b[rr * COLS + cc] === p)) {
        return { p: p as 1 | 2, line: line.map(([rr, cc]) => rr * COLS + cc) };
      }
    }
  }
  return b.every((v) => v !== 0) ? 'draw' : null;
}

/** تقييم اللوحة لصالح `me`: نافذات من 4 خانات */
function evaluate(b: Board, me: 1 | 2): number {
  const other = me === 1 ? 2 : 1;
  let score = 0;
  for (let r = 0; r < ROWS; r++) if (b[r * COLS + 3] === me) score += 3; // العمود الوسطي أقوى
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) for (const [dc, dr] of DIRS) {
    const cells: Cell[] = [];
    for (let k = 0; k < 4; k++) {
      const rr = r + dr * k;
      const cc = c + dc * k;
      if (rr < 0 || rr >= ROWS || cc < 0 || cc >= COLS) break;
      cells.push(b[rr * COLS + cc]);
    }
    if (cells.length < 4) continue;
    const mine = cells.filter((v) => v === me).length;
    const theirs = cells.filter((v) => v === other).length;
    const empties = 4 - mine - theirs;
    if (mine === 3 && empties === 1) score += 5;
    else if (mine === 2 && empties === 2) score += 2;
    if (theirs === 3 && empties === 1) score -= 4;
  }
  return score;
}

const ORDER = [3, 2, 4, 1, 5, 0, 6];

function minimax(b: Board, depth: number, alpha: number, beta: number, turn: 1 | 2, me: 1 | 2): number {
  const w = winner(b);
  if (w === 'draw') return 0;
  if (w) return w.p === me ? 100000 + depth : -100000 - depth;
  if (depth === 0) return evaluate(b, me);
  const next: 1 | 2 = turn === 1 ? 2 : 1;
  if (turn === me) {
    let best = -Infinity;
    for (const c of ORDER) {
      const d = drop(b, c, turn);
      if (!d) continue;
      best = Math.max(best, minimax(d.board, depth - 1, alpha, beta, next, me));
      alpha = Math.max(alpha, best);
      if (alpha >= beta) break;
    }
    return best;
  }
  let best = Infinity;
  for (const c of ORDER) {
    const d = drop(b, c, turn);
    if (!d) continue;
    best = Math.min(best, minimax(d.board, depth - 1, alpha, beta, next, me));
    beta = Math.min(beta, best);
    if (alpha >= beta) break;
  }
  return best;
}

export const DEPTH: Record<Level, number> = { easy: 1, medium: 3, hard: 6 };
const RANDOM: Record<Level, number> = { easy: 0.4, medium: 0.1, hard: 0 };

export function bestCol(b: Board, me: 1 | 2, depth: number): number {
  let best = -Infinity;
  let pick = ORDER.find((c) => dropRow(b, c) >= 0) ?? 3;
  for (const c of ORDER) {
    const d = drop(b, c, me);
    if (!d) continue;
    const v = minimax(d.board, depth - 1, -Infinity, Infinity, me === 1 ? 2 : 1, me);
    if (v > best) {
      best = v;
      pick = c;
    }
  }
  return pick;
}

export function aiCol(b: Board, me: 1 | 2, level: Level, rand: () => number): number {
  const open = ORDER.filter((c) => dropRow(b, c) >= 0);
  if (rand() < RANDOM[level]) return open[Math.floor(rand() * open.length)];
  return bestCol(b, me, DEPTH[level]);
}
