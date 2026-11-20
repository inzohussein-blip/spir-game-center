/**
 * فهرس الألعاب — نفس حقول game.json لكل لعبة (القسم 3.1 بالخطة).
 * بالمرحلة 0 الألعاب «قريباً»؛ من المرحلة 1 كل لعبة تنقرا من مجلّدها.
 */
export type CategoryId = 'brain' | 'puzzle' | 'arcade' | 'family' | 'words';

export type GameIcon =
  | 'cat'
  | 'numeric-2-box-multiple'
  | 'view-grid-plus'
  | 'snake'
  | 'pound'
  | 'circle-multiple'
  | 'cards'
  | 'wall'
  | 'airplane'
  | 'grid'
  | 'text-search'
  | 'dice-multiple'
  | 'paw';

export type Game = {
  id: string;
  title: string;
  /** سطر واحد يوصف اللعبة */
  tagline: string;
  /** شلون تلعب؟ (سطرين بالكثير) */
  howTo: string;
  category: CategoryId;
  minAge: number;
  /** لون الغلاف */
  color: string;
  icon: GameIcon;
  /** 1 = لاعب واحد، [1, 2] = يدعم لاعبين على نفس الجهاز */
  players: number[];
  levels: number;
  /** متوفرة للعب (من المرحلة 1) */
  ready: boolean;
};

export const CATEGORIES: { id: CategoryId | 'all'; label: string }[] = [
  { id: 'all', label: 'الكل' },
  { id: 'brain', label: 'ذكاء' },
  { id: 'puzzle', label: 'ألغاز' },
  { id: 'arcade', label: 'أركيد' },
  { id: 'family', label: 'عائلية' },
  { id: 'words', label: 'كلمات' },
];

export const CATEGORY_LABEL: Record<CategoryId, string> = {
  brain: 'ذكاء',
  puzzle: 'ألغاز',
  arcade: 'أركيد',
  family: 'عائلية',
  words: 'كلمات',
};

/** ألوان الأغلفة — نفس ألوان التصوّر */
const C = { royal: '#1A23C9', orange: '#E8590C', green: '#1C8B4A', pink: '#E0398B', teal: '#0F9B8E', violet: '#6B3FD6', navy: '#0B1033', red: '#D92D20' };

