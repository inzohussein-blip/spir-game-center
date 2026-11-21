/// <reference types="node" />
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { activeStore, addPlayTime, addProfile, applyResult, badges, checkPin, DAILY_BONUS, doneStages, emptyFamily, emptyStore, gameOf, hashPin, levelOf, limitReached, parseFamily, parseStore, playedToday, removeProfile, streak, toggleFavorite, totalStars, updateProfile } from './progressCore.ts';

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

test('تحدّي اليوم: مكافأة مرة وحدة باليوم', () => {
  const a = applyResult(emptyStore(), { gameId: 'xo', level: 'easy', stage: 1, won: true, stars: 3, stageCount: 1, now, daily: true });
  assert.ok(a.dailyBonus);
  assert.equal(a.coins, 20 + DAILY_BONUS);
  const b = applyResult(a.store, { gameId: 'xo', level: 'easy', stage: 2, won: true, stars: 3, stageCount: 1, now, daily: true });
  assert.equal(b.dailyBonus, false);
  const tomorrow = new Date(2026, 10, 21, 10);
  assert.ok(applyResult(b.store, { gameId: 'xo', level: 'easy', stage: 3, won: true, stars: 3, stageCount: 1, now: tomorrow, daily: true }).dailyBonus);
});

test('وقت اللعب والحد اليومي', () => {
  let s = addPlayTime(emptyStore(), 20, now);
  s = addPlayTime(s, 15, now);
  assert.equal(playedToday(s, now), 35);
  const p = { id: 'a', name: 'زينب', age: 6, avatar: 0, limitMin: 30, hidden: [] };
  assert.ok(limitReached(p, s, now));
  assert.ok(!limitReached({ ...p, limitMin: 0 }, s, now));
  assert.ok(!limitReached(p, s, new Date(2026, 10, 22)));
});

test('المفضلة', () => {
  const s = toggleFavorite(emptyStore(), 'snake');
  assert.deepEqual(s.favorites, ['snake']);
  assert.deepEqual(toggleFavorite(s, 'snake').favorites, []);
});

test('ملفات العائلة: إضافة وتعديل وحذف', () => {
  let f = addProfile(emptyFamily(), { name: '  أحمد  ', age: 3, avatar: 1 }, 'a');
  f = addProfile(f, { name: 'زينب', age: 7, avatar: 2 }, 'b');
  assert.equal(f.profiles[0].name, 'أحمد');
  assert.equal(f.profiles[0].age, 5);
  assert.equal(f.activeId, 'a');
  f = updateProfile(f, 'b', { limitMin: 45, age: 80 });
  assert.equal(f.profiles[1].limitMin, 45);
  assert.equal(f.profiles[1].age, 50);
  f = removeProfile(f, 'a');
  assert.equal(f.activeId, 'b');
  assert.equal(f.data.a, undefined);
  assert.deepEqual(activeStore(f), emptyStore());
});

test('رمز الأهل', () => {
  const f = { ...emptyFamily(), pinHash: hashPin('1234') };
  assert.ok(checkPin(f, '1234'));
  assert.ok(!checkPin(f, '4321'));
  assert.ok(!checkPin(emptyFamily(), ''));
});

test('نقل تقدّم النسخة القديمة لأول ملف', () => {
  const old = applyResult(emptyStore(), { gameId: 'memory', level: 'easy', stage: 1, won: true, stars: 2, stageCount: 12, now }).store;
  const f = parseFamily(null, JSON.stringify(old));
  assert.equal(f.profiles.length, 1);
  assert.equal(activeStore(f).coins, old.coins);
  assert.equal(parseFamily(null, null).profiles.length, 0);
  assert.equal(parseFamily(JSON.stringify(f), null).profiles[0].name, 'لاعب 1');
  assert.equal(parseFamily('{bad', null).profiles.length, 0);
});
