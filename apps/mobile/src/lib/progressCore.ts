/**
 * تقدّم اللاعب (منطق صافي بدون تخزين — حتى ينفحص بالاختبارات).
 * ينحفظ محلياً على الجهاز بـ progress.tsx. الملفات المتعددة للعائلة تجي بالمرحلة 2.
 */
export type Level = 'easy' | 'medium' | 'hard';
export const LEVELS: Level[] = ['easy', 'medium', 'hard'];
export const LEVEL_LABEL: Record<Level, string> = { easy: 'سهل', medium: 'متوسط', hard: 'صعب' };

export type GameProgress = {
  /** المرحلة الجاية المفتوحة لكل صعوبة */
  next: Record<Level, number>;
  /** أحسن نجوم لكل مرحلة: المفتاح "easy:3" */
  stars: Record<string, number>;
  plays: number;
  wins: number;
  lastPlayed: number;
  lastLevel: Level;
};

export type Store = {
  v: 1;
  coins: number;
  /** كل العملات اللي انربحت (للمستوى) */
  xp: number;
  sound: boolean;
  /** أيام اللعب (YYYY-MM-DD) — لوسام الأيام المتتالية */
  days: string[];
  games: Record<string, GameProgress>;
};

export const emptyStore = (): Store => ({ v: 1, coins: 0, xp: 0, sound: true, days: [], games: {} });

export const emptyGame = (): GameProgress => ({ next: { easy: 1, medium: 1, hard: 1 }, stars: {}, plays: 0, wins: 0, lastPlayed: 0, lastLevel: 'easy' });

export const gameOf = (s: Store, id: string): GameProgress => s.games[id] ?? emptyGame();

/** يتأكد إن البيانات المحفوظة سليمة (نسخة قديمة أو تالفة → نبدي من جديد) */
export function parseStore(raw: string | null): Store {
  if (!raw) return emptyStore();
  try {
    const s = JSON.parse(raw) as Partial<Store>;
    if (s.v !== 1 || typeof s.coins !== 'number' || typeof s.games !== 'object' || !s.games) return emptyStore();
    return { ...emptyStore(), ...s, days: Array.isArray(s.days) ? s.days : [] } as Store;
  } catch {
    return emptyStore();
  }
}

export const dayKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export type Result = {
  gameId: string;
  level: Level;
  stage: number;
  won: boolean;
  stars: number;
  /** عدد مراحل كل صعوبة (1 أو أقل = بلا نهاية) */
  stageCount: number;
  now: Date;
};

export type Outcome = { store: Store; coins: number; newBest: boolean; firstWin: boolean };

export function applyResult(store: Store, r: Result): Outcome {
  const prev = gameOf(store, r.gameId);
  const key = `${r.level}:${r.stage}`;
  const oldStars = prev.stars[key] ?? 0;
  const stars = Math.max(0, Math.min(3, Math.round(r.stars)));
  const newBest = r.won && stars > oldStars && oldStars > 0;
  const coins = r.won ? 5 + stars * 5 : 1;
  const capped = r.stageCount > 1 ? Math.min(r.stage + 1, r.stageCount) : r.stage + 1;
  const game: GameProgress = {
    ...prev,
    next: { ...prev.next, [r.level]: r.won ? Math.max(prev.next[r.level], capped) : prev.next[r.level] },
    stars: r.won ? { ...prev.stars, [key]: Math.max(oldStars, stars) } : prev.stars,
    plays: prev.plays + 1,
    wins: prev.wins + (r.won ? 1 : 0),
    lastPlayed: r.now.getTime(),
    lastLevel: r.level,
  };
  const today = dayKey(r.now);
  const days = store.days.includes(today) ? store.days : [...store.days, today].slice(-30);
  const totalWinsBefore = Object.values(store.games).reduce((a, g) => a + g.wins, 0);
  return {
    store: { ...store, coins: store.coins + coins, xp: store.xp + coins, days, games: { ...store.games, [r.gameId]: game } },
    coins,
    newBest,
    firstWin: r.won && totalWinsBefore === 0,
  };
}

export const totalStars = (g: GameProgress) => Object.values(g.stars).reduce((a, b) => a + b, 0);

/** عدد المراحل المخلّصة بصعوبة معيّنة */
export const doneStages = (g: GameProgress, level: Level) => Object.keys(g.stars).filter((k) => k.startsWith(`${level}:`)).length;

/** المستوى من الخبرة: كل 100 عملة مستوى */
export const levelOf = (xp: number) => ({ level: Math.floor(xp / 100) + 1, progress: (xp % 100) / 100 });

/** أطول سلسلة أيام متتالية تنتهي بآخر يوم لعب */
export function streak(days: string[]): number {
  if (days.length === 0) return 0;
  const sorted = [...new Set(days)].sort();
  let best = 1;
  let run = 1;
  for (let i = 1; i < sorted.length; i++) {
    const diff = (Date.parse(sorted[i]) - Date.parse(sorted[i - 1])) / 86_400_000;
    run = diff === 1 ? run + 1 : 1;
    best = Math.max(best, run);
  }
  return best;
}

export const BADGES = [
  { id: 'first-win', title: 'أول فوز', icon: 'checkmark' },
  { id: 'streak-7', title: '7 أيام ورا بعض', icon: 'flame' },
  { id: 'stars-50', title: '50 نجمة', icon: 'star' },
  { id: 'cat-trapper', title: 'صياد البزازين', icon: 'paw' },
  { id: 'cat-herder', title: 'راعي البزازين', icon: 'heart' },
  { id: 'explorer', title: 'جرّب 4 ألعاب', icon: 'compass' },
] as const;
export type BadgeId = (typeof BADGES)[number]['id'];

export function badges(s: Store): Record<BadgeId, boolean> {
  const games = Object.values(s.games);
  const stars = games.reduce((a, g) => a + totalStars(g), 0);
  return {
    'first-win': games.some((g) => g.wins > 0),
    'streak-7': streak(s.days) >= 7,
    'stars-50': stars >= 50,
    'cat-trapper': (s.games['trap-cat']?.wins ?? 0) >= 10,
    'cat-herder': Object.keys(s.games['drop-cat']?.stars ?? {}).length >= 20,
    explorer: games.filter((g) => g.plays > 0).length >= 4,
  };
}
