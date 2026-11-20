/**
 * منطق «نزّل البزون»: شبكة مربعة فيها بزازين ملوّنة، قطع منزلقة، صناديق ثابتة، وفتحات ملوّنة.
 * - كل قطعة تنزلق بخط مستقيم لحد ما تصطدم (الحافة، صندوق، أو قطعة ثانية).
 * - القطعة الأفقية (عرضها > 1) تتحرك يمين/يسار بس، والعمودية فوق/جوه بس، والبزون بكل الاتجاهات.
 * - إذا عبر البزون فوق فتحة بلونه يطيح بيها ويختفي. الفتحات ما تمنع الحركة.
 * - الفوز: كل البزازين طاحت.
 */
export type Dir = 'up' | 'down' | 'left' | 'right';
export const DIRS: Dir[] = ['up', 'down', 'left', 'right'];
const DELTA: Record<Dir, [number, number]> = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };

export type Cat = { x: number; y: number; color: number };
export type Block = { x: number; y: number; w: number; h: number };
export type Cell = { x: number; y: number };
export type Hole = Cell & { color: number };

export type LevelDef = {
  size: number;
  cats: Cat[];
  holes: Hole[];
  blocks: Block[];
  walls: Cell[];
  /** أقل عدد حركات للحل (يحسبه المحلّل) */
  par: number;
  /** ثواني المؤقت (بالصعب بس) */
  time?: number;
};

/** الحالة: مكان كل بزون (x=-1 يعني طاح) ومكان كل قطعة */
export type State = { cats: Cat[]; blocks: Block[] };

export const initialState = (l: LevelDef): State => ({ cats: l.cats.map((c) => ({ ...c })), blocks: l.blocks.map((b) => ({ ...b })) });

export const won = (s: State) => s.cats.every((c) => c.x < 0);

export type Piece = { kind: 'cat' | 'block'; i: number };

/** الاتجاهات المسموحة لكل قطعة */
export function canDir(s: State, p: Piece, d: Dir): boolean {
  if (p.kind === 'cat') return true;
  const b = s.blocks[p.i];
  if (b.w > 1) return d === 'left' || d === 'right';
  if (b.h > 1) return d === 'up' || d === 'down';
  return true;
}

function occupied(l: LevelDef, s: State, x: number, y: number, skip: Piece): boolean {
  if (x < 0 || y < 0 || x >= l.size || y >= l.size) return true;
  if (l.walls.some((w) => w.x === x && w.y === y)) return true;
  for (let i = 0; i < s.cats.length; i++) {
    if (skip.kind === 'cat' && skip.i === i) continue;
    const c = s.cats[i];
    if (c.x === x && c.y === y) return true;
  }
  for (let i = 0; i < s.blocks.length; i++) {
    if (skip.kind === 'block' && skip.i === i) continue;
    const b = s.blocks[i];
    if (x >= b.x && x < b.x + b.w && y >= b.y && y < b.y + b.h) return true;
  }
  return false;
}

export type MoveResult = { state: State; steps: number; fell: boolean };

/** يحرّك قطعة باتجاه لحد ما تصطدم. يرجع null إذا ما تحركت ولا خطوة */
export function slide(l: LevelDef, s: State, p: Piece, d: Dir): MoveResult | null {
  if (!canDir(s, p, d)) return null;
  const [dx, dy] = DELTA[d];
  if (p.kind === 'cat') {
    const cat = s.cats[p.i];
    if (cat.x < 0) return null;
    let { x, y } = cat;
    let steps = 0;
    while (!occupied(l, s, x + dx, y + dy, p)) {
      x += dx;
      y += dy;
      steps++;
      if (l.holes.some((h) => h.x === x && h.y === y && h.color === cat.color)) {
        const cats = s.cats.map((c, i) => (i === p.i ? { ...c, x: -1, y: -1 } : c));
        return { state: { cats, blocks: s.blocks }, steps, fell: true };
      }
    }
    if (steps === 0) return null;
    const cats = s.cats.map((c, i) => (i === p.i ? { ...c, x, y } : c));
    return { state: { cats, blocks: s.blocks }, steps, fell: false };
  }
  const b = s.blocks[p.i];
  let { x, y } = b;
  let steps = 0;
  const free = (nx: number, ny: number) => {
    for (let yy = ny; yy < ny + b.h; yy++) for (let xx = nx; xx < nx + b.w; xx++) {
      const inside = xx >= x && xx < x + b.w && yy >= y && yy < y + b.h;
      if (!inside && occupied(l, s, xx, yy, p)) return false;
    }
    return true;
  };
  while (free(x + dx, y + dy)) {
    x += dx;
    y += dy;
    steps++;
  }
  if (steps === 0) return null;
  const blocks = s.blocks.map((bb, i) => (i === p.i ? { ...bb, x, y } : bb));
  return { state: { cats: s.cats, blocks }, steps, fell: false };
}

