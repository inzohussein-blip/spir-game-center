// يبني كل لعبة بمجلد games/ لملف HTML واحد مستقل (بدون نت) — مهما كان محركها:
//  - engine: spir | spir-kit | phaser  → esbuild يجمع main.ts بملف واحد، وتنحط داخل التطبيق (assets/games).
//  - engine: godot (pack: download)    → التصدير الجاهز (packs/<id>.html من scripts/godot-pack.mjs) ما ينحط بالتطبيق؛
//    التطبيق يعرف بس حجمه ونسخته (من game.json) وينزّله عند الطلب.
// يرفض أي لعبة: بدون game.json صحيح، رخصة كود أو أصول غير مقبولة، CC-BY بدون ذكر الاسم، أكبر من الحد، أو تحمّل شي من النت.
import { build } from 'esbuild';
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../../../games/', import.meta.url));
const out = fileURLToPath(new URL('../src/games/', import.meta.url));
const assetsDir = fileURLToPath(new URL('../assets/games/', import.meta.url));
rmSync(assetsDir, { recursive: true, force: true });
mkdirSync(out, { recursive: true });
mkdirSync(assetsDir, { recursive: true });
const MAX_BYTES = 2.5 * 1024 * 1024;
const nodeModules = fileURLToPath(new URL('../node_modules/', import.meta.url));
const CODE_LICENSES = new Set(['MIT', 'Apache-2.0', 'CC0-1.0', 'BSD-3-Clause', 'Unlicense']);
/** رخص الأصول (صور وأصوات وخطوط): CC-BY مسموحة بس ويّا ذكر الاسم (credits) */
const ASSET_LICENSES = new Set([...CODE_LICENSES, 'OFL-1.1', 'CC-BY-3.0', 'CC-BY-4.0']);
const ENGINES = new Set(['spir', 'spir-kit', 'phaser', 'godot']);

const CSP_JS = `default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src data: blob:; font-src data:; media-src data: blob:; worker-src blob:`;

const html = (js) =>
  '<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8">' +
  '<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no,viewport-fit=cover">' +
  `<meta http-equiv="Content-Security-Policy" content="${CSP_JS}">` +
  `</head><body><script>${js.replace(/<\/script/gi, '<\\/script')}</script></body></html>`;

/** فحص رخص الكود والأصول — يرجع قائمة أخطاء */
export function checkLicenses(id, m) {
  const errs = [];
  if (!CODE_LICENSES.has(m.license)) errs.push(`${id}: رخصة كود غير مقبولة "${m.license}"`);
  for (const a of m.assets ?? []) {
    if (!ASSET_LICENSES.has(a.license)) errs.push(`${id}: رخصة أصول غير مقبولة "${a.license}" (${a.what})`);
    if (a.license.startsWith('CC-BY') && !(m.credits && a.by)) errs.push(`${id}: ${a.what} برخصة ${a.license} تحتاج ذكر الاسم (by + credits)`);
  }
  return errs;
}

