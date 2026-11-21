import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useState } from 'react';
import { Linking, Platform, Pressable, View } from 'react-native';
import { APP_VERSION, checkForUpdate, reloadWeb, type UpdateResult } from '../lib/updateCheck';
import { useRouter } from 'expo-router';
import { cardRadius, ctaShadow, fonts, themed, useColors } from '../theme';
import { Button, Text } from './ui';

type State = { status: 'checking' } | { status: 'done'; result: UpdateResult } | { status: 'error'; message: string };

/** بطاقة الإصدار بصفحة «حول»: رقم النسخة، فحص تلقائي عند الفتح، وزر «حدّث» إذا أكو نسخة أحدث */
export function UpdateCard() {
  const c = useColors();
  const st = useStyles();
  const [state, setState] = useState<State>({ status: 'checking' });

  const check = useCallback(async () => {
    setState({ status: 'checking' });
    try {
      setState({ status: 'done', result: await checkForUpdate() });
    } catch (e) {
      setState({ status: 'error', message: e instanceof Error ? e.message : 'صار خطأ' });
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- فحص واحد عند فتح الصفحة
    void check();
  }, [check]);

  const result = state.status === 'done' ? state.result : null;
  const hasUpdate = result?.kind === 'available' || result?.kind === 'web-reload';

  return (
    <View style={[st.card, hasUpdate && { borderColor: c.primary }]} testID="update-card">
      <View style={st.row}>
        <View style={[st.icon, hasUpdate && { backgroundColor: c.primary }]}>
          <Ionicons name={hasUpdate ? 'arrow-down-circle' : 'phone-portrait-outline'} size={24} color={hasUpdate ? '#fff' : c.primary} />
        </View>
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={st.title}>الإصدار {APP_VERSION}</Text>
          <Text variant="small" style={{ color: hasUpdate ? c.primary : c.muted, fontFamily: hasUpdate ? fonts.bold : fonts.regular }}>
            {state.status === 'checking'
              ? 'دا نفحص إذا أكو نسخة أحدث...'
              : state.status === 'error'
                ? state.message
                : result?.kind === 'available'
                  ? `أكو نسخة جديدة: ${result.update.version}`
                  : result?.kind === 'web-reload'
                    ? 'أكو نسخة أحدث من التطبيق'
                    : 'عندك آخر نسخة ✓'}
          </Text>
        </View>
      </View>

      {result?.kind === 'available' && result.update.notes ? (
        <View style={st.notes}>
          <Text variant="small" style={{ fontFamily: fonts.bold }}>شنو الجديد</Text>
          <Text variant="small" style={{ lineHeight: 22 }} numberOfLines={8}>
            {result.update.notes}
          </Text>
        </View>
      ) : null}

      {result?.kind === 'available' ? (
        <>
          <Button title={`حدّث للنسخة ${result.update.version}`} icon="download-outline" onPress={() => void Linking.openURL(result.update.url)} />
          {Platform.OS === 'android' ? (
            <Text variant="small" style={{ color: c.muted, lineHeight: 22 }}>
              ينزل ملف التحديث، افتحه واضغط «تحديث». ملفات العائلة والنجوم تبقى مثل ما هي.
            </Text>
          ) : null}
        </>
      ) : result?.kind === 'web-reload' ? (
        <Button title="حدّث هسه" icon="refresh" onPress={() => reloadWeb(result.build)} />
      ) : (
        <Button title="افحص التحديثات" icon="refresh" variant="outline" loading={state.status === 'checking'} onPress={() => void check()} />
      )}
    </View>
  );
}

const useStyles = themed((c) => ({
  card: { backgroundColor: c.card, borderRadius: cardRadius, borderWidth: 2, borderColor: c.border, padding: 14, gap: 12 },
  banner: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: c.cta, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, boxShadow: ctaShadow(c) },
  bannerText: { flex: 1, fontFamily: fonts.bold, fontSize: 14, lineHeight: 22, color: c.onCta },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  icon: { width: 46, height: 46, borderRadius: 14, backgroundColor: c.primarySoft, alignItems: 'center', justifyContent: 'center' },
  title: { fontFamily: fonts.bold, fontSize: 17, lineHeight: 28 },
  notes: { backgroundColor: c.primarySoft, borderRadius: 12, padding: 10, gap: 2 },
}));

/** شريط صغير بالرئيسية يطلع بس إذا أكو نسخة أحدث — يفحص مرة وحدة بصمت (بدون رسالة خطأ) */
export function UpdateBanner() {
  const st = useStyles();
  const c = useColors();
  const router = useRouter();
  const [result, setResult] = useState<UpdateResult | null>(null);
  useEffect(() => {
    let alive = true;
    checkForUpdate()
      .then((r) => alive && setResult(r))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);
  if (!result || result.kind === 'latest') return null;
  const label = result.kind === 'available' ? `أكو نسخة جديدة ${result.update.version} — حدّث` : 'أكو نسخة أحدث — اضغط حتى تحدّث';
  return (
    <Pressable
      onPress={() => (result.kind === 'web-reload' ? reloadWeb(result.build) : router.push('/profile'))}
      style={({ pressed }) => [st.banner, pressed && { opacity: 0.85 }]}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <Ionicons name="arrow-down-circle" size={22} color={c.onCta} />
      <Text style={st.bannerText}>{label}</Text>
      <Ionicons name="chevron-back" size={18} color={c.onCta} />
    </Pressable>
  );
}
