/// <reference types="node" />
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { applyResult, badges, doneStages, emptyStore, gameOf, levelOf, parseStore, streak, totalStars } from './progressCore.ts';

const now = new Date(2026, 10, 20, 10);

test('الفوز يفتح المرحلة الجاية ويحفظ النجوم والعملات', () => {
  const r = applyResult(emptyStore(), { gameId: 'trap-cat', level: 'easy', stage: 1, won: true, stars: 3, stageCount: 30, now });
  const g = gameOf(r.store, 'trap-cat');
  assert.equal(g.next.easy, 2);
  assert.equal(g.next.hard, 1);
  assert.equal(g.stars['easy:1'], 3);
  assert.equal(r.coins, 20);
  assert.equal(r.store.coins, 20);
  assert.ok(r.firstWin);
});

test('الخسارة ما تفتح مرحلة وتعطي عملة وحدة', () => {
  const r = applyResult(emptyStore(), { gameId: 'xo', level: 'hard', stage: 1, won: false, stars: 0, stageCount: 1, now });
  assert.equal(gameOf(r.store, 'xo').next.hard, 1);
  assert.equal(r.coins, 1);
  assert.equal(gameOf(r.store, 'xo').plays, 1);
});

test('المرحلة الأخيرة ما تعدّي العدد، واللعبة بلا نهاية تستمر', () => {
  const a = applyResult(emptyStore(), { gameId: 'drop-cat', level: 'easy', stage: 20, won: true, stars: 2, stageCount: 20, now });
  assert.equal(gameOf(a.store, 'drop-cat').next.easy, 20);
  const b = applyResult(emptyStore(), { gameId: 'xo', level: 'easy', stage: 7, won: true, stars: 3, stageCount: 1, now });
  assert.equal(gameOf(b.store, 'xo').next.easy, 8);
});

test('أحسن نجوم تبقى، والرقم القياسي ينحسب بس إذا تحسّن', () => {
  let s = applyResult(emptyStore(), { gameId: 'memory', level: 'easy', stage: 1, won: true, stars: 1, stageCount: 12, now }).store;
  const better = applyResult(s, { gameId: 'memory', level: 'easy', stage: 1, won: true, stars: 3, stageCount: 12, now });
  assert.ok(better.newBest);
  s = better.store;
  const worse = applyResult(s, { gameId: 'memory', level: 'easy', stage: 1, won: true, stars: 2, stageCount: 12, now });
  assert.equal(gameOf(worse.store, 'memory').stars['easy:1'], 3);
  assert.equal(worse.newBest, false);
  assert.equal(totalStars(gameOf(worse.store, 'memory')), 3);
  assert.equal(doneStages(gameOf(worse.store, 'memory'), 'easy'), 1);
});

test('بيانات تالفة → بداية جديدة', () => {
  assert.deepEqual(parseStore('{bad'), emptyStore());
  assert.deepEqual(parseStore(null), emptyStore());
  assert.deepEqual(parseStore('{"v":9}'), emptyStore());
});

test('المستوى والأيام المتتالية', () => {
  assert.deepEqual(levelOf(250), { level: 3, progress: 0.5 });
  assert.equal(streak(['2026-11-01', '2026-11-02', '2026-11-03', '2026-11-05']), 3);
  assert.equal(streak([]), 0);
});

test('الأوسمة', () => {
  let s = emptyStore();
  assert.equal(badges(s)['first-win'], false);
  s = applyResult(s, { gameId: 'xo', level: 'easy', stage: 1, won: true, stars: 3, stageCount: 1, now }).store;
  assert.equal(badges(s)['first-win'], true);
  assert.equal(badges(s).explorer, false);
});
