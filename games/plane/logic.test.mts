/// <reference types="node" />
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { fly, hits, newTower, starsFor, TOWER_W, TUNING } from './logic.ts';

test('الجاذبية تنزّل الطيارة', () => {
  const p = fly({ y: 100, vy: 0 }, 0.1, TUNING.easy);
  assert.ok(p.y > 100 && p.vy > 0);
});

test('الفتحة دائماً داخل الشاشة', () => {
  for (let i = 0; i < 200; i++) {
    const t = newTower(0, 600, 160, Math.random);
    assert.ok(t.gapY - 80 >= 0 && t.gapY + 80 <= 600);
  }
});

test('الاصطدام', () => {
  const tw = { x: 90, gapY: 300, passed: false };
  assert.equal(hits(100, { y: 300, vy: 0 }, 12, tw, 160), false);
  assert.equal(hits(100, { y: 150, vy: 0 }, 12, tw, 160), true);
  assert.equal(hits(100 + TOWER_W + 40, { y: 150, vy: 0 }, 12, tw, 160), false);
});

test('السهل أسهل', () => {
  assert.ok(TUNING.easy.gap > TUNING.hard.gap);
  assert.ok(TUNING.easy.speed < TUNING.hard.speed);
  assert.equal(starsFor('easy', 15), 3);
  assert.equal(starsFor('easy', 0), 0);
});
