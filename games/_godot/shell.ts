/**
 * غلاف «تجنّب الوحوش» (Godot): يفك ملفات المحرك المضمّنة بالصفحة (gzip + base64)،
 * يشغّل Godot بدون أي طلب للنت، ويربط الجسر (spir-kit/sdk) بـ addons/spir/spir.gd.
 */
import { Audio } from '../../packages/spir-engine/audio.ts';
import { listen, send, type GameMessage, type HostMessage } from '../../packages/spir-kit/sdk.ts';

type GodotEngine = { startGame: (o: { onProgress?: (cur: number, total: number) => void }) => Promise<void> };
declare global {
  interface Window {
    Engine?: new (config: Record<string, unknown>) => GodotEngine;
    GODOT_CONFIG?: Record<string, unknown>;
    spirGodotReceive?: (json: string) => void;
    spirGodotReady?: () => void;
    spirSend?: (json: string) => void;
    spirSfx?: (name: string) => void;
  }
}

// ── الجسر ──
const queue: HostMessage[] = [];
const audio = new Audio();
listen((m) => {
  if (m.type === 'sound') audio.setOn(m.on);
  if (m.type === 'start') audio.setOn(m.settings.sound);
  if (window.spirGodotReceive) window.spirGodotReceive(JSON.stringify(m));
  else queue.push(m);
});
window.spirSend = (json) => send(JSON.parse(json) as GameMessage);
window.spirSfx = (name) => audio.play(name as Parameters<Audio['play']>[0]);
const standalone = !window.ReactNativeWebView && window.parent === window;
window.spirGodotReady = () => {
  hideLoader();
  for (const m of queue.splice(0)) window.spirGodotReceive?.(JSON.stringify(m));
  send({ type: 'ready' });
  // فتح الملف لوحده (تجربة): نبدي بالسهل
  if (standalone) window.spirGodotReceive?.(JSON.stringify({ type: 'start', settings: { level: 'easy', stage: 1, sound: true, players: 1 } }));
};
addEventListener('pointerdown', () => audio.unlock(), { capture: true });

// ── شاشة التحميل ──
const bar = document.getElementById('bar') as HTMLElement;
const setProgress = (k: number) => (bar.style.width = `${Math.round(Math.max(0.05, Math.min(1, k)) * 100)}%`);
function hideLoader() {
  document.getElementById('loader')?.remove();
}
function fail(e: unknown) {
  const el = document.getElementById('msg');
  if (el) el.textContent = 'ما گدرنا نشغّل اللعبة على هذا الجهاز 😿';
  console.error(e);
}

// ── فك الملفات المضمّنة ──
function b64(id: string): Uint8Array {
  const el = document.getElementById(id);
  if (!el) throw new Error(`missing ${id}`);
  const s = atob((el.textContent ?? '').trim());
  el.remove();
  const out = new Uint8Array(s.length);
  for (let i = 0; i < s.length; i++) out[i] = s.charCodeAt(i);
  return out;
}
async function gunzip(bytes: Uint8Array): Promise<ArrayBuffer> {
  const stream = new Blob([bytes as BlobPart]).stream().pipeThrough(new DecompressionStream('gzip'));
  return new Response(stream).arrayBuffer();
}

async function boot() {
  if (typeof DecompressionStream === 'undefined' || !window.Engine || !window.GODOT_CONFIG) throw new Error('unsupported');
  const names = JSON.parse(document.getElementById('pack-files')?.textContent ?? '[]') as string[];
  const files: Record<string, ArrayBuffer> = {};
  let done = 0;
  for (const name of names) {
    files[name] = await gunzip(b64(`f:${name}`));
    setProgress(0.1 + (0.3 * ++done) / names.length);
  }
  const blobUrls: Record<string, string> = {};
  for (const name of Object.keys(files)) if (name.endsWith('.js')) blobUrls[name] = URL.createObjectURL(new Blob([files[name]], { type: 'text/javascript' }));
  const fileOf = (url: string) => url.split(/[?#]/)[0].split('/').pop() ?? '';

  // Godot يطلب ملفاته بـ fetch — نرجعها من الذاكرة
  const realFetch = window.fetch.bind(window);
  window.fetch = (input: RequestInfo | URL, init?: RequestInit) => {
    const name = fileOf(input instanceof Request ? input.url : String(input));
    const buf = files[name];
    if (buf) {
      delete files[name]; // مرة وحدة تكفي — نوفّر ذاكرة
      const type = name.endsWith('.wasm') ? 'application/wasm' : 'application/octet-stream';
      return Promise.resolve(new Response(buf, { status: 200, headers: { 'Content-Type': type, 'Content-Length': String(buf.byteLength) } }));
    }
    return realFetch(input, init);
  };
  // ملفات الصوت (worklets) من blob بدل ملف جنب الصفحة
  if (typeof AudioWorklet !== 'undefined') {
    const add = AudioWorklet.prototype.addModule;
    AudioWorklet.prototype.addModule = function (url: string | URL, opts?: WorkletOptions) {
      const name = fileOf(String(url));
      return add.call(this, blobUrls[name] ?? url, opts);
    };
  }

  const engine = new window.Engine({ ...window.GODOT_CONFIG, ensureCrossOriginIsolationHeaders: false, serviceWorker: '', canvas: document.getElementById('canvas') });
  await engine.startGame({ onProgress: (cur, total) => total > 0 && setProgress(0.4 + (0.6 * cur) / total) });
}

boot().catch(fail);
