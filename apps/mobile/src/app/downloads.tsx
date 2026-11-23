import { useEffect, useState } from 'react';
import { Platform, ScrollView, View } from 'react-native';
import { GameArt } from '../components/GameArt';
import { useToast } from '../components/feedback';
import { Button, Card, Empty, Text } from '../components/ui';
import { PACKS } from '../games/ready.generated';
import { gameById } from '../lib/games';
import { freeSpace, removeAllPacks, usePack } from '../lib/packs';
import { fonts, space, themed, useColors } from '../theme';

const mb = (bytes: number) => `${Math.round(bytes / 1024 / 1024)} ميغا`;

/** سطر لعبة وحدة: حالتها وحجمها، ونزّل أو امسح */
function PackRow({ id, onChange }: { id: string; onChange: () => void }) {
  const s = useStyles();
  const c = useColors();
  const p = usePack(id);
  const game = gameById(id);
  if (!game || !p.pack) return null;
  const status = { ready: 'نازلة على جهازك', none: 'مو نازلة', downloading: `جاري التنزيل… ${Math.round(p.progress * 100)}%`, error: p.error ?? 'تعذّر التنزيل' }[p.status];
  return (
    <Card style={s.row}>
      <GameArt game={game} size={56} showAge={false} />
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={s.title}>{game.title}</Text>
        <Text style={[s.sub, p.status === 'error' && { color: c.danger }]}>{`${mb(p.pack.bytes)} · ${status}`}</Text>
        {p.status === 'downloading' ? (
          <View style={s.track}>
            <View style={[s.fill, { width: `${Math.max(3, p.progress * 100)}%` }]} />
          </View>
        ) : null}
      </View>
      {p.status === 'ready' ? (
        <Button
          title="امسح"
          icon="trash-outline"
          variant="ghost"
          onPress={() => {
            void p.remove().then(onChange);
          }}
        />
      ) : p.status !== 'downloading' ? (
        <Button
          title="نزّل"
          icon="cloud-download-outline"
          onPress={() => {
            void p.download().then(onChange);
          }}
        />
      ) : null}
    </Card>
  );
}

/** الألعاب اللي تنزل عند الطلب: الحجم والحالة، مسح وحدة أو الكل */
export default function Downloads() {
  const s = useStyles();
  const toast = useToast();
  const ids = Object.keys(PACKS);
  const [gen, setGen] = useState(0); // يتغيّر بعد المسح حتى الأسطر تعيد فحص حالتها
  const [free, setFree] = useState<number | null>(null);
  useEffect(() => {
    void freeSpace().then(setFree);
  }, [gen]);
  const total = ids.reduce((a, id) => a + PACKS[id].bytes, 0);

  if (!ids.length) return <Empty title="ما أكو ألعاب تنزل عند الطلب" />;
  return (
    <ScrollView contentContainerStyle={s.body}>
      <Text style={s.lead}>
        {Platform.OS === 'web'
          ? 'بنسخة الويب هاي الألعاب تشتغل من الموقع مباشرة، والمتصفح يحتفظ بيها بعد أول مرة.'
          : `بعض الألعاب كبيرة، فتنزل مرة وحدة بس لما تريدها وبعدها تشتغل بدون نت. كلها سوا ${mb(total)}${free !== null ? ` — الفارغ بجهازك ${mb(free)}` : ''}.`}
      </Text>
      {ids.map((id) => (
        <PackRow key={`${id}-${gen}`} id={id} onChange={() => setGen((g) => g + 1)} />
      ))}
      {Platform.OS !== 'web' ? (
        <Button
          title="امسح كل الألعاب المنزّلة"
          icon="trash-outline"
          variant="ghost"
          onPress={() => {
            void removeAllPacks().then(() => {
              setGen((g) => g + 1);
              toast('انمسحت الألعاب المنزّلة');
            });
          }}
        />
      ) : null}
    </ScrollView>
  );
}

const useStyles = themed((c) => ({
  body: { padding: space.lg, gap: space.md },
  lead: { fontFamily: fonts.regular, fontSize: 14, lineHeight: 22, color: c.muted },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  title: { fontFamily: fonts.bold, fontSize: 16, color: c.text },
  sub: { fontFamily: fonts.regular, fontSize: 13, color: c.muted },
  track: { height: 8, borderRadius: 5, backgroundColor: c.cardAlt, overflow: 'hidden', marginTop: 4 },
  fill: { height: '100%', backgroundColor: c.cta },
}));
