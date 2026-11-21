/// <reference types="node" />
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { aiMove, blockedResult, deal, ends, fullSet, place, playable, sidesFor, starsFor, type Chain, type Tile } from './logic.ts';

test('الطقم 28 قطعة والتوزيع 7 + 7 + 14', () => {
  assert.equal(fullSet().length, 28);
  const d = deal(5);
  assert.equal(d.player.length, 7);
  assert.equal(d.ai.length, 7);
  assert.equal(d.stock.length, 14);
  const keys = new Set([...d.player, ...d.ai, ...d.stock].map((t) => t.join()));
  assert.equal(keys.size, 28);
});

test('وضع القطع وقلبها حسب الطرف', () => {
  let c: Chain = place([], [3, 5], 'end');
  assert.deepEqual(ends(c), [3, 5]);
  c = place(c, [5, 1], 'end');
  assert.deepEqual(ends(c), [3, 1]);
  c = place(c, [3, 6], 'start');
  assert.deepEqual(ends(c), [6, 1]);
  assert.deepEqual(c[0], [6, 3]);
});

test('الجهات المسموحة', () => {
  const c: Chain = [[2, 4]];
  assert.deepEqual(sidesFor(c, [4, 6]), ['end']);
  assert.deepEqual(sidesFor(c, [2, 4]), ['start', 'end']);
  assert.deepEqual(sidesFor(c, [1, 1]), []);
  assert.equal(playable(c, [[1, 1], [0, 2]]).length, 1);
});

test('الجهاز يلعب حركة صحيحة بكل الصعوبات', () => {
  const c: Chain = [[2, 4]];
  const hand: Tile[] = [[4, 6], [0, 2], [1, 1], [6, 6]];
  for (const level of ['easy', 'medium', 'hard'] as const) {
    const m = aiMove(c, hand, level, () => 0.3);
    assert.ok(m && sidesFor(c, m.tile).includes(m.side));
  }
  assert.equal(aiMove(c, [[1, 1]], 'hard', () => 0.3), null);
});

test('الانسداد: الأقل مجموع يفوز', () => {
  assert.equal(blockedResult([[0, 1]], [[6, 6]]).winner, 'player');
  assert.equal(blockedResult([[3, 3]], [[1, 5]]).winner, 'draw');
  assert.equal(starsFor({ winner: 'player', how: 'domino' }), 3);
  assert.equal(starsFor({ winner: 'player', how: 'blocked' }), 2);
  assert.equal(starsFor({ winner: 'ai', how: 'domino' }), 0);
});
