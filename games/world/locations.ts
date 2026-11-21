/** أماكن «عالم سبير» بالترتيب من تحت لفوق، وكم نجمة يحتاج كل مكان حتى ينفتح */
export type Location = { id: string; title: string; sub: string; need: number };

export const LOCATIONS: Location[] = [
  { id: 'house', title: 'بيت سبير', sub: 'زيّن البيت', need: 0 },
  { id: 'drop-cat', title: 'حديقة البزازين', sub: 'نزّل البزون', need: 0 },
  { id: 'trap-cat', title: 'مرج الشجيرات', sub: 'حاصر البزون', need: 0 },
  { id: 'merge', title: 'مختبر السبيرات', sub: 'دمج المخلوقات', need: 6 },
  { id: 'blocks', title: 'مصنع الحلوى', sub: 'بلوكات الحلوى', need: 12 },
  { id: 'connect4', title: 'ساحة التحدي', sub: 'أربعة بخط', need: 20 },
  { id: 'classics', title: 'صالة الكلاسيكيات', sub: 'ألعاب أكثر', need: 0 },
];

export type WorldState = {
  name: string;
  coins: number;
  /** مجموع النجوم بكل الألعاب */
  stars: number;
  /** نجوم كل لعبة */
  games: Record<string, number>;
  /** آخر مكان (حتى سبير يوگف عنده) */
  last?: string;
  /** مكان تحدّي اليوم (عليه شارة) */
  daily?: string | null;
};

export const unlocked = (loc: Location, s: WorldState) => s.stars >= loc.need;
