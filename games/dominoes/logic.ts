/**
 * منطق «دومينو» (دبل ستة، نظام السحب): كل لاعب 7 قطع، والباقي بالمخزن.
 * تنزّل قطعة تطابق أحد طرفين السلسلة. إذا ما عندك، تسحب لحد ما تلگى أو يخلص المخزن، وبعدها تمرّر.
 * الجولة تخلص لما واحد يخلّص قطعه، أو تنسد (الاثنين يمررون) فيفوز الأقل مجموع.
 */
import type { Level } from '../../packages/spir-kit/sdk.ts';
import { rng } from '../../packages/spir-kit/rng.ts';

export type Tile = [number, number];
export type Side = 'start' | 'end';

export function fullSet(): Tile[] {
  const out: Tile[] = [];
  for (let a = 0; a <= 6; a++) for (let b = a; b <= 6; b++) out.push([a, b]);
  return out;
}

export type Deal = { player: Tile[]; ai: Tile[]; stock: Tile[] };

export function deal(seed: number): Deal {
  const tiles = rng(seed).shuffle(fullSet());
  return { player: tiles.slice(0, 7), ai: tiles.slice(7, 14), stock: tiles.slice(14) };
}

export const pips = (t: Tile) => t[0] + t[1];
export const handPips = (h: Tile[]) => h.reduce((a, t) => a + pips(t), 0);

/** السلسلة: قطع موجّهة، الطرف الأول chain[0][0] والأخير chain[n-1][1] */
export type Chain = Tile[];

export const ends = (chain: Chain): [number, number] | null => (chain.length ? [chain[0][0], chain[chain.length - 1][1]] : null);

/** الجهات اللي تگدر تنحط بيها القطعة */
export function sidesFor(chain: Chain, t: Tile): Side[] {
  const e = ends(chain);
  if (!e) return ['end'];
  const out: Side[] = [];
  if (t[0] === e[0] || t[1] === e[0]) out.push('start');
  if (t[0] === e[1] || t[1] === e[1]) out.push('end');
  return out;
}

export function place(chain: Chain, t: Tile, side: Side): Chain {
  const e = ends(chain);
  if (!e) return [t];
  if (side === 'start') {
    const oriented: Tile = t[1] === e[0] ? [t[0], t[1]] : [t[1], t[0]];
    return [oriented, ...chain];
  }
  const oriented: Tile = t[0] === e[1] ? [t[0], t[1]] : [t[1], t[0]];
  return [...chain, oriented];
}

export const playable = (chain: Chain, hand: Tile[]) => hand.filter((t) => sidesFor(chain, t).length > 0);

export type AiMove = { tile: Tile; side: Side };

/** حركة الجهاز: السهل عشوائي، المتوسط أثقل قطعة، الصعب يحافظ على الأرقام اللي عنده أكثر */
export function aiMove(chain: Chain, hand: Tile[], level: Level, rand: () => number): AiMove | null {
  const opts: AiMove[] = [];
  for (const t of hand) for (const side of sidesFor(chain, t)) opts.push({ tile: t, side });
  if (!opts.length) return null;
  if (level === 'easy') return opts[Math.floor(rand() * opts.length)];
  const score = (m: AiMove) => {
    let s = pips(m.tile) * 2 + (m.tile[0] === m.tile[1] ? 3 : 0);
    if (level === 'hard') {
      const next = place(chain, m.tile, m.side);
      const e = ends(next)!;
      const rest = hand.filter((t) => t !== m.tile);
      // كم قطعة باقية عندي تگدر تنلعب على الأطراف الجديدة
      s += rest.filter((t) => t.includes(e[0]) || t.includes(e[1])).length * 4;
    }
    return s;
  };
  return opts.reduce((best, m) => (score(m) > score(best) ? m : best));
}

export type RoundEnd = { winner: 'player' | 'ai' | 'draw'; how: 'domino' | 'blocked' };

export function blockedResult(player: Tile[], ai: Tile[]): RoundEnd {
  const p = handPips(player);
  const a = handPips(ai);
  return { winner: p < a ? 'player' : a < p ? 'ai' : 'draw', how: 'blocked' };
}

export function starsFor(end: RoundEnd) {
  if (end.winner !== 'player') return end.winner === 'draw' ? 1 : 0;
  return end.how === 'domino' ? 3 : 2;
}
