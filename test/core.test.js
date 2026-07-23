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
  assert.equal(Core.legalMoves(level, Core.createState(level), 'n').some((move) => move.capture), true);
});

test('gravity settles on the floor and can capture the enemy king', () => {
  const floor = { width: 4, height: 5, pieces: [{ id: 'r', type: 'rook', x: 0, y: 0 }], king: [3, 3], walls: [] };
  assert.equal(Core.settle(floor, Core.createState(floor)).pieces[0].y, 4);

  const capture = { width: 4, height: 6, pieces: [{ id: 'r', type: 'rook', x: 2, y: 0 }], king: [2, 4], walls: [] };
  const captured = Core.settle(capture, Core.createState(capture));
  assert.equal(captured.kingAlive, false);
  assert.deepEqual([captured.pieces[0].x, captured.pieces[0].y], [2, 4]);
});

test('thin platforms support from the cell below but never block chess movement', () => {
  const level = { width: 5, height: 6, pieces: [{ id: 'r', type: 'rook', x: 2, y: 0 }], king: [4, 3], walls: [], platforms: [[2, 4]] };
  const state = Core.settle(level, Core.createState(level));
  assert.equal(state.pieces[0].y, 3);
  assert.equal(Core.legalMoves(level, state, 'r').some((move) => move.to[0] === 4 && move.to[1] === 3), true);
});

test('a fresh pawn advances two cells once and promotion offers four exact choices', () => {
  const level = { width: 4, height: 7, pieces: [{ id: 'p', type: 'pawn', x: 1, y: 1 }], king: [3, 0], walls: [[1, 2]] };
  const initial = Core.createState(level);
  assert.equal(Core.legalMoves(level, initial, 'p').some((move) => move.to[1] === -1), false);
  const promoteMove = Core.legalMoves(level, initial, 'p').find((move) => move.to[1] === 0);
  const pending = Core.applyMove(level, initial, promoteMove);
  assert.equal(pending.promotionPending, 'p');
  assert.deepEqual(Core.promotionMoves(pending).map((move) => move.promotion), ['rook', 'bishop', 'knight', 'queen']);
  const promoted = Core.applyMove(level, pending, { pieceId: 'p', promotion: 'knight' });
  assert.equal(promoted.pieces[0].type, 'knight');
  assert.equal(promoted.promotionPending, null);
  assert.equal(promoted.moves, 1, 'choosing a promotion is not another move');
});

test('a key removes every yellow lock', () => {
  const level = {
    width: 5, height: 5, pieces: [{ id: 'r', type: 'rook', x: 1, y: 1 }], king: [4, 1],
    walls: [[1, 2]], keys: [[1, 1]], locks: [[2, 1], [3, 1]],
  };
  const state = Core.settle(level, Core.createState(level));
  assert.equal(state.locksOpen, true);
  assert.deepEqual(state.keysCollected, [0]);
  assert.equal(Core.occupancy(level, state).has('2,1'), false);
  assert.equal(Core.occupancy(level, state).has('3,1'), false);
});

test('purple button hides blocks while held and restores them when released', () => {
  const level = {
    width: 5, height: 5,
    pieces: [{ id: 'a', type: 'rook', x: 1, y: 1 }, { id: 'b', type: 'king', x: 3, y: 1 }],
    king: [4, 4], walls: [[1, 2], [3, 2]], buttons: [[1, 1]], buttonBlocks: [[3, 1]],
  };
  const pressed = Core.settle(level, Core.createState(level));
  assert.deepEqual(Core.activeButtonBlocks(level, pressed), []);
  pressed.pieces.find((piece) => piece.id === 'a').x = 0;
  Core.settle(level, pressed);
  assert.deepEqual(Core.activeButtonBlocks(level, pressed), [[3, 1]]);
  assert.equal(pressed.pieces.some((piece) => piece.id === 'b'), false);
});

test('campaign is the original 24-level, 16 by 11 data set', () => {
  assert.equal(levels.length, 24);
  levels.forEach((level, index) => {
    assert.equal(level.title, `Level ${String(index + 1).padStart(2, '0')}`);
    assert.equal(level.width, 16);
    assert.equal(level.height, 11);
  });
  assert.deepEqual(levels[0].pieces, [{ id: 'king1', type: 'king', x: 2, y: 5 }]);
  assert.deepEqual(levels[0].king, [11, 4]);
  assert.equal(levels[0].walls.length, 38);
  assert.deepEqual(
    levels.map((level) => [level.pieces.length, level.walls.length, level.platforms.length]),
    [[1,38,0],[1,67,0],[1,50,0],[2,44,0],[3,58,0],[1,55,0],[2,33,0],[1,29,4],
      [3,58,5],[7,36,0],[4,28,7],[4,32,7],[1,46,1],[2,34,0],[3,50,3],[3,63,3],
      [2,40,2],[4,46,12],[3,35,2],[2,49,0],[2,44,5],[6,65,7],[5,92,8],[7,61,0]],
  );
});

test('the opening original levels remain solver-playable', () => {
  levels.slice(0, 9).forEach((level, index) => {
    const result = Solver.solve(level, { maxNodes: 30000 });
    assert.equal(result.solved, true, `level ${index + 1} explored ${result.explored}`);
  });
});
