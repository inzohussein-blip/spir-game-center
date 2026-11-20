import { Ionicons } from '@expo/vector-icons';
import { ScrollView, View } from 'react-native';
import { Card, PageHeader, SectionTitle, Text, type IconName } from '../../components/ui';
import { cardRadius, fonts, space, themed, useColors } from '../../theme';

/** الأوسمة اللي راح تنفتح باللعب (منطقها بالمرحلة 2) */
const BADGES: { id: string; title: string; icon: IconName }[] = [
  { id: 'first-win', title: 'أول فوز', icon: 'checkmark' },
  { id: 'streak-7', title: '7 أيام ورا بعض', icon: 'flame' },
  { id: 'stars-50', title: '50 نجمة', icon: 'star' },
  { id: 'puzzle-king', title: 'ملك الألغاز', icon: 'extension-puzzle' },
  { id: 'explorer', title: 'جرّب 10 ألعاب', icon: 'compass' },
  { id: 'cat-trapper', title: 'صياد البزازين', icon: 'paw' },
];

/** الإنجازات: المستوى والأوسمة وترتيب العائلة */
export default function Awards() {
  const s = useStyles();
  const c = useColors();
  return (
    <View style={s.root}>
      <PageHeader eyebrow="المستوى 1 · 0 عملة" title="الإنجازات">
        <View style={s.xpTrack}>
          <View style={s.xpFill} />
        </View>
      </PageHeader>
      <ScrollView contentContainerStyle={s.body}>
        <SectionTitle title="الأوسمة" hint="العب حتى تفتحها" />
        <View style={s.grid}>
          {BADGES.map((b) => (
            <View key={b.id} style={s.badge} accessibilityLabel={`${b.title} — مقفول`}>
              <View style={s.badgeIcon}>
                <Ionicons name={b.icon} size={22} color={c.muted} />
                <View style={s.lock}>
                  <Ionicons name="lock-closed" size={11} color={c.onCta} />
                </View>
              </View>
              <Text style={s.badgeTitle} numberOfLines={2}>{b.title}</Text>
            </View>
          ))}
        </View>
        <SectionTitle title="ترتيب العائلة" />
        <Card style={{ alignItems: 'center', gap: space.xs }}>
          <Ionicons name="people" size={28} color={c.primary} />
          <Text style={s.soonTitle}>يجي بالتحديث الجاي</Text>
          <Text style={s.soonHint}>كل فرد بالعائلة يسوّي ملف، ونقاطكم تتقارن هنا.</Text>
        </Card>
      </ScrollView>
    </View>
  );
}

const useStyles = themed((c) => ({
  root: { flex: 1, backgroundColor: c.bg },
  body: { padding: space.lg, gap: space.lg, paddingBottom: space.xxl },
  xpTrack: { height: 8, borderRadius: 6, backgroundColor: 'rgba(255,255,255,0.18)', overflow: 'hidden' },
  xpFill: { width: '4%', height: '100%', backgroundColor: c.cta },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  badge: { width: '31.5%', flexGrow: 1, backgroundColor: c.card, borderRadius: cardRadius, borderWidth: 2, borderColor: c.border, padding: space.sm, alignItems: 'center', gap: 6 },
  badgeIcon: { width: 48, height: 48, borderRadius: 24, backgroundColor: c.cardAlt, alignItems: 'center', justifyContent: 'center' },
  lock: { position: 'absolute', bottom: -2, end: -2, width: 20, height: 20, borderRadius: 10, backgroundColor: c.cta, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: c.card },
  badgeTitle: { fontFamily: fonts.semibold, fontSize: 12, lineHeight: 18, color: c.text, textAlign: 'center' },
  soonTitle: { fontFamily: fonts.bold, fontSize: 15, color: c.text },
  soonHint: { fontFamily: fonts.regular, fontSize: 13, color: c.muted, textAlign: 'center' },
}));
