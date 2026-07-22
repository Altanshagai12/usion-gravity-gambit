const test = require('node:test');
const assert = require('node:assert/strict');
const Core = require('../game-core');
const Layout = require('../layout');

test('tall phone viewports are fully covered by square canvas rows', () => {
  const result = Layout.compute(591, 1090, 56, 8, 9, 112);
  assert.equal(result.width, result.cellSize * 8);
  assert.equal(result.height, result.cellSize * result.visibleRows);
  assert.ok(result.visibleRows > 9);
  assert.equal(result.height, result.availableHeight);
  assert.ok(result.width <= 591);
  assert.equal(result.availableHeight, 922);
});

test('portrait rows expand every logical level coordinate', () => {
  const level = { width: 8, height: 9, pieces: [{ id: 'r', type: 'rook', x: 0, y: 8 }], king: [7, 4], walls: [[2, 3]], platforms: [[4, 5]] };
  const expanded = Layout.expandLevel(level, 5);
  assert.equal(expanded.height, 14);
  assert.equal(expanded.pieces[0].y, 13);
  assert.deepEqual(expanded.king, [7, 9]);
  assert.deepEqual(expanded.walls, [[2, 8]]);
  assert.deepEqual(expanded.platforms, [[4, 10]]);
  assert.equal(level.height, 9, 'base campaign data stays immutable');
});

test('pieces can legally move into the added top rows', () => {
  const base = { width: 8, height: 9, pieces: [{ id: 'r', type: 'rook', x: 0, y: 8 }], king: [7, 4], walls: [], platforms: [] };
  const expanded = Layout.expandLevel(base, 5);
  const state = Core.settle(expanded, Core.createState(expanded));
  assert.equal(Core.legalMoves(expanded, state, 'r').some((move) => move.to[1] === 0), true);
});
