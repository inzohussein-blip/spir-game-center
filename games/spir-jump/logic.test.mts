/// <reference types="node" />
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { count, groundHeights, makeLevel, MAX_GAP, MAX_RISE, ROWS, STAGES, starsFor } from './logic.ts';

test('كل المراحل: بداية ونهاية وثلاث نجوم بالضبط', () => {
  for (let s = 1; s <= STAGES; s++) {
    const { grid } = makeLevel(s);
    assert.equal(grid.length, ROWS);
    assert.equal(count(grid, 'P'), 1, `P ${s}`);
    assert.equal(count(grid, 'G'), 1, `G ${s}`);
    assert.equal(count(grid, '*'), 3, `* ${s}`);
  }
});

test('كل فراغ ينقفز وكل صعدة تنوصل', () => {
  for (let s = 1; s <= STAGES; s++) {
    const h = groundHeights(makeLevel(s).grid);
    let gap = 0;
    for (let x = 0; x < h.length; x++) {
      if (h[x] === 0) {
        gap++;
        assert.ok(gap <= MAX_GAP, `فراغ ${gap} بالمرحلة ${s} عمود ${x}`);
      } else gap = 0;
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
