/// <reference types="node" />
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { countByCategory, dailyChallenge, filterGames, gameById, GAMES } from './games.ts';

test('الفهرس: 12 لعبة بمعرّفات مختلفة وأعمار من 5 لفوق', () => {
  assert.equal(GAMES.length, 12);
  assert.equal(new Set(GAMES.map((g) => g.id)).size, 12);
  for (const g of GAMES) assert.ok(g.minAge >= 5 && g.minAge <= 50, g.id);
});

test('حاصر البزون موجودة', () => {
  assert.equal(gameById('trap-cat')?.title, 'حاصر البزون');
});

test('الفلترة حسب القسم والعمر', () => {
  assert.equal(filterGames(GAMES, 'all').length, 12);
  assert.ok(filterGames(GAMES, 'family').every((g) => g.category === 'family'));
  const kids = filterGames(GAMES, 'all', 5);
  assert.ok(kids.length > 0 && kids.every((g) => g.minAge <= 5));
  assert.ok(filterGames(GAMES, 'all', 7).length > kids.length);
});

test('عدد الألعاب بالأقسام يساوي المجموع', () => {
  const counts = countByCategory(GAMES);
  assert.equal(Object.values(counts).reduce((a, b) => a + b, 0), GAMES.length);
});

test('تحدّي اليوم ثابت لنفس اليوم ويتغيّر باليوم الجاي', () => {
  const a = dailyChallenge(GAMES, new Date(2026, 10, 20, 8));
  const b = dailyChallenge(GAMES, new Date(2026, 10, 20, 23));
  const c = dailyChallenge(GAMES, new Date(2026, 10, 21, 8));
  assert.equal(a.id, b.id);
  assert.notEqual(a.id, c.id);
});
