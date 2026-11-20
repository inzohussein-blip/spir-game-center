import Constants from 'expo-constants';
import { Pressable, ScrollView, View } from 'react-native';
import { ListGroup, ListRow, PageHeader, Segmented, Text } from '../../components/ui';
import { fonts, space, themed, THEMES, useTheme, type ThemeMode } from '../../theme';

const MODES: { value: ThemeMode; label: string }[] = [
  { value: 'light', label: 'فاتح' },
  { value: 'dark', label: 'داكن' },
  { value: 'system', label: 'حسب الجهاز' },
];

/** حسابي: لون التطبيق، الوضع الفاتح/الداكن، وحول */
export default function Profile() {
  const s = useStyles();
  const { theme, setTheme, mode, setMode } = useTheme();
  const version = Constants.expoConfig?.version ?? '';
  return (
    <View style={s.root}>
      <PageHeader title="حسابي" subtitle="الملفات ووضع الأهل تجي بالمرحلة 2" />
      <ScrollView contentContainerStyle={s.body}>
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

        <ListGroup title="قريباً">
          <ListRow icon="people" title="ملفات العائلة" subtitle="كل واحد نتائجه وألعابه حسب عمره" chevron={false} />
          <ListRow icon="lock-closed" title="وضع الأهل" subtitle="حد يومي للعب ورمز PIN" chevron={false} />
          <ListRow icon="volume-high" title="الأصوات والاهتزاز" chevron={false} />
        </ListGroup>

        <ListGroup title="حول">
          <ListRow icon="information-circle" title="Spir Games" subtitle={`النسخة ${version} · مجاني بالكامل وبدون إعلانات`} chevron={false} />
        </ListGroup>
      </ScrollView>
    </View>
  );
}

const useStyles = themed((c) => ({
  root: { flex: 1, backgroundColor: c.bg },
  body: { padding: space.lg, gap: space.md, paddingBottom: space.xxl },
  group: { fontFamily: fonts.bold, fontSize: 15, color: c.text, marginTop: space.sm },
  themes: { flexDirection: 'row', gap: space.md },
  themeItem: { flex: 1, alignItems: 'center', gap: 6 },
  swatch: { width: 52, height: 52, borderRadius: 14, overflow: 'hidden', flexDirection: 'row', transform: [{ rotate: '0deg' }] },
  swatchOn: { borderWidth: 3, borderColor: c.cta, boxShadow: `0 3px 0 ${c.primaryDark}` },
  themeLabel: { fontFamily: fonts.semibold, fontSize: 12, color: c.muted },
  themeLabelOn: { fontFamily: fonts.bold, color: c.text },
}));
