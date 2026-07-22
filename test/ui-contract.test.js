const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const app = fs.readFileSync(path.join(root, 'app.js'), 'utf8');
const index = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const styles = fs.readFileSync(path.join(root, 'styles.css'), 'utf8');
const layout = fs.readFileSync(path.join(root, 'layout.js'), 'utf8');

test('only the logical canvas paints checkerboard cells', () => {
  assert.doesNotMatch(styles, /conic-gradient/);
  assert.match(styles, /canvas[^}]*max-width:\s*none[^}]*max-height:\s*none/);
});

test('portrait rows use the playable runtime level', () => {
  assert.match(layout, /Math\.ceil\(availableHeight \/ cellSize\)/);
  assert.match(layout, /function expandLevel/);
  assert.match(app, /for \(let y = 0; y < visibleRows;/);
  assert.match(app, /Core\.legalMoves\(activeLevel/);
  assert.match(app, /boardY >= 0 && boardY < activeLevel\.height/);
});

test('pieces are larger and the pawn is drawn symmetrically around its center', () => {
  assert.match(app, /const size = cellSize \* \.78/);
  assert.match(app, /function drawPawn/);
  assert.match(app, /const centerX = \(x \+ \.5\) \* cellSize/);
  assert.doesNotMatch(app, /pawn:\s*['"]/);
});

test('selection does not draw a green box around the active piece', () => {
  assert.doesNotMatch(app, /function drawPiece\([^)]*selected/);
  assert.doesNotMatch(app, /if \(selected\)/);
});

test('mobile clients receive the current uncached UI assets', () => {
  for (const asset of ['styles.css', 'levels.js', 'layout.js', 'app.js']) {
    assert.match(index, new RegExp(`${asset.replace('.', '\\.')}\\?v=2\\.4\\.0`));
  }
});
