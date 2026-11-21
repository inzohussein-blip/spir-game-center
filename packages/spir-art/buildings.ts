/** أماكن الخريطة: كل لعبة إلها بناية صغيرة على منصة عشب */
import { id, INK, shade, svg, vgrad } from './style.ts';

const W = 170;
const H = 170;

/** منصة عشب دائرية (الأساس تحت كل بناية) */
const base = (gid: string) =>
  `<ellipse cx="85" cy="146" rx="78" ry="22" fill="#000" opacity="0.18"/>
   <ellipse cx="85" cy="136" rx="76" ry="26" fill="#2FA866" stroke="${INK}" stroke-width="4"/>
   <ellipse cx="85" cy="130" rx="72" ry="22" fill="url(#${gid})"/>
   <path d="M30 128 q8 -6 14 0 M120 124 q8 -6 14 0" stroke="#2E9A5C" stroke-width="3" fill="none" stroke-linecap="round"/>`;

const grassGrad = (gid: string) => vgrad(gid, '#8BEA9E', '#4CC778');

const wrap = (body: string, defs = '') => {
  const g = id('gb');
  return { w: W, h: H, svg: svg(W, H, base(g) + body, grassGrad(g) + defs) };
};

/** بيت سبير: سطح بأذنين بزون */
export function houseBuilding() {
  const r = id('hr');
  return wrap(
    `<rect x="45" y="72" width="80" height="60" rx="8" fill="#FFF3DD" stroke="${INK}" stroke-width="4"/>
     <path d="M34 78 L85 34 L136 78 Z" fill="url(#${r})" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>
     <path d="M50 64 L46 30 L70 50 Z M120 64 L124 30 L100 50 Z" fill="#FF9F43" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>
     <path d="M52 58 L50 40 L62 50 Z M118 58 L120 40 L108 50 Z" fill="#FF9CBF"/>
     <rect x="74" y="98" width="22" height="34" rx="11" fill="#B86A2A" stroke="${INK}" stroke-width="3.5"/>
     <circle cx="91" cy="116" r="2.5" fill="${INK}"/>
     <rect x="54" y="86" width="16" height="16" rx="4" fill="#9FD8FF" stroke="${INK}" stroke-width="3"/>
     <rect x="100" y="86" width="16" height="16" rx="4" fill="#9FD8FF" stroke="${INK}" stroke-width="3"/>`,
    vgrad(r, '#FF8A6B', '#E0503A'),
  );
}

/** حديقة البزازين (نزّل البزون): لوحة خشب وفتحات */
export function gardenBuilding() {
  return wrap(
    `<rect x="40" y="60" width="90" height="66" rx="12" fill="#7B5CFF" stroke="${INK}" stroke-width="4"/>
     <rect x="48" y="68" width="74" height="50" rx="8" fill="#F4F7E8"/>
     <circle cx="66" cy="94" r="12" fill="#FF9F43" stroke="${INK}" stroke-width="3"/><circle cx="66" cy="94" r="7" fill="#1E1840"/>
     <rect x="84" y="74" width="32" height="14" rx="6" fill="#E39A52" stroke="${INK}" stroke-width="3"/>
     <rect x="96" y="92" width="14" height="22" rx="6" fill="#E39A52" stroke="${INK}" stroke-width="3"/>
     <path d="M60 60 L60 40 L110 40 L110 60" stroke="${INK}" stroke-width="4" fill="none"/>
     <rect x="62" y="30" width="46" height="18" rx="6" fill="#FFC93C" stroke="${INK}" stroke-width="3.5"/>`,
  );
}

/** مرج الشجيرات (حاصر البزون) */
export function meadowBuilding() {
  const b = (x: number, y: number, s: number, c: string) =>
    `<path d="M${x - 18 * s} ${y} C${x - 26 * s} ${y - 16 * s} ${x - 10 * s} ${y - 30 * s} ${x} ${y - 24 * s} C${x + 10 * s} ${y - 34 * s} ${x + 28 * s} ${y - 18 * s} ${x + 18 * s} ${y} Z" fill="${c}" stroke="${INK}" stroke-width="3.5" stroke-linejoin="round"/>`;
  return wrap(
    `${b(50, 120, 1.2, '#3DBF72')}${b(120, 118, 1.3, '#2FA866')}${b(85, 104, 1.6, '#4CD584')}
     <circle cx="62" cy="100" r="4" fill="#FF6B8A" stroke="${INK}" stroke-width="1.5"/><circle cx="110" cy="96" r="4" fill="#FFD84A" stroke="${INK}" stroke-width="1.5"/>
     <path d="M82 50 L82 80" stroke="${INK}" stroke-width="4"/><path d="M82 50 L108 58 L82 66 Z" fill="#FF6B5B" stroke="${INK}" stroke-width="3.5" stroke-linejoin="round"/>`,
  );
}

