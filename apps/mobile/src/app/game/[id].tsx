import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useToast } from '../../components/feedback';
import { GameArt } from '../../components/GameArt';
import { Badge, Button, Card, Chip, Empty, Segmented, Text } from '../../components/ui';
import { CATEGORY_LABEL, gameById } from '../../lib/games';
import { useProgress } from '../../lib/progress';
import { doneStages, gameOf, LEVEL_LABEL, LEVELS, totalStars, type Level } from '../../lib/progressCore';
import { cardRadius, fonts, space, themed, useColors } from '../../theme';

/** صفحة اللعبة: الغلاف، الأرقام، شلون تلعب، الصعوبة، المراحل، وزر «العب هسه» ثابت تحت */
export default function GameDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const game = gameById(String(id));
  const s = useStyles();
  const c = useColors();
  const router = useRouter();
  const toast = useToast();
  const insets = useSafeAreaInsets();
  const { store } = useProgress();
  const progress = gameOf(store, String(id));
  const [level, setLevel] = useState<Level>(progress.lastLevel);
  const [players, setPlayers] = useState<'1' | '2'>('1');
  const [picked, setPicked] = useState<number | null>(null);

  if (!game) return <Empty title="ما لگينا هاي اللعبة" />;
  const back = () => (router.canGoBack() ? router.back() : router.replace('/'));
  const staged = game.levels > 1;
  const next = Math.min(progress.next[level], Math.max(1, game.levels));
  const stage = staged ? (picked && picked <= next ? picked : next) : progress.next[level];
  const play = () =>
    router.push({ pathname: '/play/[id]', params: { id: game.id, level, stage: String(stage), players: players } });

  return (
    <View style={s.root}>
      <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
        <GameArt game={game} size={110} showAge={false} rows={20} style={[s.cover, { paddingTop: insets.top }]} />
        <View style={[s.topBar, { top: insets.top + 10 }]}>
          <Pressable onPress={back} style={s.roundBtn} accessibilityRole="button" accessibilityLabel="رجوع">
            <Ionicons name="chevron-forward" size={22} color="#FFFFFF" />
          </Pressable>
          <Pressable onPress={() => toast('المفضلة تجي بالتحديث الجاي')} style={s.roundBtn} accessibilityRole="button" accessibilityLabel="أضف للمفضلة">
            <Ionicons name="heart" size={20} color={c.cta} />
          </Pressable>
        </View>

        <View style={s.sheet}>
          <Text style={s.title}>{game.title}</Text>
          <View style={s.badges}>
            <Badge label={`من ${game.minAge} سنين`} tone="yellow" />
            <Badge label={CATEGORY_LABEL[game.category]} />
            {game.players.includes(2) ? <Badge label="لاعبين" /> : null}
            <Badge label="بدون نت" tone="green" />
          </View>

          <View style={s.stats}>
            <Stat value={`★ ${totalStars(progress)}`} label="النجوم" gold />
            <Stat value={staged ? `${doneStages(progress, level)}/${game.levels}` : `${progress.wins}`} label={staged ? `مراحل ${LEVEL_LABEL[level]}` : 'مرات الفوز'} />
            <Stat value={`${progress.plays}`} label="مرات اللعب" />
          </View>

          <Card>
            <Text style={s.howTitle}>شلون تلعب؟</Text>
            <Text style={s.howText}>{game.howTo}</Text>
          </Card>

          {game.players.includes(2) ? (
            <Segmented
              options={[
                { value: '1', label: 'ضد الجهاز', icon: 'hardware-chip-outline' },
                { value: '2', label: 'لاعبين', icon: 'people-outline' },
              ]}
              value={players}
              onChange={setPlayers}
            />
          ) : null}

          {players === '1' ? (
            <>
              <Text style={s.howTitle}>الصعوبة</Text>
              <View style={s.levels}>
                {LEVELS.map((l) => (
                  <Chip
                    key={l}
                    label={LEVEL_LABEL[l]}
                    active={level === l}
                    onPress={() => {
                      setLevel(l);
                      setPicked(null);
                    }}
                  />
                ))}
              </View>
            </>
          ) : null}

          {staged ? (
            <>
              <Text style={s.howTitle}>المراحل</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.stageRow}>
                {Array.from({ length: game.levels }, (_, i) => i + 1).map((n) => {
                  const open = n <= next;
                  const stars = progress.stars[`${level}:${n}`] ?? 0;
                  const on = n === stage;
                  return (
                    <Pressable
                      key={n}
                      disabled={!open}
                      onPress={() => setPicked(n)}
                      style={[s.stage, !open && s.stageLocked, on && s.stageOn]}
                      accessibilityRole="button"
                      accessibilityLabel={open ? `المرحلة ${n}` : `المرحلة ${n} مقفولة`}
                    >
                      {open ? <Text style={[s.stageNum, on && { color: c.onCta }]}>{String(n)}</Text> : <Ionicons name="lock-closed" size={14} color={c.muted} />}
                      {stars > 0 ? <Text style={[s.stageStars, on && { color: c.onCta }]}>{'★'.repeat(stars)}</Text> : null}
                    </Pressable>
                  );
                })}
              </ScrollView>
            </>
          ) : null}
        </View>
      </ScrollView>

      <View style={[s.footer, { paddingBottom: Math.max(insets.bottom, space.md) }]}>
        <Button
          title={game.ready ? (staged ? `العب المرحلة ${stage}` : 'العب هسه') : 'قريباً'}
          icon={game.ready ? 'play' : 'time-outline'}
          disabled={!game.ready}
          onPress={play}
        />
      </View>
    </View>
  );
}

