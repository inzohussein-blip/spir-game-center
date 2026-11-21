import { Asset } from 'expo-asset';
import { useEffect, useImperativeHandle, useRef, type Ref } from 'react';
import { parseGameMessage, type GameMessage, type HostMessage } from '../lib/bridge';

export type GameViewHandle = { send: (msg: HostMessage) => void };

/**
 * الويب (الآيفون): اللعبة ملف HTML منفصل بالموقع، يفتح داخل iframe معزول
 * (sandbox بدون نفس الأصل) — ينحمّل بس لما تنفتح اللعبة.
 */
export function GameView({ asset, onMessage, ref }: { asset: number; onMessage: (m: GameMessage) => void; ref?: Ref<GameViewHandle> }) {
  const frameRef = useRef<HTMLIFrameElement>(null);
  const handlerRef = useRef(onMessage);
  useEffect(() => {
    handlerRef.current = onMessage;
  }, [onMessage]);

  useImperativeHandle(ref, () => ({
    send: (msg) => frameRef.current?.contentWindow?.postMessage(JSON.stringify({ spirHost: 1, ...msg }), '*'),
  }));

  useEffect(() => {
    const listener = (e: MessageEvent) => {
      if (e.source !== frameRef.current?.contentWindow) return;
      const m = parseGameMessage(e.data);
      if (m) handlerRef.current(m);
    };
    window.addEventListener('message', listener);
    return () => window.removeEventListener('message', listener);
  }, []);

  // رابط الملف بالموقع: Expo يرجّعه بدون الامتداد (.html) فنضيفه
  const a = Asset.fromModule(asset);
  const src = /\.html(\?|$)/.test(a.uri) ? a.uri : `${a.uri}.${a.type || 'html'}`;
  return <iframe ref={frameRef} title="game" src={src} sandbox="allow-scripts" style={{ flex: 1, width: '100%', height: '100%', border: 0, display: 'block', backgroundColor: '#62C6FF' }} />;
}
