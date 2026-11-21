/// <reference types="node" />
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { candidates, countSolutions, makePuzzle, SPECS, starsFor, type Grid, type Spec } from './logic.ts';

const valid = (g: Grid, s: Spec) => g.every((v, i) => {
  const copy = [...g];
  copy[i] = 0;
  return candidates(copy, s, i).includes(v);
});

for (const level of ['easy', 'medium', 'hard'] as const) {
  test(`${level}: الحل صحيح واللغز إله حل واحد ويطابق الحل`, () => {
    for (const stage of [1, 10, 20]) {
      const { puzzle, solution, spec } = makePuzzle(level, stage);
      assert.equal(solution.length, SPECS[level].n ** 2);
      assert.ok(valid(solution, spec));
      assert.equal(countSolutions([...puzzle], spec), 1);
      puzzle.forEach((v, i) => v && assert.equal(v, solution[i]));
    }
  });
}

test('نفس المرحلة = نفس اللغز، والمراحل المتأخرة أقل أرقام', () => {
  assert.deepEqual(makePuzzle('medium', 5).puzzle, makePuzzle('medium', 5).puzzle);
  const shown = (s: number) => makePuzzle('hard', s).puzzle.filter(Boolean).length;
  assert.ok(shown(20) <= shown(1));
});

test('النجوم حسب الغلط', () => {
  assert.equal(starsFor(0), 3);
  assert.equal(starsFor(2), 2);
  assert.equal(starsFor(5), 1);
});