export const GAMES: Game[] = [
  { id: 'trap-cat', title: 'حاصر البزون', tagline: 'سدّ الطريق قبل ما يهرب', howTo: 'كل ضغطة تسدّ دائرة. البزون يتحرك خطوة بعد كل ضغطة — احصره قبل ما يوصل للحافة.', category: 'brain', minAge: 5, color: C.pink, icon: 'cat', players: [1], levels: 30, ready: false },
  { id: 'merge', title: 'دمج الأرقام', tagline: 'اجمع الأرقام المتشابهة', howTo: 'اسحب للأربع اتجاهات. الأرقام المتشابهة تندمج — حاول توصل لأكبر رقم.', category: 'puzzle', minAge: 9, color: C.orange, icon: 'numeric-2-box-multiple', players: [1], levels: 1, ready: false },
  { id: 'blocks', title: 'بلوكات الشبكة', tagline: 'رتّب القطع وامسح الصفوف', howTo: 'اسحب القطع للشبكة. كل صف أو عمود يتعبّى ينمسح ويعطيك نقاط.', category: 'puzzle', minAge: 7, color: C.violet, icon: 'view-grid-plus', players: [1], levels: 1, ready: false },
  { id: 'snake', title: 'الأفعى', tagline: 'كُل وكبر بدون ما تصطدم', howTo: 'اسحب لتغيير الاتجاه. كل أكلة تطوّل الأفعى — لا تضرب نفسك.', category: 'arcade', minAge: 7, color: C.green, icon: 'snake', players: [1], levels: 3, ready: false },
  { id: 'xo', title: 'إكس أو', tagline: 'ضد الجهاز أو ويّا صديقك', howTo: 'رتّب ثلاث علامات بخط واحد قبل خصمك. ثلاث مستويات للجهاز.', category: 'family', minAge: 5, color: C.royal, icon: 'pound', players: [1, 2], levels: 3, ready: false },
  { id: 'connect4', title: 'أربعة بخط', tagline: 'نزّل القطع ورتّب أربعة', howTo: 'نزّل قطعة بأي عمود. أول واحد يرتّب أربع قطع بخط يفوز.', category: 'family', minAge: 6, color: C.red, icon: 'circle-multiple', players: [1, 2], levels: 3, ready: false },
  { id: 'memory', title: 'ذاكرة البطاقات', tagline: 'اقلب وطابق الصور', howTo: 'اقلب بطاقتين، إذا تطابقن يبقن مفتوحات. خلّص بأقل عدد حركات.', category: 'brain', minAge: 5, color: C.orange, icon: 'cards', players: [1], levels: 12, ready: false },
  { id: 'breakout', title: 'كاسر الطوب', tagline: 'اكسر كل الطوب بالكرة', howTo: 'حرّك المضرب بإصبعك وخلي الكرة تكسر الطوب. لا تخلي الكرة توگع.', category: 'arcade', minAge: 7, color: C.teal, icon: 'wall', players: [1], levels: 20, ready: false },
  { id: 'plane', title: 'الطيارة الطايرة', tagline: 'ضغطة وحدة وطير', howTo: 'اضغط حتى تصعد الطيارة وعدّي من بين العوائق.', category: 'arcade', minAge: 6, color: C.navy, icon: 'airplane', players: [1], levels: 1, ready: false },
  { id: 'sudoku', title: 'سودوكو', tagline: '4×4 للصغار و9×9 للكبار', howTo: 'عبّي الشبكة بحيث كل رقم يطلع مرة وحدة بكل صف وعمود ومربع.', category: 'puzzle', minAge: 12, color: C.royal, icon: 'grid', players: [1], levels: 3, ready: false },
  { id: 'word-search', title: 'البحث عن الكلمات', tagline: 'لگّي الكلمات المخفية', howTo: 'اسحب على الحروف حتى تحدد الكلمة. مواضيع: حيوانات، فواكه، مدن.', category: 'words', minAge: 8, color: C.violet, icon: 'text-search', players: [1], levels: 15, ready: false },
  { id: 'dominoes', title: 'دومينو', tagline: 'اللعبة الشعبية ضد الجهاز', howTo: 'نزّل قطعة تطابق أحد الطرفين. أول واحد يخلص قطعه يفوز بالجولة.', category: 'family', minAge: 10, color: C.green, icon: 'dice-multiple', players: [1], levels: 3, ready: false },
  { id: 'drop-cat', title: 'نزّل البزون', tagline: 'كل بزون لفتحة لونه', howTo: 'اسحب القطع حتى تفتح الطريق، وكل بزون يطيح بالفتحة اللي بنفس لونه. بالصعب أكو مؤقت.', category: 'puzzle', minAge: 5, color: C.teal, icon: 'paw', players: [1], levels: 60, ready: false },
];

export const gameById = (id: string) => GAMES.find((g) => g.id === id);

/** الألعاب حسب القسم والعمر (العمر اختياري — بدونه تطلع كلها) */
export function filterGames(games: Game[], category: CategoryId | 'all', age?: number): Game[] {
  return games.filter((g) => (category === 'all' || g.category === category) && (age === undefined || g.minAge <= age));
}

/** عدد الألعاب بكل قسم */
export function countByCategory(games: Game[]): Record<CategoryId, number> {
  const out: Record<CategoryId, number> = { brain: 0, puzzle: 0, arcade: 0, family: 0, words: 0 };
  for (const g of games) out[g.category] += 1;
  return out;
}

/**
 * تحدّي اليوم: نفس اللعبة لكل الناس بنفس اليوم (يعتمد على التاريخ بس).
 * يختار من الألعاب الجاهزة إذا أكو، وإلا من الكل.
 */
export function dailyChallenge(games: Game[], date: Date): Game {
  const pool = games.some((g) => g.ready) ? games.filter((g) => g.ready) : games;
  const day = Math.floor(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86_400_000);
  return pool[day % pool.length];
}
