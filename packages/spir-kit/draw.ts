/** ألوان «ملكي» وأدوات رسم مشتركة لكل الألعاب */
export const COLORS = {
  royal: '#1A23C9',
  navy: '#0B1033',
  yellow: '#FFD60A',
  bg: '#EEF0FF',
  card: '#FFFFFF',
  cardAlt: '#E6E9FB',
  soft: '#E3E6FF',
  border: '#C9CEF5',
  muted: '#4A5185',
  orange: '#E8590C',
  pink: '#E0398B',
  green: '#1C8B4A',
  teal: '#0F9B8E',
  violet: '#6B3FD6',
  red: '#D92D20',
} as const;

export const FONT = "'Readex Pro', Tahoma, 'Noto Sans Arabic', 'Segoe UI', sans-serif";

export function rrect(c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  const rr = Math.min(r, w / 2, h / 2);
  c.beginPath();
  c.moveTo(x + rr, y);
  c.arcTo(x + w, y, x + w, y + h, rr);
  c.arcTo(x + w, y + h, x, y + h, rr);
  c.arcTo(x, y + h, x, y, rr);
  c.arcTo(x, y, x + w, y, rr);
  c.closePath();
}

export function text(c: CanvasRenderingContext2D, s: string, x: number, y: number, o: { size?: number; color?: string; weight?: number; align?: CanvasTextAlign } = {}) {
  c.font = `${o.weight ?? 700} ${o.size ?? 16}px ${FONT}`;
  c.fillStyle = o.color ?? COLORS.navy;
  c.textAlign = o.align ?? 'center';
  c.textBaseline = 'middle';
  c.direction = 'rtl';
  c.fillText(s, x, y);
}

/** زر «ملكي»: أصفر بظل كحلي حاد (أو أبيض بإطار) */
export function button(c: CanvasRenderingContext2D, b: { x: number; y: number; w: number; h: number; label: string; primary?: boolean; disabled?: boolean }) {
  c.save();
  c.globalAlpha = b.disabled ? 0.4 : 1;
  if (b.primary) {
    rrect(c, b.x, b.y + 3, b.w, b.h, 10);
    c.fillStyle = COLORS.navy;
    c.fill();
  }
  rrect(c, b.x, b.y, b.w, b.h, 10);
  c.fillStyle = b.primary ? COLORS.yellow : COLORS.card;
  c.fill();
  if (!b.primary) {
    c.lineWidth = 2;
    c.strokeStyle = COLORS.border;
    c.stroke();
  }
  text(c, b.label, b.x + b.w / 2, b.y + b.h / 2 + 1, { size: 14, color: b.primary ? COLORS.navy : COLORS.royal });
  c.restore();
}

export const hit = (b: { x: number; y: number; w: number; h: number }, x: number, y: number) => x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h;

export function star(c: CanvasRenderingContext2D, x: number, y: number, r: number, fill: string) {
  c.beginPath();
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const rad = i % 2 === 0 ? r : r * 0.45;
    c.lineTo(x + Math.cos(a) * rad, y + Math.sin(a) * rad);
  }
  c.closePath();
  c.fillStyle = fill;
  c.fill();
}

/** أشكال تميّز الألوان (لعمى الألوان) */
export type Shape = 'circle' | 'triangle' | 'star' | 'square' | 'diamond' | 'heart' | 'moon' | 'drop' | 'flower' | 'hexagon';

