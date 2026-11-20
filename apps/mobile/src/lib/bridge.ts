/**
 * رسائل الجسر بين التطبيق واللعبة — نفس الأنواع اللي بـ packages/spir-kit/sdk.ts
 * (منسوخة هنا لأن Metro ما يقرا ملفات برا مجلد التطبيق).
 */
import type { Level } from './progressCore';

export type GameSettings = { level: Level; stage: number; sound: boolean; players: 1 | 2 };

export type GameMessage =
  | { type: 'ready' }
  | { type: 'hud'; text: string; score?: string }
  | { type: 'complete'; stars: number; score: number; moves?: number; title?: string; subtitle?: string; timeUp?: boolean }
  | { type: 'over'; score: number; title?: string; subtitle?: string }
  | { type: 'vibrate' };

export type HostMessage = { type: 'start'; settings: GameSettings } | { type: 'pause' } | { type: 'resume' } | { type: 'sound'; on: boolean };

const TYPES = new Set(['ready', 'hud', 'complete', 'over', 'vibrate']);

/** يتحقق من رسالة اللعبة قبل ما نصدقها (النوع والأرقام) */
export function parseGameMessage(raw: unknown): GameMessage | null {
  let data = raw;
  if (typeof data === 'string') {
    try {
      data = JSON.parse(data);
    } catch {
      return null;
    }
  }
  if (!data || typeof data !== 'object') return null;
  const m = data as Record<string, unknown>;
  if (m.spir !== 1 || typeof m.type !== 'string' || !TYPES.has(m.type)) return null;
  const str = (v: unknown, max = 80) => (typeof v === 'string' ? v.slice(0, max) : undefined);
  const num = (v: unknown, min: number, max: number) => (typeof v === 'number' && Number.isFinite(v) ? Math.min(max, Math.max(min, v)) : min);
  switch (m.type) {
    case 'ready':
    case 'vibrate':
      return { type: m.type };
    case 'hud':
      return { type: 'hud', text: str(m.text, 40) ?? '', score: str(m.score, 30) };
    case 'complete':
      return { type: 'complete', stars: Math.round(num(m.stars, 0, 3)), score: num(m.score, 0, 1e6), moves: m.moves === undefined ? undefined : num(m.moves, 0, 1e6), title: str(m.title, 40), subtitle: str(m.subtitle), timeUp: m.timeUp === true };
    case 'over':
      return { type: 'over', score: num(m.score, 0, 1e6), title: str(m.title, 40), subtitle: str(m.subtitle) };
  }
  return null;
}
