import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { GameCard, GameTile } from '../../components/GameCard';
import { Chip, Halftone, PageHeader, SectionTitle, Text } from '../../components/ui';
import { formatNumber, greetingFor } from '../../lib/format';
import { CATEGORIES, dailyFor, filterGames, visibleGames, type CategoryId } from '../../lib/games';
import { useProgress } from '../../lib/progress';
import { DAILY_BONUS, dayKey } from '../../lib/progressCore';
import { Avatar } from '../../components/Avatar';
import { cardRadius, fonts, space, themed } from '../../theme';

/** الرئيسية: تحدّي اليوم، الأقسام، الألعاب الجديدة، وشبكة كل الألعاب */
export default function Home() {
  const s = useStyles();
  const router = useRouter();
  const { store, profile } = useProgress();
  const [cat, setCat] = useState<CategoryId | 'all'>('all');
  // الألعاب حسب عمر اللاعب وبدون اللي خفاها الأهل
  const mine = useMemo(() => visibleGames(profile), [profile]);
  // آخر الألعاب اللي انلعبت (للصف «كمّل من وين وقفت»)
  const recent = useMemo(
    () => mine.filter((g) => (store.games[g.id]?.lastPlayed ?? 0) > 0).sort((a, b) => (store.games[b.id]?.lastPlayed ?? 0) - (store.games[a.id]?.lastPlayed ?? 0)),
    [store.games, mine],
  );
  const favs = useMemo(() => mine.filter((g) => store.favorites.includes(g.id)), [mine, store.favorites]);
  const games = useMemo(() => filterGames(mine, cat), [mine, cat]);
  // التاريخ والتحية ينحسبون مرة وحدة عند فتح الشاشة
  const [now] = useState(() => new Date());
  const challenge = useMemo(() => dailyFor(profile, now), [profile, now]);
  const dailyDone = store.dailyDone === dayKey(now);
  const rows = useMemo(() => {
    const out: (typeof games)[] = [];
    for (let i = 0; i < games.length; i += 2) out.push(games.slice(i, i + 2));
    return out;
  }, [games]);

  return (
    <View style={s.root}>
      <PageHeader
        eyebrow={profile ? `${greetingFor(now.getHours())} يا ${profile.name}` : greetingFor(now.getHours())}
        title="الألعاب"
        actions={
          <View style={s.headActions}>
          <Pressable onPress={() => router.push('/who')} accessibilityRole="button" accessibilityLabel="غيّر اللاعب">
            {profile ? <Avatar index={profile.avatar} size={36} /> : null}
          </Pressable>
          <View style={s.coin} accessibilityLabel={`عملاتك: ${store.coins}`}>
            <View style={s.coinDot} />
            <Text style={s.coinText}>{formatNumber(store.coins)}</Text>
          </View>
          </View>
        }
      />
      <ScrollView contentContainerStyle={s.body}>
        <Pressable onPress={() => router.push({ pathname: '/game/[id]', params: { id: challenge.id } })} style={s.hero} accessibilityRole="button" accessibilityLabel={`تحدّي اليوم: ${challenge.title}`}>
          <Halftone rows={8} cols={30} color="rgba(255,255,255,0.10)" style={{ top: 8, left: 8 }} />
          <View style={[s.heroIcon, { backgroundColor: challenge.color }]}>
            <MaterialCommunityIcons name={challenge.icon} size={30} color="#FFFFFF" />
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={s.heroKicker}>تحدّي اليوم</Text>
            <Text style={s.heroTitle} numberOfLines={1}>{challenge.title}</Text>
            <Text style={s.heroSub} numberOfLines={1}>{dailyDone ? 'خلصته اليوم ✓ — رجع باچر لتحدّي جديد' : `اربح وخذ +${DAILY_BONUS} عملة إضافية`}</Text>
          </View>
          <View style={s.heroBtn}>
            <Text style={s.heroBtnText}>{dailyDone ? 'العب' : 'تحدّى'}</Text>
          </View>
        </Pressable>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.chips}>
          {CATEGORIES.map((c) => (
            <Chip key={c.id} label={c.label} active={cat === c.id} onPress={() => setCat(c.id)} />
          ))}
        </ScrollView>

        {cat === 'all' ? (
          <>
            {favs.length ? (
              <>
                <SectionTitle title="المفضلة" />
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.tiles}>
                  {favs.map((g) => (
                    <GameTile key={g.id} game={g} />
                  ))}
                </ScrollView>
              </>
            ) : null}
            {recent.length ? (
              <>
                <SectionTitle title="كمّل من وين وقفت" />
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.tiles}>
                  {recent.map((g) => (
                    <GameTile key={g.id} game={g} />
                  ))}
                </ScrollView>
              </>
            ) : null}
          </>
        ) : null}

        <SectionTitle title="كل الألعاب" action={<Text style={s.count}>{`${games.length} لعبة`}</Text>} />
        <View style={{ gap: space.md }}>
          {rows.map((row) => (
            <View key={row.map((g) => g.id).join()} style={s.row}>
              {row.map((g) => (
                <GameCard key={g.id} game={g} />
              ))}
              {row.length === 1 ? <View style={{ flex: 1 }} /> : null}
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const useStyles = themed((c) => ({
  root: { flex: 1, backgroundColor: c.bg },
  body: { padding: space.lg, gap: space.lg, paddingBottom: space.xxl },
  headActions: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  coin: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.14)', borderRadius: 999, paddingStart: 6, paddingEnd: 12, paddingVertical: 5 },
  coinDot: { width: 18, height: 18, borderRadius: 9, backgroundColor: c.cta, borderBottomWidth: 2, borderBottomColor: c.accent },
  coinText: { fontFamily: fonts.bold, fontSize: 14, lineHeight: 20, color: c.onHeader },
  hero: { flexDirection: 'row', alignItems: 'center', gap: space.md, backgroundColor: c.primaryDark, borderRadius: cardRadius, padding: space.md, overflow: 'hidden' },
  heroIcon: { width: 58, height: 58, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  heroKicker: { fontFamily: fonts.bold, fontSize: 12, lineHeight: 18, color: c.cta },
  heroTitle: { fontFamily: fonts.display, fontSize: 20, lineHeight: 30, color: '#FFFFFF' },
  heroSub: { fontFamily: fonts.regular, fontSize: 12, lineHeight: 18, color: 'rgba(255,255,255,0.8)' },
  heroBtn: { backgroundColor: c.cta, borderRadius: 10, paddingHorizontal: 16, minHeight: 38, justifyContent: 'center', boxShadow: '0 3px 0 #000000' },
  heroBtnText: { fontFamily: fonts.bold, fontSize: 14, color: c.onCta },
  chips: { gap: space.sm, paddingBottom: 4 },
  tiles: { gap: space.sm },
  row: { flexDirection: 'row', gap: space.md },
  count: { fontFamily: fonts.semibold, fontSize: 12, color: c.primary },
}));
