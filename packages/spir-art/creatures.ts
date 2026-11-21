/**
 * «السبيرات»: 11 مخلوق لعبة الدمج. كل مستوى أكبر شوية ويزيد عليه شي (أذنين، قرون، جناحين، تاج…).
 */
import { id, INK, shade, svg, vgrad } from './style.ts';

export const CREATURES = [
  { name: 'بيضة', color: '#FFE9C7' },
  { name: 'نقطة', color: '#FFB3D6' },
  { name: 'خوخة', color: '#FF9F43' },
  { name: 'شمسة', color: '#FFC93C' },
  { name: 'ورقة', color: '#3DD68C' },
  { name: 'غيمة', color: '#4FB8FF' },
  { name: 'عنبة', color: '#9B7BFF' },
  { name: 'رمّانة', color: '#FF6B5B' },
  { name: 'موجة', color: '#22C7B8' },
  { name: 'نجمة', color: '#FF7AB6' },
  { name: 'الملك', color: '#FFD43B' },
] as const;

export function creature(tier: number, size = 96) {
  const t = Math.max(0, Math.min(CREATURES.length - 1, tier));
  const base = CREATURES[t].color;
  const g = id('cr');
  const c = size / 2;
  // الجسم يكبر ويّا المستوى
  const r = size * (0.27 + t * 0.012);
  const cy = c + size * 0.08;
  const parts: string[] = [];

  // أجنحة (خلف الجسم)
  if (t >= 8) {
    for (const sgn of [-1, 1]) {
      parts.push(`<path d="M${c + sgn * r * 0.7} ${cy - r * 0.2} C${c + sgn * r * 1.7} ${cy - r * 1.2} ${c + sgn * r * 1.9} ${cy + r * 0.2} ${c + sgn * r * 0.9} ${cy + r * 0.35} Z" fill="#E8F6FF" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>`);
    }
  }
  // أذنين
  if (t >= 3 && t < 6) {
    for (const sgn of [-1, 1]) parts.push(`<circle cx="${c + sgn * r * 0.7}" cy="${cy - r * 0.85}" r="${r * 0.28}" fill="${shade(base, -0.1)}" stroke="${INK}" stroke-width="3"/>`);
  }
  // قرون
  if (t >= 6 && t < 10) {
    for (const sgn of [-1, 1]) parts.push(`<path d="M${c + sgn * r * 0.45} ${cy - r * 0.8} Q${c + sgn * r * 0.75} ${cy - r * 1.5} ${c + sgn * r * 0.35} ${cy - r * 1.45}" stroke="${INK}" stroke-width="${r * 0.32}" stroke-linecap="round" fill="none"/><path d="M${c + sgn * r * 0.45} ${cy - r * 0.8} Q${c + sgn * r * 0.75} ${cy - r * 1.5} ${c + sgn * r * 0.35} ${cy - r * 1.45}" stroke="#FFF3DD" stroke-width="${r * 0.18}" stroke-linecap="round" fill="none"/>`);
  }

  // الجسم: بيضة للمستوى الأول، وغيرها دائرة مضغوطة شوية
  const body = t === 0
    ? `<ellipse cx="${c}" cy="${cy}" rx="${r * 0.85}" ry="${r * 1.05}" fill="url(#${g})" stroke="${INK}" stroke-width="3.5"/><path d="M${c - r * 0.6} ${cy} l${r * 0.25} -${r * 0.2} l${r * 0.25} ${r * 0.2} l${r * 0.25} -${r * 0.2} l${r * 0.25} ${r * 0.2}" stroke="${shade(base, -0.3)}" stroke-width="3" fill="none" stroke-linejoin="round"/>`
    : `<ellipse cx="${c}" cy="${cy}" rx="${r}" ry="${r * 0.92}" fill="url(#${g})" stroke="${INK}" stroke-width="3.5"/>`;
  parts.push(body);
  // لمعة
  parts.push(`<ellipse cx="${c - r * 0.38}" cy="${cy - r * 0.48}" rx="${r * 0.28}" ry="${r * 0.14}" fill="#fff" opacity="0.65" transform="rotate(-25 ${c - r * 0.38} ${cy - r * 0.48})"/>`);

  // هوائي
  if (t === 4 || t === 5) parts.push(`<path d="M${c} ${cy - r * 0.9} Q${c + r * 0.2} ${cy - r * 1.35} ${c + r * 0.05} ${cy - r * 1.5}" stroke="${INK}" stroke-width="3" fill="none"/><circle cx="${c + r * 0.05}" cy="${cy - r * 1.55}" r="${r * 0.16}" fill="#FFE27A" stroke="${INK}" stroke-width="2.5"/>`);
  // ورقة على الراس
  if (t === 4) parts.push(`<path d="M${c - r * 0.1} ${cy - r * 0.88} q-${r * 0.5} -${r * 0.45} -${r * 0.15} -${r * 0.7} q${r * 0.3} ${r * 0.25} ${r * 0.15} ${r * 0.7} Z" fill="#2FA866" stroke="${INK}" stroke-width="2"/>`);

  // العيون
  const ey = cy - r * 0.12;
  const ex = r * 0.36;
  const er = r * (0.17 + (t >= 7 ? 0.03 : 0));
  if (t === 0) {
    parts.push(`<path d="M${c - ex - er} ${ey} q${er} ${er * 0.8} ${er * 2} 0 M${c + ex - er} ${ey} q${er} ${er * 0.8} ${er * 2} 0" stroke="${INK}" stroke-width="3" fill="none" stroke-linecap="round"/>`);
  } else {
    for (const sgn of [-1, 1]) {
      parts.push(`<ellipse cx="${c + sgn * ex}" cy="${ey}" rx="${er}" ry="${er * 1.2}" fill="${INK}"/><circle cx="${c + sgn * ex - er * 0.35}" cy="${ey - er * 0.45}" r="${er * 0.42}" fill="#fff"/>`);
    }
  }
  // نظارات
  if (t === 9) parts.push(`<circle cx="${c - ex}" cy="${ey}" r="${er * 1.7}" fill="none" stroke="${INK}" stroke-width="3"/><circle cx="${c + ex}" cy="${ey}" r="${er * 1.7}" fill="none" stroke="${INK}" stroke-width="3"/><path d="M${c - ex + er * 1.7} ${ey} H${c + ex - er * 1.7}" stroke="${INK}" stroke-width="3"/>`);
  // خدود
  if (t >= 2) parts.push(`<ellipse cx="${c - r * 0.6}" cy="${cy + r * 0.18}" rx="${r * 0.16}" ry="${r * 0.1}" fill="#FF6F9C" opacity="0.55"/><ellipse cx="${c + r * 0.6}" cy="${cy + r * 0.18}" rx="${r * 0.16}" ry="${r * 0.1}" fill="#FF6F9C" opacity="0.55"/>`);
  // الحلگ
  if (t >= 1) {
    parts.push(t >= 5
      ? `<path d="M${c - r * 0.22} ${cy + r * 0.2} Q${c} ${cy + r * 0.55} ${c + r * 0.22} ${cy + r * 0.2} Z" fill="#B23A5A" stroke="${INK}" stroke-width="2.5" stroke-linejoin="round"/>`
      : `<path d="M${c - r * 0.16} ${cy + r * 0.22} Q${c} ${cy + r * 0.38} ${c + r * 0.16} ${cy + r * 0.22}" stroke="${INK}" stroke-width="3" fill="none" stroke-linecap="round"/>`);
  }
  // فيونكة
  if (t === 7) parts.push(`<path d="M${c} ${cy + r * 0.75} l-${r * 0.35} -${r * 0.18} v${r * 0.36} Z M${c} ${cy + r * 0.75} l${r * 0.35} -${r * 0.18} v${r * 0.36} Z" fill="#FFC93C" stroke="${INK}" stroke-width="2.5" stroke-linejoin="round"/><circle cx="${c}" cy="${cy + r * 0.75}" r="${r * 0.09}" fill="#FFC93C" stroke="${INK}" stroke-width="2"/>`);
  // تاج
  if (t === 10) parts.push(`<path d="M${c - r * 0.55} ${cy - r * 0.78} L${c - r * 0.6} ${cy - r * 1.35} L${c - r * 0.28} ${cy - r * 1.05} L${c} ${cy - r * 1.5} L${c + r * 0.28} ${cy - r * 1.05} L${c + r * 0.6} ${cy - r * 1.35} L${c + r * 0.55} ${cy - r * 0.78} Z" fill="#FFE27A" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/><circle cx="${c}" cy="${cy - r * 1.0}" r="${r * 0.09}" fill="#FF6B5B"/>`);

  return { w: size, h: size, svg: svg(size, size, parts.join(''), vgrad(g, shade(base, 0.35), shade(base, -0.12))) };
}

/** بلاطة خلفية لكل خانة بلعبة الدمج */
export function mergeCell(size = 96, color = '#E8DDFF') {
  return {
    w: size,
    h: size,
    svg: svg(size, size, `<rect x="3" y="3" width="${size - 6}" height="${size - 6}" rx="${size * 0.2}" fill="${color}" stroke="${shade(color, -0.12)}" stroke-width="3"/>`),
  };
}

/** بلاطة ملوّنة تحت المخلوق (لون المستوى) */
export function tierTile(tier: number, size = 96) {
  const base = CREATURES[Math.max(0, Math.min(CREATURES.length - 1, tier))].color;
  const g = id('tt');
  return {
    w: size,
    h: size + 5,
    svg: svg(
      size,
      size + 5,
      `<rect x="3" y="8" width="${size - 6}" height="${size - 6}" rx="${size * 0.2}" fill="${shade(base, -0.4)}"/>
       <rect x="3" y="3" width="${size - 6}" height="${size - 6}" rx="${size * 0.2}" fill="url(#${g})" stroke="${INK}" stroke-width="3.5"/>`,
      vgrad(g, shade(base, 0.7), shade(base, 0.45)),
    ),
  };
}
