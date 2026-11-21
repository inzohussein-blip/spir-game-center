/**
 * منطق «البحث عن الكلمات»: كلمات عربية مخفية بالشبكة.
 * السهل: أفقي (من اليمين لليسار) وعمودي. المتوسط: ويّا المايل. الصعب: كل الاتجاهات حتى المقلوبة.
 */
import type { Level } from '../../packages/spir-kit/sdk.ts';
import { rng } from '../../packages/spir-kit/rng.ts';

export const THEMES: { title: string; words: string[] }[] = [
  { title: 'حيوانات', words: ['اسد', 'قطة', 'فيل', 'زرافة', 'حصان', 'ارنب', 'نمر', 'جمل', 'دب', 'غزال', 'ثعلب', 'بطة'] },
  { title: 'فواكه', words: ['تفاح', 'موز', 'عنب', 'رمان', 'تين', 'كرز', 'مشمش', 'خوخ', 'تمر', 'بطيخ', 'ليمون', 'برتقال'] },
  { title: 'مدن عراقية', words: ['بغداد', 'البصرة', 'الموصل', 'اربيل', 'كربلاء', 'النجف', 'الحلة', 'كركوك', 'الكوت', 'العمارة', 'دهوك', 'سامراء'] },
  { title: 'ألوان', words: ['احمر', 'اصفر', 'ازرق', 'اخضر', 'ابيض', 'اسود', 'وردي', 'بني', 'رمادي', 'بنفسجي', 'ذهبي', 'فضي'] },
  { title: 'المدرسة', words: ['قلم', 'كتاب', 'دفتر', 'ممحاة', 'مسطرة', 'حقيبة', 'سبورة', 'معلم', 'صف', 'درس', 'ورقة', 'الوان'] },
  { title: 'رياضة', words: ['كرة', 'ملعب', 'هدف', 'حكم', 'سباحة', 'جري', 'تنس', 'لاعب', 'فريق', 'كأس', 'مباراة', 'شوط'] },
  { title: 'خضروات', words: ['طماطة', 'خيار', 'بصل', 'جزر', 'بطاطا', 'باذنجان', 'فلفل', 'خس', 'ثوم', 'شلغم', 'لهانة', 'باميا'] },
  { title: 'البيت', words: ['باب', 'شباك', 'غرفة', 'مطبخ', 'سرير', 'كرسي', 'ميز', 'ثلاجة', 'سجادة', 'مروحة', 'حديقة', 'سطح'] },
];

const LETTERS = 'ابتثجحخدذرزسشصضطظعغفقكلمنهوي';

export type Spec = { size: number; words: number; dirs: [number, number][] };
const H: [number, number][] = [[-1, 0], [0, 1]]; // من اليمين لليسار، ومن فوق لجوه
const D: [number, number][] = [[-1, 1]];
const ALL: [number, number][] = [[-1, 0], [1, 0], [0, 1], [0, -1], [-1, 1], [1, 1], [-1, -1], [1, -1]];
export const SPECS: Record<Level, Spec> = {
  easy: { size: 6, words: 4, dirs: H },
  medium: { size: 8, words: 6, dirs: [...H, ...D] },
  hard: { size: 10, words: 8, dirs: ALL },
};
export const STAGES = 16;

export type Placed = { word: string; x: number; y: number; dx: number; dy: number };
export type Puzzle = { title: string; size: number; grid: string[]; words: Placed[] };

/** تقسيم الكلمة لحروف (الكلمات ما بيها تشكيل) */
export const letters = (w: string) => [...w];

export function makePuzzle(level: Level, stage: number): Puzzle {
  const spec = SPECS[level];
  const theme = THEMES[(stage - 1) % THEMES.length];
  for (let attempt = 0; attempt < 50; attempt++) {
    const r = rng(stage * 3571 + spec.size * 131 + attempt);
    const grid = new Array<string>(spec.size * spec.size).fill('');
    const pool = r.shuffle(theme.words.filter((w) => letters(w).length <= spec.size));
    const placed: Placed[] = [];
    for (const word of pool) {
      if (placed.length >= spec.words) break;
      const chars = letters(word);
      for (let t = 0; t < 120; t++) {
        const [dx, dy] = r.pick(spec.dirs);
        const x = r.int(0, spec.size - 1);
        const y = r.int(0, spec.size - 1);
        const ex = x + dx * (chars.length - 1);
        const ey = y + dy * (chars.length - 1);
        if (ex < 0 || ey < 0 || ex >= spec.size || ey >= spec.size) continue;
        let ok = true;
        for (let k = 0; k < chars.length && ok; k++) {
          const cell = grid[(y + dy * k) * spec.size + x + dx * k];
          if (cell && cell !== chars[k]) ok = false;
        }
        if (!ok) continue;
        chars.forEach((ch, k) => (grid[(y + dy * k) * spec.size + x + dx * k] = ch));
        placed.push({ word, x, y, dx, dy });
        break;
      }
    }
    if (placed.length < spec.words) continue;
    for (let i = 0; i < grid.length; i++) if (!grid[i]) grid[i] = LETTERS[Math.floor(r.next() * LETTERS.length)];
    return { title: theme.title, size: spec.size, grid, words: placed };
  }
  throw new Error('ما گدرت أرتّب الكلمات');
}

/** الخانات بين نقطتين إذا على خط مستقيم أو مايل، وإلا null */
export function lineCells(size: number, a: number, b: number): number[] | null {
  const ax = a % size;
  const ay = Math.floor(a / size);
  const bx = b % size;
  const by = Math.floor(b / size);
  const dx = Math.sign(bx - ax);
  const dy = Math.sign(by - ay);
  const len = Math.max(Math.abs(bx - ax), Math.abs(by - ay));
  if (!(ax === bx || ay === by || Math.abs(bx - ax) === Math.abs(by - ay))) return null;
  return Array.from({ length: len + 1 }, (_, k) => (ay + dy * k) * size + ax + dx * k);
}

/** الكلمة اللي تطابق التحديد (بأي اتجاه)، أو null */
export function match(p: Puzzle, cells: number[], found: Set<string>): Placed | null {
  const text = cells.map((i) => p.grid[i]).join('');
  const rev = [...text].reverse().join('');
  for (const w of p.words) {
    if (found.has(w.word)) continue;
    if (w.word !== text && w.word !== rev) continue;
    const pos = letters(w.word).map((_, k) => (w.y + w.dy * k) * p.size + w.x + w.dx * k);
    const same = pos.length === cells.length && (pos.every((v, k) => v === cells[k]) || pos.every((v, k) => v === cells[cells.length - 1 - k]));
    if (same) return w;
  }
  return null;
}

export function starsFor(mistakes: number) {
  return mistakes <= 1 ? 3 : mistakes <= 4 ? 2 : 1;
}
