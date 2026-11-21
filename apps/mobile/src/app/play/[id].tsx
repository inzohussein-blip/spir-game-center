import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, BackHandler, Pressable, Vibration, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GameView, type GameViewHandle } from '../../components/GameView';
import { Button, Empty, Halftone, Text } from '../../components/ui';
import { GAME_ASSET } from '../../games/bundles.generated';
import { STICKERS } from '../../games/catalog.generated';
import type { GameMessage, GameSettings } from '../../lib/bridge';
import { dailyFor, gameById } from '../../lib/games';
import { useProgress } from '../../lib/progress';
import { DAILY_BONUS, LEVEL_LABEL, LEVELS, limitReached, type Level } from '../../lib/progressCore';
import { fonts, fromLeft, space, themed, useColors, wideSpaces } from '../../theme';

type EndState = { won: boolean; title: string; subtitle?: string; stars: number; coins: number; newBest: boolean; firstWin: boolean; dailyBonus: boolean; sticker: string | null; hasNext: boolean };

/** كل كم ثانية نحسب وقت اللعب */
const TICK_S = 20;

/**
 * المشغّل الموحّد: شريط علوي (إيقاف، المرحلة، النتيجة) فوق اللعبة،
 * قائمة الإيقاف، ونافذة النهاية — نفس الشكل لكل الألعاب.
 */