export const keyOf = (s: State) => s.cats.map((c) => `${c.x},${c.y}`).join(';') + '|' + s.blocks.map((b) => `${b.x},${b.y}`).join(';');

export type Move = { piece: Piece; dir: Dir };

export function allMoves(l: LevelDef, s: State): { move: Move; res: MoveResult }[] {
  const out: { move: Move; res: MoveResult }[] = [];
  const pieces: Piece[] = [...s.cats.map((_, i) => ({ kind: 'cat' as const, i })), ...s.blocks.map((_, i) => ({ kind: 'block' as const, i }))];
  for (const piece of pieces) for (const dir of DIRS) {
    const res = slide(l, s, piece, dir);
    if (res) out.push({ move: { piece, dir }, res });
  }
  return out;
}

/** المحلّل (BFS): أقصر حل كسلسلة حركات، أو null إذا مستحيلة أو أكبر من الحد */
export function solve(l: LevelDef, from: State = initialState(l), maxNodes = 200_000): Move[] | null {
  if (won(from)) return [];
  const seen = new Map<string, { prev: string | null; move: Move | null }>();
  const startKey = keyOf(from);
  seen.set(startKey, { prev: null, move: null });
  const queue: State[] = [from];
  for (let h = 0; h < queue.length; h++) {
    if (seen.size > maxNodes) return null;
    const cur = queue[h];
    const curKey = keyOf(cur);
    for (const { move, res } of allMoves(l, cur)) {
      const k = keyOf(res.state);
      if (seen.has(k)) continue;
      seen.set(k, { prev: curKey, move });
      if (won(res.state)) {
        const path: Move[] = [];
        let at: string | null = k;
        while (at) {
          const node = seen.get(at);
          if (!node?.move) break;
          path.unshift(node.move);
          at = node.prev;
        }
        return path;
      }
      queue.push(res.state);
    }
  }
  return null;
}

/** حركة البزون التلقائية (للصغار): اتجاه يوصله لفتحته مباشرة إذا موجود */
export function autoDropDir(l: LevelDef, s: State, catIndex: number): Dir | null {
  for (const d of DIRS) {
    const r = slide(l, s, { kind: 'cat', i: catIndex }, d);
    if (r?.fell) return d;
  }
  return null;
}

export function starsFor(par: number, moves: number, timeUp: boolean) {
  if (timeUp) return 0;
  return moves <= par ? 3 : moves <= par + 3 ? 2 : 1;
}

/** التحقق من صحة مرحلة: ماكو تداخل، كل بزون إله فتحة بلونه */
export function validate(l: LevelDef): string | null {
  const cells = new Set<string>();
  const put = (x: number, y: number, what: string) => {
    if (x < 0 || y < 0 || x >= l.size || y >= l.size) return `${what} برا الشبكة`;
    const k = `${x},${y}`;
    if (cells.has(k)) return `${what} متداخل عند ${k}`;
    cells.add(k);
    return null;
  };
  for (const w of l.walls) {
    const e = put(w.x, w.y, 'صندوق');
    if (e) return e;
  }
  for (const c of l.cats) {
    const e = put(c.x, c.y, 'بزون');
    if (e) return e;
    if (!l.holes.some((h) => h.color === c.color)) return 'بزون بدون فتحة';
  }
  for (const b of l.blocks) for (let y = b.y; y < b.y + b.h; y++) for (let x = b.x; x < b.x + b.w; x++) {
    const e = put(x, y, 'قطعة');
    if (e) return e;
  }
  for (const h of l.holes) if (l.walls.some((w) => w.x === h.x && w.y === h.y)) return 'فتحة تحت صندوق';
  return null;
}
