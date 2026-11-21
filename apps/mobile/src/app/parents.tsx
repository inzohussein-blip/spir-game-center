import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, ScrollView, Switch, View } from 'react-native';
import { Avatar } from '../components/Avatar';
import { useToast } from '../components/feedback';
import { ProfileForm } from '../components/ProfileForm';
import { Button, Card, Chip, Text } from '../components/ui';
import { GAMES } from '../lib/games';
import { useProgress } from '../lib/progress';
import { checkPin, emptyStore, playedToday, type Profile } from '../lib/progressCore';
import { fonts, space, themed, useColors } from '../theme';

const LIMITS = [0, 15, 30, 45, 60, 90];

/** لوحة أرقام الرمز (4 أرقام) */
function PinPad({ title, hint, onDone }: { title: string; hint?: string; onDone: (pin: string) => boolean }) {
  const s = useStyles();
  const c = useColors();
  const [pin, setPin] = useState('');
  const [bad, setBad] = useState(false);
  const press = (d: string) => {
    const next = (pin + d).slice(0, 4);
    setBad(false);
    setPin(next);
    if (next.length === 4) {
      const ok = onDone(next);
      if (!ok) setBad(true);
      setPin('');
    }
  };
  return (
    <View style={s.pinBox}>
      <Ionicons name="lock-closed" size={34} color={c.primary} />
      <Text style={s.pinTitle}>{title}</Text>
      {hint ? <Text style={s.pinHint}>{hint}</Text> : null}
      <View style={s.dots}>
        {[0, 1, 2, 3].map((i) => (
          <View key={i} style={[s.dot, i < pin.length && s.dotOn, bad && { borderColor: c.danger }]} />
        ))}
      </View>
      {bad ? <Text style={{ color: c.danger, fontFamily: fonts.semibold }}>الرمز غلط، جرّب مرة ثانية</Text> : null}
      <View style={s.keys}>
        {['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '⌫'].map((k) => (
          <Pressable
            key={k || 'blank'}
            disabled={!k}
            onPress={() => (k === '⌫' ? setPin((p) => p.slice(0, -1)) : press(k))}
            style={({ pressed }) => [s.key, !k && { opacity: 0 }, pressed && { backgroundColor: c.cardAlt }]}
            accessibilityRole="button"
            accessibilityLabel={k === '⌫' ? 'امسح' : k}
          >
            <Text style={s.keyText}>{k}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

function ProfileCard({ p }: { p: Profile }) {
  const s = useStyles();
  const c = useColors();
  const toast = useToast();
  const { family, editProfile, deleteProfile } = useProgress();
  const [editing, setEditing] = useState(false);
  const [showGames, setShowGames] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const store = family.data[p.id] ?? emptyStore();
  const [now] = useState(() => new Date());
  const today = Math.round(playedToday(store, now));
  const pct = p.limitMin ? Math.min(1, today / p.limitMin) : 0;

  if (editing) {
    return (
      <ProfileForm
        initial={p}
        submitLabel="احفظ"
        onSubmit={(v) => {
          editProfile(p.id, v);
          setEditing(false);
          toast('انحفظ');
        }}
        onCancel={() => setEditing(false)}
      />
    );
  }
  return (
    <Card style={{ gap: space.md }}>
      <View style={s.row}>
        <Avatar index={p.avatar} size={48} />
        <View style={{ flex: 1 }}>
          <Text style={s.name}>{p.name}</Text>
          <Text style={s.sub}>{`${p.age} سنة · ${store.coins} عملة`}</Text>
        </View>
        <Pressable onPress={() => setEditing(true)} style={s.iconBtn} accessibilityRole="button" accessibilityLabel={`عدّل ${p.name}`}>
          <Ionicons name="create-outline" size={20} color={c.primary} />
        </Pressable>
      </View>
      <View style={{ gap: 6 }}>
        <View style={s.row}>
          <Text style={[s.label, { flex: 1 }]}>لعب اليوم</Text>
          <Text style={s.label}>{p.limitMin ? `${today} / ${p.limitMin} دقيقة` : `${today} دقيقة`}</Text>
        </View>
        {p.limitMin ? (
          <View style={s.track}>
            <View style={[s.fill, { width: `${Math.max(3, pct * 100)}%`, backgroundColor: pct >= 1 ? c.danger : c.cta }]} />
          </View>
        ) : null}
      </View>
      <Text style={s.label}>الحد اليومي</Text>
      <View style={s.chips}>
        {LIMITS.map((m) => (
          <Chip key={m} label={m ? `${m} د` : 'بلا حد'} active={p.limitMin === m} onPress={() => editProfile(p.id, { limitMin: m })} />
        ))}
      </View>
      <Pressable onPress={() => setShowGames((v) => !v)} style={s.row} accessibilityRole="button">
        <Text style={[s.label, { flex: 1 }]}>{`الألعاب المخفية (${p.hidden.length})`}</Text>
        <Ionicons name={showGames ? 'chevron-up' : 'chevron-down'} size={18} color={c.muted} />
      </Pressable>
      {showGames
        ? GAMES.map((g) => (
            <View key={g.id} style={s.row}>
              <Text style={{ flex: 1 }}>{g.title}</Text>
              <Text style={s.sub}>{`+${g.minAge}`}</Text>
              <Switch
                value={!p.hidden.includes(g.id)}
                onValueChange={(on) => editProfile(p.id, { hidden: on ? p.hidden.filter((h) => h !== g.id) : [...p.hidden, g.id] })}
                trackColor={{ true: c.cta, false: c.border }}
                thumbColor="#FFFFFF"
                accessibilityLabel={`إظهار ${g.title}`}
              />
            </View>
          ))
        : null}
      {confirmDelete ? (
        <View style={{ gap: space.sm }}>
          <Text style={{ color: c.danger, fontFamily: fonts.semibold }}>{`تمسح ملف ${p.name} وكل نجومه؟ ما يرجع.`}</Text>
          <View style={s.row}>
            <Button title="امسح" variant="danger" onPress={() => deleteProfile(p.id)} style={{ flex: 1 }} />
            <Button title="لا" variant="outline" onPress={() => setConfirmDelete(false)} style={{ flex: 1 }} />
          </View>
        </View>
      ) : (
        <Button title="امسح الملف" icon="trash-outline" variant="ghost" onPress={() => setConfirmDelete(true)} />
      )}
    </Card>
  );
}

/** وضع الأهل: محمي برمز، ومنه يتحكمون بوقت اللعب والأعمار والألعاب والملفات */
export default function Parents() {
  const s = useStyles();
  const toast = useToast();
  const { family, setPin } = useProgress();
  const [open, setOpen] = useState(false);
  const [firstPin, setFirstPin] = useState<string | null>(null);
  const [changing, setChanging] = useState(false);

  if (!family.pinHash || changing) {
    return (
      <ScrollView contentContainerStyle={s.body}>
        <PinPad
          key={firstPin ? 'confirm' : 'new'}
          title={firstPin ? 'أعد الرمز للتأكيد' : 'حط رمز للأهل'}
          hint="4 أرقام — حتى الأطفال ما يغيرون الإعدادات"
          onDone={(pin) => {
            if (!firstPin) {
              setFirstPin(pin);
              return true;
            }
            if (pin !== firstPin) {
              setFirstPin(null);
              return false;
            }
            setPin(pin);
            setFirstPin(null);
            setChanging(false);
            setOpen(true);
            toast('انحفظ الرمز');
            return true;
          }}
        />
      </ScrollView>
    );
  }
  if (!open) {
    return (
      <ScrollView contentContainerStyle={s.body}>
        <PinPad title="رمز الأهل" onDone={(pin) => {
          const ok = checkPin(family, pin);
          if (ok) setOpen(true);
          return ok;
        }} />
      </ScrollView>
    );
  }
  return (
    <ScrollView contentContainerStyle={s.body}>
      <Text style={s.intro}>لما يخلص الحد اليومي تطلع رسالة «كافي لليوم» وما تنفتح الألعاب لحد باچر. الألعاب تطلع حسب العمر، وتگدر تخفي أي لعبة.</Text>
      {family.profiles.map((p) => (
        <ProfileCard key={p.id} p={p} />
      ))}
      <Button title="غيّر الرمز" icon="key-outline" variant="outline" onPress={() => setChanging(true)} />
    </ScrollView>
  );
}

const useStyles = themed((c) => ({
  body: { padding: space.lg, gap: space.lg, paddingBottom: space.xxl },
  intro: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 22, color: c.muted },
  pinBox: { alignItems: 'center', gap: space.md, paddingTop: space.xl },
  pinTitle: { fontFamily: fonts.display, fontSize: 24, lineHeight: 36, color: c.text },
  pinHint: { fontFamily: fonts.regular, fontSize: 13, color: c.muted, textAlign: 'center' },
  dots: { flexDirection: 'row', gap: space.md, marginVertical: space.sm },
  dot: { width: 18, height: 18, borderRadius: 9, borderWidth: 2, borderColor: c.primary },
  dotOn: { backgroundColor: c.primary },
  keys: { flexDirection: 'row', flexWrap: 'wrap', width: 264, gap: 12, justifyContent: 'center' },
  key: { width: 80, height: 64, borderRadius: 14, backgroundColor: c.card, borderWidth: 2, borderColor: c.border, alignItems: 'center', justifyContent: 'center' },
  keyText: { fontFamily: fonts.bold, fontSize: 24, color: c.text },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  name: { fontFamily: fonts.bold, fontSize: 17, color: c.text },
  sub: { fontFamily: fonts.regular, fontSize: 12, color: c.muted },
  label: { fontFamily: fonts.semibold, fontSize: 14, color: c.text },
  iconBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: c.primarySoft, alignItems: 'center', justifyContent: 'center' },
  track: { height: 8, borderRadius: 6, backgroundColor: c.cardAlt, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 6 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
}));
