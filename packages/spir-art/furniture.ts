/** أغراض «بيت سبير»: أثاث، ألعاب، زينة، وقبعات لسبير */
import { id, INK, shade, svg, vgrad } from './style.ts';

const S = 3.5; // سمك الحد

export function room(w: number, h: number) {
  const g = id('wall');
  const f = id('floor');
  const floorY = h * 0.62;
  const stripes = Array.from({ length: Math.ceil(w / 40) }, (_, i) => `<rect x="${i * 40}" y="0" width="20" height="${floorY}" fill="#fff" opacity="0.18"/>`).join('');
  const boards = Array.from({ length: 6 }, (_, i) => `<path d="M0 ${floorY + 30 + i * ((h - floorY) / 6)} H${w}" stroke="#B9783E" stroke-width="2" opacity="0.5"/>`).join('');
  return {
    w,
    h,
    svg: svg(
      w,
      h,
      `<rect width="${w}" height="${floorY}" fill="url(#${g})"/>${stripes}
       <rect y="${floorY - 14}" width="${w}" height="16" fill="#FFF3DD" stroke="${INK}" stroke-width="3"/>
       <rect y="${floorY}" width="${w}" height="${h - floorY}" fill="url(#${f})"/>${boards}`,
      vgrad(g, '#FFD9A8', '#FFC58A') + vgrad(f, '#E8A867', '#C98245'),
    ),
  };
}

type Art = { w: number; h: number; svg: string };

