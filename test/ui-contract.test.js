const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const app = fs.readFileSync(path.join(root, 'app.js'), 'utf8');
const index = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const styles = fs.readFileSync(path.join(root, 'styles.css'), 'utf8');

test('only the logical canvas paints checkerboard cells', () => {
  assert.doesNotMatch(styles, /conic-gradient/);
  assert.match(styles, /canvas[^}]*max-width:\s*none[^}]*max-height:\s*none/);
});

test('selection does not draw a green box around the active piece', () => {
  assert.doesNotMatch(app, /function drawPiece\([^)]*selected/);
  assert.doesNotMatch(app, /if \(selected\)/);
});

test('mobile clients receive the current uncached UI assets', () => {
  for (const asset of ['styles.css', 'levels.js', 'app.js']) {
    assert.match(index, new RegExp(`${asset.replace('.', '\\.')}\\?v=2\\.2\\.0`));
  }
});