export default function Play() {
  const params = useLocalSearchParams<{ id: string; level?: string; stage?: string; players?: string }>();
  const game = gameById(String(params.id));
  const asset = game ? GAME_ASSET[game.id] : undefined;
  const s = useStyles();
  const c = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { store, profile, record, setSound, addMinutes } = useProgress();
  const viewRef = useRef<GameViewHandle>(null);

  const level: Level = LEVELS.includes(params.level as Level) ? (params.level as Level) : 'easy';
  const players: 1 | 2 = params.players === '2' ? 2 : 1;
  const [stage, setStage] = useState(() => Math.max(1, Number(params.stage) || 1));
  const [hud, setHud] = useState<{ text: string; score?: string }>({ text: '' });
  const [paused, setPaused] = useState(false);
  const [end, setEnd] = useState<EndState | null>(null);
  const settingsRef = useRef<GameSettings>({ level, stage, sound: store.sound, players });

  const start = useCallback(
    (st: number) => {
      settingsRef.current = { level, stage: st, sound: store.sound, players };
      setStage(st);
      setEnd(null);
      setPaused(false);
      viewRef.current?.send({ type: 'start', settings: settingsRef.current });
    },
    [level, players, store.sound],
  );

  const onMessage = useCallback(
    (m: GameMessage) => {
      if (!game) return;
      switch (m.type) {
        case 'ready':
          viewRef.current?.send({ type: 'start', settings: settingsRef.current });
          return;
        case 'hud':
          setHud({ text: m.text, score: m.score });
          return;
        case 'vibrate':
          Vibration.vibrate(15);
          return;
        case 'complete':
        case 'over': {
          const won = m.type === 'complete';
          const stars = won ? m.stars : 0;
          const st = settingsRef.current.stage;
          const now = new Date();
          const out = record({ gameId: game.id, level, stage: st, won, stars, stageCount: game.levels, now, daily: dailyFor(profile, now).id === game.id });
          setEnd({
            won,
            title: m.title ?? (won ? 'عاشت إيدك!' : 'خلصت الجولة'),
            subtitle: m.subtitle,
            stars,
            coins: out.coins,
            newBest: out.newBest,
            firstWin: out.firstWin,
            dailyBonus: out.dailyBonus,
            sticker: out.sticker,
            hasNext: won && (game.levels <= 1 || st < game.levels),
          });
        }
      }
    },
    [game, level, record, profile],
  );

  const pause = useCallback(() => {
    if (end) return;
    viewRef.current?.send({ type: 'pause' });
    setPaused(true);
  }, [end]);
  const resume = () => {
    viewRef.current?.send({ type: 'resume' });
    setPaused(false);
  };
  const exit = () => (router.canGoBack() ? router.back() : router.replace({ pathname: '/game/[id]', params: { id: String(params.id) } }));

  // التطبيق راح للخلفية → نوقف اللعبة
  useEffect(() => {
    const sub = AppState.addEventListener('change', (st) => st !== 'active' && pause());
    return () => sub.remove();
  }, [pause]);
  // زر الرجوع بالأندرويد يفتح قائمة الإيقاف بدل ما يطلع فجأة
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (end) return false;
      if (paused) {
        viewRef.current?.send({ type: 'resume' });
        setPaused(false);
      } else pause();
      return true;
    });
    return () => sub.remove();
  }, [paused, end, pause]);

  // وقت اللعب: نحسبه بس واللعبة شغالة (مو متوقفة ولا بنافذة النهاية)
  const [clock, setClock] = useState(() => Date.now());
  useEffect(() => {
    if (paused || end) return;
    const t = setInterval(() => {
      if (AppState.currentState !== 'active') return;
      addMinutes(TICK_S / 60);
      setClock(Date.now());
    }, TICK_S * 1000);
    return () => clearInterval(t);
  }, [paused, end, addMinutes]);
  // إذا خلص الوقت أثناء اللعب نخليه يكمّل الجولة، ونمنع الجولة الجاية بس
  const blocked = limitReached(profile, store, new Date(clock));
  const [blockedAtStart] = useState(blocked);

  if (!game || !asset) return <Empty title="هاي اللعبة بعدها ما جاهزة" />;
  if (blockedAtStart) {
    return (
      <View style={[s.root, s.limitBox, { paddingTop: insets.top + space.xxl }]}>
        <Ionicons name="moon" size={56} color={c.primary} />
        <Text style={s.sheetTitle}>{wideSpaces('كافي لليوم!')}</Text>
        <Text style={s.limitText}>{`خلص وقت اللعب اللي حطوه الأهل${profile ? ` لـ ${profile.name}` : ''}. نرجع نلعب باچر.`}</Text>
        <Button title="رجوع" icon="arrow-forward" onPress={exit} />
      </View>
    );
  }

  const toggleSound = () => {
    const on = !store.sound;
    setSound(on);
    settingsRef.current = { ...settingsRef.current, sound: on };
    viewRef.current?.send({ type: 'sound', on });
  };

  return (
    <View style={s.root}>
      <View style={[s.bar, { backgroundColor: game.color, paddingTop: insets.top + 6 }]}>
        <Pressable onPress={pause} style={s.barBtn} accessibilityRole="button" accessibilityLabel="إيقاف">
          <Ionicons name="pause" size={20} color="#FFFFFF" />
        </Pressable>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text style={s.barTitle} numberOfLines={1}>{hud.text || game.title}</Text>
          <Text style={s.barSub} numberOfLines={1}>{`${game.title} · ${LEVEL_LABEL[level]}`}</Text>
        </View>
        <View style={s.scorePill}>
          <Text style={s.scoreText} numberOfLines={1}>{hud.score ?? ' '}</Text>
        </View>
      </View>

      <View style={{ flex: 1 }}>
        <GameView ref={viewRef} asset={asset} onMessage={onMessage} />
      </View>

      {paused && !end ? (
        <View style={s.backdrop}>
          <View style={[s.sheet, { paddingBottom: Math.max(insets.bottom, space.lg) }]}>
            <Text style={s.sheetTitle}>{wideSpaces('اللعبة متوقفة')}</Text>
            <Button title="كمّل" icon="play" onPress={resume} />
            <Button title="أعد المرحلة" icon="refresh" variant="outline" onPress={() => start(stage)} />
            <Button title={store.sound ? 'الصوت: شغّال' : 'الصوت: مطفي'} icon={store.sound ? 'volume-high' : 'volume-mute'} variant="outline" onPress={toggleSound} />
            <Button title="اطلع" icon="exit-outline" variant="ghost" onPress={exit} />
          </View>
        </View>
      ) : null}

      {end ? (
        <View style={s.backdrop}>
          <View style={[s.sheet, { paddingBottom: Math.max(insets.bottom, space.lg), paddingTop: 0 }]}>
            <View style={[s.band, !end.won && { backgroundColor: c.primaryDark }]}>
              <Halftone rows={6} cols={22} color="rgba(255,255,255,0.14)" style={{ top: 8, ...fromLeft(8) }} />
              <View style={s.stripeWide} />
              <View style={s.stripeThin} />
              <Text style={s.endTitle}>{wideSpaces(end.title)}</Text>
              {end.subtitle ? <Text style={s.endSub}>{end.subtitle}</Text> : null}
            </View>
            {end.won ? (
              <View style={s.stars} accessibilityLabel={`${end.stars} من 3 نجوم`}>
                {[0, 1, 2].map((i) => (
                  <Ionicons key={i} name="star" size={i === 1 ? 54 : 44} color={i < end.stars ? c.cta : c.cardAlt} style={i === 1 ? { marginTop: -10 } : undefined} />
                ))}
              </View>
            ) : (
              <Ionicons name="sad-outline" size={48} color={c.muted} style={{ alignSelf: 'center' }} />
            )}
            <View style={s.chips}>
              {end.newBest ? <Text style={[s.chip, s.chipYellow]}>رقم قياسي جديد</Text> : null}
              {end.firstWin ? <Text style={[s.chip, s.chipYellow]}>وسام: أول فوز</Text> : null}
              {end.dailyBonus ? <Text style={[s.chip, s.chipYellow]}>{`تحدّي اليوم +${DAILY_BONUS}`}</Text> : null}
              {end.sticker ? <Text style={[s.chip, s.chipSticker]}>{`ملصق جديد: «${STICKERS.find((x) => x.id === end.sticker)?.name ?? ''}»`}</Text> : null}
              <Text style={s.chip}>{`+${end.coins} عملة`}</Text>
            </View>
            {blocked ? (
              <Text style={s.limitText}>خلص وقت اللعب لليوم — نرجع باچر</Text>
            ) : end.hasNext ? (
              <Button title={game.levels <= 1 ? 'جولة ثانية' : 'المرحلة الجاية'} icon="arrow-back" onPress={() => start(stage + 1)} />
            ) : (
              <Button title={end.won ? 'العب مرة ثانية' : 'حاول مرة ثانية'} icon="refresh" onPress={() => start(stage)} />
            )}
            <View style={{ flexDirection: 'row', gap: space.sm }}>
              {end.hasNext && !blocked ? <Button title="أعد" variant="outline" onPress={() => start(stage)} style={{ flex: 1 }} /> : null}
              <Button title="القائمة" variant="outline" onPress={exit} style={{ flex: 1 }} />
            </View>
          </View>
        </View>
      ) : null}
    </View>
  );
}

