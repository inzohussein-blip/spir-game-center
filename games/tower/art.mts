/** صور «برج سبير» (تنرسم بـ games/_godot/make-art.mts) */
import * as A from '../../packages/spir-art/index.ts';
import { INK, svg } from '../../packages/spir-art/style.ts';

const inner = (a: { svg: string }) => a.svg.replace(/^<svg[^>]*>/, '').replace(/<\/svg>$/, '');

/** الأرضية اللي ينبني عليها البرج: 7 بلاطات عشب */
const base = (() => {
  const t = A.groundTile(48, true);
  const tiles = Array.from({ length: 7 }, (_, i) => `<g transform="translate(${i * 48} 0)">${inner(t)}</g>`).join('');
  return { w: 336, h: 48, svg: svg(336, 48, tiles) };
})();

/** خطّاف الرافعة */
const hook = {
  w: 48,
  h: 44,
  svg: svg(48, 44, `<rect x="8" y="2" width="32" height="14" rx="6" fill="#FFC93C" stroke="${INK}" stroke-width="4"/><path d="M24 16 V30 Q24 40 14 38" stroke="${INK}" stroke-width="6" fill="none" stroke-linecap="round"/>`),
};

export default {
  bg: A.sky(A.THEMES[0], 480, 720),
  cloud: A.cloud(1),
  base,
  hook,
  crate: A.crate(64),
  wood2: A.woodBlock(2, false, 64),
  wood3: A.woodBlock(3, false, 64),
  cat_orange: A.catFace('orange', 'closed', 'smile'),
  cat_pink: A.catFace('pink', 'closed', 'smile'),
  cat_gray: A.catFace('gray', 'closed', 'smile'),
  cat_scared: A.catFace('orange', 'scared', 'o'),
  heart: A.heart(40, true),
  heart_off: A.heart(40, false),
  star: A.starIcon(48),
};
