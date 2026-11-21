/** عناصر الواجهة: أزرار حلوى، نجوم، عملة، لوحة، شريط عنوان، قطع احتفال */
import { id, INK, shade, svg, vgrad } from './style.ts';

/** زر «حلوى»: منفوخ بتدرج ولمعة وظل غامق تحت */
export function pill(w: number, h: number, color = '#FFC93C') {
  const g = id('p');
  const r = h / 2;
  return {
    w,
    h: h + 6,
    svg: svg(
      w,
      h + 6,
      `<rect x="2" y="7" width="${w - 4}" height="${h - 4}" rx="${r}" fill="${shade(color, -0.45)}"/>
       <rect x="2" y="2" width="${w - 4}" height="${h - 4}" rx="${r}" fill="url(#${g})" stroke="${INK}" stroke-width="3.5"/>
       <rect x="${r * 0.6}" y="7" width="${w - r * 1.2}" height="${h * 0.22}" rx="${h * 0.11}" fill="#fff" opacity="0.45"/>`,
      vgrad(g, shade(color, 0.25), shade(color, -0.1)),
    ),
  };
}

/** زر دائري (للأيقونات) */
export function roundBtn(size: number, color = '#FFFFFF', icon: 'undo' | 'hint' | 'pause' | 'back' | 'play' | 'home' = 'pause') {
  const g = id('r');
  const c = size / 2;
  const icons: Record<string, string> = {
    undo: `<path d="M${c + 8} ${c + 9} A10 10 0 1 0 ${c - 9} ${c + 2}" stroke="${INK}" stroke-width="4.5" fill="none" stroke-linecap="round"/><path d="M${c - 16} ${c - 2} L${c - 9} ${c + 5} L${c - 2} ${c - 2}" stroke="${INK}" stroke-width="4.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`,
    hint: `<path d="M${c} ${c - 13} a9 9 0 0 1 6 16 v3 h-12 v-3 a9 9 0 0 1 6 -16 Z" fill="#FFE27A" stroke="${INK}" stroke-width="3.5" stroke-linejoin="round"/><path d="M${c - 5} ${c + 11} h10" stroke="${INK}" stroke-width="3.5" stroke-linecap="round"/>`,
    pause: `<rect x="${c - 9}" y="${c - 10}" width="6" height="20" rx="3" fill="${INK}"/><rect x="${c + 3}" y="${c - 10}" width="6" height="20" rx="3" fill="${INK}"/>`,
    back: `<path d="M${c - 4} ${c - 10} L${c + 6} ${c} L${c - 4} ${c + 10}" stroke="${INK}" stroke-width="5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`,
    play: `<path d="M${c - 6} ${c - 11} L${c + 10} ${c} L${c - 6} ${c + 11} Z" fill="${INK}" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>`,
    home: `<path d="M${c - 11} ${c} L${c} ${c - 11} L${c + 11} ${c} M${c - 7} ${c - 3} V${c + 10} H${c + 7} V${c - 3}" stroke="${INK}" stroke-width="4" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`,
  };
  return {
    w: size,
    h: size + 5,
    svg: svg(
      size,
      size + 5,
      `<circle cx="${c}" cy="${c + 5}" r="${c - 2}" fill="${shade(color, -0.4)}"/>
       <circle cx="${c}" cy="${c}" r="${c - 2}" fill="url(#${g})" stroke="${INK}" stroke-width="3.5"/>
       <ellipse cx="${c - c * 0.25}" cy="${c - c * 0.45}" rx="${c * 0.35}" ry="${c * 0.16}" fill="#fff" opacity="0.55"/>
       ${icons[icon]}`,
      vgrad(g, shade(color, 0.2), shade(color, -0.08)),
    ),
  };
}

export function starIcon(size = 64, filled = true) {
  const g = id('st');
  const c = size / 2;
  const pts = Array.from({ length: 10 }, (_, i) => {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const r = i % 2 ? c * 0.44 : c * 0.92;
    return `${(c + Math.cos(a) * r).toFixed(1)},${(c + 3 + Math.sin(a) * r).toFixed(1)}`;
  }).join(' ');
  return {
    w: size,
    h: size,
    svg: svg(
      size,
      size,
      filled
        ? `<polygon points="${pts}" fill="url(#${g})" stroke="${INK}" stroke-width="${size * 0.06}" stroke-linejoin="round"/><path d="M${c - c * 0.3} ${c - c * 0.1} q${c * 0.2} -${c * 0.25} ${c * 0.4} -${c * 0.2}" stroke="#fff" stroke-width="${size * 0.06}" stroke-linecap="round" fill="none" opacity="0.8"/>`
        : `<polygon points="${pts}" fill="#D9D4F0" stroke="#A9A1D6" stroke-width="${size * 0.06}" stroke-linejoin="round"/>`,
      vgrad(g, '#FFE27A', '#FFAE1A'),
    ),
  };
}

