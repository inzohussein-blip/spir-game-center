/// <reference types="node" />
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { autoDropDir, initialState, slide, solve, starsFor, validate, won, type LevelDef } from './logic.ts';

const LEVELS = JSON.parse(readFileSync(new URL('./levels.json', import.meta.url), 'utf8')) as Record<string, LevelDef[]>;

const tiny: LevelDef = {
  size: 4,
  cats: [{ x: 0, y: 0, color: 0 }],
  holes: [{ x: 3, y: 0, color: 0 }],
  blocks: [{ x: 2, y: 0, w: 1, h: 2 }],
  walls: [],
  par: 0,
};

test('البزون يوقف عند القطعة، والقطعة العمودية ما تتحرك يمين', () => {
  const s = initialState(tiny);
  const r = slide(tiny, s, { kind: 'cat', i: 0 }, 'right');
  assert.equal(r?.state.cats[0].x, 1);
  assert.equal(r?.fell, false);
  assert.equal(slide(tiny, s, { kind: 'block', i: 0 }, 'right'), null);
});

test('القطعة تنزلق لحد الحافة، وبعدها البزون يطيح بفتحته', () => {
  let s = initialState(tiny);
  const b = slide(tiny, s, { kind: 'block', i: 0 }, 'down');
  assert.equal(b?.state.blocks[0].y, 2);
  s = b!.state;
  const c = slide(tiny, s, { kind: 'cat', i: 0 }, 'right');
  assert.equal(c?.fell, true);
  assert.ok(won(c!.state));
});

test('البزون يعبر فوق فتحة مو بلونه', () => {
  const l: LevelDef = { size: 4, cats: [{ x: 0, y: 0, color: 0 }], holes: [{ x: 1, y: 0, color: 1 }, { x: 3, y: 3, color: 0 }], blocks: [], walls: [], par: 0 };
  const r = slide(l, initialState(l), { kind: 'cat', i: 0 }, 'right');
  assert.equal(r?.state.cats[0].x, 3);
  assert.equal(r?.fell, false);
});

test('المحلّل يلگى أقصر حل', () => {
  assert.equal(solve(tiny)?.length, 2);
  assert.equal(autoDropDir(tiny, initialState(tiny), 0), null);
});

test('120 مرحلة: 40 لكل صعوبة، صحيحة وتنحل بالـ par المكتوب', () => {
  for (const name of ['easy', 'medium', 'hard']) {
    assert.equal(LEVELS[name].length, 40, name);
    for (const [i, l] of LEVELS[name].entries()) {
      assert.equal(validate(l), null, `${name} ${i + 1}`);
      assert.equal(solve(l, initialState(l), 300_000)?.length, l.par, `${name} ${i + 1}`);
      if (name === 'hard') assert.ok((l.time ?? 0) > 0);
    }
  }
});

test('الصعوبة تزيد: متوسط par السهل أقل من الصعب', () => {
  const avg = (n: string) => LEVELS[n].reduce((a, l) => a + l.par, 0) / LEVELS[n].length;
  assert.ok(avg('easy') < avg('medium') && avg('medium') < avg('hard'));
});

test('النجوم: صفر إذا خلص الوقت', () => {
  assert.equal(starsFor(5, 5, false), 3);
  assert.equal(starsFor(5, 7, false), 2);
  assert.equal(starsFor(5, 20, false), 1);
  assert.equal(starsFor(5, 5, true), 0);
});
