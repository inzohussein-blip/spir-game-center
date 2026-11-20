import { useRouter } from 'expo-router';
import { Pressable, View } from 'react-native';
import { CATEGORY_LABEL, type Game } from '../lib/games';
import { cardRadius, fonts, themed } from '../theme';
import { GameArt } from './GameArt';
import { Text } from './ui';

/** بطاقة لعبة بالشبكة: الغلاف فوق، والاسم والقسم تحت */
export function GameCard({ game }: { game: Game }) {
  const s = useStyles();
  const router = useRouter();
  const players = game.players.includes(2) ? 'لاعبين' : CATEGORY_LABEL[game.category];
  return (
    <Pressable
      onPress={() => router.push({ pathname: '/game/[id]', params: { id: game.id } })}
      style={({ pressed }) => [s.card, pressed && { transform: [{ scale: 0.97 }] }]}
      accessibilityRole="button"
      accessibilityLabel={`${game.title}، من عمر ${game.minAge}`}
    >
      <GameArt game={game} style={s.art} />
      <View style={s.meta}>
        <Text style={s.name} numberOfLines={1}>{game.title}</Text>
        <Text style={s.sub} numberOfLines={1}>{`${players} · بدون نت`}</Text>
      </View>
    </Pressable>
  );
}

/** أيقونة صغيرة مربعة (لصف «كمّل من وين وقفت» والأقسام) */
export function GameTile({ game }: { game: Game }) {
  const s = useStyles();
  const router = useRouter();
  return (
    <Pressable onPress={() => router.push({ pathname: '/game/[id]', params: { id: game.id } })} style={s.tile} accessibilityRole="button" accessibilityLabel={game.title}>
      <GameArt game={game} size={34} showAge={false} rows={5} style={s.tileArt} />
      <Text style={s.tileName} numberOfLines={1}>{game.title}</Text>
    </Pressable>
  );
}

const useStyles = themed((c) => ({
  card: { flex: 1, backgroundColor: c.card, borderRadius: cardRadius, borderWidth: 2, borderColor: c.border, overflow: 'hidden' },
  art: { aspectRatio: 4 / 3 },
  meta: { paddingHorizontal: 10, paddingTop: 7, paddingBottom: 10, gap: 1 },
  name: { fontFamily: fonts.bold, fontSize: 14, lineHeight: 22, color: c.text },
  sub: { fontFamily: fonts.regular, fontSize: 11, lineHeight: 16, color: c.muted },
  tile: { width: 78, alignItems: 'center', gap: 6 },
  tileArt: { width: 68, height: 68, borderRadius: 18 },
  tileName: { fontFamily: fonts.semibold, fontSize: 11, lineHeight: 16, color: c.text, textAlign: 'center' },
}));
