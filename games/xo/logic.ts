/** منطق «إكس أو»: لوحة 3×3، والخصم الآلي بـ Minimax */
import type { Level } from '../../packages/spir-kit/sdk.ts';

export type Mark = 'X' | 'O' | null;
export type Board = Mark[];

export const LINES = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6],
];

export const empty = (): Board => new Array<Mark>(9).fill(null);

export function winner(b: Board): { mark: 'X' | 'O'; line: number[] } | 'draw' | null {
  for (const line of LINES) {
    const [a, c, d] = line;
    if (b[a] && b[a] === b[c] && b[a] === b[d]) return { mark: b[a] as 'X' | 'O', line };
  }
  return b.every(Boolean) ? 'draw' : null;
}

const free = (b: Board) => b.flatMap((m, i) => (m ? [] : [i]));

/** Minimax: أحسن خانة للاعب `me` */
export function bestMove(b: Board, me: 'X' | 'O'): number {
  const other = me === 'X' ? 'O' : 'X';
  const score = (board: Board, turn: 'X' | 'O', depth: number): number => {
    const w = winner(board);
    if (w === 'draw') return 0;
    if (w) return w.mark === me ? 10 - depth : depth - 10;
    const vals = free(board).map((i) => {
      board[i] = turn;
      const v = score(board, turn === 'X' ? 'O' : 'X', depth + 1);
      board[i] = null;
      return v;
    });
    return turn === me ? Math.max(...vals) : Math.min(...vals);
  };
  let best = -Infinity;
  let pick = free(b)[0];
  for (const i of free(b)) {
    b[i] = me;
    const v = score(b, other, 1);
    b[i] = null;
    if (v > best) {
      best = v;
      pick = i;
    }
  }
  return pick;
}

/** نسبة الحركات «الذكية» حسب الصعوبة — الباقي عشوائي */
const SMART: Record<Level, number> = { easy: 0.35, medium: 0.75, hard: 1 };

export function aiMove(b: Board, me: 'X' | 'O', level: Level, rand: () => number): number {
  const options = free(b);
  if (rand() < SMART[level]) return bestMove(b, me);
  return options[Math.floor(rand() * options.length)];
}
