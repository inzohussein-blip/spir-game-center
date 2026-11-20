/// <reference types="node" />
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { aiMove, bestMove, empty, winner, type Board } from './logic.ts';

const b = (s: string): Board => s.split('').map((ch) => (ch === 'X' || ch === 'O' ? ch : null));

test('كشف الفائز والتعادل', () => {
  assert.equal((winner(b('XXX......')) as { mark: string }).mark, 'X');
  assert.equal((winner(b('O...O...O')) as { mark: string }).mark, 'O');
  assert.equal(winner(b('XOXXOOOXX')), 'draw');
  assert.equal(winner(empty()), null);
});

test('الجهاز يكمل الخط الفائز', () => {
  assert.equal(bestMove(b('OO.XX....'), 'O'), 2);
});

test('الجهاز يسد خط الخصم', () => {
  assert.equal(bestMove(b('XX..O....'), 'O'), 2);
});

test('بالصعب الجهاز ما يخسر أبداً (كل ألعاب X ممكنة)', () => {
  const play = (board: Board): void => {
    const w = winner(board);
    if (w) {
      assert.ok(w === 'draw' || w.mark === 'O', board.join(''));
      return;
    }
    for (let i = 0; i < 9; i++) {
      if (board[i]) continue;
      const next = [...board];
      next[i] = 'X';
      if (winner(next)) {
        play(next);
        continue;
      }
      next[aiMove(next, 'O', 'hard', () => 0)] = 'O';
      play(next);
    }
  };
  play(empty());
});
