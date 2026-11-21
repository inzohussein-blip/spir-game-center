/// <reference types="node" />
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { canMove, move, slideRow, spawn, starsFor } from './logic.ts';

test('الدمج مرة وحدة بكل حركة', () => {
  assert.deepEqual(slideRow([2, 2, 2, 2]).row, [4, 4, 0, 0]);
  assert.deepEqual(slideRow([2, 2, 4, 0]).row, [4, 4, 0, 0]);
  assert.deepEqual(slideRow([0, 2, 0, 2]).row, [4, 0, 0, 0]);
  assert.deepEqual(slideRow([4, 2, 2, 8]).row, [4, 4, 8, 0]);
  assert.equal(slideRow([2, 2, 2, 2]).score, 8);
});

test('الاتجاهات', () => {
  const g = [2, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2];
  assert.equal(move(g, 'right').grid[3], 4);
  assert.equal(move(g, 'down').grid[15], 4);
  assert.equal(move(g, 'up').grid[3], 4);
  assert.equal(move([2, 4, 8, 16, ...new Array(12).fill(0)], 'left').moved, false);
});

test('ظهور رقم جديد بخانة فارغة', () => {
  const r = spawn(new Array(16).fill(0), () => 0.5);
  assert.ok(r && (r.grid[r.at] === 2 || r.grid[r.at] === 4));
  assert.equal(spawn(new Array(16).fill(2), () => 0.5), null);
});

test('اللوحة المسدودة', () => {
  const full = [2, 4, 2, 4, 4, 2, 4, 2, 2, 4, 2, 4, 4, 2, 4, 2];
  assert.equal(canMove(full), false);
  full[1] = 2;
  assert.equal(canMove(full), true);
});

test('النجوم حسب أكبر رقم', () => {
  assert.equal(starsFor('easy', 256), 3);
  assert.equal(starsFor('easy', 128), 2);
  assert.equal(starsFor('easy', 64), 1);
  assert.equal(starsFor('easy', 32), 0);
});
