/**
 * الويب: الألعاب الكبيرة منشورة ويّا الموقع نفسه (مجلد packs) — ما تحتاج تنزيل منفصل.
 * المتصفح يخزّنها تلقائياً بعد أول فتح.
 */
import { useCallback } from 'react';
import { PACKS, type PackInfo } from '../games/ready.generated';

export const PACK_TAG = 'packs';

/** مسار الموقع (مثل /spir-game-center/) من رابط manifest.json */
function siteBase(): string {
  if (typeof document === 'undefined') return '/';
  const href = document.querySelector('link[rel="manifest"]')?.getAttribute('href') ?? '/manifest.json';
  return href.replace(/manifest\.json$/, '');
}
export const packUrl = (p: PackInfo) => `${siteBase()}packs/${p.file}`;

export type PackState = { status: 'none' | 'ready' | 'downloading' | 'error'; progress: number; uri: string | null; error?: string };

export function usePack(id: string) {
  const pack = PACKS[id];
  const noop = useCallback(async () => {}, []);
  return { pack, status: pack ? ('ready' as const) : ('none' as const), progress: 1, uri: pack ? packUrl(pack) : null, error: undefined, download: noop, remove: noop };
}

export async function removeAllPacks() {}
export async function freeSpace(): Promise<number | null> {
  return null;
}
