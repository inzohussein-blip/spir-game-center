import { useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
import { Avatar } from '../components/Avatar';
import { SceneView } from '../components/SceneView';
import { UpdateBanner } from '../components/UpdateCard';
import type { GameMessage } from '../lib/bridge';
import { dailyFor, gameById, GAMES } from '../lib/games';
import { useProgress } from '../lib/progress';
import { allStars, dayKey, gameOf, totalStars } from '../lib/progressCore';

/** «عالم سبير»: الخريطة (مشهد Pixi) — شاشة إضافية من الرئيسية. كل مكان يفتح لعبة أو البيت أو الأقسام */
export default function World() {
  const router = useRouter();
  const { store, profile } = useProgress();
  const [now] = useState(() => new Date());

  const state = useMemo(() => {
    const games: Record<string, number> = {};
    for (const g of GAMES) if (g.featured) games[g.id] = totalStars(gameOf(store, g.id));
    const last = Object.entries(store.games).sort((a, b) => b[1].lastPlayed - a[1].lastPlayed)[0]?.[0];
    const daily = dailyFor(profile, now);
    return {
      name: profile?.name ?? '',
      coins: store.coins,
      stars: allStars(store),
      games,
      last: last && gameById(last)?.featured ? last : 'house',
      daily: store.dailyDone === dayKey(now) ? null : daily.featured ? daily.id : 'classics',
    };
  }, [store, profile, now]);

  const onMessage = useCallback(
    (m: GameMessage) => {
      if (m.type !== 'open') return;
      if (m.target === 'house') router.push('/house');
      else if (m.target === 'classics') router.navigate('/categories');
      else if (gameById(m.target)) router.push({ pathname: '/game/[id]', params: { id: m.target } });
    },
    [router],
  );

  return (
    <View style={{ flex: 1 }}>
      <SceneView scene="world" state={state} onMessage={onMessage} />
      <View style={{ position: 'absolute', top: 74, left: 12, right: 12, gap: 8, alignItems: 'flex-start' }} pointerEvents="box-none">
        <UpdateBanner />
        {profile ? (
          <Pressable onPress={() => router.push('/who')} accessibilityRole="button" accessibilityLabel="غيّر اللاعب" style={{ borderRadius: 30, borderWidth: 3, borderColor: '#2A2350' }}>
            <Avatar index={profile.avatar} size={44} />
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}
