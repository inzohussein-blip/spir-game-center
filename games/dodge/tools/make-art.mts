/**
 * يرسم صور «تجنّب الوحوش» من spir-art ويحفظها PNG داخل مشروع Godot (art/).
 * يحتاج Playwright (موجود ببيئة التطوير). التشغيل:
 *   node --experimental-strip-types games/dodge/tools/make-art.mts
 */
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT ?? 'playwright');
const A = await import('../../../packages/spir-art/index.ts');
const out = fileURLToPath(new URL('../godot/art/', import.meta.url));

type Art = { svg: string; w: number; h: number };
const K = 2; // دقة مضاعفة
const items: Record<string, Art> = {
  spir: A.catFace('orange', 'open', 'smile'),
  spir_happy: A.catFace('orange', 'happy', 'open'),
  spir_scared: A.catFace('orange', 'scared', 'o'),
  fish: A.fish(48),
  heart: A.heart(40, true),
  heart_off: A.heart(40, false),
  bg: A.sky(A.THEMES[0], 480, 720),
};
for (const t of [1, 3, 5, 7, 9]) items[`mob${t}`] = A.creature(t, 96);

const b = await chromium.launch();
const p = await b.newPage({ deviceScaleFactor: K });
for (const [name, a] of Object.entries(items)) {
  await p.setViewportSize({ width: Math.ceil(a.w), height: Math.ceil(a.h) });
  await p.setContent(`<html><body style="margin:0;background:transparent">${a.svg}</body></html>`);
  await p.locator('svg').screenshot({ path: `${out}${name}.png`, omitBackground: true });
}
await b.close();
console.log('art ok →', out);
