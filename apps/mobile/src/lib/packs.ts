/**
 * ألعاب تنزل عند الطلب (Godot وغيره): ملف HTML واحد كبير بإصدار GitHub ثابت اسمه «packs».
 * الأندرويد: ينزل مرة وحدة لـ documentDirectory/packs ويشتغل بعدها بدون نت.
 */
import Constants from 'expo-constants';
import * as FS from 'expo-file-system/legacy';
import { useCallback, useEffect, useState } from 'react';
import { PACKS, type PackInfo } from '../games/ready.generated';

const REPO: string | undefined = (Constants.expoConfig?.extra as { releasesRepo?: string } | undefined)?.releasesRepo;
export const PACK_TAG = 'packs';
export const packUrl = (p: PackInfo) => `https://github.com/${REPO}/releases/download/${PACK_TAG}/${p.file}`;

const dir = () => `${FS.documentDirectory ?? ''}packs/`;
const pathOf = (p: PackInfo) => dir() + p.file;

export type PackState = { status: 'none' | 'ready' | 'downloading' | 'error'; progress: number; uri: string | null; error?: string };

/** حالة لعبة تنزل عند الطلب + تنزيل ومسح */
export function usePack(id: string) {
  const pack = PACKS[id];
  const [st, setSt] = useState<PackState>({ status: 'none', progress: 0, uri: null });

  useEffect(() => {
    if (!pack) return;
    let alive = true;
    FS.getInfoAsync(pathOf(pack))
      .then((info) => alive && info.exists && setSt({ status: 'ready', progress: 1, uri: pathOf(pack) }))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [pack]);

  const download = useCallback(async () => {
    if (!pack) return;
    setSt({ status: 'downloading', progress: 0, uri: null });
    try {
      await FS.makeDirectoryAsync(dir(), { intermediates: true }).catch(() => {});
      // نمسح النسخ القديمة من نفس اللعبة
      const old = (await FS.readDirectoryAsync(dir()).catch(() => [] as string[])).filter((f) => f.startsWith(`${id}-`) && f !== pack.file);
      await Promise.all(old.map((f) => FS.deleteAsync(dir() + f, { idempotent: true })));
      const tmp = `${pathOf(pack)}.part`;
      const dl = FS.createDownloadResumable(packUrl(pack), tmp, {}, (p) => {
        const total = p.totalBytesExpectedToWrite > 0 ? p.totalBytesExpectedToWrite : pack.bytes;
        setSt((s) => ({ ...s, progress: Math.min(0.99, p.totalBytesWritten / total) }));
      });
      const res = await dl.downloadAsync();
      if (!res || res.status !== 200) throw new Error(`تعذّر التنزيل (${res?.status ?? '؟'})`);
      // نتأكد الملف كامل (نفس الحجم المكتوب بـ game.json)
      const info = await FS.getInfoAsync(tmp);
      if (!info.exists || (info.size ?? 0) < pack.bytes * 0.98) throw new Error('الملف ما نزل كامل، جرّب مرة ثانية');
      await FS.moveAsync({ from: tmp, to: pathOf(pack) });
      setSt({ status: 'ready', progress: 1, uri: pathOf(pack) });
    } catch (e) {
      setSt({ status: 'error', progress: 0, uri: null, error: e instanceof Error ? e.message : 'تعذّر التنزيل' });
    }
  }, [id, pack]);

  const remove = useCallback(async () => {
    if (!pack) return;
    await FS.deleteAsync(pathOf(pack), { idempotent: true });
    setSt({ status: 'none', progress: 0, uri: null });
  }, [pack]);

  return { pack, ...st, download, remove };
}
