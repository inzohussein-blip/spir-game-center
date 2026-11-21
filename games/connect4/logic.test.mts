/// <reference types="node" />
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { bestCol, COLS, drop, dropRow, empty, ROWS, winner, type Board } from './logic.ts';

const play = (b: Board, moves: [number, 1 | 2][]) => moves.reduce((acc, [c, p]) => drop(acc, c, p)!.board, b);

test('القطعة تنزل لأوطى صف', () => {
  const b = drop(empty(), 3, 1)!;
  assert.equal(b.row, ROWS - 1);
  assert.equal(dropRow(b.board, 3), ROWS - 2);
});

test('العمود المليان ما يقبل', () => {
  let b = empty();
  for (let i = 0; i < ROWS; i++) b = drop(b, 0, 1)!.board;
  assert.equal(drop(b, 0, 2), null);
});

test('كشف أربعة أفقي وعمودي ومايل', () => {
  assert.equal((winner(play(empty(), [[0, 1], [1, 1], [2, 1], [3, 1]])) as { p: number }).p, 1);
  assert.equal((winner(play(empty(), [[5, 2], [5, 2], [5, 2], [5, 2]])) as { p: number }).p, 2);
  const diag = play(empty(), [[0, 1], [1, 2], [1, 1], [2, 2], [2, 2], [2, 1], [3, 2], [3, 2], [3, 2], [3, 1]]);
  assert.equal((winner(diag) as { p: number }).p, 1);
  assert.equal(winner(empty()), null);
});

test('الجهاز يكمل أربعة إذا يگدر', () => {
  const b = play(empty(), [[0, 2], [6, 1], [1, 2], [6, 1], [2, 2], [5, 1]]);
  assert.equal(bestCol(b, 2, 3), 3);
});

test('الجهاز يسد خط اللاعب', () => {
  const b = play(empty(), [[0, 1], [6, 2], [1, 1], [6, 2], [2, 1]]);
  assert.equal(bestCol(b, 2, 3), 3);
  assert.ok(COLS === 7);
});
