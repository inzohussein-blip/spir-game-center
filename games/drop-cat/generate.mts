/// <reference types="node" />
/**
 * مولّد مراحل «نزّل البزون»: يولّد مراحل عشوائية ببذرة ثابتة، والمحلّل يتأكد إنها تنحل
 * ويحسب أقل عدد حركات (par). المراحل تترتب من الأسهل للأصعب وتنحفظ بـ levels.json.
 * التشغيل: node games/drop-cat/generate.mts
 */
import { writeFileSync } from 'node:fs';
import { rng } from '../../packages/spir-kit/rng.ts';
import { initialState, slide, solve, validate, type LevelDef } from './logic.ts';

type Spec = { sizes: number[]; cats: [number, number]; blocks: [number, number]; walls: [number, number]; par: [number, number]; long: number };

const SPECS: Record<'easy' | 'medium' | 'hard', Spec> = {
  easy: { sizes: [4, 5], cats: [1, 2], blocks: [1, 3], walls: [0, 0], par: [2, 5], long: 0 },
  medium: { sizes: [5, 6], cats: [2, 2], blocks: [3, 5], walls: [0, 1], par: [5, 9], long: 1 },
  hard: { sizes: [6, 6], cats: [2, 3], blocks: [4, 6], walls: [1, 2], par: [8, 15], long: 2 },
};
const PER_LEVEL = 20;

function attempt(spec: Spec, seed: number): LevelDef | null {
  const r = rng(seed);
  const size = r.pick(spec.sizes);
  const taken = new Set<string>();
  const freeCell = () => {
    for (let t = 0; t < 50; t++) {
      const x = r.int(0, size - 1);
      const y = r.int(0, size - 1);
      if (!taken.has(`${x},${y}`)) return { x, y };
    }
    return null;
  };
  const nCats = r.int(...spec.cats);
  const holes: LevelDef['holes'] = [];
  const cats: LevelDef['cats'] = [];
  const walls: LevelDef['walls'] = [];
  const blocks: LevelDef['blocks'] = [];
  // الفتحات أول (ما تحجز الخانة — القطع تگدر تعبر فوقها)
  const holeCells = new Set<string>();
  for (let c = 0; c < nCats; c++) {
    let h = freeCell();
    while (h && holeCells.has(`${h.x},${h.y}`)) h = freeCell();
    if (!h) return null;
    holeCells.add(`${h.x},${h.y}`);
    holes.push({ ...h, color: c });
  }
  for (let i = r.int(...spec.walls); i > 0; i--) {
    const w = freeCell();
    if (!w || holeCells.has(`${w.x},${w.y}`)) continue;
    taken.add(`${w.x},${w.y}`);
    walls.push(w);
  }
  for (let c = 0; c < nCats; c++) {
    const p = freeCell();
    if (!p || holeCells.has(`${p.x},${p.y}`)) return null;
    taken.add(`${p.x},${p.y}`);
    cats.push({ ...p, color: c });
  }
  const nBlocks = r.int(...spec.blocks);
  for (let i = 0; i < nBlocks; i++) {
    const len = r.next() < 0.7 ? 2 : spec.long > 0 && r.next() < 0.5 ? 3 : 1;
    const horiz = r.next() < 0.5;
    const w = horiz ? len : 1;
    const h = horiz ? 1 : len;
    let placed = false;
    for (let t = 0; t < 30 && !placed; t++) {
      const x = r.int(0, size - w);
      const y = r.int(0, size - h);
      let ok = true;
      for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++) if (taken.has(`${xx},${yy}`)) ok = false;
      if (!ok) continue;
      for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++) taken.add(`${xx},${yy}`);
      blocks.push({ x, y, w, h });
      placed = true;
    }
  }
  const level: LevelDef = { size, cats, holes, blocks, walls, par: 0 };
  if (validate(level)) return null;
  // ما نريد مرحلة يطيح بيها بزون بأول حركة بدون تفكير لكل البزازين
  const s0 = initialState(level);
  const direct = cats.filter((_, i) => ['up', 'down', 'left', 'right'].some((d) => slide(level, s0, { kind: 'cat', i }, d as 'up')?.fell)).length;
  if (direct === cats.length && cats.length > 1) return null;
  const sol = solve(level, s0, 120_000);
  if (!sol) return null;
  level.par = sol.length;
  if (level.par < spec.par[0] || level.par > spec.par[1]) return null;
  return level;
}

const out: Record<string, LevelDef[]> = {};
for (const [name, spec] of Object.entries(SPECS)) {
  const found: LevelDef[] = [];
  const seen = new Set<string>();
  for (let seed = 1; found.length < PER_LEVEL * 3 && seed < 400_000; seed++) {
    const l = attempt(spec, seed * 977 + name.length);
    if (!l) continue;
    const k = JSON.stringify(l);
    if (seen.has(k)) continue;
    seen.add(k);
    found.push(l);
  }
  if (found.length < PER_LEVEL) throw new Error(`${name}: ${found.length} مراحل بس`);
  // نختار 20 موزعة على الصعوبة ونرتبها من الأسهل
  found.sort((a, b) => a.par - b.par || a.size - b.size);
  const pick: LevelDef[] = [];
  for (let i = 0; i < PER_LEVEL; i++) pick.push(found[Math.floor((i * (found.length - 1)) / (PER_LEVEL - 1))]);
  if (name === 'hard') for (const l of pick) l.time = 40 + l.par * 8;
  out[name] = pick;
  console.log(name, pick.map((l) => l.par).join(' '));
}
writeFileSync(new URL('./levels.json', import.meta.url), JSON.stringify(out) + '\n');
