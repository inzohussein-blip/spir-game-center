/// <reference types="node" />
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { letters, lineCells, makePuzzle, match, SPECS, STAGES, starsFor } from './logic.ts';

test('كل المراحل تنبني وكل كلمة موجودة بمكانها', () => {
  for (const level of ['easy', 'medium', 'hard'] as const) for (let s = 1; s <= STAGES; s++) {
    const p = makePuzzle(level, s);
    assert.equal(p.words.length, SPECS[level].words, `${level} ${s}`);
    assert.equal(p.grid.length, p.size * p.size);
    assert.ok(p.grid.every((ch) => ch.length === 1));
    for (const w of p.words) {
      const got = letters(w.word).map((_, k) => p.grid[(w.y + w.dy * k) * p.size + w.x + w.dx * k]).join('');
      assert.equal(got, w.word);
    }
  }
});

test('السهل بس أفقي (من اليمين) وعمودي', () => {
  for (let s = 1; s <= STAGES; s++) for (const w of makePuzzle('easy', s).words) assert.ok((w.dx === -1 && w.dy === 0) || (w.dx === 0 && w.dy === 1));
});

test('خط التحديد', () => {
  assert.deepEqual(lineCells(6, 0, 3), [0, 1, 2, 3]);
  assert.deepEqual(lineCells(6, 0, 14), [0, 7, 14]);
  assert.equal(lineCells(6, 0, 8), null);
});

test('مطابقة الكلمة بالاتجاهين', () => {
  const p = makePuzzle('medium', 2);
  const w = p.words[0];
  const cells = letters(w.word).map((_, k) => (w.y + w.dy * k) * p.size + w.x + w.dx * k);
  assert.equal(match(p, cells, new Set())?.word, w.word);
  assert.equal(match(p, [...cells].reverse(), new Set())?.word, w.word);
  assert.equal(match(p, cells, new Set([w.word])), null);
});

test('النجوم', () => {
  assert.equal(starsFor(0), 3);
  assert.equal(starsFor(3), 2);
  assert.equal(starsFor(9), 1);
});
