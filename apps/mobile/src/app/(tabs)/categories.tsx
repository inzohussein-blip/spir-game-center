import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ScrollView, View } from 'react-native';
import { GameTile } from '../../components/GameCard';
import { PageHeader, SectionTitle } from '../../components/ui';
import { CATEGORIES, countByCategory, filterGames, GAMES, type CategoryId } from '../../lib/games';
import { space, themed, useColors } from '../../theme';

const ICON: Record<CategoryId, 'head-lightbulb' | 'puzzle' | 'gamepad-variant' | 'account-group' | 'alphabetical-variant'> = {
  brain: 'head-lightbulb',
  puzzle: 'puzzle',
  arcade: 'gamepad-variant',
  family: 'account-group',
  words: 'alphabetical-variant',
};

/** الأقسام: كل قسم وألعابه بصف أفقي */
export default function Categories() {
  const s = useStyles();
  const c = useColors();
  const counts = countByCategory(GAMES);
  const cats = CATEGORIES.filter((x): x is { id: CategoryId; label: string } => x.id !== 'all');
  return (
    <View style={s.root}>
      <PageHeader title="الأقسام" subtitle={`${GAMES.length} لعبة بـ ${cats.length} أقسام`} />
      <ScrollView contentContainerStyle={s.body}>
        {cats.map((cat) => (
          <View key={cat.id} style={s.block}>
            <SectionTitle
              title={cat.label}
              hint={`${counts[cat.id]} ألعاب`}
              action={<MaterialCommunityIcons name={ICON[cat.id]} size={24} color={c.primary} />}
            />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.tiles}>
              {filterGames(GAMES, cat.id).map((g) => (
                <GameTile key={g.id} game={g} />
              ))}
            </ScrollView>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const useStyles = themed((c) => ({
  root: { flex: 1, backgroundColor: c.bg },
  body: { padding: space.lg, gap: space.xl, paddingBottom: space.xxl },
  block: { gap: space.md },
  tiles: { gap: space.sm },
}));
