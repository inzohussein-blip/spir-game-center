import { Asset } from 'expo-asset';
import { useEffect, useImperativeHandle, useRef, useState, type ComponentType, type Ref } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { WebView, type WebViewMessageEvent, type WebViewProps } from 'react-native-webview';
import { parseGameMessage, type GameMessage, type HostMessage } from '../lib/bridge';

// نوع WebView الافتراضي يصير never مع TypeScript 7 — نثبّته (نفس حل بالملعب)
type WebViewInstance = { injectJavaScript: (js: string) => void };
const Web = WebView as unknown as ComponentType<WebViewProps & { ref?: Ref<WebViewInstance> }>;

export type GameViewHandle = { send: (msg: HostMessage) => void };

/**
 * الأندرويد: اللعبة ملف HTML محلي (asset) يشتغل داخل WebView بدون نت.
 * الملف ينسخ لذاكرة الجهاز أول مرة وبعدها ينفتح منها مباشرة.
 * ممنوع أي تنقل لموقع خارجي أو فتح نوافذ.
 */
export function GameView({ asset, onMessage, ref }: { asset: number; onMessage: (m: GameMessage) => void; ref?: Ref<GameViewHandle> }) {
  const webRef = useRef<WebViewInstance>(null);
  const [uri, setUri] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    const a = Asset.fromModule(asset);
    a.downloadAsync()
      .then(() => alive && setUri(a.localUri ?? a.uri))
      .catch(() => alive && setUri(a.uri));
    return () => {
      alive = false;
    };
  }, [asset]);

  useImperativeHandle(ref, () => ({
    send: (msg) => webRef.current?.injectJavaScript(`window.__spirReceive&&window.__spirReceive(${JSON.stringify(msg)});true;`),
  }));

  if (!uri) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#62C6FF' }}>
        <ActivityIndicator size="large" color="#FFFFFF" />
      </View>
    );
  }
  return (
    <Web
      ref={webRef}
      source={{ uri }}
      originWhitelist={['file://*', 'about:*', 'data:*']}
      // بس ملفات الجهاز المحلية (اللعبة نفسها) — أي رابط http ممنوع
      onShouldStartLoadWithRequest={(r: { url: string }) => r.url.startsWith('file://') || r.url.startsWith('about:') || r.url.startsWith('data:')}
      onMessage={(e: WebViewMessageEvent) => {
        const m = parseGameMessage(e.nativeEvent.data);
        if (m) onMessage(m);
      }}
      javaScriptEnabled
      domStorageEnabled={false}
      allowFileAccess
      allowFileAccessFromFileURLs={false}
      allowUniversalAccessFromFileURLs={false}
      setSupportMultipleWindows={false}
      javaScriptCanOpenWindowsAutomatically={false}
      mediaPlaybackRequiresUserAction={false}
      scrollEnabled={false}
      bounces={false}
      overScrollMode="never"
      showsVerticalScrollIndicator={false}
      showsHorizontalScrollIndicator={false}
      textZoom={100}
      androidLayerType="hardware"
      style={{ flex: 1, backgroundColor: '#62C6FF' }}
    />
  );
}