const bundles = {};
const scenes = [];
/** ألعاب تنزل عند الطلب: { id: { file, bytes, version, engine } } */
const packs = {};
const meta = {};
const errors = [];
for (const id of readdirSync(root).sort()) {
  const dir = join(root, id);
  const manifestPath = join(dir, 'game.json');
  if (!existsSync(manifestPath)) continue;
  const m = JSON.parse(readFileSync(manifestPath, 'utf8'));
  const engine = m.engine ?? 'spir';
  if (m.id !== id) errors.push(`${id}: id بـ game.json لازم يكون "${id}"`);
  if (!ENGINES.has(engine)) errors.push(`${id}: محرك غير معروف "${engine}"`);
  errors.push(...checkLicenses(id, m));
  meta[id] = { engine, credits: m.credits ?? null };

  if (m.pack?.type === 'download') {
    // اللعبة جاهزة من محرك ثاني: التطبيق يحتاج بس معلوماتها (الملف نفسه ينزل من إصدار GitHub)
    if (!m.pack.file || !m.pack.bytes) errors.push(`${id}: pack.file و pack.bytes لازم يكونون مكتوبين (شغّل scripts/godot-pack.mjs)`);
    packs[id] = { file: m.pack.file, bytes: m.pack.bytes, version: m.version ?? 1, engine };
    console.log(`↓ ${id.padEnd(10)} ${String(Math.round((m.pack.bytes ?? 0) / 1024 / 1024)).padStart(4)}MB  (${m.title}) — ${engine}، ينزل عند الطلب`);
    continue;
  }

  const result = await build({
    entryPoints: [join(dir, 'main.ts')],
    bundle: true,
    minify: true,
    format: 'iife',
    target: 'es2019',
    write: false,
    legalComments: 'none',
    logLevel: 'silent',
    nodePaths: [nodeModules],
    loader: { '.woff2': 'dataurl' },
    // ثوابت Phaser وقت البناء (تشيل الأجزاء اللي ما نحتاجها)
    define: { CANVAS_RENDERER: 'true', WEBGL_RENDERER: 'true', WEBGL_DEBUG: 'false', EXPERIMENTAL: 'false', PLUGIN_3D: 'false', PLUGIN_CAMERA3D: 'false', PLUGIN_FBINSTANT: 'false', FEATURE_SOUND: 'true' },
  });
  const page = html(result.outputFiles[0].text);
  // روابط تحمّل شي من النت فعلاً (src/href/url()/fetch) — نصوص الأخطاء داخل المكتبات مسموحة
  if (/(src=|href=|url\(|fetch\()\s*["'`]?https?:/i.test(page)) errors.push(`${id}: تحمّل شي من رابط خارجي`);
  const bytes = Buffer.byteLength(page);
  if (bytes > MAX_BYTES) errors.push(`${id}: حجمها ${Math.round(bytes / 1024)}KB أكبر من ${MAX_BYTES / 1024}KB`);
  bundles[id] = page;
  if (m.kind === 'scene') scenes.push(id);
  console.log(`✓ ${id.padEnd(10)} ${String(Math.round(bytes / 1024)).padStart(4)}KB  (${m.title})${engine !== 'spir' ? ` — ${engine}` : ''}`);
}
if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}

const ids = Object.keys(bundles);
const games = [...ids.filter((id) => !scenes.includes(id)), ...Object.keys(packs)];
// كل لعبة ملف HTML مستقل (asset) — ينحمّل بس لما تنفتح، مو ويّا التطبيق كله
for (const id of ids) writeFileSync(join(assetsDir, `${id}.html`), bundles[id]);
writeFileSync(
  join(out, 'bundles.generated.ts'),
  '// ملف مولّد بـ scripts/build-games.mjs — لا تعدّله يدوياً\n' +
    '/* eslint-disable @typescript-eslint/no-require-imports */\n' +
    `export const GAME_ASSET: Record<string, number> = {\n${ids.map((id) => `  ${JSON.stringify(id)}: require('../../assets/games/${id}.html'),`).join('\n')}\n};\n`,
);
writeFileSync(
  join(out, 'ready.generated.ts'),
  `// ملف مولّد بـ scripts/build-games.mjs — الألعاب الجاهزة للعب، والمشاهد، والألعاب اللي تنزل عند الطلب\n` +
    `export const READY_GAMES: readonly string[] = ${JSON.stringify(games)};\n` +
    `export const SCENES: readonly string[] = ${JSON.stringify(scenes)};\n` +
    `export type PackInfo = { file: string; bytes: number; version: number; engine: string };\n` +
    `export const PACKS: Readonly<Record<string, PackInfo>> = ${JSON.stringify(packs)};\n` +
    `export const GAME_META: Readonly<Record<string, { engine: string; credits: string | null }>> = ${JSON.stringify(meta)};\n`,
);
// قائمة أغراض البيت والملصقات (التطبيق يتحقق من الأسعار منها)
const catalog = JSON.parse(readFileSync(join(root, 'house', 'catalog.json'), 'utf8'));
writeFileSync(join(out, 'catalog.generated.ts'), `// ملف مولّد من games/house/catalog.json — لا تعدّله يدوياً\nexport const HOUSE_ITEMS: readonly { id: string; name: string; price: number; kind: string }[] = ${JSON.stringify(catalog.items)};\nexport const STICKERS: readonly { id: string; name: string }[] = ${JSON.stringify(catalog.stickers)};\n`);
console.log(`${games.length} ألعاب (${Object.keys(packs).length} تنزل عند الطلب) + ${scenes.length} مشاهد`);
