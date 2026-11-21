/// <reference types="node" />
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { canPlace, emptyGrid, fitsAnywhere, place, randomPiece, SIZE, starsFor } from './logic.ts';

const bar = { cells: Array.from({ length: SIZE }, (_, i) => [i, 0] as [number, number]), color: 0 };

test('الوضع داخل الشبكة وبدون تداخل', () => {
  const g = emptyGrid();
  const sq = { cells: [[0, 0], [1, 0], [0, 1], [1, 1]] as [number, number][], color: 1 };
  assert.ok(canPlace(g, sq, 0, 0));
  assert.ok(!canPlace(g, sq, SIZE - 1, 0));
  const r = place(g, sq, 0, 0);
  assert.ok(!canPlace(r.grid, sq, 1, 1));
});

test('الصف الممتلئ ينمسح ويعطي نقاط', () => {
  const r = place(emptyGrid(), bar, 0, 3);
  assert.equal(r.lines, 1);
  assert.ok(r.grid.every((v) => v === -1));
  assert.equal(r.score, SIZE + 10);
});

test('صف وعمود سوا = مكافأة', () => {
  let g = emptyGrid();
  for (let i = 1; i < SIZE; i++) g[i] = 0; // الصف 0 ناقص الخانة 0
  for (let i = 1; i < SIZE; i++) g[i * SIZE] = 0; // العمود 0 ناقص الخانة 0
  const r = place(g, { cells: [[0, 0]], color: 2 }, 0, 0);
  assert.equal(r.lines, 2);
  assert.equal(r.score, 1 + 20 + 10);
  g = r.grid;
  assert.ok(g.every((v) => v === -1));
});

test('اكتشاف ماكو مكان', () => {
  const full = new Array(SIZE * SIZE).fill(0);
  assert.equal(fitsAnywhere(full, { cells: [[0, 0]], color: 0 }), false);
  assert.ok(randomPiece('easy', () => 0.3).cells.length > 0);
});

test('النجوم', () => {
  assert.equal(starsFor('easy', 10), 0);
  assert.equal(starsFor('easy', 300), 3);
});
