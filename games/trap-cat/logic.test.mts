/// <reference types="node" />
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { catMove, distToEdge, idx, isEdge, makeBoard, N, neighbors, startBlocks, starsFor, type Board } from './logic.ts';

const empty = (): Board => ({ n: N, blocked: new Array(N * N).fill(false), cat: idx(N, 5, 5) });

test('كل خانة داخلية إلها 6 جيران', () => {
  assert.equal(neighbors(N, idx(N, 5, 5)).length, 6);
  assert.equal(neighbors(N, idx(N, 4, 4)).length, 6);
  assert.equal(neighbors(N, 0).length, 2);
});

test('الجيرة متبادلة', () => {
  for (let i = 0; i < N * N; i++) for (const j of neighbors(N, i)) assert.ok(neighbors(N, j).includes(i), `${i}-${j}`);
});

test('المسافة للحافة من المركز 5 بلوحة فارغة', () => {
  assert.equal(distToEdge(empty())[idx(N, 5, 5)], 5);
});

test('البزون يتحرك لخانة أقرب للحافة', () => {
  const b = empty();
  const d0 = distToEdge(b)[b.cat];
  const m = catMove(b, 'hard', () => 0.5);
  assert.equal(m.kind, 'move');
  if (m.kind === 'move') assert.equal(distToEdge(b)[m.to], d0 - 1);
});

test('محاط بالكامل = محصور', () => {
  const b = empty();
  for (const i of neighbors(N, b.cat)) b.blocked[i] = true;
  assert.equal(catMove(b, 'hard', () => 0.5).kind, 'trapped');
});

test('محاط بحلقة أبعد بدون طريق للحافة = محصور حتى لو يگدر يتحرك', () => {
  const b = empty();
  // حلقة بمسافة 2: كل جيران الجيران اللي مو جيران
  const ring1 = new Set(neighbors(N, b.cat));
  for (const i of ring1) for (const j of neighbors(N, i)) if (j !== b.cat && !ring1.has(j)) b.blocked[j] = true;
  assert.equal(catMove(b, 'hard', () => 0.5).kind, 'trapped');
});

test('على الحافة = يهرب', () => {
  const b = empty();
  b.cat = idx(N, 0, 5);
  assert.ok(isEdge(N, b.cat));
  assert.equal(catMove(b, 'hard', () => 0.5).kind, 'escape');
});

test('اللوحة ثابتة لنفس المرحلة وما تسد البزون أو جيرانه', () => {
  const a = makeBoard('medium', 4);
  const b = makeBoard('medium', 4);
  assert.deepEqual(a.blocked, b.blocked);
  assert.equal(a.blocked.filter(Boolean).length, startBlocks('medium', 4));
  assert.ok(!a.blocked[a.cat]);
  for (const i of neighbors(N, a.cat)) assert.ok(!a.blocked[i]);
});

test('الخانات المسدودة تقل ويّا المراحل والسهل أكثر', () => {
  assert.ok(startBlocks('easy', 1) > startBlocks('hard', 1));
  assert.ok(startBlocks('easy', 30) < startBlocks('easy', 1));
});

test('النجوم حسب الحركات', () => {
  assert.equal(starsFor('easy', 5), 3);
  assert.equal(starsFor('easy', 12), 2);
  assert.equal(starsFor('easy', 40), 1);
});
