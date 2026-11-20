/// <reference types="node" />
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { colsFor, makeDeck, pairsFor, starsFor } from './logic.ts';

test('كل رمز يطلع مرتين بالضبط', () => {
  const deck = makeDeck('medium', 5);
  const counts = new Map<number, number>();
  for (const s of deck) counts.set(s, (counts.get(s) ?? 0) + 1);
  assert.equal(deck.length, pairsFor('medium', 5) * 2);
  for (const n of counts.values()) assert.equal(n, 2);
});

test('نفس المرحلة = نفس التوزيع', () => {
  assert.deepEqual(makeDeck('hard', 3), makeDeck('hard', 3));
});

test('الأزواج تزيد ويّا المراحل ولها حد', () => {
  assert.equal(pairsFor('easy', 1), 3);
  assert.ok(pairsFor('easy', 12) <= 6);
  assert.ok(pairsFor('hard', 12) <= 10);
  assert.ok(pairsFor('hard', 1) > pairsFor('easy', 1));
});

test('الأعمدة والنجوم', () => {
  assert.equal(colsFor(6), 3);
  assert.equal(colsFor(20), 5);
  assert.equal(starsFor(4, 6), 3);
  assert.equal(starsFor(4, 9), 2);
  assert.equal(starsFor(4, 20), 1);
});