/** مختبر السبيرات (دمج المخلوقات): قبة زجاج */
export function labBuilding() {
  const d = id('ld');
  return wrap(
    `<rect x="44" y="88" width="82" height="42" rx="8" fill="#4FB8FF" stroke="${INK}" stroke-width="4"/>
     <path d="M48 90 A37 37 0 0 1 122 90 Z" fill="url(#${d})" stroke="${INK}" stroke-width="4"/>
     <circle cx="72" cy="74" r="9" fill="#FF7AB6" stroke="${INK}" stroke-width="3"/><circle cx="96" cy="68" r="12" fill="#3DD68C" stroke="${INK}" stroke-width="3"/>
     <circle cx="69" cy="72" r="2" fill="${INK}"/><circle cx="75" cy="72" r="2" fill="${INK}"/><circle cx="92" cy="66" r="2.4" fill="${INK}"/><circle cx="100" cy="66" r="2.4" fill="${INK}"/>
     <path d="M66 62 q8 -10 18 -6" stroke="#fff" stroke-width="4" fill="none" stroke-linecap="round" opacity="0.7"/>
     <rect x="74" y="104" width="22" height="26" rx="5" fill="#2C8AD6" stroke="${INK}" stroke-width="3"/>`,
    vgrad(d, '#E8F6FF', '#9FD8FF'),
  );
}

/** مصنع الحلوى (بلوكات الحلوى) */
export function candyBuilding() {
  const c = ['#FF6B5B', '#FFC93C', '#3DD68C', '#4FB8FF', '#9B7BFF', '#FF7AB6'];
  const blocks = [
    [52, 96, 0], [76, 96, 1], [100, 96, 2], [64, 74, 3], [88, 74, 4], [76, 52, 5],
  ]
    .map(([x, y, k]) => `<rect x="${x}" y="${y}" width="22" height="22" rx="6" fill="${c[k]}" stroke="${INK}" stroke-width="3"/><rect x="${x + 4}" y="${y + 3}" width="10" height="4" rx="2" fill="#fff" opacity="0.6"/>`)
    .join('');
  return wrap(`<rect x="44" y="118" width="86" height="14" rx="5" fill="#FFF3DD" stroke="${INK}" stroke-width="3.5"/>${blocks}`);
}

/** ساحة التحدي (أربعة بخط): لوحة بقطع */
export function arenaBuilding() {
  const disc = (x: number, y: number, c: string) => `<circle cx="${x}" cy="${y}" r="7" fill="${c}" stroke="${INK}" stroke-width="2"/>`;
  return wrap(
    `<rect x="46" y="50" width="78" height="76" rx="12" fill="#4FB8FF" stroke="${INK}" stroke-width="4"/>
     ${[0, 1, 2, 3].map((r) => [0, 1, 2, 3].map((k) => disc(60 + k * 17, 64 + r * 17, (r + k) % 3 === 0 ? '#FFC93C' : (r * k) % 2 ? '#FF6B5B' : '#E8F6FF')).join('')).join('')}
     <path d="M40 126 L130 126" stroke="${INK}" stroke-width="5" stroke-linecap="round"/>
     <path d="M54 50 L54 30 M116 50 L116 30" stroke="${INK}" stroke-width="3.5"/>
     <path d="M54 30 L70 35 L54 40 Z" fill="#FFC93C" stroke="${INK}" stroke-width="2.5"/><path d="M116 30 L100 35 L116 40 Z" fill="#FF6B5B" stroke="${INK}" stroke-width="2.5"/>`,
  );
}

/** صالة الكلاسيكيات (الألعاب القديمة) */
export function arcadeBuilding() {
  const s = id('as');
  return wrap(
    `<rect x="48" y="62" width="74" height="68" rx="10" fill="#9B7BFF" stroke="${INK}" stroke-width="4"/>
     <rect x="58" y="72" width="54" height="34" rx="6" fill="url(#${s})" stroke="${INK}" stroke-width="3"/>
     <path d="M70 88 h10 M75 83 v10" stroke="#3DD68C" stroke-width="3.5" stroke-linecap="round"/><circle cx="96" cy="86" r="4" fill="#FF6B5B"/><circle cx="104" cy="92" r="4" fill="#FFC93C"/>
     <rect x="66" y="112" width="38" height="10" rx="5" fill="${shade('#9B7BFF', -0.3)}"/>
     <rect x="54" y="40" width="62" height="20" rx="8" fill="#FFC93C" stroke="${INK}" stroke-width="3.5"/>
     <circle cx="66" cy="50" r="3" fill="#FF6B5B"/><circle cx="85" cy="50" r="3" fill="#FF6B5B"/><circle cx="104" cy="50" r="3" fill="#FF6B5B"/>`,
    vgrad(s, '#2A2160', '#120E30'),
  );
}

