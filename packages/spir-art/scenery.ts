/** خلفيات العوالم: سماء متدرجة، شمس أو قمر، تلال، وغيوم (الغيوم قطع منفصلة تتحرك) */
import { id, INK, shade, svg, vgrad } from './style.ts';

export type Theme = { name: string; skyTop: string; skyBottom: string; hill1: string; hill2: string; ground: string; tile: string; night?: boolean; sea?: boolean; snow?: boolean; noSun?: boolean };

export const THEMES: Theme[] = [
  { name: 'الحديقة', skyTop: '#62C6FF', skyBottom: '#CFF0FF', hill1: '#7EDB8E', hill2: '#4CC074', ground: '#3FA862', tile: '#F4F7E8' },
  { name: 'الشاطئ', skyTop: '#3FB4FF', skyBottom: '#FFE7B8', hill1: '#46C6E8', hill2: '#2AA3D6', ground: '#F5D58A', tile: '#FFF4DA', sea: true },
  { name: 'الثلج', skyTop: '#8FB8FF', skyBottom: '#EEF4FF', hill1: '#FFFFFF', hill2: '#DDE7FF', ground: '#C9D8FF', tile: '#F3F7FF', snow: true },
  { name: 'الليل', skyTop: '#1B1447', skyBottom: '#4B3A9A', hill1: '#3A2F7A', hill2: '#2A2160', ground: '#231B52', tile: '#E9E4FF', night: true },
];

export function sky(t: Theme, w = 390, h = 900) {
  const g = id('s');
  const sunOrMoon = t.noSun
    ? ''
    : t.night
    ? `<circle cx="${w * 0.78}" cy="${h * 0.12}" r="34" fill="#FFF3C4"/><circle cx="${w * 0.78 + 14}" cy="${h * 0.12 - 8}" r="30" fill="${t.skyTop}"/>` +
      Array.from({ length: 40 }, (_, i) => {
        const x = (i * 97) % w;
        const y = ((i * 53) % (h * 0.5)) + 10;
        return `<circle cx="${x}" cy="${y}" r="${1 + (i % 3) * 0.6}" fill="#fff" opacity="${0.4 + (i % 4) * 0.15}"/>`;
      }).join('')
    : `<circle cx="${w * 0.8}" cy="${h * 0.1}" r="86" fill="url(#${g}glow)"/><circle cx="${w * 0.8}" cy="${h * 0.1}" r="38" fill="#FFD43B" stroke="#FFB800" stroke-width="4"/><circle cx="${w * 0.8 - 12}" cy="${h * 0.1 - 12}" r="9" fill="#FFF3B0" opacity="0.8"/>`;
  const hills = `
    <path d="M0 ${h * 0.72} C${w * 0.2} ${h * 0.6} ${w * 0.4} ${h * 0.66} ${w * 0.55} ${h * 0.62} C${w * 0.75} ${h * 0.57} ${w * 0.9} ${h * 0.64} ${w} ${h * 0.6} L${w} ${h} L0 ${h} Z" fill="${t.hill1}"/>
    <path d="M0 ${h * 0.8} C${w * 0.25} ${h * 0.72} ${w * 0.5} ${h * 0.78} ${w * 0.7} ${h * 0.74} C${w * 0.85} ${h * 0.71} ${w * 0.95} ${h * 0.75} ${w} ${h * 0.74} L${w} ${h} L0 ${h} Z" fill="${t.hill2}"/>
    <rect x="0" y="${h * 0.88}" width="${w}" height="${h * 0.12}" fill="${t.ground}"/>`;
  const sea = t.sea
    ? `<path d="M0 ${h * 0.7} Q${w * 0.25} ${h * 0.68} ${w * 0.5} ${h * 0.7} T${w} ${h * 0.7} L${w} ${h * 0.8} L0 ${h * 0.8} Z" fill="#FFFFFF" opacity="0.35"/>`
    : '';
  const snow = t.snow
    ? Array.from({ length: 30 }, (_, i) => `<circle cx="${(i * 71) % w}" cy="${(i * 113) % (h * 0.7)}" r="${2 + (i % 3)}" fill="#fff" opacity="0.8"/>`).join('')
    : '';
  const glow = `<radialGradient id="${g}glow"><stop offset="0.35" stop-color="#FFF4B0" stop-opacity="0.85"/><stop offset="1" stop-color="#FFF4B0" stop-opacity="0"/></radialGradient>`;
  return { w, h, svg: svg(w, h, `<rect width="${w}" height="${h}" fill="url(#${g})"/>${sunOrMoon}${hills}${sea}${snow}`, vgrad(g, t.skyTop, t.skyBottom) + glow) };
}

export function cloud(scale = 1, night = false) {
  const w = Math.round(140 * scale);
  const h = Math.round(70 * scale);
  const f = night ? '#6B5BB8' : '#FFFFFF';
  return {
    w,
    h,
    svg: svg(
      w,
      h,
      `<g transform="scale(${scale})" opacity="${night ? 0.5 : 0.95}"><path d="M20 60 C4 60 4 38 22 36 C22 18 44 10 58 22 C66 6 96 6 102 26 C122 22 134 40 122 52 C122 60 112 62 104 60 Z" fill="${f}"/><path d="M20 60 L104 60" stroke="${shade(f, -0.08)}" stroke-width="6" stroke-linecap="round"/></g>`,
    ),
  };
}

/** إطار اللوحة (مربع بحواف خشب أو حلوى) */
export function boardFrame(w: number, h: number, color = '#6A4BD8') {
  const g = id('bf');
  return {
    w,
    h,
    svg: svg(
      w,
      h,
      `<rect x="0" y="8" width="${w}" height="${h - 8}" rx="28" fill="${INK}" opacity="0.35"/>
       <rect x="2" y="2" width="${w - 4}" height="${h - 10}" rx="26" fill="url(#${g})" stroke="${INK}" stroke-width="5"/>
       <rect x="14" y="12" width="${w - 28}" height="10" rx="5" fill="#fff" opacity="0.3"/>`,
      vgrad(g, shade(color, 0.2), shade(color, -0.15)),
    ),
  };
}
