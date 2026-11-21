/**
 * البزون (سبير وأصدقاؤه): قطع منفصلة حتى تتحرك (cutout).
 * كل القطع مرسومة حول نقطة ارتكاز معروفة، والتجميع بـ spir-engine/cat.ts.
 */
import { CAT_COLORS, id, INK, rgrad, svg, vgrad } from './style.ts';

const SW = 5; // سمك الحد

export function catBody(color: keyof typeof CAT_COLORS | string) {
  const [l, m, d] = CAT_COLORS[color] ?? CAT_COLORS.orange;
  const g = id('b');
  return {
    w: 120,
    h: 100,
    svg: svg(
      120,
      100,
      `<path d="M22 92 C10 92 8 70 16 52 C26 28 44 14 60 14 C76 14 94 28 104 52 C112 70 110 92 98 92 Z" fill="url(#${g})" stroke="${INK}" stroke-width="${SW}" stroke-linejoin="round"/>
       <ellipse cx="60" cy="66" rx="24" ry="22" fill="#FFF4E2" opacity="0.95"/>
       <ellipse cx="40" cy="90" rx="14" ry="9" fill="${l}" stroke="${INK}" stroke-width="${SW - 1}"/>
       <ellipse cx="80" cy="90" rx="14" ry="9" fill="${l}" stroke="${INK}" stroke-width="${SW - 1}"/>
       <path d="M36 88 v4 M42 88 v4 M76 88 v4 M82 88 v4" stroke="${d}" stroke-width="2" stroke-linecap="round"/>`,
      vgrad(g, l, d, `<stop offset="0.45" stop-color="${m}"/>`),
    ),
  };
}

export function catHead(color: keyof typeof CAT_COLORS | string, stripes = true) {
  const [l, m, d] = CAT_COLORS[color] ?? CAT_COLORS.orange;
  const g = id('h');
  const s = stripes
    ? `<path d="M62 10 q3 12 0 20 M48 14 q4 9 4 16 M76 14 q-4 9 -4 16" stroke="${d}" stroke-width="5" stroke-linecap="round" fill="none"/>`
    : '';
  return {
    w: 124,
    h: 104,
    svg: svg(
      124,
      104,
      `<path d="M62 6 C96 6 118 28 118 56 C118 64 114 70 110 74 L116 80 L104 82 C96 96 80 100 62 100 C44 100 28 96 20 82 L8 80 L14 74 C10 70 6 64 6 56 C6 28 28 6 62 6 Z" fill="url(#${g})" stroke="${INK}" stroke-width="${SW}" stroke-linejoin="round"/>
       ${s}
       <ellipse cx="62" cy="76" rx="26" ry="18" fill="#FFF4E2"/>
       <ellipse cx="30" cy="70" rx="10" ry="6" fill="#FF8FB1" opacity="0.55"/>
       <ellipse cx="94" cy="70" rx="10" ry="6" fill="#FF8FB1" opacity="0.55"/>
       <path d="M40 22 q10 -8 22 -8" stroke="#ffffff" stroke-width="6" stroke-linecap="round" opacity="0.55" fill="none"/>`,
      vgrad(g, l, d, `<stop offset="0.5" stop-color="${m}"/>`),
    ),
  };
}

/** أذن (يسار) — اليمين نفسها مقلوبة. الارتكاز بقاعدة الأذن */
export function catEar(color: keyof typeof CAT_COLORS | string) {
  const [, m, d] = CAT_COLORS[color] ?? CAT_COLORS.orange;
  return {
    w: 50,
    h: 56,
    svg: svg(
      50,
      56,
      `<path d="M6 52 C4 30 10 10 18 4 C24 8 40 22 46 46 Z" fill="${m}" stroke="${INK}" stroke-width="${SW}" stroke-linejoin="round"/>
       <path d="M14 44 C13 30 16 18 20 13 C25 18 33 28 36 40 Z" fill="#FF9CBF"/>
       <path d="M8 50 L44 46" stroke="${d}" stroke-width="2" opacity="0.4"/>`,
    ),
  };
}

export function catTail(color: keyof typeof CAT_COLORS | string) {
  const [l, m, d] = CAT_COLORS[color] ?? CAT_COLORS.orange;
  return {
    w: 70,
    h: 90,
    svg: svg(
      70,
      90,
      `<path d="M10 84 C30 80 44 64 40 44 C36 26 46 10 60 10" stroke="${INK}" stroke-width="22" stroke-linecap="round" fill="none"/>
       <path d="M10 84 C30 80 44 64 40 44 C36 26 46 10 60 10" stroke="${m}" stroke-width="13" stroke-linecap="round" fill="none"/>
       <path d="M44 30 C38 22 50 12 60 10" stroke="${d}" stroke-width="13" stroke-linecap="round" fill="none"/>
       <path d="M22 76 C32 70 36 62 36 52" stroke="${l}" stroke-width="4" stroke-linecap="round" fill="none" opacity="0.7"/>`,
    ),
  };
}

