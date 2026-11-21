/**
 * منطق «سودوكو»: 4×4 للسهل، 6×6 للمتوسط، 9×9 للصعب.
 * المولّد يعبّي شبكة كاملة بالتراجع (backtracking) ببذرة ثابتة، وبعدين يشيل أرقام
 * وهو متأكد إن اللغز إله حل واحد بس.
 */
import type { Level } from '../../packages/spir-kit/sdk.ts';
import { rng } from '../../packages/spir-kit/rng.ts';

export type Spec = { n: number; bw: number; bh: number; clues: [number, number] };
export const SPECS: Record<Level, Spec> = {
  easy: { n: 4, bw: 2, bh: 2, clues: [8, 6] },
  medium: { n: 6, bw: 3, bh: 2, clues: [18, 13] },
  hard: { n: 9, bw: 3, bh: 3, clues: [34, 27] },
};
export const STAGES = 20;

export type Grid = number[]; // 0 = فارغة

export function candidates(g: Grid, s: Spec, i: number): number[] {
  const { n, bw, bh } = s;
  const r = Math.floor(i / n);
  const c = i % n;
  const used = new Set<number>();
  for (let k = 0; k < n; k++) {
    used.add(g[r * n + k]);
    used.add(g[k * n + c]);
  }
  const br = r - (r % bh);
  const bc = c - (c % bw);
  for (let y = br; y < br + bh; y++) for (let x = bc; x < bc + bw; x++) used.add(g[y * n + x]);
  const out: number[] = [];
  for (let v = 1; v <= n; v++) if (!used.has(v)) out.push(v);
  return out;
}

/** يحسب عدد الحلول (يوقف عند limit) */
export function countSolutions(g: Grid, s: Spec, limit = 2): number {
  const i = g.indexOf(0);
  if (i < 0) return 1;
  let count = 0;
  for (const v of candidates(g, s, i)) {
    g[i] = v;
    count += countSolutions(g, s, limit - count);
    g[i] = 0;
    if (count >= limit) break;
  }
  return count;
}

function fill(g: Grid, s: Spec, rand: () => number): boolean {
  const i = g.indexOf(0);
  if (i < 0) return true;
  const cands = candidates(g, s, i);
  for (let k = cands.length - 1; k > 0; k--) {
    const j = Math.floor(rand() * (k + 1));
    [cands[k], cands[j]] = [cands[j], cands[k]];
  }
  for (const v of cands) {
    g[i] = v;
    if (fill(g, s, rand)) return true;
  }
  g[i] = 0;
  return false;
}

export function makePuzzle(level: Level, stage: number): { puzzle: Grid; solution: Grid; spec: Spec } {
  const spec = SPECS[level];
  const r = rng(stage * 8191 + spec.n);
  const solution = new Array<number>(spec.n * spec.n).fill(0);
  fill(solution, spec, r.next);
  const puzzle = [...solution];
  // الأرقام الظاهرة تقل ويّا المراحل
  const [most, least] = spec.clues;
  const target = Math.round(most - ((most - least) * (stage - 1)) / (STAGES - 1));
  const order = r.shuffle(Array.from({ length: puzzle.length }, (_, i) => i));
  let shown = puzzle.length;
  for (const i of order) {
    if (shown <= target) break;
    const keep = puzzle[i];
    puzzle[i] = 0;
    if (countSolutions([...puzzle], spec) !== 1) puzzle[i] = keep;
    else shown--;
  }
  return { puzzle, solution, spec };
}

export function starsFor(mistakes: number) {
  return mistakes === 0 ? 3 : mistakes <= 2 ? 2 : 1;
}
