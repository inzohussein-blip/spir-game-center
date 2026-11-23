/// <reference types="node" />
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { count, groundHeights, makeLevel, MAX_GAP, MAX_RISE, MOVING_GAP, ROWS, skyOf, STAGES, starsFor, worldOf } from './logic.ts';

test('كل المراحل: بداية ونهاية وثلاث نجوم بالضبط', () => {
  for (let s = 1; s <= STAGES; s++) {
    const { grid } = makeLevel(s);
    assert.equal(grid.length, ROWS);
    assert.equal(count(grid, 'P'), 1, `P ${s}`);
    assert.equal(count(grid, 'G'), 1, `G ${s}`);
    assert.equal(count(grid, '*'), 3, `* ${s}`);
  }
});

test('كل فراغ ينقفز (أو فوقه منصة تتحرك) وكل صعدة تنوصل', () => {
  for (let s = 1; s <= STAGES; s++) {
    const { grid } = makeLevel(s);
    const h = groundHeights(grid);
    let gap = 0;
    let moving = false;
    for (let x = 0; x < h.length; x++) {
      if (h[x] === 0) {
        gap++;
        if (grid.some((row) => row[x] === 'm')) moving = true;
        assert.ok(gap <= (moving ? MOVING_GAP : MAX_GAP), `فراغ ${gap} بالمرحلة ${s} عمود ${x}`);
      } else {
        gap = 0;
        moving = false;
      }
    }
    const solid = h.filter((v) => v > 0);
    for (let i = 1; i < solid.length; i++) assert.ok(solid[i] - solid[i - 1] <= MAX_RISE, `صعدة بالمرحلة ${s}`);
    assert.ok(h[0] > 0 && h[h.length - 1] > 0);
  }
});

test('المراحل تطول وثابتة لنفس الرقم', () => {
  assert.deepEqual(makeLevel(4).grid, makeLevel(4).grid);
  assert.ok(makeLevel(10).width > makeLevel(1).width);
  assert.ok(count(makeLevel(1).grid, 'e') <= count(makeLevel(10).grid, 'e') + 3);
});

test('النجوم: نجمة على الأقل إذا وصلت', () => {
  assert.equal(starsFor(0), 1);
  assert.equal(starsFor(3), 3);
});

test('العالم الثاني: منصات تتحرك بس بعد المرحلة 10، والزعيم بآخر مرحلة بس', () => {
  for (let s = 1; s <= STAGES; s++) {
    const { grid } = makeLevel(s);
    if (worldOf(s) === 1) assert.equal(count(grid, 'm'), 0, `m ${s}`);
    assert.equal(count(grid, 'B'), s === STAGES ? 1 : 0, `B ${s}`);
  }
  assert.ok([11, 12, 13, 14, 15, 16, 17, 18, 19, 20].some((s) => count(makeLevel(s).grid, 'm') > 0));
  assert.deepEqual([1, 5, 6, 10, 11, 15, 16, 20].map(skyOf), [0, 0, 1, 1, 2, 2, 3, 3]);
});
