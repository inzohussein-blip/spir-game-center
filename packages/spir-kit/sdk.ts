/**
 * spir-sdk: الجسر بين اللعبة (داخل WebView أو iframe) والتطبيق.
 * نفس الرسائل بالأندرويد والويب — اللعبة ما تعرف وين تشتغل.
 */
export type Level = 'easy' | 'medium' | 'hard';

export type Settings = {
  level: Level;
  /** رقم المرحلة (يبدي من 1) */
  stage: number;
  sound: boolean;
  /** 1 = ضد الجهاز، 2 = لاعبين على نفس الجهاز */
  players: 1 | 2;
};

/** من اللعبة للتطبيق */
export type GameMessage =
  | { type: 'ready' }
  | { type: 'hud'; text: string; score?: string }
  | { type: 'complete'; stars: number; score: number; moves?: number; title?: string; subtitle?: string; timeUp?: boolean }
  | { type: 'over'; score: number; title?: string; subtitle?: string }
  | { type: 'vibrate' }
  /** من الخريطة: افتح لعبة أو مكان */
  | { type: 'open'; target: string }
  /** من البيت: احفظ بيانات (مشتريات، ترتيب) */
  | { type: 'save'; key: string; data: unknown };

/** من التطبيق للعبة */
export type HostMessage = { type: 'start'; settings: Settings } | { type: 'pause' } | { type: 'resume' } | { type: 'sound'; on: boolean } | { type: 'state'; data: unknown };

type Bridge = { postMessage: (s: string) => void };

declare global {
  interface Window {
    ReactNativeWebView?: Bridge;
    __spirReceive?: (msg: HostMessage) => void;
  }
}

export function send(msg: GameMessage) {
  const json = JSON.stringify({ spir: 1, ...msg });
  if (window.ReactNativeWebView) window.ReactNativeWebView.postMessage(json);
  else if (window.parent !== window) window.parent.postMessage(json, '*');
}

/** يستلم رسائل التطبيق: الأندرويد يستدعي __spirReceive، والويب يرسل postMessage */
export function listen(handler: (msg: HostMessage) => void) {
  window.__spirReceive = handler;
  window.addEventListener('message', (e: MessageEvent) => {
    let data: unknown = e.data;
    if (typeof data === 'string') {
      try {
        data = JSON.parse(data);
      } catch {
        return;
      }
    }
    if (data && typeof data === 'object' && (data as { spirHost?: number }).spirHost === 1) handler(data as HostMessage);
  });
}

export const sdk = {
  ready: () => send({ type: 'ready' }),
  hud: (text: string, score?: string) => send({ type: 'hud', text, score }),
  complete: (r: { stars: number; score: number; moves?: number; title?: string; subtitle?: string; timeUp?: boolean }) => send({ type: 'complete', ...r }),
  over: (r: { score: number; title?: string; subtitle?: string }) => send({ type: 'over', ...r }),
  vibrate: () => send({ type: 'vibrate' }),
};
