// يبني كل لعبة بمجلد games/ لملف HTML واحد مستقل (بدون نت)، ويكتبها بـ src/games/bundles.generated.ts
// حتى التطبيق يفتحها بـ WebView (أندرويد) أو iframe (ويب).
// يرفض أي لعبة: بدون game.json صحيح، بدون رخصة، أكبر من الحد، أو فيها روابط http خارجية.
import { build } from 'esbuild';
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../../../games/', import.meta.url));
const out = fileURLToPath(new URL('../src/games/', import.meta.url));
const MAX_BYTES = 300 * 1024;
const LICENSES = new Set(['MIT', 'Apache-2.0', 'CC0-1.0', 'BSD-3-Clause', 'Unlicense']);

const html = (js) =>
  '<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8">' +
  '<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no,viewport-fit=cover">' +
  `<meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src data:">` +
  `</head><body><script>${js.replace(/<\/script/gi, '<\\/script')}</script></body></html>`;

const bundles = {};
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
  });
  const page = html(result.outputFiles[0].text);
  if (/https?:\/\/(?!www\.w3\.org)/.test(page)) errors.push(`${id}: فيها رابط خارجي`);
  const bytes = Buffer.byteLength(page);
  if (bytes > MAX_BYTES) errors.push(`${id}: حجمها ${Math.round(bytes / 1024)}KB أكبر من ${MAX_BYTES / 1024}KB`);
  bundles[id] = page;
  console.log(`✓ ${id.padEnd(10)} ${String(Math.round(bytes / 1024)).padStart(4)}KB  (${m.title})`);
}
if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}

const ids = Object.keys(bundles);
writeFileSync(
  join(out, 'bundles.generated.ts'),
  '// ملف مولّد بـ scripts/build-games.mjs — لا تعدّله يدوياً\n' +
    `export const GAME_HTML: Record<string, string> = {\n${ids.map((id) => `  ${JSON.stringify(id)}: ${JSON.stringify(bundles[id])},`).join('\n')}\n};\n`,
);
writeFileSync(join(out, 'ready.generated.ts'), `// ملف مولّد بـ scripts/build-games.mjs — الألعاب الجاهزة للعب\nexport const READY_GAMES: readonly string[] = ${JSON.stringify(ids)};\n`);
console.log(`${ids.length} ألعاب جاهزة`);
