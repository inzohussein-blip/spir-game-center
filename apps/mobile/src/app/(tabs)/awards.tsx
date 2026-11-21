import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Card, PageHeader, SectionTitle, Text, type IconName } from '../../components/ui';
import { formatNumber } from '../../lib/format';
import { useProgress } from '../../lib/progress';
import { Avatar } from '../../components/Avatar';
import { BADGES, badges, emptyStore, levelOf, weeklyStars } from '../../lib/progressCore';
import { cardRadius, fonts, space, themed, useColors } from '../../theme';


/** الإنجازات: المستوى والأوسمة وترتيب العائلة */
export default function Awards() {
  const s = useStyles();
  const c = useColors();
  const { store, family, profile } = useProgress();
  const [now] = useState(() => new Date());
  const ranking = family.profiles.map((p) => ({ p, stars: weeklyStars(family.data[p.id] ?? emptyStore(), now) })).sort((a, b) => b.stars - a.stars);
  const lv = levelOf(store.xp);
  const got = badges(store);
  const count = BADGES.filter((b) => got[b.id]).length;
  return (
    <View style={s.root}>
      <PageHeader eyebrow={`المستوى ${lv.level} · ${formatNumber(store.coins)} عملة`} title="الإنجازات">
        <View style={s.xpTrack}>
          <View style={[s.xpFill, { width: `${Math.max(4, lv.progress * 100)}%` }]} />
        </View>
      </PageHeader>
      <ScrollView contentContainerStyle={s.body}>
        <SectionTitle title="الأوسمة" hint={`${count} من ${BADGES.length} — العب حتى تفتحها`} />
        <View style={s.grid}>
          {BADGES.map((b) => {
            const on = got[b.id];
            return (
              <View key={b.id} style={s.badge} accessibilityLabel={`${b.title} — ${on ? 'مفتوح' : 'مقفول'}`}>
                <View style={[s.badgeIcon, on && s.badgeOn]}>
                  <Ionicons name={b.icon as IconName} size={22} color={on ? c.onCta : c.muted} />
                  {on ? null : (
                    <View style={s.lock}>
                      <Ionicons name="lock-closed" size={11} color={c.onCta} />
                    </View>
                  )}
                </View>
                <Text style={s.badgeTitle} numberOfLines={2}>{b.title}</Text>
              </View>
            );
          })}
        </View>
        <SectionTitle title="تحدّي العائلة الأسبوعي" hint="نجوم آخر 7 أيام" />
        <Card style={{ padding: 0, overflow: 'hidden', gap: 0 }}>
          {ranking.map((r, i) => (
            <View key={r.p.id} style={[s.rankRow, i === 0 && r.stars > 0 && s.rankFirst, i > 0 && s.rankBorder]}>
              <Text style={s.rankNum}>{String(i + 1)}</Text>
              <Avatar index={r.p.avatar} size={36} />
              <Text style={s.rankName} numberOfLines={1}>{r.p.id === profile?.id ? `${r.p.name} (إنت)` : r.p.name}</Text>
              <Ionicons name="star" size={16} color={c.accent} />
              <Text style={s.rankStars}>{String(r.stars)}</Text>
            </View>
          ))}
          {ranking.length < 2 ? <Text style={[s.soonHint, { padding: space.md }]}>سوّوا ملف لكل واحد بالعائلة («منو يلعب؟») وتسابقوا على النجوم كل أسبوع.</Text> : null}
        </Card>
      </ScrollView>
    </View>
  );
}

const useStyles = themed((c) => ({
  root: { flex: 1, backgroundColor: c.bg },
  body: { padding: space.lg, gap: space.lg, paddingBottom: space.xxl },
  xpTrack: { height: 8, borderRadius: 6, backgroundColor: 'rgba(255,255,255,0.18)', overflow: 'hidden' },
  xpFill: { height: '100%', backgroundColor: c.cta },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  badge: { width: '31.5%', flexGrow: 1, backgroundColor: c.card, borderRadius: cardRadius, borderWidth: 2, borderColor: c.border, padding: space.sm, alignItems: 'center', gap: 6 },
  badgeIcon: { width: 48, height: 48, borderRadius: 24, backgroundColor: c.cardAlt, alignItems: 'center', justifyContent: 'center' },
  badgeOn: { backgroundColor: c.cta, boxShadow: `0 3px 0 ${c.primaryDark}` },
  lock: { position: 'absolute', bottom: -2, end: -2, width: 20, height: 20, borderRadius: 10, backgroundColor: c.cta, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: c.card },
  badgeTitle: { fontFamily: fonts.semibold, fontSize: 12, lineHeight: 18, color: c.text, textAlign: 'center' },
  rankRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm, paddingHorizontal: space.md, paddingVertical: space.sm },
  rankFirst: { backgroundColor: c.accentSoft },
  rankBorder: { borderTopWidth: 2, borderTopColor: c.border },
  rankNum: { fontFamily: fonts.display, fontSize: 20, width: 22, textAlign: 'center', color: c.primary },
  rankName: { flex: 1, fontFamily: fonts.bold, fontSize: 15, color: c.text },
  rankStars: { fontFamily: fonts.bold, fontSize: 15, color: c.text, minWidth: 28, textAlign: 'left' },
  soonTitle: { fontFamily: fonts.bold, fontSize: 15, color: c.text },
  soonHint: { fontFamily: fonts.regular, fontSize: 13, color: c.muted, textAlign: 'center' },
}));
