/** قطع اللعب: بلاط الأرضية، قطع خشب منزلقة، صناديق، فتحات ملوّنة، شجيرات، أشكال الألوان */
import { CAT_COLORS, id, INK, rgrad, shade, svg, vgrad } from './style.ts';

/** بلاطة أرضية (مربعة) بلون الموضوع */
export function floorTile(base: string, size = 64) {
  const g = id('f');
  const r = size * 0.18;
  return {
    w: size,
    h: size,
    svg: svg(
      size,
      size,
      `<rect x="2" y="2" width="${size - 4}" height="${size - 4}" rx="${r}" fill="url(#${g})"/>
       <rect x="2" y="2" width="${size - 4}" height="${size - 4}" rx="${r}" fill="none" stroke="${shade(base, -0.18)}" stroke-width="2"/>
       <path d="M${size * 0.2} ${size * 0.22} h${size * 0.25}" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity="0.5"/>`,
      vgrad(g, shade(base, 0.12), shade(base, -0.06)),
    ),
  };
}

/** قطعة خشب منزلقة: cells خانات بالطول أو العرض. خطوط وأسهم تبيّن الاتجاه */
export function woodBlock(cells: number, vertical: boolean, cell = 64) {
  const g = id('w');
  const len = cells * cell;
  const w = vertical ? cell : len;
  const h = vertical ? len : cell;
  const pad = 5;
  const iw = w - pad * 2;
  const ih = h - pad * 2;
  const grain = Array.from({ length: 3 }, (_, i) => {
    const k = (i + 1) / 4;
    return vertical
      ? `<path d="M${pad + iw * k} ${pad + 10} Q${pad + iw * k + 4} ${h / 2} ${pad + iw * k} ${h - pad - 10}" stroke="#9A5B2A" stroke-width="2" fill="none" opacity="0.35"/>`
      : `<path d="M${pad + 10} ${pad + ih * k} Q${w / 2} ${pad + ih * k + 4} ${w - pad - 10} ${pad + ih * k}" stroke="#9A5B2A" stroke-width="2" fill="none" opacity="0.35"/>`;
  }).join('');
  const arrows =
    cells === 1
      ? `<circle cx="${w / 2}" cy="${h / 2}" r="7" fill="#FFE2B8" stroke="${INK}" stroke-width="2.5"/>`
      : vertical
        ? `<path d="M${w / 2 - 8} ${pad + 22} L${w / 2} ${pad + 12} L${w / 2 + 8} ${pad + 22} M${w / 2 - 8} ${h - pad - 22} L${w / 2} ${h - pad - 12} L${w / 2 + 8} ${h - pad - 22}" stroke="#FFE2B8" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`
        : `<path d="M${pad + 22} ${h / 2 - 8} L${pad + 12} ${h / 2} L${pad + 22} ${h / 2 + 8} M${w - pad - 22} ${h / 2 - 8} L${w - pad - 12} ${h / 2} L${w - pad - 22} ${h / 2 + 8}" stroke="#FFE2B8" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`;
  return {
    w,
    h,
    svg: svg(
      w,
      h,
      `<rect x="${pad}" y="${pad + 4}" width="${iw}" height="${ih}" rx="14" fill="#7A4A22"/>
       <rect x="${pad}" y="${pad}" width="${iw}" height="${ih}" rx="14" fill="url(#${g})" stroke="${INK}" stroke-width="4"/>
       ${grain}
       <rect x="${pad + 6}" y="${pad + 5}" width="${iw - 12}" height="6" rx="3" fill="#fff" opacity="0.35"/>
       ${arrows}`,
      vgrad(g, '#F2B06A', '#C97A3A', '<stop offset="0.5" stop-color="#E39A52"/>'),
    ),
  };
}

