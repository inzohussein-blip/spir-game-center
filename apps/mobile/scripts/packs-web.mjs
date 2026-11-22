// نسخة الويب: الألعاب اللي تنزل عند الطلب (Godot) تنحط بمجلد dist/packs ويّا الموقع.
// من packs/ بجذر المشروع إذا موجودة (بناء محلي)، وإلا تنزل من إصدار GitHub «packs».
import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const repo = fileURLToPath(new URL('../../../', import.meta.url));
const dist = fileURLToPath(new URL('../dist/packs/', import.meta.url));
const app = JSON.parse(readFileSync(new URL('../app.json', import.meta.url), 'utf8')).expo;
const releases = app.extra?.releasesRepo;
mkdirSync(dist, { recursive: true });

for (const id of readdirSync(join(repo, 'games'))) {
  const p = join(repo, 'games', id, 'game.json');
  if (!existsSync(p)) continue;
  const m = JSON.parse(readFileSync(p, 'utf8'));
  if (m.pack?.type !== 'download') continue;
  const local = join(repo, 'packs', m.pack.file);
  if (existsSync(local)) {
    copyFileSync(local, join(dist, m.pack.file));
    console.log(`packs: ${m.pack.file} (محلي)`);
    continue;
  }
  const url = `https://github.com/${releases}/releases/download/packs/${m.pack.file}`;
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(String(res.status));
    writeFileSync(join(dist, m.pack.file), Buffer.from(await res.arrayBuffer()));
    console.log(`packs: ${m.pack.file} (من الإصدار)`);
  } catch (e) {
    // ما نوقف النشر: اللعبة تطلع بس ما تشتغل لحد ما تنرفع الحزمة
    console.warn(`::warning::packs: ${m.pack.file} ما نزلت (${e.message}) — شغّل workflow «Game Packs»`);
  }
}
