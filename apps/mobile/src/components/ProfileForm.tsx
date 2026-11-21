import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { AVATARS } from '../lib/progressCore';
import { fonts, space, themed, useColors } from '../theme';
import { Avatar } from './Avatar';
import { Button, Card, Input, Text } from './ui';

/** نموذج ملف لاعب: الاسم، العمر (5–50)، والصورة الرمزية */
export function ProfileForm({ initial, submitLabel, onSubmit, onCancel }: { initial?: { name: string; age: number; avatar: number }; submitLabel: string; onSubmit: (p: { name: string; age: number; avatar: number }) => void; onCancel?: () => void }) {
  const s = useStyles();
  const c = useColors();
  const [name, setName] = useState(initial?.name ?? '');
  const [age, setAge] = useState(initial?.age ?? 8);
  const [avatar, setAvatar] = useState(initial?.avatar ?? 0);
  const step = (d: number) => setAge((a) => Math.max(5, Math.min(50, a + d)));
  return (
    <Card style={{ gap: space.md }}>
      <Input label="الاسم" value={name} onChangeText={setName} placeholder="مثلاً: زينب" maxLength={20} />
      <View style={{ gap: space.xs }}>
        <Text style={s.label}>العمر</Text>
        <View style={s.ageRow}>
          <Pressable onPress={() => step(1)} style={s.stepBtn} accessibilityRole="button" accessibilityLabel="زيد العمر">
            <Ionicons name="add" size={22} color={c.onCta} />
          </Pressable>
          <Text style={s.age}>{`${age} سنة`}</Text>
          <Pressable onPress={() => step(-1)} style={s.stepBtn} accessibilityRole="button" accessibilityLabel="نقّص العمر">
            <Ionicons name="remove" size={22} color={c.onCta} />
          </Pressable>
        </View>
        <Text style={s.hint}>نطلّع الألعاب اللي تناسب هذا العمر</Text>
      </View>
      <View style={{ gap: space.xs }}>
        <Text style={s.label}>الصورة</Text>
        <View style={s.avatars}>
          {AVATARS.map((a, i) => (
            <Pressable key={a.icon} onPress={() => setAvatar(i)} style={[s.avatarWrap, i === avatar && s.avatarOn]} accessibilityRole="radio" accessibilityState={{ selected: i === avatar }} accessibilityLabel={`صورة ${i + 1}`}>
              <Avatar index={i} size={44} />
            </Pressable>
          ))}
        </View>
      </View>
      <Button title={submitLabel} icon="checkmark" disabled={!name.trim()} onPress={() => onSubmit({ name, age, avatar })} />
      {onCancel ? <Button title="إلغاء" variant="ghost" onPress={onCancel} /> : null}
    </Card>
  );
}

const useStyles = themed((c) => ({
  label: { fontFamily: fonts.semibold, fontSize: 14, color: c.text },
  hint: { fontFamily: fonts.regular, fontSize: 12, color: c.muted },
  ageRow: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  stepBtn: { width: 44, height: 44, borderRadius: 10, backgroundColor: c.cta, alignItems: 'center', justifyContent: 'center', boxShadow: `0 3px 0 ${c.primaryDark}` },
  age: { flex: 1, textAlign: 'center', fontFamily: fonts.display, fontSize: 26, lineHeight: 38, color: c.primary },
  avatars: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  avatarWrap: { padding: 3, borderRadius: 30, borderWidth: 3, borderColor: 'transparent' },
  avatarOn: { borderColor: c.cta },
}));