/** صندوق ثابت (ما يتحرك) */
export function crate(cell = 64) {
  const g = id('c');
  const p = 5;
  const s = cell - p * 2;
  return {
    w: cell,
    h: cell,
    svg: svg(
      cell,
      cell,
      `<rect x="${p}" y="${p + 4}" width="${s}" height="${s}" rx="10" fill="#3A2E5C"/>
       <rect x="${p}" y="${p}" width="${s}" height="${s}" rx="10" fill="url(#${g})" stroke="${INK}" stroke-width="4"/>
       <rect x="${p + 8}" y="${p + 8}" width="${s - 16}" height="${s - 16}" rx="5" fill="none" stroke="#4E4380" stroke-width="3"/>
       <path d="M${p + 10} ${p + 10} L${cell - p - 10} ${cell - p - 10} M${cell - p - 10} ${p + 10} L${p + 10} ${cell - p - 10}" stroke="#4E4380" stroke-width="5" stroke-linecap="round"/>
       <circle cx="${p + 7}" cy="${p + 7}" r="2.5" fill="#B8B0E0"/><circle cx="${cell - p - 7}" cy="${p + 7}" r="2.5" fill="#B8B0E0"/>
       <circle cx="${p + 7}" cy="${cell - p - 7}" r="2.5" fill="#B8B0E0"/><circle cx="${cell - p - 7}" cy="${cell - p - 7}" r="2.5" fill="#B8B0E0"/>`,
      vgrad(g, '#8C80C8', '#62579E'),
    ),
  };
}

/** أشكال تميّز الألوان (لعمى الألوان) */
export const SHAPES = ['circle', 'triangle', 'star', 'diamond', 'heart'] as const;
export type ShapeName = (typeof SHAPES)[number];

export function shapePath(kind: ShapeName, cx: number, cy: number, r: number): string {
  switch (kind) {
    case 'circle':
      return `<circle cx="${cx}" cy="${cy}" r="${r}"/>`;
    case 'triangle':
      return `<path d="M${cx} ${cy - r * 1.1} L${cx + r} ${cy + r * 0.8} L${cx - r} ${cy + r * 0.8} Z" stroke-linejoin="round"/>`;
    case 'diamond':
      return `<path d="M${cx} ${cy - r * 1.15} L${cx + r * 0.9} ${cy} L${cx} ${cy + r * 1.15} L${cx - r * 0.9} ${cy} Z"/>`;
    case 'heart':
      return `<path d="M${cx} ${cy + r} C${cx - r * 1.6} ${cy} ${cx - r * 0.8} ${cy - r * 1.3} ${cx} ${cy - r * 0.45} C${cx + r * 0.8} ${cy - r * 1.3} ${cx + r * 1.6} ${cy} ${cx} ${cy + r} Z"/>`;
    case 'star': {
      const pts = Array.from({ length: 10 }, (_, i) => {
        const a = -Math.PI / 2 + (i * Math.PI) / 5;
        const rr = i % 2 ? r * 0.5 : r * 1.15;
        return `${(cx + Math.cos(a) * rr).toFixed(1)},${(cy + Math.sin(a) * rr).toFixed(1)}`;
      }).join(' ');
      return `<polygon points="${pts}" stroke-linejoin="round"/>`;
    }
  }
}

/** فتحة بالأرض بلون البزون اللي لازم يطيح بيها */
export function hole(color: string, shape: ShapeName, cell = 64) {
  const [l, m] = CAT_COLORS[color] ?? CAT_COLORS.orange;
  const g = id('o');
  const c = cell / 2;
  const r = cell * 0.36;
  return {
    w: cell,
    h: cell,
    svg: svg(
      cell,
      cell,
      `<circle cx="${c}" cy="${c}" r="${r + 5}" fill="${m}" stroke="${INK}" stroke-width="4"/>
       <circle cx="${c}" cy="${c}" r="${r - 2}" fill="url(#${g})"/>
       <path d="M${c - r + 6} ${c - 4} A ${r - 6} ${r - 6} 0 0 1 ${c + r - 6} ${c - 4}" stroke="#000" stroke-width="5" opacity="0.25" fill="none"/>
       <g fill="${l}" opacity="0.95">${shapePath(shape, c, c + 3, cell * 0.11)}</g>
       <path d="M${c - r + 2} ${c - r * 0.55} A ${r + 2} ${r + 2} 0 0 1 ${c + r * 0.2} ${c - r - 2}" stroke="#fff" stroke-width="3" opacity="0.6" fill="none" stroke-linecap="round"/>`,
      rgrad(g, '#3A2E6A', '#120E26', 0.5, 0.35),
    ),
  };
}

