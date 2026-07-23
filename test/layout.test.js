const test = require('node:test');
const assert = require('node:assert/strict');
const Layout = require('../layout');

test('the original 16 by 11 board is letterboxed without adding playable rows', () => {
  const result = Layout.compute(948, 650, 0, 16, 11, 0);
  assert.equal(result.visibleRows, 11);
  assert.equal(result.cellSize, 650 / 11);
  assert.equal(result.width, result.cellSize * 16);
  assert.equal(result.height, result.cellSize * 11);
  assert.ok(result.height <= 650);
});

test('tall phone viewports keep the exact logical board dimensions', () => {
  const result = Layout.compute(390, 844, 0, 16, 11, 0);
  assert.equal(result.visibleRows, 11);
  assert.equal(result.width, 390);
  assert.equal(result.height, (390 / 16) * 11);
});

test('coordinate expansion shifts every optional interactive object immutably', () => {
  const level = {
    width: 16, height: 11, pieces: [{ id: 'r', type: 'rook', x: 0, y: 8 }], king: [7, 4],
    walls: [[2, 3]], platforms: [[4, 5]], keys: [[5, 6]], locks: [[6, 7]],
    buttons: [[7, 8]], buttonBlocks: [[8, 9]],
  };
  const expanded = Layout.expandLevel(level, 5);
  assert.equal(expanded.height, 16);
  assert.equal(expanded.pieces[0].y, 13);
  assert.deepEqual(expanded.king, [7, 9]);
  assert.deepEqual(expanded.walls, [[2, 8]]);
  assert.deepEqual(expanded.platforms, [[4, 10]]);
  assert.deepEqual(expanded.keys, [[5, 11]]);
  assert.deepEqual(expanded.locks, [[6, 12]]);
  assert.deepEqual(expanded.buttons, [[7, 13]]);
  assert.deepEqual(expanded.buttonBlocks, [[8, 14]]);
  assert.equal(level.height, 11);
});
