const levels = require('../levels');
const { solve } = require('../solver');

for (const [index, level] of levels.entries()) {
  const result = solve(level, { maxNodes: 100000 });
  const required = level.pieces.length > 1 ? require('../solver').requiredPieces(level, { maxNodes: 100000 }).length : 1;
  console.log(`${String(index + 1).padStart(2, '0')} ${level.title.padEnd(18)} solved=${result.solved} moves=${result.moves} required=${required}/${level.pieces.length} explored=${result.explored}`);
}
