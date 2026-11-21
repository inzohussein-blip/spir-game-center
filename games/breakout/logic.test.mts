/// <reference types="node" />
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { bounceRect, makeBricks, paddleBounce, starsFor, STAGES, type Ball } from './logic.ts';

test('كل مرحلة بيها طوب، والمراحل تكبر', () => {
  for (let s = 1; s <= STAGES; s++) assert.ok(makeBricks('medium', s).length > 0, String(s));
  assert.ok(makeBricks('easy', 20).length >= makeBricks('easy', 1).length);
  assert.deepEqual(makeBricks('hard', 7), makeBricks('hard', 7));
});

test('طوب الضربتين بس بالمتوسط والصعب', () => {
  assert.ok(makeBricks('easy', 10).every((b) => b.hp === 1));
  assert.ok(makeBricks('hard', 10).some((b) => b.hp === 2));
});

test('الكرة ترتد من فوق المستطيل', () => {
  const b: Ball = { x: 50, y: 95, vx: 0, vy: 100, r: 8 };
  assert.ok(bounceRect(b, { x: 0, y: 100, w: 100, h: 20 }));
  assert.ok(b.vy < 0);
  const far: Ball = { x: 50, y: 50, vx: 0, vy: 100, r: 8 };
  assert.equal(bounceRect(far, { x: 0, y: 100, w: 100, h: 20 }), false);
});

test('المضرب: الطرف يعطي زاوية، والسرعة ثابتة', () => {
  const b: Ball = { x: 140, y: 0, vx: 0, vy: 1, r: 7 };
  paddleBounce(b, 100, 80, 300);
  assert.ok(b.vx > 0 && b.vy < 0);
  assert.ok(Math.abs(Math.hypot(b.vx, b.vy) - 300) < 1e-6);
});

test('النجوم', () => {
  assert.equal(starsFor('medium', 0), 3);
  assert.equal(starsFor('medium', 1), 2);
  assert.equal(starsFor('medium', 2), 1);
});
