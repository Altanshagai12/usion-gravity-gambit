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

test('thin platforms stop gravity but never block chess movement', () => {
  const level = { width: 5, height: 6, pieces: [{ id: 'r', type: 'rook', x: 0, y: 1 }], king: [4, 1], walls: [], platforms: [[2, 2]] };
  const state = Core.settle(level, Core.createState(level));
  assert.equal(state.pieces[0].y, 5);
  state.pieces[0].x = 2;
  state.pieces[0].y = 2;
  assert.equal(Core.settle(level, state).pieces[0].y, 2);
  assert.equal(Core.legalMoves(level, state, 'r').some((move) => move.to[0] === 4 && move.to[1] === 2), true);
});

test('a fresh pawn can advance two cells once', () => {
  const level = { width: 4, height: 7, pieces: [{ id: 'p', type: 'pawn', x: 1, y: 5 }], king: [3, 0], walls: [[1, 6]] };
  const state = Core.createState(level);
  const double = Core.legalMoves(level, state, 'p').find((move) => move.to[1] === 3);
  assert.ok(double);
  const moved = Core.applyMove(level, state, double);
  assert.equal(Core.legalMoves(level, moved, 'p').some((move) => move.to[1] === moved.pieces[0].y - 2), false);
});

test('gravity exposes animation frames', () => {
  const level = { width: 4, height: 6, pieces: [{ id: 'r', type: 'rook', x: 0, y: 4 }], king: [3, 4], walls: [[0, 5]] };
  const state = Core.createState(level);
  const move = Core.legalMoves(level, state, 'r').find((item) => item.to[0] === 1 && item.to[1] === 4);
  const result = Core.applyMoveDetailed(level, state, move);
  assert.ok(result.frames.length > 1);
  assert.equal(result.state.pieces[0].y, 5);
});

test('a move exposes immediate continuation moves for the same piece', () => {
  const level = levels[5];
  const state = Core.settle(level, Core.createState(level));
  const firstMove = Core.legalMoves(level, state, state.pieces[0].id).find((move) => move.to[0] === 4 && move.to[1] === 2);
  const result = Core.applyMoveDetailed(level, state, firstMove);
  assert.equal(result.nextMoves.some((move) => move.capture && move.to[0] === 7 && move.to[1] === 5), true);
});

test('capturing the king wins immediately', () => {
  const level = levels[0];
  const state = Core.settle(level, Core.createState(level));
  const capture = Core.legalMoves(level, state, state.pieces[0].id).find((move) => move.capture);
  assert.ok(capture);
  assert.equal(Core.applyMove(level, state, capture).kingAlive, false);
});

test('every campaign level is solvable', () => {
  assert.equal(levels.length, 24);
  levels.forEach((level, index) => {
    const result = Solver.solve(level, { maxNodes: 100000 });
    assert.equal(result.solved, true, `level ${index + 1}: ${level.title} explored ${result.explored}`);
  });
});

test('thin platforms never overlap a solid wall boundary', () => {
  levels.forEach((level, index) => {
    const walls = new Set(level.walls.map(([x, y]) => `${x},${y}`));
    const overlap = level.platforms.filter(([x, y]) => walls.has(`${x},${y}`) || walls.has(`${x},${y + 1}`));
    assert.deepEqual(overlap, [], `level ${index + 1}: ${level.title}`);
  });
});

test('most advanced levels use at least three pieces', () => {
  const advanced = levels.slice(11);
  const rich = advanced.filter((level) => level.pieces.length >= 3);
  assert.ok(rich.length / advanced.length >= 0.75, `${rich.length}/${advanced.length} advanced levels`);
});

test('challenge difficulty strictly increases from level 8 onward', () => {
  const scores = levels.slice(7).map((level) => {
    const result = Solver.solve(level, { maxNodes: 100000 });
    return result.moves * 1000 + result.explored;
  });
  scores.slice(1).forEach((score, index) => {
    assert.ok(score > scores[index], `level ${index + 9}: ${score} must exceed ${scores[index]}`);
  });
});

test('at least 80% of campaign pieces are solver-required', () => {
  const total = levels.reduce((sum, level) => sum + level.pieces.length, 0);
  const required = levels.reduce((sum, level) => sum + Solver.requiredPieces(level, { maxNodes: 100000 }).length, 0);
  assert.ok(required / total >= 0.8, `${required}/${total} required pieces`);
});
