/// <reference types="node" />
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { newSnake, SIZE, starsFor, step, turn, type Snake } from './logic.ts';

const r = () => 0.5;

test('تتقدم خطوة بالاتجاه', () => {
  const s = newSnake(r);
  const n = step(s, false, r);
  assert.equal(n.snake.body[0].x, s.body[0].x - 1);
  assert.equal(n.snake.body.length, 3);
});

test('ما ترجع على نفسها', () => {
  assert.equal(turn('left', 'right'), 'left');
  assert.equal(turn('left', 'up'), 'up');
});

test('الأكل يطوّلها ويطلع أكل جديد', () => {
  const s = newSnake(r);
  const fed: Snake = { ...s, food: { x: s.body[0].x - 1, y: s.body[0].y } };
  const n = step(fed, false, r);
  assert.ok(n.ate);
  assert.equal(n.snake.body.length, 4);
  assert.ok(!n.snake.body.some((b) => b.x === n.snake.food.x && b.y === n.snake.food.y));
});

test('الحايط: تموت، وبالسهل تعبر', () => {
  const s: Snake = { body: [{ x: 0, y: 5 }, { x: 1, y: 5 }, { x: 2, y: 5 }], dir: 'left', food: { x: 9, y: 9 } };
  assert.ok(step(s, false, r).dead);
  const w = step(s, true, r);
  assert.ok(!w.dead);
  assert.equal(w.snake.body[0].x, SIZE - 1);
});

test('تصطدم بنفسها', () => {
  const s: Snake = { body: [{ x: 5, y: 5 }, { x: 5, y: 6 }, { x: 6, y: 6 }, { x: 6, y: 5 }, { x: 6, y: 4 }], dir: 'right', food: { x: 0, y: 0 } };
  assert.ok(step(s, false, r).dead);
});

test('النجوم', () => {
  assert.equal(starsFor('easy', 0), 0);
  assert.equal(starsFor('easy', 18), 3);
});