function Stat({ value, label, gold }: { value: string; label: string; gold?: boolean }) {
  const s = useStyles();
  const c = useColors();
  return (
    <View style={s.stat}>
      <Text style={[s.statValue, gold && { color: c.accent }]}>{value}</Text>
      <Text style={s.statLabel} numberOfLines={1}>{label}</Text>
    </View>
  );
}

const useStyles = themed((c) => ({
  root: { flex: 1, backgroundColor: c.bg },
  cover: { height: 260 },
  topBar: { position: 'absolute', left: space.lg, right: space.lg, flexDirection: 'row', justifyContent: 'space-between' },
  roundBtn: { width: 42, height: 42, borderRadius: 21, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  sheet: { marginTop: -24, backgroundColor: c.bg, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: space.lg, gap: space.md },
  title: { fontFamily: fonts.display, fontSize: 28, lineHeight: 40, color: c.text },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: -6 },
  stats: { flexDirection: 'row', gap: space.sm },
  stat: { flex: 1, backgroundColor: c.card, borderRadius: cardRadius, borderWidth: 2, borderColor: c.border, paddingVertical: space.sm, alignItems: 'center' },
  statValue: { fontFamily: fonts.display, fontSize: 22, lineHeight: 32, color: c.primary },
  statLabel: { fontFamily: fonts.regular, fontSize: 11, lineHeight: 16, color: c.muted },
  howTitle: { fontFamily: fonts.bold, fontSize: 15, lineHeight: 24, color: c.text },
  howText: { fontFamily: fonts.regular, fontSize: 14, lineHeight: 24, color: c.muted },
  levels: { flexDirection: 'row', gap: space.sm },
  stageRow: { gap: space.sm, paddingBottom: 4 },
  stage: { width: 48, height: 52, borderRadius: 12, borderWidth: 2, borderColor: c.border, backgroundColor: c.card, alignItems: 'center', justifyContent: 'center' },
  stageLocked: { backgroundColor: c.cardAlt, borderColor: c.cardAlt },
  stageOn: { backgroundColor: c.cta, borderColor: c.primaryDark, boxShadow: `0 3px 0 ${c.primaryDark}` },
  stageNum: { fontFamily: fonts.bold, fontSize: 16, lineHeight: 22, color: c.text },
  stageStars: { fontFamily: fonts.bold, fontSize: 9, lineHeight: 12, color: c.accent },
  footer: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: space.lg, paddingTop: space.md, backgroundColor: c.bg, borderTopWidth: 1, borderTopColor: c.border },
}));
