/**
 * دليل الأسلوب لـ «عالم سبير»: ألوان وأدوات SVG مشتركة.
 * كل الرسوم: حد داكن ناعم، تدرّج من فوق لجوه، لمعة فوق، وظل تحت.
 */
export const INK = '#2A2350';

export const PALETTE = {
  sky: '#4FB8FF',
  sun: '#FFC93C',
  coral: '#FF6B5B',
  leaf: '#3DD68C',
  grape: '#7B5CFF',
  ink: '#1E1B3A',
  cream: '#FFF7EA',
} as const;

/** ألوان البزازين: [فاتح، أساسي، غامق] */
export const CAT_COLORS: Record<string, [string, string, string]> = {
  orange: ['#FFC27A', '#FF9F43', '#E07A1F'],
  pink: ['#FFB3D6', '#FF7AB6', '#E0559A'],
  mint: ['#9BF0C6', '#3DD68C', '#22A86A'],
  blue: ['#A8DBFF', '#4FB8FF', '#2C8AD6'],
  grape: ['#C9B8FF', '#9B7BFF', '#6F4FE0'],
  gray: ['#E2E4EE', '#B8BCCF', '#8A8FA8'],
};

let uid = 0;
/** معرّف فريد للتدرجات داخل كل SVG */
export const id = (p: string) => `${p}${++uid}`;

export const svg = (w: number, h: number, body: string, defs = '') =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><defs>${defs}</defs>${body}</svg>`;

export const vgrad = (gid: string, top: string, bottom: string, stops = '') =>
  `<linearGradient id="${gid}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${top}"/>${stops}<stop offset="1" stop-color="${bottom}"/></linearGradient>`;

export const rgrad = (gid: string, inner: string, outer: string, cx = 0.35, cy = 0.3) =>
  `<radialGradient id="${gid}" cx="${cx}" cy="${cy}" r="0.8"><stop offset="0" stop-color="${inner}"/><stop offset="1" stop-color="${outer}"/></radialGradient>`;

/** يفتّح أو يغمّق لون hex بنسبة (-1..1) */
export function shade(hex: string, k: number): string {
  const n = parseInt(hex.slice(1), 16);
  const ch = [n >> 16, (n >> 8) & 255, n & 255].map((v) => Math.round(k >= 0 ? v + (255 - v) * k : v * (1 + k)));
  return '#' + ch.map((v) => Math.max(0, Math.min(255, v)).toString(16).padStart(2, '0')).join('');
}
