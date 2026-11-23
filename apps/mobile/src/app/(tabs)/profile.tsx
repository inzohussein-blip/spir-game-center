import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Avatar } from '../../components/Avatar';
import { UpdateCard } from '../../components/UpdateCard';
import { useProgress } from '../../lib/progress';
import { levelOf, playedToday } from '../../lib/progressCore';
import { Linking, Pressable, ScrollView, View } from 'react-native';
import { Card, ListGroup, ListRow, PageHeader, Segmented, Text } from '../../components/ui';
import { fonts, space, themed, THEMES, useTheme, type ThemeMode } from '../../theme';

const PRIVACY_URL = 'https://inzohussein-blip.github.io/spir-game-center/privacy.html';

const MODES: { value: ThemeMode; label: string }[] = [
  { value: 'light', label: 'فاتح' },
  { value: 'dark', label: 'داكن' },
  { value: 'system', label: 'حسب الجهاز' },
];

/** حسابي: اللاعب الحالي، تغيير اللاعب، وضع الأهل، لون التطبيق، الصوت، وحول */
export default function Profile() {
  const s = useStyles();
  const router = useRouter();
  const { theme, setTheme, mode, setMode } = useTheme();
  const { profile, store, family, setSound } = useProgress();
  const lv = levelOf(store.xp);
  const [now] = useState(() => new Date());
  const today = Math.round(playedToday(store, now));
  const version = Constants.expoConfig?.version ?? '';
  return (
    <View style={s.root}>
      <PageHeader title="حسابي" subtitle={profile ? `${profile.name} · المستوى ${lv.level}` : undefined} />
      <ScrollView contentContainerStyle={s.body}>
        {profile ? (
          <Card style={s.me}>
            <Avatar index={profile.avatar} size={60} />
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={s.meName}>{profile.name}</Text>
              <Text style={s.meSub}>{`${profile.age} سنة · ${store.coins} عملة · لعبت اليوم ${today} دقيقة${profile.limitMin ? ` من ${profile.limitMin}` : ''}`}</Text>
            </View>
          </Card>
        ) : null}
        <ListGroup>
          <ListRow icon="people" title="غيّر اللاعب" subtitle={`${family.profiles.length} ملفات بالعائلة`} onPress={() => router.push('/who')} />
          <ListRow icon="lock-closed" title="وضع الأهل" subtitle="وقت اللعب، الأعمار، الألعاب المخفية" onPress={() => router.push('/parents')} />
          <ListRow icon="cloud-download" title="الألعاب المنزّلة" subtitle="الألعاب الكبيرة اللي تنزل عند الطلب" onPress={() => router.push('/downloads')} />
          <ListRow icon={store.sound ? 'volume-high' : 'volume-mute'} title={store.sound ? 'الأصوات: شغّالة' : 'الأصوات: مطفية'} onPress={() => setSound(!store.sound)} chevron={false} />
        </ListGroup>
        <Text style={s.group}>لون التطبيق</Text>
        <View style={s.themes}>
          {THEMES.map((t) => {
            const on = t.id === theme;
            return (
              <Pressable key={t.id} onPress={() => setTheme(t.id)} style={s.themeItem} accessibilityRole="radio" accessibilityState={{ selected: on }} accessibilityLabel={t.label}>
                <View style={[s.swatch, on && s.swatchOn]}>
                  <View style={{ flex: 1, backgroundColor: t.swatch[0] }} />
                  <View style={{ flex: 1, backgroundColor: t.swatch[1] }} />
                </View>
                <Text style={[s.themeLabel, on && s.themeLabelOn]}>{t.label}</Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={s.group}>المظهر</Text>
        <Segmented options={MODES} value={mode} onChange={setMode} />


        <Text style={s.group}>التحديثات</Text>
        <UpdateCard />

        <ListGroup title="حول">
          <ListRow icon="information-circle" title="Spir Games" subtitle={`النسخة ${version} · مجاني بالكامل وبدون إعلانات`} chevron={false} />
          <ListRow icon="shield-checkmark" title="سياسة الخصوصية" subtitle="ما نجمع أي بيانات — كلشي على جهازك" onPress={() => void Linking.openURL(PRIVACY_URL)} />
        </ListGroup>
      </ScrollView>
    </View>
  );
}

const useStyles = themed((c) => ({
  root: { flex: 1, backgroundColor: c.bg },
  body: { padding: space.lg, gap: space.md, paddingBottom: space.xxl },
  me: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  meName: { fontFamily: fonts.bold, fontSize: 18, color: c.text },
  meSub: { fontFamily: fonts.regular, fontSize: 12, lineHeight: 18, color: c.muted },
  group: { fontFamily: fonts.bold, fontSize: 15, color: c.text, marginTop: space.sm },
  themes: { flexDirection: 'row', gap: space.md },
  themeItem: { flex: 1, alignItems: 'center', gap: 6 },
  swatch: { width: 52, height: 52, borderRadius: 14, overflow: 'hidden', flexDirection: 'row', transform: [{ rotate: '0deg' }] },
  swatchOn: { borderWidth: 3, borderColor: c.cta, boxShadow: `0 3px 0 ${c.primaryDark}` },
  themeLabel: { fontFamily: fonts.semibold, fontSize: 12, color: c.muted },
  themeLabelOn: { fontFamily: fonts.bold, color: c.text },
}));
