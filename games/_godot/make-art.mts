/**
 * يرسم صور لعبة Godot من spir-art ويحفظها PNG بمشروعها (games/<id>/godot/art/).
 * قائمة الصور بـ games/<id>/art.mts (export default). يحتاج Playwright (بيئة التطوير):
 *   PLAYWRIGHT=… node --experimental-strip-types games/_godot/make-art.mts <id>
 */
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

type Art = { svg: string; w: number; h: number };
const id = process.argv[2];
if (!id) throw new Error('usage: make-art.mts <game-id>');
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT ?? 'playwright');
const items = (await import(`../${id}/art.mts`)).default as Record<string, Art>;
const out = fileURLToPath(new URL(`../${id}/godot/art/`, import.meta.url));
const K = 2; // دقة مضاعفة

const b = await chromium.launch();
const p = await b.newPage({ deviceScaleFactor: K });
for (const [name, a] of Object.entries(items)) {
  await p.setViewportSize({ width: Math.ceil(a.w), height: Math.ceil(a.h) });
  await p.setContent(`<html><body style="margin:0;background:transparent">${a.svg}</body></html>`);
  await p.locator('svg').screenshot({ path: `${out}${name}.png`, omitBackground: true });
}
await b.close();
console.log(`art ok → ${out} (${Object.keys(items).length})`);
