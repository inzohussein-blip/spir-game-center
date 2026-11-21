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
  favorites: string[];
  /** وقت اللعب بالدقائق لكل يوم (آخر 14 يوم) */
  playMin: Record<string, number>;
  /** آخر يوم انربحت بيه مكافأة تحدّي اليوم */
  dailyDone: string;
};

export const emptyStore = (): Store => ({ v: 1, coins: 0, xp: 0, sound: true, days: [], games: {}, favorites: [], playMin: {}, dailyDone: '' });

export const emptyGame = (): GameProgress => ({ next: { easy: 1, medium: 1, hard: 1 }, stars: {}, plays: 0, wins: 0, lastPlayed: 0, lastLevel: 'easy' });

export const gameOf = (s: Store, id: string): GameProgress => s.games[id] ?? emptyGame();

/** يتأكد إن البيانات المحفوظة سليمة (نسخة قديمة أو تالفة → نبدي من جديد) */
export function parseStore(raw: string | null): Store {
  if (!raw) return emptyStore();
  try {
    const s = JSON.parse(raw) as Partial<Store>;
    if (s.v !== 1 || typeof s.coins !== 'number' || typeof s.games !== 'object' || !s.games) return emptyStore();
    return normalizeStore(s);
  } catch {
    return emptyStore();
  }
}

export function normalizeStore(s: Partial<Store>): Store {
  const base = emptyStore();
  return {
    ...base,
    ...s,
    v: 1,
    days: Array.isArray(s.days) ? s.days : [],
    games: s.games && typeof s.games === 'object' ? s.games : {},
    favorites: Array.isArray(s.favorites) ? s.favorites : [],
    playMin: s.playMin && typeof s.playMin === 'object' ? s.playMin : {},
    dailyDone: typeof s.dailyDone === 'string' ? s.dailyDone : '',
  };
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
  /** إذا هاي لعبة تحدّي اليوم */
  daily?: boolean;
};

export const DAILY_BONUS = 50;

export type Outcome = { store: Store; coins: number; newBest: boolean; firstWin: boolean; dailyBonus: boolean };