/** شكل اللون الصغير (يتحط على جبهة البزون) */
export function badge(color: string, shape: ShapeName) {
  const [l] = CAT_COLORS[color] ?? CAT_COLORS.orange;
  return { w: 24, h: 24, svg: svg(24, 24, `<g fill="#fff" stroke="${INK}" stroke-width="2">${shapePath(shape, 12, 12, 8)}</g><g fill="${l}">${shapePath(shape, 12, 12, 4)}</g>`) };
}

/** خلية عشب سداسية (لحاصر البزون) */
export function hexGrass(size = 60) {
  const g = id('g');
  const r = size / 2 - 2;
  const pts = Array.from({ length: 6 }, (_, i) => {
    const a = Math.PI / 6 + (i * Math.PI) / 3;
    return `${(size / 2 + Math.cos(a) * r).toFixed(1)},${(size / 2 + Math.sin(a) * r).toFixed(1)}`;
  }).join(' ');
  return {
    w: size,
    h: size,
    svg: svg(
      size,
      size,
      `<polygon points="${pts}" fill="url(#${g})" stroke="#2E9A5C" stroke-width="2.5" stroke-linejoin="round"/>
       <path d="M${size * 0.28} ${size * 0.66} q2 -8 4 -10 M${size * 0.32} ${size * 0.66} q1 -6 5 -8 M${size * 0.64} ${size * 0.4} q2 -7 4 -9 M${size * 0.68} ${size * 0.4} q1 -5 5 -7" stroke="#34A866" stroke-width="2" fill="none" stroke-linecap="round" opacity="0.7"/><path d="M${size * 0.22} ${size * 0.3} q${size * 0.15} -${size * 0.08} ${size * 0.3} -${size * 0.06}" stroke="#fff" stroke-width="2.5" opacity="0.45" fill="none" stroke-linecap="round"/>`,
      vgrad(g, '#8BEA9E', '#4CC778'),
    ),
  };
}

/** شجيرة (تسد الطريق) */
export function bush(size = 64) {
  const g = id('u');
  const s = size;
  return {
    w: s,
    h: s,
    svg: svg(
      s,
      s,
      `<ellipse cx="${s / 2}" cy="${s * 0.82}" rx="${s * 0.36}" ry="${s * 0.1}" fill="#000" opacity="0.18"/>
       <path d="M${s * 0.14} ${s * 0.7} C${s * 0.04} ${s * 0.5} ${s * 0.2} ${s * 0.3} ${s * 0.34} ${s * 0.34} C${s * 0.36} ${s * 0.14} ${s * 0.64} ${s * 0.1} ${s * 0.68} ${s * 0.3} C${s * 0.86} ${s * 0.28} ${s * 0.96} ${s * 0.52} ${s * 0.86} ${s * 0.7} C${s * 0.7} ${s * 0.84} ${s * 0.3} ${s * 0.84} ${s * 0.14} ${s * 0.7} Z" fill="url(#${g})" stroke="${INK}" stroke-width="3.5" stroke-linejoin="round"/>
       <circle cx="${s * 0.32}" cy="${s * 0.5}" r="${s * 0.05}" fill="#FF6B8A" stroke="${INK}" stroke-width="1.5"/>
       <circle cx="${s * 0.66}" cy="${s * 0.44}" r="${s * 0.05}" fill="#FFD84A" stroke="${INK}" stroke-width="1.5"/>
       <path d="M${s * 0.3} ${s * 0.3} q${s * 0.1} -${s * 0.06} ${s * 0.18} 0" stroke="#fff" stroke-width="3" fill="none" opacity="0.5" stroke-linecap="round"/>`,
      vgrad(g, '#5FD88A', '#1F8F55'),
    ),
  };
}

