import { useCallback, useMemo } from 'react';
import { SceneView } from '../../components/SceneView';
import type { GameMessage } from '../../lib/bridge';
import { useProgress } from '../../lib/progress';

/** «بيت سبير» والألبوم (مشهد Pixi): الشراء والقبعات يتحققون هنا بالتطبيق */
export default function House() {
  const { store, profile, buy, wear } = useProgress();
  const state = useMemo(() => ({ name: profile?.name ?? '', coins: store.coins, owned: store.owned, wear: store.wear, stickers: store.stickers }), [store, profile]);
  const onMessage = useCallback(
    (m: GameMessage) => {
      if (m.type !== 'save') return;
      if (m.key === 'buy' && m.data) buy(m.data);
      else if (m.key === 'wear') wear(m.data);
    },
    [buy, wear],
  );
  return <SceneView scene="house" state={state} onMessage={onMessage} />;
}