export function applyResult(store: Store, r: Result): Outcome {
  const prev = gameOf(store, r.gameId);
  const key = `${r.level}:${r.stage}`;
  const oldStars = prev.stars[key] ?? 0;
  const stars = Math.max(0, Math.min(3, Math.round(r.stars)));
  const newBest = r.won && stars > oldStars && oldStars > 0;
  const today0 = dayKey(r.now);
  const dailyBonus = !!r.daily && r.won && store.dailyDone !== today0;
  const coins = (r.won ? 5 + stars * 5 : 1) + (dailyBonus ? DAILY_BONUS : 0);
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
    store: { ...store, coins: store.coins + coins, xp: store.xp + coins, days, games: { ...store.games, [r.gameId]: game }, dailyDone: dailyBonus ? today : store.dailyDone },
    coins,
    newBest,
    firstWin: r.won && totalWinsBefore === 0,
    dailyBonus,
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

// ---------- وقت اللعب والمفضلة ----------

/** يضيف دقائق لعب لليوم، ويحتفظ بآخر 14 يوم بس */
export function addPlayTime(s: Store, minutes: number, now: Date): Store {
  const k = dayKey(now);
  const playMin = { ...s.playMin, [k]: (s.playMin[k] ?? 0) + Math.max(0, minutes) };
  const keep = Object.keys(playMin).sort().slice(-14);
  return { ...s, playMin: Object.fromEntries(keep.map((d) => [d, playMin[d]])) };
}

export const playedToday = (s: Store, now: Date) => s.playMin[dayKey(now)] ?? 0;

export const toggleFavorite = (s: Store, id: string): Store => ({ ...s, favorites: s.favorites.includes(id) ? s.favorites.filter((f) => f !== id) : [...s.favorites, id] });

// ---------- العائلة: ملفات متعددة ووضع الأهل ----------

export const AVATARS = [
  { icon: 'cat', color: '#E0398B' },
  { icon: 'dog', color: '#E8590C' },
  { icon: 'rabbit', color: '#0F9B8E' },
  { icon: 'owl', color: '#6B3FD6' },
  { icon: 'penguin', color: '#1A23C9' },
  { icon: 'panda', color: '#0B1033' },
  { icon: 'duck', color: '#1C8B4A' },
  { icon: 'elephant', color: '#D92D20' },
] as const;

export type Profile = {
  id: string;
  name: string;
  age: number;
  avatar: number;
  /** حد اللعب اليومي بالدقائق (0 = بلا حد) */
  limitMin: number;
  /** ألعاب مخفية عن هذا الملف */
  hidden: string[];
};

export type Family = {
  v: 2;
  profiles: Profile[];
  activeId: string | null;
  /** رمز وضع الأهل (مخزّن كـ hash) — فارغ = بعده ما انحط */
  pinHash: string;
  data: Record<string, Store>;
};

export const emptyFamily = (): Family => ({ v: 2, profiles: [], activeId: null, pinHash: '', data: {} });

export const clampAge = (n: number) => Math.max(5, Math.min(50, Math.round(n) || 5));

/** hash بسيط للرمز — حماية من الفضول مو تشفير */
export function hashPin(pin: string): string {
  let h = 5381;
  for (const ch of `spir:${pin}`) h = ((h << 5) + h + ch.charCodeAt(0)) >>> 0;
  return h.toString(36);
}
export const checkPin = (f: Family, pin: string) => f.pinHash !== '' && f.pinHash === hashPin(pin);

export function addProfile(f: Family, p: Omit<Profile, 'id' | 'limitMin' | 'hidden'> & Partial<Profile>, id: string): Family {
  const profile: Profile = { limitMin: 0, hidden: [], ...p, id, name: p.name.trim().slice(0, 20) || 'لاعب', age: clampAge(p.age) };
  return { ...f, profiles: [...f.profiles, profile], activeId: f.activeId ?? id, data: { ...f.data, [id]: emptyStore() } };
}

export const updateProfile = (f: Family, id: string, patch: Partial<Omit<Profile, 'id'>>): Family => ({
  ...f,
  profiles: f.profiles.map((p) => (p.id === id ? { ...p, ...patch, age: patch.age === undefined ? p.age : clampAge(patch.age) } : p)),
});

export function removeProfile(f: Family, id: string): Family {
  const profiles = f.profiles.filter((p) => p.id !== id);
  const data = { ...f.data };
  delete data[id];
  return { ...f, profiles, data, activeId: f.activeId === id ? (profiles[0]?.id ?? null) : f.activeId };
}

export const activeProfile = (f: Family) => f.profiles.find((p) => p.id === f.activeId) ?? f.profiles[0] ?? null;
export const activeStore = (f: Family) => {
  const p = activeProfile(f);
  return p ? (f.data[p.id] ?? emptyStore()) : emptyStore();
};
export const setActiveStore = (f: Family, s: Store): Family => {
  const p = activeProfile(f);
  return p ? { ...f, data: { ...f.data, [p.id]: s } } : f;
};

/** يقرا بيانات العائلة، وإذا ماكو ينقل تقدّم النسخة القديمة (لاعب واحد) لأول ملف */
export function parseFamily(raw: string | null, legacy: string | null): Family {
  if (raw) {
    try {
      const f = JSON.parse(raw) as Partial<Family>;
      if (f.v === 2 && Array.isArray(f.profiles) && f.data && typeof f.data === 'object') {
        const data: Record<string, Store> = {};
        for (const p of f.profiles) data[p.id] = normalizeStore(f.data[p.id] ?? {});
        return { v: 2, profiles: f.profiles, activeId: f.activeId ?? f.profiles[0]?.id ?? null, pinHash: typeof f.pinHash === 'string' ? f.pinHash : '', data };
      }
    } catch {
      // نكمل للنسخة القديمة
    }
  }
  if (legacy) {
    const old = parseStore(legacy);
    if (old.coins > 0 || Object.keys(old.games).length) {
      const f = addProfile(emptyFamily(), { name: 'لاعب 1', age: 10, avatar: 0 }, 'p1');
      return { ...f, data: { p1: old } };
    }
  }
  return emptyFamily();
}

/** هل خلص وقت اللعب لهذا الملف اليوم؟ */
export const limitReached = (p: Profile | null, s: Store, now: Date) => !!p && p.limitMin > 0 && playedToday(s, now) >= p.limitMin;