/** قطعة حلوى لامعة (لبلوكات الحلوى) */
export const CANDY = ['#FF6B5B', '#FFC93C', '#3DD68C', '#4FB8FF', '#9B7BFF', '#FF7AB6'];
export function candy(color: string, size = 64) {
  const g = id('cd');
  const p = 3;
  const s = size - p * 2;
  return {
    w: size,
    h: size,
    svg: svg(
      size,
      size,
      `<rect x="${p}" y="${p + 3}" width="${s}" height="${s - 3}" rx="${size * 0.22}" fill="${shade(color, -0.4)}"/>
       <rect x="${p}" y="${p}" width="${s}" height="${s - 4}" rx="${size * 0.22}" fill="url(#${g})" stroke="${INK}" stroke-width="2.5"/>
       <rect x="${p + s * 0.18}" y="${p + s * 0.12}" width="${s * 0.64}" height="${s * 0.18}" rx="${s * 0.09}" fill="#fff" opacity="0.55"/>
       <circle cx="${p + s * 0.76}" cy="${p + s * 0.66}" r="${s * 0.07}" fill="#fff" opacity="0.5"/>`,
      vgrad(g, shade(color, 0.3), shade(color, -0.08)),
    ),
  };
}

/** قطعة «أربعة بخط»: وجه بزون (أصفر) */
export function discCat(size = 64) {
  const g = id('dc');
  const c = size / 2;
  const r = size * 0.44;
  return {
    w: size,
    h: size,
    svg: svg(
      size,
      size,
      `<path d="M${c - r * 0.85} ${c - r * 0.35} L${c - r * 0.8} ${c - r * 1.05} L${c - r * 0.3} ${c - r * 0.8} Z M${c + r * 0.85} ${c - r * 0.35} L${c + r * 0.8} ${c - r * 1.05} L${c + r * 0.3} ${c - r * 0.8} Z" fill="#FFB21A" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>
       <circle cx="${c}" cy="${c}" r="${r}" fill="url(#${g})" stroke="${INK}" stroke-width="3"/>
       <ellipse cx="${c - r * 0.36}" cy="${c - r * 0.08}" rx="${r * 0.13}" ry="${r * 0.17}" fill="${INK}"/><ellipse cx="${c + r * 0.36}" cy="${c - r * 0.08}" rx="${r * 0.13}" ry="${r * 0.17}" fill="${INK}"/>
       <circle cx="${c - r * 0.4}" cy="${c - r * 0.15}" r="${r * 0.05}" fill="#fff"/><circle cx="${c + r * 0.32}" cy="${c - r * 0.15}" r="${r * 0.05}" fill="#fff"/>
       <path d="M${c - r * 0.1} ${c + r * 0.18} h${r * 0.2} l-${r * 0.1} ${r * 0.12} Z" fill="#FF6F9C"/>
       <path d="M${c} ${c + r * 0.3} q-${r * 0.12} ${r * 0.16} -${r * 0.24} ${r * 0.06} M${c} ${c + r * 0.3} q${r * 0.12} ${r * 0.16} ${r * 0.24} ${r * 0.06}" stroke="${INK}" stroke-width="2.2" fill="none" stroke-linecap="round"/>
       <ellipse cx="${c - r * 0.45}" cy="${c - r * 0.55}" rx="${r * 0.22}" ry="${r * 0.1}" fill="#fff" opacity="0.6"/>`,
      vgrad(g, '#FFE27A', '#FFB21A'),
    ),
  };
}

