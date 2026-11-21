// يبني كل لعبة بمجلد games/ لملف HTML واحد مستقل (بدون نت)، ويكتبها بـ src/games/bundles.generated.ts
// حتى التطبيق يفتحها بـ WebView (أندرويد) أو iframe (ويب).
// يرفض أي لعبة: بدون game.json صحيح، بدون رخصة، أكبر من الحد، أو فيها روابط http خارجية.
import { build } from 'esbuild';
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../../../games/', import.meta.url));
const out = fileURLToPath(new URL('../src/games/', import.meta.url));
const assetsDir = fileURLToPath(new URL('../assets/games/', import.meta.url));
rmSync(assetsDir, { recursive: true, force: true });
mkdirSync(assetsDir, { recursive: true });
const MAX_BYTES = 1536 * 1024;
const nodeModules = fileURLToPath(new URL('../node_modules/', import.meta.url));
const LICENSES = new Set(['MIT', 'Apache-2.0', 'CC0-1.0', 'BSD-3-Clause', 'Unlicense']);

const html = (js) =>
  '<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8">' +
  '<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no,viewport-fit=cover">' +
  `<meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src data: blob:; font-src data:; worker-src blob:">` +
  `</head><body><script>${js.replace(/<\/script/gi, '<\\/script')}</script></body></html>`;

const bundles = {};
const scenes = [];
const errors = [];
for (const id of readdirSync(root).sort()) {
  const dir = join(root, id);
  const manifestPath = join(dir, 'game.json');
  if (!existsSync(manifestPath)) continue;
  const m = JSON.parse(readFileSync(manifestPath, 'utf8'));
  if (m.id !== id) errors.push(`${id}: id بـ game.json لازم يكون "${id}"`);
  if (!LICENSES.has(m.license)) errors.push(`${id}: رخصة غير مقبولة "${m.license}"`);
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
  });
  const page = html(result.outputFiles[0].text);
  // روابط تحمّل شي من النت فعلاً (src/href/url()/fetch) — نصوص الأخطاء داخل المكتبات مسموحة
  if (/(src=|href=|url\(|fetch\()\s*["'`]?https?:/i.test(page)) errors.push(`${id}: تحمّل شي من رابط خارجي`);
  const bytes = Buffer.byteLength(page);
  if (bytes > MAX_BYTES) errors.push(`${id}: حجمها ${Math.round(bytes / 1024)}KB أكبر من ${MAX_BYTES / 1024}KB`);
  bundles[id] = page;
  if (m.kind === 'scene') scenes.push(id);
  console.log(`✓ ${id.padEnd(10)} ${String(Math.round(bytes / 1024)).padStart(4)}KB  (${m.title})`);
}
if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}

const ids = Object.keys(bundles);
const games = ids.filter((id) => !scenes.includes(id));
// كل لعبة ملف HTML مستقل (asset) — ينحمّل بس لما تنفتح، مو ويّا التطبيق كله
for (const id of ids) writeFileSync(join(assetsDir, `${id}.html`), bundles[id]);
writeFileSync(
  join(out, 'bundles.generated.ts'),
  '// ملف مولّد بـ scripts/build-games.mjs — لا تعدّله يدوياً\n' +
    '/* eslint-disable @typescript-eslint/no-require-imports */\n' +
    `export const GAME_ASSET: Record<string, number> = {\n${ids.map((id) => `  ${JSON.stringify(id)}: require('../../assets/games/${id}.html'),`).join('\n')}\n};\n`,
);
writeFileSync(join(out, 'ready.generated.ts'), `// ملف مولّد بـ scripts/build-games.mjs — الألعاب الجاهزة للعب، والمشاهد (الخريطة والبيت)\nexport const READY_GAMES: readonly string[] = ${JSON.stringify(games)};\nexport const SCENES: readonly string[] = ${JSON.stringify(scenes)};\n`);
// قائمة أغراض البيت والملصقات (التطبيق يتحقق من الأسعار منها)
const catalog = JSON.parse(readFileSync(join(root, 'house', 'catalog.json'), 'utf8'));
writeFileSync(join(out, 'catalog.generated.ts'), `// ملف مولّد من games/house/catalog.json — لا تعدّله يدوياً\nexport const HOUSE_ITEMS: readonly { id: string; name: string; price: number; kind: string }[] = ${JSON.stringify(catalog.items)};\nexport const STICKERS: readonly { id: string; name: string }[] = ${JSON.stringify(catalog.stickers)};\n`);
console.log(`${games.length} ألعاب + ${scenes.length} مشاهد`);
