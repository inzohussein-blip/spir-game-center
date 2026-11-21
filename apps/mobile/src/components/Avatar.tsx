import { MaterialCommunityIcons } from '@expo/vector-icons';
import { View } from 'react-native';
import { AVATARS } from '../lib/progressCore';

/** صورة رمزية للاعب: حيوان أبيض على دائرة ملوّنة (بدون كاميرا ولا صور شخصية) */
export function Avatar({ index, size = 56 }: { index: number; size?: number }) {
  const a = AVATARS[index % AVATARS.length];
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: a.color, alignItems: 'center', justifyContent: 'center' }}>
      <MaterialCommunityIcons name={a.icon} size={size * 0.56} color="#FFFFFF" />
    </View>
  );
}
