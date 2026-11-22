/** رسوم «قفزة سبير» (لعبة المنصات): أرض، منصات، سمكة، علم النهاية، فطر النطّ، قلب */
import { id, INK, shade, svg, vgrad } from './style.ts';

/** بلاطة أرض: عشب فوق (top=true) أو تراب */
export function groundTile(size = 48, top = true, grass = '#4CC778', dirt = '#C98245') {
  const g = id('gt');
  return {
    w: size,
    h: size,
    svg: svg(
      size,
      size,
      top
        ? `<rect width="${size}" height="${size}" fill="url(#${g})"/>
           <path d="M0 ${size * 0.3} Q${size * 0.25} ${size * 0.42} ${size * 0.5} ${size * 0.3} T${size} ${size * 0.3} V0 H0 Z" fill="${grass}"/>
           <path d="M0 ${size * 0.3} Q${size * 0.25} ${size * 0.42} ${size * 0.5} ${size * 0.3} T${size} ${size * 0.3}" stroke="${shade(grass, -0.3)}" stroke-width="3" fill="none"/>
           <rect width="${size}" height="5" fill="${shade(grass, 0.3)}"/>
           <circle cx="${size * 0.25}" cy="${size * 0.7}" r="3" fill="${shade(dirt, -0.25)}"/><circle cx="${size * 0.7}" cy="${size * 0.6}" r="2.5" fill="${shade(dirt, -0.25)}"/>`
        : `<rect width="${size}" height="${size}" fill="url(#${g})"/><circle cx="${size * 0.3}" cy="${size * 0.35}" r="3" fill="${shade(dirt, -0.25)}"/><circle cx="${size * 0.72}" cy="${size * 0.7}" r="3.5" fill="${shade(dirt, -0.25)}"/>`,
      vgrad(g, shade(dirt, 0.08), shade(dirt, -0.12)),
    ),
  };
}

/** منصة خشب طايرة (بلاطة وحدة) */
export function plankTile(size = 48) {
  const g = id('pl');
  return {
    w: size,
    h: size / 2,
    svg: svg(size, size / 2, `<rect x="0" y="2" width="${size}" height="${size / 2 - 4}" rx="6" fill="url(#${g})" stroke="${INK}" stroke-width="3"/><path d="M6 ${size / 4} H${size - 6}" stroke="#9A5B2A" stroke-width="2" opacity="0.5"/><rect x="4" y="5" width="${size - 8}" height="4" rx="2" fill="#fff" opacity="0.35"/>`, vgrad(g, '#F2B06A', '#C97A3A')),
  };
}

export function fish(size = 36, color = '#4FB8FF') {
  const g = id('fi');
  const w = size;
  const h = size * 0.7;
  return {
    w,
    h,
    svg: svg(
      w,
      h,
      `<path d="M${w * 0.08} ${h * 0.5} C${w * 0.25} ${h * 0.08} ${w * 0.62} ${h * 0.08} ${w * 0.75} ${h * 0.5} C${w * 0.62} ${h * 0.92} ${w * 0.25} ${h * 0.92} ${w * 0.08} ${h * 0.5} Z" fill="url(#${g})" stroke="${INK}" stroke-width="2.5"/>
       <path d="M${w * 0.72} ${h * 0.5} L${w * 0.96} ${h * 0.2} L${w * 0.96} ${h * 0.8} Z" fill="${shade(color, -0.15)}" stroke="${INK}" stroke-width="2.5" stroke-linejoin="round"/>
       <circle cx="${w * 0.24}" cy="${h * 0.42}" r="${size * 0.05}" fill="${INK}"/><circle cx="${w * 0.225}" cy="${h * 0.39}" r="${size * 0.018}" fill="#fff"/>
       <path d="M${w * 0.42} ${h * 0.3} Q${w * 0.48} ${h * 0.5} ${w * 0.42} ${h * 0.7}" stroke="#fff" stroke-width="2" fill="none" opacity="0.6"/>`,
      vgrad(g, shade(color, 0.35), shade(color, -0.05)),
    ),
  };
}

