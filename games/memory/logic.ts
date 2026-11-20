/** منطق «ذاكرة البطاقات»: عدد الأزواج حسب الصعوبة والمرحلة، وتوزيع ثابت لكل مرحلة */
import type { Level } from '../../packages/spir-kit/sdk.ts';
import { rng } from '../../packages/spir-kit/rng.ts';

export const SYMBOLS = 10;

const BASE: Record<Level, number> = { easy: 3, medium: 4, hard: 6 };
const MAX: Record<Level, number> = { easy: 6, medium: 8, hard: 10 };

export const pairsFor = (level: Level, stage: number) => Math.min(MAX[level], BASE[level] + Math.floor((stage - 1) / 2));

/** عدد الأعمدة حتى الشبكة تبقى متوازنة بالطول */
export const colsFor = (cards: number) => (cards <= 6 ? 3 : cards <= 12 ? 4 : cards <= 16 ? 4 : 5);

/** كم ثانية تنكشف البطاقات بالبداية */
export const PEEK_MS: Record<Level, number> = { easy: 2000, medium: 1000, hard: 0 };

export function makeDeck(level: Level, stage: number): number[] {
  const pairs = pairsFor(level, stage);
  const r = rng(stage * 1013 + level.length * 31);
  const symbols = r.shuffle(Array.from({ length: SYMBOLS }, (_, i) => i)).slice(0, pairs);
  return r.shuffle([...symbols, ...symbols]);
}

export function starsFor(pairs: number, moves: number) {
  return moves <= Math.ceil(pairs * 1.5) ? 3 : moves <= Math.ceil(pairs * 2.2) ? 2 : 1;
}
