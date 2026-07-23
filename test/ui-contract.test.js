const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const app = fs.readFileSync(path.join(root, 'app.js'), 'utf8');
const index = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const styles = fs.readFileSync(path.join(root, 'styles.css'), 'utf8');

test('the canvas paints only the fixed logical checkerboard', () => {
  assert.doesNotMatch(styles, /conic-gradient/);
  assert.match(styles, /canvas[^}]*max-width:\s*none[^}]*max-height:\s*none/);
  assert.match(app, /for \(let y = 0; y < level\.height;/);
  assert.match(app, /boardY >= 0 && boardY < activeLevel\.height/);
});

test('the original board has no visible top HUD and controls overlay its last row', () => {
  assert.match(styles, /\.top-rail\s*\{\s*display:\s*none/);
  assert.match(styles, /\.control-rail[^}]*top:\s*calc\(50% \+ var\(--board-height\) \/ 2 - var\(--grid-size\)\)/);
  assert.match(index, /id="undoButton"[^>]*>&#9664;/);
  assert.match(index, /id="resetButton"[^>]*>&#8635;/);
});

test('pieces and original interactive objects use dedicated drawing paths', () => {
  assert.match(app, /const size = cellSize \* \.78/);
  assert.match(app, /pawn: '\\u265f\\ufe0e'/);
  for (const name of ['drawWalls', 'drawPlatform', 'drawKey', 'drawButton', 'drawBlock']) {
    assert.match(app, new RegExp(`function ${name}\\(`));
  }
});

test('pawn promotion exposes rook, bishop, knight, and queen choices', () => {
  for (const type of ['rook', 'bishop', 'knight', 'queen']) {
    assert.match(index, new RegExp(`data-promotion="${type}"`));
  }
  assert.match(app, /state\?\.promotionPending/);
});

test('the campaign begins with the original first three levels unlocked', () => {
  assert.match(app, /let unlocked = 3/);
  assert.match(app, /Math\.max\(3,/);
  assert.match(app, /completed\.length \+ 3/);
  assert.match(app, /loadLevel\(0\)/);
});

test('clients receive the current uncached version 3 assets', () => {
  for (const asset of ['styles.css', 'game-core.js', 'levels.js', 'layout.js', 'app.js']) {
    assert.match(index, new RegExp(`${asset.replace('.', '\\.')}\\?v=3\\.0\\.0`));
  }
});