const ITEMS: Record<string, () => Art> = {
  rug: () => ({ w: 200, h: 70, svg: svg(200, 70, `<ellipse cx="100" cy="38" rx="96" ry="30" fill="#7B5CFF" stroke="${INK}" stroke-width="${S}"/><ellipse cx="100" cy="38" rx="74" ry="21" fill="#9B7BFF"/><ellipse cx="100" cy="38" rx="48" ry="12" fill="#C9B8FF"/>`) }),
  plant: () => ({ w: 70, h: 110, svg: svg(70, 110, `<path d="M35 70 C10 60 8 30 22 20 C26 40 32 50 35 70 Z M35 70 C60 60 62 28 48 16 C44 40 38 50 35 70 Z M35 70 C30 40 34 14 35 6 C38 14 40 40 35 70 Z" fill="#3DD68C" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/><path d="M16 70 H54 L48 104 H22 Z" fill="#FF6B5B" stroke="${INK}" stroke-width="${S}" stroke-linejoin="round"/><rect x="12" y="66" width="46" height="10" rx="4" fill="#FF8A6B" stroke="${INK}" stroke-width="3"/>`) }),
  ball: () => ({ w: 50, h: 50, svg: svg(50, 50, `<circle cx="25" cy="25" r="21" fill="#FF6B5B" stroke="${INK}" stroke-width="${S}"/><path d="M6 20 Q25 30 44 20 M8 32 Q25 40 42 32" stroke="#FFF3DD" stroke-width="4" fill="none"/><ellipse cx="18" cy="14" rx="6" ry="3" fill="#fff" opacity="0.6"/>`) }),
  yarn: () => ({ w: 60, h: 50, svg: svg(60, 50, `<circle cx="26" cy="26" r="20" fill="#4FB8FF" stroke="${INK}" stroke-width="${S}"/><path d="M10 18 Q26 30 40 12 M8 30 Q26 40 44 24 M16 42 Q30 30 42 36" stroke="#A8DBFF" stroke-width="3" fill="none"/><path d="M44 34 Q54 40 58 48" stroke="${INK}" stroke-width="3" fill="none"/>`) }),
  lamp: () => ({ w: 70, h: 150, svg: svg(70, 150, `<path d="M18 10 H52 L62 50 H8 Z" fill="#FFC93C" stroke="${INK}" stroke-width="${S}" stroke-linejoin="round"/><rect x="32" y="50" width="6" height="86" fill="#5B4A9A" stroke="${INK}" stroke-width="2"/><ellipse cx="35" cy="140" rx="22" ry="7" fill="#5B4A9A" stroke="${INK}" stroke-width="3"/><path d="M14 46 H56" stroke="#fff" stroke-width="3" opacity="0.5"/>`) }),
  painting: () => ({ w: 110, h: 84, svg: svg(110, 84, `<rect x="4" y="4" width="102" height="76" rx="6" fill="#E39A52" stroke="${INK}" stroke-width="${S}"/><rect x="14" y="14" width="82" height="56" rx="3" fill="#9FD8FF"/><path d="M14 60 L40 36 L58 52 L72 40 L96 62 V70 H14 Z" fill="#3DD68C"/><circle cx="78" cy="26" r="7" fill="#FFD43B"/>`) }),
  window: () => ({ w: 120, h: 120, svg: svg(120, 120, `<rect x="16" y="10" width="88" height="92" rx="8" fill="#BDE6FF" stroke="${INK}" stroke-width="${S}"/><path d="M60 10 V102 M16 56 H104" stroke="${INK}" stroke-width="${S}"/><circle cx="84" cy="30" r="8" fill="#FFD43B"/><path d="M6 6 Q30 40 22 108 M114 6 Q90 40 98 108" stroke="#FF7AB6" stroke-width="12" fill="none" stroke-linecap="round"/><rect x="2" y="2" width="116" height="10" rx="5" fill="#B86A2A" stroke="${INK}" stroke-width="3"/>`) }),
  bed: () => ({ w: 140, h: 70, svg: svg(140, 70, `<ellipse cx="70" cy="44" rx="66" ry="24" fill="#FF7AB6" stroke="${INK}" stroke-width="${S}"/><ellipse cx="70" cy="40" rx="50" ry="15" fill="#FFD1E6" stroke="${INK}" stroke-width="2.5"/><path d="M26 38 Q70 20 114 38" stroke="#fff" stroke-width="3" fill="none" opacity="0.6"/>`) }),
  shelf: () => ({ w: 120, h: 130, svg: svg(120, 130, `<rect x="6" y="6" width="108" height="118" rx="6" fill="#C98245" stroke="${INK}" stroke-width="${S}"/><path d="M6 46 H114 M6 86 H114" stroke="${INK}" stroke-width="${S}"/>${[[14, '#FF6B5B'], [26, '#4FB8FF'], [38, '#FFC93C'], [52, '#3DD68C']].map(([x, c]) => `<rect x="${x}" y="16" width="10" height="28" rx="2" fill="${c}" stroke="${INK}" stroke-width="2"/>`).join('')}${[[70, '#9B7BFF'], [82, '#FF7AB6']].map(([x, c]) => `<rect x="${x}" y="56" width="10" height="28" rx="2" fill="${c}" stroke="${INK}" stroke-width="2"/>`).join('')}<circle cx="40" cy="104" r="10" fill="#FFC93C" stroke="${INK}" stroke-width="2"/><rect x="70" y="94" width="30" height="20" rx="4" fill="#3DD68C" stroke="${INK}" stroke-width="2"/>`) }),
  fishbowl: () => ({ w: 80, h: 90, svg: svg(80, 90, `<path d="M18 14 H62 Q78 40 70 68 Q60 86 40 86 Q20 86 10 68 Q2 40 18 14 Z" fill="#BDE6FF" stroke="${INK}" stroke-width="${S}" opacity="0.95"/><path d="M8 40 Q40 48 72 40 V60 Q60 84 40 84 Q20 84 8 60 Z" fill="#4FB8FF" opacity="0.6"/><path d="M34 54 q10 -10 20 0 q-10 10 -20 0 Z M54 54 l8 -6 v12 Z" fill="#FF9F43" stroke="${INK}" stroke-width="2"/><circle cx="38" cy="53" r="1.5" fill="${INK}"/><circle cx="26" cy="34" r="3" fill="#fff" opacity="0.8"/>`) }),
  cattree: () => ({ w: 110, h: 190, svg: svg(110, 190, `<rect x="44" y="40" width="16" height="140" fill="#E8C9A0" stroke="${INK}" stroke-width="3"/><path d="M44 60 h16 M44 80 h16 M44 100 h16 M44 120 h16 M44 140 h16" stroke="#C9A06A" stroke-width="2"/><rect x="10" y="30" width="70" height="18" rx="8" fill="#9B7BFF" stroke="${INK}" stroke-width="${S}"/><rect x="40" y="100" width="66" height="16" rx="7" fill="#9B7BFF" stroke="${INK}" stroke-width="${S}"/><rect x="14" y="172" width="84" height="16" rx="7" fill="#7B5CFF" stroke="${INK}" stroke-width="${S}"/><circle cx="22" cy="56" r="7" fill="#FFC93C" stroke="${INK}" stroke-width="2"/><path d="M22 48 V40" stroke="${INK}" stroke-width="2"/>`) }),
  sofa: () => ({ w: 200, h: 110, svg: svg(200, 110, `<rect x="20" y="10" width="160" height="60" rx="22" fill="#2E7BFF" stroke="${INK}" stroke-width="${S}"/><rect x="6" y="44" width="188" height="48" rx="20" fill="#4F95FF" stroke="${INK}" stroke-width="${S}"/><rect x="4" y="34" width="34" height="62" rx="16" fill="#2E7BFF" stroke="${INK}" stroke-width="${S}"/><rect x="162" y="34" width="34" height="62" rx="16" fill="#2E7BFF" stroke="${INK}" stroke-width="${S}"/><path d="M100 48 V88" stroke="${INK}" stroke-width="2.5" opacity="0.4"/><rect x="24" y="92" width="10" height="14" rx="3" fill="#5B4A9A"/><rect x="166" y="92" width="10" height="14" rx="3" fill="#5B4A9A"/><path d="M40 20 Q100 8 160 20" stroke="#fff" stroke-width="4" fill="none" opacity="0.35"/>`) }),
  'hat-cap': () => ({ w: 90, h: 50, svg: svg(90, 50, `<path d="M14 40 Q14 6 46 6 Q76 6 76 40 Z" fill="#FF6B5B" stroke="${INK}" stroke-width="${S}" stroke-linejoin="round"/><path d="M60 38 Q84 36 88 44 Q70 48 54 44 Z" fill="#E0503A" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/><circle cx="46" cy="8" r="5" fill="#FFC93C" stroke="${INK}" stroke-width="2"/>`) }),
  'hat-flower': () => ({ w: 60, h: 60, svg: svg(60, 60, `${[0, 1, 2, 3, 4].map((i) => { const a = (i * Math.PI * 2) / 5 - Math.PI / 2; return `<circle cx="${30 + Math.cos(a) * 13}" cy="${30 + Math.sin(a) * 13}" r="11" fill="#FF7AB6" stroke="${INK}" stroke-width="3"/>`; }).join('')}<circle cx="30" cy="30" r="9" fill="#FFD43B" stroke="${INK}" stroke-width="3"/>`) }),
  'hat-party': () => ({ w: 60, h: 80, svg: svg(60, 80, `<path d="M30 6 L54 72 H6 Z" fill="#9B7BFF" stroke="${INK}" stroke-width="${S}" stroke-linejoin="round"/><path d="M18 40 L42 40 M13 56 L47 56" stroke="#FFC93C" stroke-width="5" stroke-linecap="round"/><circle cx="30" cy="8" r="7" fill="#FF6B5B" stroke="${INK}" stroke-width="2.5"/>`) }),
  'hat-crown': () => ({ w: 90, h: 60, svg: svg(90, 60, `<path d="M8 52 L6 12 L28 32 L45 6 L62 32 L84 12 L82 52 Z" fill="#FFD43B" stroke="${INK}" stroke-width="${S}" stroke-linejoin="round"/><circle cx="45" cy="38" r="6" fill="#FF6B5B" stroke="${INK}" stroke-width="2"/><circle cx="24" cy="42" r="4" fill="#4FB8FF"/><circle cx="66" cy="42" r="4" fill="#3DD68C"/>`) }),
};

export const furniture = (itemId: string): Art => (ITEMS[itemId] ?? ITEMS.ball)();

/** إطار ملصق بالألبوم (فاضي أو مليان) */
export function stickerFrame(size = 90, filled = true) {
  const g = id('sf');
  return {
    w: size,
    h: size + 5,
    svg: svg(
      size,
      size + 5,
      `<rect x="3" y="8" width="${size - 6}" height="${size - 6}" rx="18" fill="${shade('#7B5CFF', -0.4)}" opacity="0.6"/>
       <rect x="3" y="3" width="${size - 6}" height="${size - 6}" rx="18" fill="${filled ? `url(#${g})` : '#E3DDFB'}" stroke="${INK}" stroke-width="3" ${filled ? '' : 'stroke-dasharray="7 6"'}/>`,
      vgrad(g, '#FFFFFF', '#F1ECFF'),
    ),
  };
}
