const { solve } = require('../solver');

let seed = 90210;
const random = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
const pick = (items) => items[Math.floor(random() * items.length)];
const pointKey = (point) => `${point[0]},${point[1]}`;
const types = ['rook', 'bishop', 'knight', 'queen', 'pawn'];

function candidate(index) {
  const width = 8;
  const height = 9;
  const occupied = new Set();
  const king = [5 + Math.floor(random() * 3), 1 + Math.floor(random() * 6)];
  occupied.add(pointKey(king));
  const pieces = [];
  const pieceCount = 2 + Math.floor(random() * 3);
  while (pieces.length < pieceCount) {
    const point = [Math.floor(random() * 6), 1 + Math.floor(random() * 7)];
    if (occupied.has(pointKey(point))) continue;
    occupied.add(pointKey(point));
    pieces.push({ id: `p${pieces.length}`, type: pick(types), x: point[0], y: point[1] });
  }

  const walls = Array.from({ length: width }, (_, x) => [x, height - 1]);
  const wallCount = 4 + Math.floor(random() * 8);
  while (walls.length < width + wallCount) {
    const point = [Math.floor(random() * width), 2 + Math.floor(random() * 6)];
    if (occupied.has(pointKey(point)) || walls.some((wall) => pointKey(wall) === pointKey(point))) continue;
    walls.push(point);
  }
  return { title: `Candidate ${index}`, hint: '', width, height, pieces, king, walls };
}

const found = [];
for (let attempt = 0; attempt < 20000 && found.length < 8; attempt += 1) {
  const level = candidate(attempt);
  const result = solve(level, { maxNodes: 30000 });
  const target = 3 + Math.floor(found.length / 2);
  if (!result.solved || result.moves < target || result.moves > target + 2 || result.explored < 80) continue;
  found.push({ level, metrics: { moves: result.moves, explored: result.explored }, solution: result.path });
  console.log(JSON.stringify(found[found.length - 1]));
}
console.error(`Found ${found.length} candidates after seed ${seed}`);
