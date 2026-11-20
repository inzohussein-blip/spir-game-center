import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { StyleProp, ViewStyle } from 'react-native';
import { View } from 'react-native';
import type { Game } from '../lib/games';
import { fonts, themed } from '../theme';
import { Halftone, Text } from './ui';

/**
 * غلاف اللعبة: لون اللعبة + نقاط القمصان + أيقونة بيضاء، وشارة العمر الصفراء بظل كحلي.
 * `size` يتحكم بحجم الأيقونة؛ الغلاف ياخذ أبعاده من `style`.
 */
export function GameArt({ game, size = 52, showAge = true, rows = 8, style }: { game: Game; size?: number; showAge?: boolean; rows?: number; style?: StyleProp<ViewStyle> }) {
  const s = useStyles();
  return (
    <View style={[s.art, { backgroundColor: game.color }, style]}>
      <Halftone rows={rows} cols={16} color="rgba(255,255,255,0.18)" style={{ top: 6, left: 6 }} />
      <MaterialCommunityIcons name={game.icon} size={size} color="#FFFFFF" />
      {showAge ? (
        <View style={s.age}>
          <Text style={s.ageText}>{`+${game.minAge}`}</Text>
        </View>
      ) : null}
    </View>
  );
}

const useStyles = themed((c) => ({
  art: { alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  age: { position: 'absolute', top: 8, start: 8, backgroundColor: c.cta, borderRadius: 6, paddingHorizontal: 7, paddingVertical: 1, boxShadow: `0 2px 0 ${c.primaryDark}` },
  ageText: { fontFamily: fonts.bold, fontSize: 11, lineHeight: 16, color: c.onCta },
}));
