const levels = require('../levels');
const { solve } = require('../solver');

for (const [index, level] of levels.entries()) {
  const result = solve(level, { maxNodes: 100000 });
  console.log(`${String(index + 1).padStart(2, '0')} ${level.title.padEnd(18)} solved=${result.solved} moves=${result.moves} explored=${result.explored}`);
}
