const test = require('node:test');
const assert = require('node:assert/strict');
const Layout = require('../layout');

test('tall phone viewports are fully covered by square canvas rows', () => {
  const result = Layout.compute(591, 1090, 56, 8, 9);
  assert.equal(result.width, result.cellSize * 8);
  assert.equal(result.height, result.cellSize * result.visibleRows);
  assert.ok(result.visibleRows > 9);
  assert.ok(result.height >= result.availableHeight);
  assert.ok(result.height - result.availableHeight < result.cellSize);
});

test('visual filler rows map back outside the logical puzzle', () => {
  const result = Layout.compute(390, 844, 56, 8, 9);
  assert.equal(Layout.logicalRowAt((result.rowOffset - 0.5) * result.cellSize, result.cellSize, result.rowOffset), -1);
  assert.equal(Layout.logicalRowAt((result.rowOffset + 2.5) * result.cellSize, result.cellSize, result.rowOffset), 2);
});