/** قطعة «أربعة بخط»: وجه جرو (مرجاني) بأذنين متدليات */
export function discDog(size = 64) {
  const g = id('dd');
  const c = size / 2;
  const r = size * 0.44;
  return {
    w: size,
    h: size,
    svg: svg(
      size,
      size,
      `<circle cx="${c}" cy="${c}" r="${r}" fill="url(#${g})" stroke="${INK}" stroke-width="3"/>
       <path d="M${c - r * 0.75} ${c - r * 0.7} C${c - r * 1.15} ${c - r * 0.4} ${c - r * 1.05} ${c + r * 0.3} ${c - r * 0.7} ${c + r * 0.25} Z M${c + r * 0.75} ${c - r * 0.7} C${c + r * 1.15} ${c - r * 0.4} ${c + r * 1.05} ${c + r * 0.3} ${c + r * 0.7} ${c + r * 0.25} Z" fill="#B5462F" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>
       <ellipse cx="${c}" cy="${c + r * 0.32}" rx="${r * 0.42}" ry="${r * 0.3}" fill="#FFE1D6"/>
       <ellipse cx="${c - r * 0.32}" cy="${c - r * 0.12}" rx="${r * 0.12}" ry="${r * 0.15}" fill="${INK}"/><ellipse cx="${c + r * 0.32}" cy="${c - r * 0.12}" rx="${r * 0.12}" ry="${r * 0.15}" fill="${INK}"/>
       <circle cx="${c - r * 0.36}" cy="${c - r * 0.18}" r="${r * 0.05}" fill="#fff"/><circle cx="${c + r * 0.28}" cy="${c - r * 0.18}" r="${r * 0.05}" fill="#fff"/>
       <ellipse cx="${c}" cy="${c + r * 0.18}" rx="${r * 0.16}" ry="${r * 0.11}" fill="${INK}"/>
       <path d="M${c - r * 0.14} ${c + r * 0.42} q${r * 0.14} ${r * 0.14} ${r * 0.28} 0" stroke="${INK}" stroke-width="2.2" fill="none" stroke-linecap="round"/>
       <ellipse cx="${c - r * 0.4}" cy="${c - r * 0.55}" rx="${r * 0.2}" ry="${r * 0.09}" fill="#fff" opacity="0.5"/>`,
      vgrad(g, '#FF9A7A', '#E0533A'),
    ),
  };
}

/** لوحة «أربعة بخط» بفتحات دائرية (القطع تبين من ورا) */
export function c4Board(cols: number, rows: number, cell = 64) {
  const g = id('cb');
  const pad = 14;
  const w = cols * cell + pad * 2;
  const h = rows * cell + pad * 2;
  const holes = [];
  for (let r = 0; r < rows; r++) for (let k = 0; k < cols; k++) {
    const cx = pad + k * cell + cell / 2;
    const cy = pad + r * cell + cell / 2;
    const rr = cell * 0.4;
    holes.push(`M${cx - rr} ${cy} a${rr} ${rr} 0 1 0 ${rr * 2} 0 a${rr} ${rr} 0 1 0 -${rr * 2} 0`);
  }
  return {
    w,
    h: h + 8,
    svg: svg(
      w,
      h + 8,
      `<path fill-rule="evenodd" d="M24 8 H${w - 24} Q${w} 8 ${w} 32 V${h - 16} Q${w} ${h + 8} ${w - 24} ${h + 8} H24 Q0 ${h + 8} 0 ${h - 16} V32 Q0 8 24 8 Z ${holes.join(' ')}" fill="${INK}" opacity="0.4"/>
       <path fill-rule="evenodd" d="M24 2 H${w - 24} Q${w - 2} 2 ${w - 2} 24 V${h - 24} Q${w - 2} ${h - 2} ${w - 24} ${h - 2} H24 Q2 ${h - 2} 2 ${h - 24} V24 Q2 2 24 2 Z ${holes.join(' ')}" fill="url(#${g})" stroke="${INK}" stroke-width="4"/>
       ${holes.map((d) => `<path d="${d}" fill="none" stroke="${INK}" stroke-width="3"/>`).join('')}
       <rect x="20" y="8" width="${w - 40}" height="8" rx="4" fill="#fff" opacity="0.35"/>`,
      vgrad(g, '#6FC8FF', '#2C8AD6'),
    ),
  };
}
