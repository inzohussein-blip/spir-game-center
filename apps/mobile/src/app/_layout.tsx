import { ReadexPro_400Regular, ReadexPro_600SemiBold, ReadexPro_700Bold, useFonts } from '@expo-google-fonts/readex-pro';
import { ReemKufi_700Bold } from '@expo-google-fonts/reem-kufi';
import { Stack, type ErrorBoundaryProps } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useState } from 'react';
import { I18nManager, Platform, Pressable, View } from 'react-native';
import { BrandSplash } from '../components/BrandSplash';
import { ToastProvider } from '../components/feedback';
import { StackHeader } from '../components/StackHeader';
import { Text } from '../components/ui';
import { ProgressProvider } from '../lib/progress';
import { fonts, headerText, ThemeProvider, useTheme } from '../theme';

// العربية: اتجاه من اليمين لليسار
if (Platform.OS !== 'web' && !I18nManager.isRTL) {
  I18nManager.allowRTL(true);
  I18nManager.forceRTL(true);
}
if (Platform.OS === 'web' && typeof document !== 'undefined') {
  document.documentElement.dir = 'rtl';
  document.documentElement.lang = 'ar';
  document.title = 'Spir Games';
}

/** إذا شاشة طاحت: زر «جرّب مرة ثانية» بدل شاشة بيضاء */
export function ErrorBoundary({ retry }: ErrorBoundaryProps) {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 12, backgroundColor: '#EEF0FF' }}>
      <Text style={{ fontFamily: fonts.bold, fontSize: 18, color: '#0B1033' }}>صار خطأ بهاي الصفحة</Text>
      <Text style={{ textAlign: 'center', color: '#4A5185' }}>جرّب مرة ثانية.</Text>
      <Pressable onPress={() => void retry()} style={{ backgroundColor: '#FFD60A', borderRadius: 10, paddingHorizontal: 22, paddingVertical: 10, boxShadow: '0 3px 0 #0B1033' }} accessibilityRole="button">
        <Text style={{ color: '#0B1033', fontFamily: fonts.bold }}>جرّب مرة ثانية</Text>
      </Pressable>
    </View>
  );
}

function AppStack() {
  const { colors: c } = useTheme();
  useEffect(() => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') document.body.style.backgroundColor = c.bg;
  }, [c.bg]);
  return (
    <>
      <StatusBar style={c.onHeader === '#FFFFFF' ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          header: (props) => <StackHeader {...props} />,
          headerStyle: { backgroundColor: c.header },
          headerTintColor: headerText(c),
          headerShadowVisible: false,
          headerTitleStyle: { fontFamily: fonts.bold },
          contentStyle: { backgroundColor: c.bg },
          headerBackTitle: 'رجوع',
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="game/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="play/[id]" options={{ headerShown: false, gestureEnabled: false, animation: 'fade' }} />
      </Stack>
    </>
  );
}

/** شاشة الشعار تبقى على الأقل هالمدة عند الفتح */
const SPLASH_MS = 1300;

export default function RootLayout() {
  const [loaded] = useFonts({ ReadexPro_400Regular, ReadexPro_600SemiBold, ReadexPro_700Bold, ReemKufi_700Bold });
  const [minDone, setMinDone] = useState(false);
  const [splashGone, setSplashGone] = useState(false);
  const hideSplash = useCallback(() => setSplashGone(true), []);
  useEffect(() => {
    const t = setTimeout(() => setMinDone(true), SPLASH_MS);
    return () => clearTimeout(t);
  }, []);
  return (
    <ThemeProvider>
      <View style={{ flex: 1 }}>
        {loaded ? (
          <ProgressProvider>
            <ToastProvider>
              <AppStack />
            </ToastProvider>
          </ProgressProvider>
        ) : null}
        {!splashGone ? (
          <View style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, zIndex: 100 }}>
            <BrandSplash durationMs={SPLASH_MS - 100} done={loaded && minDone} fontsReady={loaded} onHidden={hideSplash} />
          </View>
        ) : null}
      </View>
    </ThemeProvider>
  );
}
