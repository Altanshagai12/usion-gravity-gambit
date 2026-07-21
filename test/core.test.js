const test = require('node:test');
const assert = require('node:assert/strict');
const Core = require('../game-core');
const Solver = require('../solver');
const levels = require('../levels');

test('rook cannot move through a wall', () => {
  const level = { width: 5, height: 5, pieces: [{ id: 'r', type: 'rook', x: 0, y: 3 }], king: [4, 3], walls: [[2, 3]] };
  const moves = Core.legalMoves(level, Core.createState(level), 'r');
  assert.equal(moves.some((move) => move.to[0] > 1 && move.to[1] === 3), false);
});

test('knight jumps over walls', () => {
  const level = { width: 5, height: 5, pieces: [{ id: 'n', type: 'knight', x: 1, y: 3 }], king: [2, 1], walls: [[1, 2], [2, 2]] };
  const moves = Core.legalMoves(level, Core.createState(level), 'n');
  assert.equal(moves.some((move) => move.capture), true);
});

test('gravity settles pieces on the floor', () => {
  const level = { width: 4, height: 5, pieces: [{ id: 'r', type: 'rook', x: 0, y: 0 }], king: [3, 3], walls: [] };
  const state = Core.settle(level, Core.createState(level));
  assert.equal(state.pieces[0].y, 4);
});

test('capturing the king wins immediately', () => {
  const level = levels[0];
  const state = Core.settle(level, Core.createState(level));
  const capture = Core.legalMoves(level, state, state.pieces[0].id).find((move) => move.capture);
  assert.ok(capture);
  assert.equal(Core.applyMove(level, state, capture).kingAlive, false);
});

test('every campaign level is solvable', () => {
  levels.forEach((level, index) => {
    const result = Solver.solve(level, { maxNodes: 100000 });
    assert.equal(result.solved, true, `level ${index + 1}: ${level.title} explored ${result.explored}`);
  });
});
