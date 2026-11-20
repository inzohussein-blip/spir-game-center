import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useToast } from '../../components/feedback';
import { GameArt } from '../../components/GameArt';
import { Badge, Button, Card, Chip, Empty, Text } from '../../components/ui';
import { CATEGORY_LABEL, gameById } from '../../lib/games';
import { cardRadius, fonts, space, themed, useColors } from '../../theme';

const LEVELS = ['سهل', 'متوسط', 'صعب'] as const;

/** صفحة اللعبة: الغلاف، الأرقام، شلون تلعب، المستوى، وزر «العب هسه» ثابت تحت */
export default function GameDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const game = gameById(String(id));
  const s = useStyles();
  const c = useColors();
  const router = useRouter();
  const toast = useToast();
  const insets = useSafeAreaInsets();
  const [level, setLevel] = useState<(typeof LEVELS)[number]>('متوسط');

  if (!game) return <Empty title="ما لگينا هاي اللعبة" />;
  const back = () => (router.canGoBack() ? router.back() : router.replace('/'));

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
            <Stat value="—" label="أفضل نتيجة" />
            <Stat value={game.levels > 1 ? `0/${game.levels}` : '∞'} label="المراحل" />
            <Stat value="★ 0" label="النجوم" gold />
          </View>

          <Card>
            <Text style={s.howTitle}>شلون تلعب؟</Text>
            <Text style={s.howText}>{game.howTo}</Text>
          </Card>

          <Text style={s.howTitle}>المستوى</Text>
          <View style={s.levels}>
            {LEVELS.map((l) => (
              <Chip key={l} label={l} active={level === l} onPress={() => setLevel(l)} />
            ))}
          </View>
        </View>
      </ScrollView>

      <View style={[s.footer, { paddingBottom: Math.max(insets.bottom, space.md) }]}>
        <Button
          title={game.ready ? 'العب هسه' : 'قريباً'}
          icon={game.ready ? 'play' : 'time-outline'}
          disabled={!game.ready}
          onPress={() => toast('اللعبة تنضاف بالمرحلة الجاية')}
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
      <Text style={s.statLabel}>{label}</Text>
    </View>
  );
}

const useStyles = themed((c) => ({
  root: { flex: 1, backgroundColor: c.bg },
  cover: { height: 280 },
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
  footer: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: space.lg, paddingTop: space.md, backgroundColor: c.bg, borderTopWidth: 1, borderTopColor: c.border },
}));