const useStyles = themed((c) => ({
  root: { flex: 1, backgroundColor: '#EEF0FF' },
  bar: { flexDirection: 'row', alignItems: 'center', gap: space.sm, paddingHorizontal: space.md, paddingBottom: space.sm },
  barBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  barTitle: { fontFamily: fonts.bold, fontSize: 15, lineHeight: 22, color: '#FFFFFF' },
  barSub: { fontFamily: fonts.regular, fontSize: 11, lineHeight: 16, color: 'rgba(255,255,255,0.8)' },
  scorePill: { minWidth: 40, maxWidth: 130, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 12, paddingVertical: 6 },
  scoreText: { fontFamily: fonts.bold, fontSize: 12, lineHeight: 18, color: '#FFFFFF', textAlign: 'center' },
  backdrop: { position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(11,16,51,0.5)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: c.bg, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: space.lg, gap: space.md, overflow: 'hidden' },
  sheetTitle: { fontFamily: fonts.display, fontSize: 24, lineHeight: 36, color: c.text, textAlign: 'center' },
  band: { marginHorizontal: -space.lg, backgroundColor: c.headerBg, paddingVertical: space.lg, paddingHorizontal: space.lg, alignItems: 'center', overflow: 'hidden' },
  stripeWide: { position: 'absolute', top: -20, bottom: -20, ...fromLeft(-30), width: 70, backgroundColor: c.cta, transform: [{ skewX: '-14deg' }] },
  stripeThin: { position: 'absolute', top: -20, bottom: -20, ...fromLeft(52), width: 11, backgroundColor: c.cta, transform: [{ skewX: '-14deg' }] },
  endTitle: { fontFamily: fonts.display, fontSize: 30, lineHeight: 44, color: '#FFFFFF', textAlign: 'center' },
  endSub: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 20, color: 'rgba(255,255,255,0.85)', textAlign: 'center' },
  stars: { flexDirection: 'row', justifyContent: 'center', gap: 6, paddingTop: space.sm },
  chips: { flexDirection: 'row', justifyContent: 'center', flexWrap: 'wrap', gap: space.sm },
  chip: { fontFamily: fonts.bold, fontSize: 12, lineHeight: 18, color: c.primary, backgroundColor: c.primarySoft, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4, overflow: 'hidden' },
  limitBox: { alignItems: 'center', gap: space.lg, paddingHorizontal: space.xl },
  limitText: { fontFamily: fonts.semibold, fontSize: 15, lineHeight: 24, color: c.muted, textAlign: 'center' },
  chipSticker: { color: '#FFFFFF', backgroundColor: '#FF6B5B' },
  chipYellow: { color: c.warnText, backgroundColor: c.warnSoft },
}));