export function coin(size = 40) {
  const g = id('co');
  const c = size / 2;
  return {
    w: size,
    h: size,
    svg: svg(
      size,
      size,
      `<circle cx="${c}" cy="${c + 2}" r="${c - 2}" fill="#C77C00"/><circle cx="${c}" cy="${c}" r="${c - 2}" fill="url(#${g})" stroke="${INK}" stroke-width="2.5"/>
       <circle cx="${c}" cy="${c}" r="${c * 0.6}" fill="none" stroke="#E09A00" stroke-width="2"/>
       <path d="M${c} ${c - c * 0.42} L${c + c * 0.12} ${c - c * 0.12} L${c + c * 0.42} ${c - c * 0.1} L${c + c * 0.18} ${c + c * 0.1} L${c + c * 0.26} ${c + c * 0.42} L${c} ${c + c * 0.24} L${c - c * 0.26} ${c + c * 0.42} L${c - c * 0.18} ${c + c * 0.1} L${c - c * 0.42} ${c - c * 0.1} L${c - c * 0.12} ${c - c * 0.12} Z" fill="#E59400"/>
       <ellipse cx="${c - c * 0.35}" cy="${c - c * 0.45}" rx="${c * 0.22}" ry="${c * 0.12}" fill="#fff" opacity="0.7"/>`,
      vgrad(g, '#FFE27A', '#FFB61A'),
    ),
  };
}

/** لوحة/بطاقة كريمية بحد */
export function panel(w: number, h: number, color = '#FFF7EA') {
  return {
    w,
    h: h + 8,
    svg: svg(
      w,
      h + 8,
      `<rect x="2" y="10" width="${w - 4}" height="${h - 4}" rx="28" fill="${INK}" opacity="0.4"/>
       <rect x="2" y="2" width="${w - 4}" height="${h - 4}" rx="28" fill="${color}" stroke="${INK}" stroke-width="4"/>`,
    ),
  };
}

/** شريط عنوان (ربطة) */
export function ribbon(w: number, color = '#FF6B5B') {
  const g = id('rb');
  const h = 64;
  return {
    w,
    h,
    svg: svg(
      w,
      h,
      `<path d="M4 18 L30 18 L30 56 L18 46 L4 56 Z" fill="${shade(color, -0.3)}" stroke="${INK}" stroke-width="3.5" stroke-linejoin="round"/>
       <path d="M${w - 4} 18 L${w - 30} 18 L${w - 30} 56 L${w - 18} 46 L${w - 4} 56 Z" fill="${shade(color, -0.3)}" stroke="${INK}" stroke-width="3.5" stroke-linejoin="round"/>
       <rect x="18" y="4" width="${w - 36}" height="44" rx="12" fill="url(#${g})" stroke="${INK}" stroke-width="3.5"/>
       <rect x="30" y="10" width="${w - 60}" height="7" rx="3.5" fill="#fff" opacity="0.4"/>`,
      vgrad(g, shade(color, 0.2), shade(color, -0.1)),
    ),
  };
}

/** قطع احتفال صغيرة */
export function confetti(color: string) {
  return { w: 12, h: 18, svg: svg(12, 18, `<rect x="1" y="1" width="10" height="16" rx="3" fill="${color}"/>`) };
}

export function sparkle(color = '#FFE27A') {
  return { w: 24, h: 24, svg: svg(24, 24, `<path d="M12 1 C13 9 15 11 23 12 C15 13 13 15 12 23 C11 15 9 13 1 12 C9 11 11 9 12 1 Z" fill="${color}"/>`) };
}

export function dot(color = '#FFFFFF') {
  return { w: 16, h: 16, svg: svg(16, 16, `<circle cx="8" cy="8" r="7" fill="${color}"/>`) };
}
