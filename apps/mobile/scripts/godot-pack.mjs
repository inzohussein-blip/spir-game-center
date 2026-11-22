// يحوّل لعبة Godot (games/<id>/godot) لـ «حزمة»: ملف HTML واحد مستقل يشتغل بدون نت.
//   1) (إذا GODOT مكتوب) تصدير ويب بدون threads: GODOT=/path/to/godot node scripts/godot-pack.mjs dodge
//   2) ملفات المحرك (wasm + pck + worklets) تنضغط gzip وتنحط داخل الصفحة base64،
//      والغلاف (games/<id>/shell.ts) يفكها بالذاكرة ويشغّل المحرك — ولا طلب واحد للنت.
//   3) الناتج: packs/<id>-<version>.html بجذر المشروع، ويتحدث pack.bytes بـ game.json.
// سياسة الأمان لهالملف بس تسمح بـ 'wasm-unsafe-eval' (WebAssembly) و blob: (ملفات الصوت).
import { build } from 'esbuild';
import { execFileSync } from 'node:child_process';
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';

const id = process.argv[2];
if (!id) throw new Error('usage: node scripts/godot-pack.mjs <game-id>');
const repo = fileURLToPath(new URL('../../../', import.meta.url));
const gameDir = join(repo, 'games', id);
const projectDir = join(gameDir, 'godot');
const exportDir = join(gameDir, 'build');
const manifestPath = join(gameDir, 'game.json');
const m = JSON.parse(readFileSync(manifestPath, 'utf8'));
if (m.engine !== 'godot') throw new Error(`${id}: engine لازم يكون godot`);

// 1) التصدير
if (process.env.GODOT) {
  mkdirSync(exportDir, { recursive: true });
  const run = (...args) => execFileSync(process.env.GODOT, ['--headless', '--path', projectDir, ...args], { stdio: 'inherit' });
  run('--import');
  run('--export-release', 'Web', join(exportDir, 'index.html'));
}
const exported = readdirSync(exportDir);
const shellHtml = readFileSync(join(exportDir, 'index.html'), 'utf8');
const config = shellHtml.match(/const GODOT_CONFIG = (\{.*?\});/)?.[1];
if (!config) throw new Error('GODOT_CONFIG ما لگيناه بالتصدير');
if (/GODOT_THREADS_ENABLED = true/.test(shellHtml)) throw new Error('صدّر بدون threads (variant/thread_support=false)');

// 2) الملفات المضمّنة
const engineJs = readFileSync(join(exportDir, 'index.js'), 'utf8');
const embedded = exported.filter((f) => f.endsWith('.wasm') || f.endsWith('.pck') || f.endsWith('.worklet.js'));
const blobs = embedded
  .map((f) => {
    const gz = gzipSync(readFileSync(join(exportDir, f)), { level: 9 });
    return `<script type="application/octet-stream" id="f:${f}">${gz.toString('base64')}</script>`;
  })
  .join('\n');

const nodeModules = fileURLToPath(new URL('../node_modules/', import.meta.url));
const shell = await build({
  entryPoints: [join(gameDir, 'shell.ts')],
  bundle: true,
  minify: true,
  format: 'iife',
  target: 'es2020',
  write: false,
  logLevel: 'error',
  nodePaths: [nodeModules],
});
const shellJs = shell.outputFiles[0].text;
const safe = (js) => js.replace(/<\/script/gi, '<\\/script');

const CSP = `default-src 'none'; script-src 'unsafe-inline' 'wasm-unsafe-eval' blob:; style-src 'unsafe-inline'; img-src data: blob:; font-src data:; media-src data: blob:; worker-src blob:; connect-src blob:`;
const html =
  '<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8">' +
  '<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no,viewport-fit=cover">' +
  `<meta http-equiv="Content-Security-Policy" content="${CSP}">` +
  `<title>${m.title}</title>` +
  '<style>html,body{margin:0;height:100%;overflow:hidden;background:#62C6FF;touch-action:none;user-select:none;-webkit-user-select:none}' +
  '#canvas{display:block;width:100%;height:100%;outline:none}' +
  '#loader{position:fixed;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:18px;background:linear-gradient(#62C6FF,#CFF0FF);font:800 22px system-ui,sans-serif;color:#2A2350}' +
  '#track{width:62%;height:16px;border-radius:9px;background:#fff;border:3px solid #2A2350;overflow:hidden}#bar{height:100%;width:5%;background:#FFC93C;transition:width .2s}</style>' +
  '</head><body><canvas id="canvas" tabindex="0"></canvas>' +
  `<div id="loader"><div id="msg">${m.title}… دا تتحمّل</div><div id="track"><div id="bar"></div></div></div>\n` +
  `<script type="application/json" id="pack-files">${JSON.stringify(embedded)}</script>\n${blobs}\n` +
  `<script>${safe(engineJs)}</script>\n` +
  `<script>window.GODOT_CONFIG=${config};</script>\n` +
  `<script>${safe(shellJs)}</script></body></html>`;

// 3) الحفظ
const file = `${id}-${m.version ?? 1}.html`;
const outDir = join(repo, 'packs');
mkdirSync(outDir, { recursive: true });
writeFileSync(join(outDir, file), html);
const bytes = Buffer.byteLength(html);
m.pack = { ...(m.pack ?? {}), type: 'download', file, bytes };
writeFileSync(manifestPath, `${JSON.stringify(m, null, 2)}\n`);
console.log(`✓ packs/${file}  ${(bytes / 1024 / 1024).toFixed(1)}MB  (${embedded.join(', ')})`);