export function shape(c: CanvasRenderingContext2D, kind: Shape, x: number, y: number, r: number, fill: string) {
  c.fillStyle = fill;
  c.beginPath();
  switch (kind) {
    case 'circle':
      c.arc(x, y, r, 0, Math.PI * 2);
      break;
    case 'triangle':
      c.moveTo(x, y - r);
      c.lineTo(x + r * 0.95, y + r * 0.75);
      c.lineTo(x - r * 0.95, y + r * 0.75);
      break;
    case 'star':
      star(c, x, y, r * 1.1, fill);
      return;
    case 'square':
      rrect(c, x - r * 0.85, y - r * 0.85, r * 1.7, r * 1.7, r * 0.3);
      break;
    case 'diamond':
      c.moveTo(x, y - r * 1.1);
      c.lineTo(x + r * 0.85, y);
      c.lineTo(x, y + r * 1.1);
      c.lineTo(x - r * 0.85, y);
      break;
    case 'heart':
      c.moveTo(x, y + r * 0.9);
      c.bezierCurveTo(x - r * 1.4, y - r * 0.1, x - r * 0.6, y - r * 1.2, x, y - r * 0.4);
      c.bezierCurveTo(x + r * 0.6, y - r * 1.2, x + r * 1.4, y - r * 0.1, x, y + r * 0.9);
      break;
    case 'moon':
      c.arc(x, y, r, Math.PI * 0.25, Math.PI * 1.75, false);
      c.arc(x + r * 0.45, y - r * 0.1, r * 0.75, Math.PI * 1.6, Math.PI * 0.4, true);
      break;
    case 'drop':
      c.moveTo(x, y - r * 1.15);
      c.bezierCurveTo(x + r * 0.2, y - r * 0.6, x + r, y, x + r * 0.9, y + r * 0.3);
      c.arc(x, y + r * 0.25, r * 0.9, 0, Math.PI, false);
      c.bezierCurveTo(x - r, y, x - r * 0.2, y - r * 0.6, x, y - r * 1.15);
      break;
    case 'flower':
      for (let i = 0; i < 5; i++) {
        const a = (i * Math.PI * 2) / 5 - Math.PI / 2;
        c.moveTo(x + Math.cos(a) * r * 0.55 + r * 0.45, y + Math.sin(a) * r * 0.55);
        c.arc(x + Math.cos(a) * r * 0.55, y + Math.sin(a) * r * 0.55, r * 0.45, 0, Math.PI * 2);
      }
      break;
    case 'hexagon':
      for (let i = 0; i < 6; i++) {
        const a = (i * Math.PI) / 3;
        c.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r);
      }
      break;
  }
  c.closePath();
  c.fill();
}

/** رأس بزون: دائرة وأذنين وعيون وخشم صغير. `look` يحرّك العيون باتجاه */
export function catHead(c: CanvasRenderingContext2D, x: number, y: number, r: number, fill: string, o: { look?: [number, number]; sleepy?: boolean; scared?: boolean } = {}) {
  c.save();
  c.lineJoin = 'round';
  // الأذنين
  c.fillStyle = fill;
  c.strokeStyle = COLORS.navy;
  c.lineWidth = Math.max(1.5, r * 0.12);
  for (const s of [-1, 1]) {
    c.beginPath();
    c.moveTo(x + s * r * 0.85, y - r * 0.15);
    c.lineTo(x + s * r * 0.8, y - r * 1.15);
    c.lineTo(x + s * r * 0.2, y - r * 0.8);
    c.closePath();
    c.fill();
    c.stroke();
  }
  // الراس
  c.beginPath();
  c.ellipse(x, y, r, r * 0.88, 0, 0, Math.PI * 2);
  c.fill();
  c.stroke();
  // العيون
  const [lx, ly] = o.look ?? [0, 0];
  c.fillStyle = COLORS.navy;
  for (const s of [-1, 1]) {
    c.beginPath();
    if (o.sleepy) {
      c.lineWidth = Math.max(1.5, r * 0.1);
      c.arc(x + s * r * 0.38, y - r * 0.05, r * 0.16, 0.15 * Math.PI, 0.85 * Math.PI);
      c.stroke();
    } else {
      const er = o.scared ? r * 0.18 : r * 0.14;
      c.arc(x + s * r * 0.38 + lx * r * 0.06, y - r * 0.08 + ly * r * 0.06, er, 0, Math.PI * 2);
      c.fill();
    }
  }
  // الخشم والحلگ
  c.beginPath();
  c.moveTo(x - r * 0.1, y + r * 0.18);
  c.lineTo(x + r * 0.1, y + r * 0.18);
  c.lineTo(x, y + r * 0.3);
  c.closePath();
  c.fill();
  c.lineWidth = Math.max(1, r * 0.08);
  c.beginPath();
  c.moveTo(x, y + r * 0.3);
  c.quadraticCurveTo(x - r * 0.12, y + r * 0.45, x - r * 0.26, y + r * 0.36);
  c.moveTo(x, y + r * 0.3);
  c.quadraticCurveTo(x + r * 0.12, y + r * 0.45, x + r * 0.26, y + r * 0.36);
  c.stroke();
  c.restore();
}
