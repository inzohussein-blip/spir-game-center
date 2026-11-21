import { useIsFocused } from 'expo-router';
import { useCallback, useEffect, useRef } from 'react';
import { AppState, View } from 'react-native';
import { GAME_ASSET } from '../games/bundles.generated';
import type { GameMessage } from '../lib/bridge';
import { useProgress } from '../lib/progress';
import { GameView, type GameViewHandle } from './GameView';

/**
 * مشهد Pixi (الخريطة أو البيت) داخل تبويب: يبدي لما يجهز، ويستلم البيانات من التطبيق
 * كل ما تتغيّر، ويوقف الصوت والحركة لما التبويب ما يكون ظاهر.
 */
export function SceneView({ scene, state, onMessage }: { scene: 'world' | 'house'; state: unknown; onMessage: (m: GameMessage) => void }) {
  const viewRef = useRef<GameViewHandle>(null);
  const readyRef = useRef(false);
  const focused = useIsFocused();
  const { store } = useProgress();
  const stateRef = useRef(state);
  const sound = store.sound;

  useEffect(() => {
    stateRef.current = state;
    if (readyRef.current) viewRef.current?.send({ type: 'state', data: state });
  }, [state]);

  useEffect(() => {
    if (!readyRef.current) return;
    viewRef.current?.send({ type: focused ? 'resume' : 'pause' });
    if (focused) viewRef.current?.send({ type: 'state', data: stateRef.current });
  }, [focused]);

  useEffect(() => {
    if (readyRef.current) viewRef.current?.send({ type: 'sound', on: sound });
  }, [sound]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (st) => readyRef.current && viewRef.current?.send({ type: st === 'active' && focused ? 'resume' : 'pause' }));
    return () => sub.remove();
  }, [focused]);

  const handle = useCallback(
    (m: GameMessage) => {
      if (m.type === 'ready') {
        readyRef.current = true;
        viewRef.current?.send({ type: 'start', settings: { level: 'easy', stage: 1, sound, players: 1 } });
        viewRef.current?.send({ type: 'state', data: stateRef.current });
        return;
      }
      onMessage(m);
    },
    [onMessage, sound],
  );

  return (
    <View style={{ flex: 1 }}>
      <GameView ref={viewRef} asset={GAME_ASSET[scene]} onMessage={handle} />
    </View>
  );
}
