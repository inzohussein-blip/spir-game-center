import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Image, Pressable, ScrollView, View } from 'react-native';
import { GameCard, GameTile } from '../../components/GameCard';
import { UpdateBanner } from '../../components/UpdateCard';
import { Chip, Halftone, PageHeader, SectionTitle, Text } from '../../components/ui';
import { formatNumber, greetingFor } from '../../lib/format';
import { CATEGORIES, dailyFor, filterGames, visibleGames, type CategoryId } from '../../lib/games';
import { useProgress } from '../../lib/progress';
import { DAILY_BONUS, dayKey } from '../../lib/progressCore';
import { Avatar } from '../../components/Avatar';
import { COVERS } from '../../lib/covers';
import { cardRadius, fonts, space, themed } from '../../theme';

/**
 * الرئيسية (ترتيب المتجر): تحدّي اليوم، الأقسام، ألعاب سبير الجديدة، بيت سبير والألبوم،
 * المفضلة، «كمّل من وين وقفت»، وشبكة كل الألعاب.
 */
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
  const featured = useMemo(() => mine.filter((g) => g.featured), [mine]);
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
        <UpdateBanner />
        <Pressable onPress={() => router.push({ pathname: '/game/[id]', params: { id: challenge.id } })} style={s.hero} accessibilityRole="button" accessibilityLabel={`تحدّي اليوم: ${challenge.title}`}>
          <Halftone rows={8} cols={30} color="rgba(255,255,255,0.10)" style={{ top: 8, left: 8 }} />
          <View style={[s.heroIcon, { backgroundColor: challenge.color }]}>
            {COVERS[challenge.id] ? (
              <Image source={COVERS[challenge.id]} resizeMode="cover" style={s.heroCover} />
            ) : (
              <MaterialCommunityIcons name={challenge.icon} size={30} color="#FFFFFF" />
            )}
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
            {featured.length ? (
              <>
                <SectionTitle title="ألعاب سبير الجديدة" hint="رسوم وشخصيات وملصقات" />
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.tiles}>
                  {featured.map((g) => (
                    <Pressable key={g.id} onPress={() => router.push({ pathname: '/game/[id]', params: { id: g.id } })} style={({ pressed }) => [s.feature, pressed && { transform: [{ scale: 0.97 }] }]} accessibilityRole="button" accessibilityLabel={g.title}>
                      {COVERS[g.id] ? <Image source={COVERS[g.id]} resizeMode="cover" style={s.featureImg} /> : null}
                      <View style={s.featureMeta}>
                        <Text style={s.featureTitle} numberOfLines={1}>{g.title}</Text>
                        <Text style={s.featureSub} numberOfLines={1}>{g.tagline}</Text>
                      </View>
                    </Pressable>
                  ))}
                </ScrollView>
              </>
            ) : null}

            <View style={s.row}>
              <Pressable onPress={() => router.push('/house')} style={[s.place, { backgroundColor: '#FF9F43' }]} accessibilityRole="button" accessibilityLabel="بيت سبير والألبوم">
                <Halftone rows={5} cols={14} color="rgba(255,255,255,0.18)" style={{ top: 6, left: 6 }} />
                <MaterialCommunityIcons name="home-heart" size={30} color="#FFFFFF" />
                <View style={{ flex: 1 }}>
                  <Text style={s.placeTitle}>بيت سبير</Text>
                  <Text style={s.placeSub}>{`زيّن البيت · ${store.stickers.length} ملصق`}</Text>
                </View>
              </Pressable>
              <Pressable onPress={() => router.push('/world')} style={[s.place, { backgroundColor: '#0F9B8E' }]} accessibilityRole="button" accessibilityLabel="خريطة عالم سبير">
                <Halftone rows={5} cols={14} color="rgba(255,255,255,0.18)" style={{ top: 6, left: 6 }} />
                <MaterialCommunityIcons name="map-legend" size={30} color="#FFFFFF" />
                <View style={{ flex: 1 }}>
                  <Text style={s.placeTitle}>الخريطة</Text>
                  <Text style={s.placeSub}>عالم سبير</Text>
                </View>
              </Pressable>
            </View>

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
  heroIcon: { width: 58, height: 58, borderRadius: 14, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  heroCover: { width: 58 * 1.77, height: 58 },
  feature: { width: 230, backgroundColor: c.card, borderRadius: cardRadius, borderWidth: 2, borderColor: c.border, overflow: 'hidden' },
  featureImg: { width: '100%', height: 128 },
  featureMeta: { paddingHorizontal: space.md, paddingVertical: space.sm },
  featureTitle: { fontFamily: fonts.bold, fontSize: 15, lineHeight: 22, color: c.text },
  featureSub: { fontFamily: fonts.regular, fontSize: 12, lineHeight: 18, color: c.muted },
  place: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: space.sm, borderRadius: cardRadius, padding: space.md, overflow: 'hidden', boxShadow: `0 3px 0 ${c.primaryDark}` },
  placeTitle: { fontFamily: fonts.bold, fontSize: 15, lineHeight: 22, color: '#FFFFFF' },
  placeSub: { fontFamily: fonts.regular, fontSize: 11, lineHeight: 16, color: 'rgba(255,255,255,0.9)' },
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
