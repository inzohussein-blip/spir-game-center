/** صور «تجنّب الوحوش» (تنرسم بـ games/_godot/make-art.mts) */
import * as A from '../../packages/spir-art/index.ts';

const items: Record<string, { svg: string; w: number; h: number }> = {
  spir: A.catFace('orange', 'open', 'smile'),
  spir_happy: A.catFace('orange', 'happy', 'open'),
  spir_scared: A.catFace('orange', 'scared', 'o'),
  fish: A.fish(48),
  heart: A.heart(40, true),
  heart_off: A.heart(40, false),
  bg: A.sky(A.THEMES[0], 480, 720),
};
for (const t of [1, 3, 5, 7, 9]) items[`mob${t}`] = A.creature(t, 96);
export default items;
