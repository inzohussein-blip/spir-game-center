import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { Avatar } from '../components/Avatar';
import { ProfileForm } from '../components/ProfileForm';
import { PageHeader, Text } from '../components/ui';
import { useProgress } from '../lib/progress';
import { cardRadius, fonts, space, themed, useColors } from '../theme';

/** «منو راح يلعب؟»: ملفات العائلة بدون تسجيل دخول. أول مرة: نسوّي أول ملف */
export default function Who() {
  const s = useStyles();
  const c = useColors();
  const router = useRouter();
  const { family, choose, createProfile } = useProgress();
  const [adding, setAdding] = useState(false);
  const first = family.profiles.length === 0;
  const go = () => router.replace('/');

  return (
    <View style={s.root}>
      <PageHeader eyebrow={first ? 'أهلاً بيكم بـ Spir Games' : 'Spir Games'} title={first ? 'سوّي ملفك' : 'منو راح يلعب؟'} />
      <ScrollView contentContainerStyle={s.body} keyboardShouldPersistTaps="handled">
        {first || adding ? (
          <>
            {first ? <Text style={s.intro}>كل واحد بالعائلة إله ملف: نجومه وعملاته وألعاب تناسب عمره. ما نحتاج رقم تلفون ولا إيميل.</Text> : null}
            <ProfileForm
              submitLabel="يلا نلعب"
              onSubmit={(p) => {
                createProfile(p);
                go();
              }}
              onCancel={first ? undefined : () => setAdding(false)}
            />
          </>
        ) : (
          <View style={s.grid}>
            {family.profiles.map((p) => (
              <Pressable
                key={p.id}
                onPress={() => {
                  choose(p.id);
                  go();
                }}
                style={({ pressed }) => [s.card, p.id === family.activeId && s.cardOn, pressed && { transform: [{ scale: 0.97 }] }]}
                accessibilityRole="button"
                accessibilityLabel={`${p.name}، ${p.age} سنة`}
              >
                <Avatar index={p.avatar} size={64} />
                <Text style={s.name} numberOfLines={1}>{p.name}</Text>
                <Text style={s.age}>{`${p.age} سنة`}</Text>
              </Pressable>
            ))}
            <Pressable onPress={() => setAdding(true)} style={[s.card, s.addCard]} accessibilityRole="button" accessibilityLabel="لاعب جديد">
              <View style={s.plus}>
                <Ionicons name="add" size={30} color={c.primary} />
              </View>
              <Text style={[s.name, { color: c.primary }]}>لاعب جديد</Text>
            </Pressable>
          </View>
        )}
        {!first ? (
          <Pressable onPress={() => router.push('/parents')} style={s.parent} accessibilityRole="button">
            <Ionicons name="lock-closed" size={22} color={c.text} />
            <View style={{ flex: 1 }}>
              <Text style={s.parentTitle}>وضع الأهل</Text>
              <Text style={s.parentHint}>وقت اللعب، الأعمار، والملفات (برمز)</Text>
            </View>
            <Ionicons name="chevron-back" size={18} color={c.muted} />
          </Pressable>
        ) : null}
      </ScrollView>
    </View>
  );
}

const useStyles = themed((c) => ({
  root: { flex: 1, backgroundColor: c.bg },
  body: { padding: space.lg, gap: space.lg, paddingBottom: space.xxl },
  intro: { fontFamily: fonts.regular, fontSize: 14, lineHeight: 24, color: c.muted },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: space.md },
  card: { width: '47%', flexGrow: 1, backgroundColor: c.card, borderRadius: cardRadius, borderWidth: 2, borderColor: c.border, padding: space.lg, alignItems: 'center', gap: 6 },
  cardOn: { borderColor: c.primaryDark, boxShadow: `0 3px 0 ${c.primaryDark}` },
  addCard: { borderStyle: 'dashed', justifyContent: 'center' },
  plus: { width: 64, height: 64, borderRadius: 32, backgroundColor: c.primarySoft, alignItems: 'center', justifyContent: 'center' },
  name: { fontFamily: fonts.bold, fontSize: 16, lineHeight: 24, color: c.text },
  age: { fontFamily: fonts.semibold, fontSize: 12, color: c.primary, backgroundColor: c.primarySoft, borderRadius: 6, paddingHorizontal: 8, overflow: 'hidden' },
  parent: { flexDirection: 'row', alignItems: 'center', gap: space.md, backgroundColor: c.cardAlt, borderRadius: cardRadius, padding: space.lg },
  parentTitle: { fontFamily: fonts.bold, fontSize: 15, color: c.text },
  parentHint: { fontFamily: fonts.regular, fontSize: 12, color: c.muted },
}));