export type EyeKind = 'open' | 'happy' | 'closed' | 'scared' | 'wink';

/** عين واحدة (المشهد يحطها مرتين) */
export function catEye(kind: EyeKind) {
  const g = id('e');
  let body: string;
  switch (kind) {
    case 'open':
      body = `<ellipse cx="16" cy="19" rx="13" ry="16" fill="url(#${g})" stroke="${INK}" stroke-width="2.5"/>
              <ellipse cx="11" cy="12" rx="5" ry="6" fill="#fff"/><circle cx="20" cy="25" r="2.8" fill="#fff" opacity="0.9"/>`;
      break;
    case 'scared':
      body = `<ellipse cx="16" cy="19" rx="13" ry="16" fill="#fff" stroke="${INK}" stroke-width="3"/>
              <circle cx="16" cy="20" r="5" fill="${INK}"/><circle cx="14" cy="18" r="1.6" fill="#fff"/>`;
      break;
    case 'happy':
      body = `<path d="M4 22 Q16 6 28 22" stroke="${INK}" stroke-width="5" stroke-linecap="round" fill="none"/>`;
      break;
    case 'wink':
      body = `<path d="M4 18 Q16 26 28 18" stroke="${INK}" stroke-width="5" stroke-linecap="round" fill="none"/>`;
      break;
    case 'closed':
      body = `<path d="M5 20 Q16 28 27 20" stroke="${INK}" stroke-width="4.5" stroke-linecap="round" fill="none"/>`;
      break;
  }
  return { w: 32, h: 38, svg: svg(32, 38, body, rgrad(g, '#5B4A9A', '#1E1B3A', 0.4, 0.3)) };
}

export type MouthKind = 'smile' | 'open' | 'o' | 'flat';

export function catMouth(kind: MouthKind) {
  const nose = `<path d="M23 4 L33 4 Q28 11 28 11 Q28 11 23 4 Z" fill="#FF6F9C" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/>`;
  let m: string;
  switch (kind) {
    case 'smile':
      m = `<path d="M28 11 Q28 18 20 18 M28 11 Q28 18 36 18" stroke="${INK}" stroke-width="3" stroke-linecap="round" fill="none"/>`;
      break;
    case 'open':
      m = `<path d="M18 14 Q28 34 38 14 Z" fill="#B23A5A" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/><ellipse cx="28" cy="24" rx="6" ry="4" fill="#FF8FB1"/>`;
      break;
    case 'o':
      m = `<ellipse cx="28" cy="20" rx="6" ry="7" fill="#B23A5A" stroke="${INK}" stroke-width="3"/>`;
      break;
    case 'flat':
      m = `<path d="M21 17 L35 17" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>`;
      break;
  }
  return { w: 56, h: 36, svg: svg(56, 36, nose + m) };
}

/** وشاح سبير الأزرق (يميّزه عن باقي البزازين) */
export function scarf() {
  return {
    w: 96,
    h: 40,
    svg: svg(
      96,
      40,
      `<path d="M8 10 Q48 26 88 10 L90 20 Q48 38 6 20 Z" fill="#2E7BFF" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>
       <path d="M60 22 L70 38 L80 34 L72 18 Z" fill="#2E7BFF" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>
       <path d="M20 17 Q48 28 78 17" stroke="#8FC1FF" stroke-width="3" fill="none" stroke-linecap="round"/>`,
    ),
  };
}

/** وجه بزون كامل برسمة وحدة (للملصقات والأيقونات): أذنين + راس + عيون + حلگ */
export function catFace(color: keyof typeof CAT_COLORS | string, eye: EyeKind = 'open', mouth: MouthKind = 'smile') {
  const inner = (a: { svg: string }) => a.svg.replace(/^<svg[^>]*>/, '').replace(/<\/svg>$/, '');
  const ear = inner(catEar(color));
  return {
    w: 130,
    h: 118,
    svg: svg(
      130,
      118,
      `<g transform="translate(8 4) rotate(-12 25 52)">${ear}</g>
       <g transform="translate(122 4) scale(-1 1) rotate(-12 25 52)">${ear}</g>
       <g transform="translate(3 14)">${inner(catHead(color))}</g>
       <g transform="translate(30 48)">${inner(catEye(eye))}</g>
       <g transform="translate(68 48)">${inner(catEye(eye))}</g>
       <g transform="translate(37 82)">${inner(catMouth(mouth))}</g>`,
    ),
  };
}
