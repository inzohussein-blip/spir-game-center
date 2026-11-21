/// <reference types="node" />
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { parseGameMessage } from './bridge.ts';

test('يقبل رسائل اللعبة الصحيحة', () => {
  assert.deepEqual(parseGameMessage('{"spir":1,"type":"ready"}'), { type: 'ready' });
  assert.equal(parseGameMessage({ spir: 1, type: 'hud', text: 'المرحلة 2', score: '5 حركة' })?.type, 'hud');
});

test('يرفض الرسائل الغريبة', () => {
  assert.equal(parseGameMessage('not json'), null);
  assert.equal(parseGameMessage({ type: 'ready' }), null);
  assert.equal(parseGameMessage({ spir: 1, type: 'navigate', url: 'http://x' }), null);
  assert.equal(parseGameMessage(42), null);
});

test('يحدّ الأرقام والنصوص', () => {
  const m = parseGameMessage({ spir: 1, type: 'complete', stars: 99, score: -5, title: 'x'.repeat(500) });
  assert.ok(m && m.type === 'complete');
  if (m?.type === 'complete') {
    assert.equal(m.stars, 3);
    assert.equal(m.score, 0);
    assert.equal(m.title?.length, 40);
  }
});

test('رسائل الخريطة والبيت', () => {
  assert.deepEqual(parseGameMessage({ spir: 1, type: 'open', target: 'drop-cat' }), { type: 'open', target: 'drop-cat' });
  assert.equal(parseGameMessage({ spir: 1, type: 'open', target: '../evil' }), null);
  assert.deepEqual(parseGameMessage({ spir: 1, type: 'save', key: 'buy', data: 'sofa' }), { type: 'save', key: 'buy', data: 'sofa' });
  assert.deepEqual(parseGameMessage({ spir: 1, type: 'save', key: 'wear', data: null }), { type: 'save', key: 'wear', data: null });
  assert.equal(parseGameMessage({ spir: 1, type: 'save', key: 'coins', data: 999 }), null);
});
