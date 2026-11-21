import { ScrollView, View } from 'react-native';
import { GameCard } from '../components/GameCard';
import { Text } from '../components/ui';
import { visibleGames } from '../lib/games';
import { useProgress } from '../lib/progress';
import { fonts, space, themed } from '../theme';

/** «صالة الكلاسيكيات»: الألعاب الأبسط (غير ألعاب العالم الرئيسية) */
export default function Classics() {
  const s = useStyles();
  const { profile } = useProgress();
  const games = visibleGames(profile).filter((g) => !g.featured);
  const rows: (typeof games)[] = [];
  for (let i = 0; i < games.length; i += 2) rows.push(games.slice(i, i + 2));
  return (
    <ScrollView style={s.root} contentContainerStyle={s.body}>
      <Text style={s.intro}>{`${games.length} ألعاب كلاسيكية سريعة — تنفع للجولات القصيرة ويّا العائلة.`}</Text>
      {rows.map((row) => (
        <View key={row.map((g) => g.id).join()} style={s.row}>
          {row.map((g) => (
            <GameCard key={g.id} game={g} />
          ))}
          {row.length === 1 ? <View style={{ flex: 1 }} /> : null}
        </View>
      ))}
    </ScrollView>
  );
}

const useStyles = themed((c) => ({
  root: { flex: 1, backgroundColor: c.bg },
  body: { padding: space.lg, gap: space.md, paddingBottom: space.xxl },
  intro: { fontFamily: fonts.semibold, fontSize: 14, lineHeight: 22, color: c.muted },
  row: { flexDirection: 'row', gap: space.md },
}));