/** قفل (للأماكن المسكّرة) */
export function lockBadge() {
  return {
    w: 56,
    h: 60,
    svg: svg(
      56,
      60,
      `<path d="M16 26 V18 a12 12 0 0 1 24 0 V26" stroke="${INK}" stroke-width="6" fill="none"/>
       <path d="M16 26 V18 a12 12 0 0 1 24 0 V26" stroke="#C9CEF5" stroke-width="3" fill="none"/>
       <rect x="8" y="24" width="40" height="32" rx="9" fill="#FFC93C" stroke="${INK}" stroke-width="4"/>
       <circle cx="28" cy="38" r="4.5" fill="${INK}"/><rect x="26" y="40" width="4" height="9" rx="2" fill="${INK}"/>`,
    ),
  };
}

/** شجرة زينة */
export function tree(kind = 0) {
  const c = ['#3DBF72', '#2FA866', '#55D68A'][kind % 3];
  return {
    w: 60,
    h: 80,
    svg: svg(
      60,
      80,
      `<ellipse cx="30" cy="74" rx="18" ry="5" fill="#000" opacity="0.15"/>
       <rect x="25" y="48" width="10" height="26" rx="4" fill="#A0622D" stroke="${INK}" stroke-width="3"/>
       <circle cx="30" cy="32" r="24" fill="${c}" stroke="${INK}" stroke-width="3.5"/>
       <path d="M18 24 q8 -10 18 -8" stroke="#fff" stroke-width="4" fill="none" stroke-linecap="round" opacity="0.45"/>`,
    ),
  };
}

export function flower(color = '#FF7AB6') {
  return {
    w: 24,
    h: 24,
    svg: svg(24, 24, `${[0, 1, 2, 3, 4].map((i) => { const a = (i * Math.PI * 2) / 5; return `<circle cx="${12 + Math.cos(a) * 6}" cy="${12 + Math.sin(a) * 6}" r="4.5" fill="${color}"/>`; }).join('')}<circle cx="12" cy="12" r="3.5" fill="#FFE27A"/>`),
  };
}

/** بحر بموجات (خلفية الخريطة) */
export function sea(w: number, h: number) {
  const g = id('sea');
  const waves = Array.from({ length: Math.ceil(h / 90) }, (_, i) => `<path d="M${(i * 53) % 60} ${i * 90 + 40} q15 -8 30 0 t30 0" stroke="#fff" stroke-width="3" fill="none" opacity="0.35" stroke-linecap="round"/><path d="M${w - 90 + ((i * 37) % 50)} ${i * 90 + 75} q15 -8 30 0 t30 0" stroke="#fff" stroke-width="3" fill="none" opacity="0.35" stroke-linecap="round"/>`).join('');
  return { w, h, svg: svg(w, h, `<rect width="${w}" height="${h}" fill="url(#${g})"/>${waves}`, vgrad(g, '#6FD0FF', '#2FA3E8')) };
}

/** الجزيرة: شكل عشب كبير بحافة رمل (عرض w وارتفاع h) */
export function island(w: number, h: number) {
  const g = id('is');
  const m = 22;
  const wob = Array.from({ length: 12 }, (_, i) => {
    const y = m + ((h - m * 2) * i) / 11;
    const dx = Math.sin(i * 1.7) * 10;
    return [m + 6 + dx, y];
  });
  const left = wob.map(([x, y]) => `${x},${y}`).join(' L');
  const right = [...wob].reverse().map(([x, y]) => `${w - x},${y}`).join(' L');
  return {
    w,
    h,
    svg: svg(
      w,
      h,
      `<path d="M${left} L${right} Z" fill="#F5D58A" stroke="${INK}" stroke-width="5" stroke-linejoin="round" transform="translate(0 6)"/>
       <path d="M${left} L${right} Z" fill="#F5D58A" stroke="${INK}" stroke-width="5" stroke-linejoin="round"/>
       <path d="M${left} L${right} Z" fill="url(#${g})" transform="translate(${w * 0.04} ${h * 0.012}) scale(0.92 0.976)"/>`,
      vgrad(g, '#7EDB8E', '#58C878'),
    ),
  };
}
