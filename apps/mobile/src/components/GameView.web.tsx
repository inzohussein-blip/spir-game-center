import { useEffect, useImperativeHandle, useRef, type Ref } from 'react';
import { parseGameMessage, type GameMessage, type HostMessage } from '../lib/bridge';

export type GameViewHandle = { send: (msg: HostMessage) => void };

/**
 * الويب (الآيفون): اللعبة داخل iframe معزول (sandbox بدون نفس الأصل) من نص HTML محلي.
 * نفس ملف اللعبة اللي بالأندرويد.
 */
export function GameView({ html, onMessage, ref }: { html: string; onMessage: (m: GameMessage) => void; ref?: Ref<GameViewHandle> }) {
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

  return <iframe ref={frameRef} title="game" srcDoc={html} sandbox="allow-scripts" style={{ flex: 1, width: '100%', height: '100%', border: 0, display: 'block', backgroundColor: '#EEF0FF' }} />;
}