export function goalFlag(h = 140) {
  return {
    w: 80,
    h,
    svg: svg(80, h, `<rect x="12" y="10" width="8" height="${h - 20}" rx="4" fill="#FFF3DD" stroke="${INK}" stroke-width="3"/><circle cx="16" cy="10" r="8" fill="#FFC93C" stroke="${INK}" stroke-width="3"/><path d="M20 20 C40 14 52 30 76 22 V60 C52 68 40 52 20 58 Z" fill="#FF6B5B" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/><path d="M34 32 l5 9 10 1 -7 7 2 10 -9 -5 -9 5 2 -10 -7 -7 10 -1 Z" fill="#FFE27A" transform="scale(0.8) translate(10 6)"/><ellipse cx="16" cy="${h - 10}" rx="16" ry="6" fill="${INK}" opacity="0.3"/>`),
  };
}

export function mushroom(size = 48) {
  return {
    w: size,
    h: size,
    svg: svg(size, size, `<rect x="${size * 0.36}" y="${size * 0.5}" width="${size * 0.28}" height="${size * 0.46}" rx="5" fill="#FFF3DD" stroke="${INK}" stroke-width="3"/><path d="M${size * 0.06} ${size * 0.56} C${size * 0.06} ${size * 0.15} ${size * 0.94} ${size * 0.15} ${size * 0.94} ${size * 0.56} Z" fill="#FF6B5B" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/><circle cx="${size * 0.32}" cy="${size * 0.38}" r="${size * 0.07}" fill="#fff"/><circle cx="${size * 0.62}" cy="${size * 0.32}" r="${size * 0.09}" fill="#fff"/><circle cx="${size * 0.78}" cy="${size * 0.48}" r="${size * 0.05}" fill="#fff"/>`),
  };
}

export function heart(size = 32, filled = true) {
  return {
    w: size,
    h: size,
    svg: svg(size, size, `<path d="M${size / 2} ${size * 0.88} C${size * 0.05} ${size * 0.55} ${size * 0.05} ${size * 0.15} ${size * 0.3} ${size * 0.15} C${size * 0.42} ${size * 0.15} ${size / 2} ${size * 0.25} ${size / 2} ${size * 0.3} C${size / 2} ${size * 0.25} ${size * 0.58} ${size * 0.15} ${size * 0.7} ${size * 0.15} C${size * 0.95} ${size * 0.15} ${size * 0.95} ${size * 0.55} ${size / 2} ${size * 0.88} Z" fill="${filled ? '#FF5C7A' : '#D9D4F0'}" stroke="${INK}" stroke-width="2.5"/>${filled ? `<ellipse cx="${size * 0.32}" cy="${size * 0.32}" rx="${size * 0.08}" ry="${size * 0.05}" fill="#fff" opacity="0.7"/>` : ''}`),
  };
}

/** زر تحكم دائري شفاف (يسار، يمين، قفز) */
export function padButton(size = 84, kind: 'left' | 'right' | 'jump' = 'left') {
  const c = size / 2;
  const icon =
    kind === 'jump'
      ? `<path d="M${c} ${c - 16} L${c + 16} ${c + 8} H${c - 16} Z" fill="#fff" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>`
      : `<path d="M${kind === 'left' ? c - 14 : c + 14} ${c} L${kind === 'left' ? c + 10 : c - 10} ${c - 16} V${c + 16} Z" fill="#fff" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>`;
  return { w: size, h: size, svg: svg(size, size, `<circle cx="${c}" cy="${c}" r="${c - 3}" fill="${kind === 'jump' ? '#FFC93C' : '#2A2350'}" fill-opacity="${kind === 'jump' ? 0.85 : 0.35}" stroke="#fff" stroke-width="3" stroke-opacity="0.8"/>${icon}`) };
}
