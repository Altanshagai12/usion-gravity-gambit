(function (root, factory) {
  const levels = factory();
  if (typeof module === 'object' && module.exports) module.exports = levels;
  else root.GravityGambitLevels = levels;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const floor = (width, y) => Array.from({ length: width }, (_, x) => [x, y]);
  const L = (title, hint, pieces, king, walls = [], width = 8, height = 9) => ({
    title, hint, pieces, king, width, height,
    walls: [...floor(width, height - 1), ...walls],
  });

  return [
    L('Open File', 'Rooks travel in straight lines.', [{ type: 'rook', x: 0, y: 7 }], [6, 7]),
    L('Clean Diagonal', 'Bishops stay on their color.', [{ type: 'bishop', x: 0, y: 7 }], [4, 3]),
    L('The Jump', 'Knights can leap over anything.', [{ type: 'knight', x: 1, y: 7 }], [2, 5], [[1, 6], [2, 6], [3, 6]]),
    L('Royal Reach', 'Queens combine rook and bishop movement.', [{ type: 'queen', x: 0, y: 7 }], [5, 2]),
    L('Drop File', 'Move into open air, then let gravity work.', [{ type: 'rook', x: 0, y: 3 }], [6, 7], [[0, 4], ...floor(5, 8)]),
    L('Soft Landing', 'A piece can land on another piece.', [{ id: 'q', type: 'queen', x: 0, y: 2 }, { id: 'p', type: 'pawn', x: 5, y: 7 }], [7, 4], [[0, 3], ...floor(8, 8)]),
    L('Diagonal Ascent', 'The same bishop may need several landing heights.', [{ id: 'p0', type: 'pawn', x: 0, y: 6 }, { id: 'p1', type: 'knight', x: 0, y: 7 }, { id: 'p2', type: 'bishop', x: 5, y: 2 }], [7, 1], [[7, 6], [4, 4], [4, 3], [3, 3], [6, 3], [6, 4], [1, 2], [7, 4], [7, 7]]),
    L('Knight Current', 'Read where gravity places the knight after every jump.', [{ id: 'p0', type: 'knight', x: 1, y: 3 }, { id: 'p1', type: 'rook', x: 3, y: 6 }, { id: 'p2', type: 'queen', x: 1, y: 7 }, { id: 'p3', type: 'rook', x: 5, y: 4 }], [5, 2], [[7, 6], [2, 3], [5, 3], [0, 2], [1, 2], [4, 2], [5, 6], [3, 4], [6, 5], [4, 7]]),
    L('Borrowed Step', 'One piece can change another piece’s landing square.', [{ id: 'p0', type: 'rook', x: 0, y: 3 }, { id: 'p1', type: 'pawn', x: 3, y: 3 }, { id: 'p2', type: 'pawn', x: 0, y: 6 }, { id: 'p3', type: 'bishop', x: 4, y: 7 }], [6, 4], [[1, 4], [5, 5], [6, 2], [1, 2], [7, 3], [5, 6], [5, 2], [4, 4]]),
    L('Twin Levers', 'Both knights matter, but not in the same way.', [{ id: 'p0', type: 'knight', x: 0, y: 7 }, { id: 'p1', type: 'knight', x: 1, y: 7 }, { id: 'p2', type: 'pawn', x: 3, y: 3 }], [5, 3], [[4, 7], [5, 6], [0, 2], [5, 4]]),
    L('Quiet Detour', 'The shortest-looking route is not the winning route.', [{ id: 'p0', type: 'knight', x: 3, y: 3 }, { id: 'p1', type: 'rook', x: 5, y: 3 }, { id: 'p2', type: 'pawn', x: 1, y: 1 }, { id: 'p3', type: 'rook', x: 4, y: 6 }], [7, 1], [[2, 3], [7, 4], [6, 5], [0, 6], [5, 2], [5, 5], [6, 6]]),
    L('Relay', 'Pass the useful height from one knight to the other.', [{ id: 'p0', type: 'knight', x: 2, y: 6 }, { id: 'p1', type: 'knight', x: 4, y: 1 }], [5, 2], [[1, 6], [6, 7], [4, 4], [5, 6], [6, 2], [6, 3], [3, 3], [2, 4]]),
    L('Long Diagonal', 'Preserve access to both colors of diagonal.', [{ id: 'p0', type: 'pawn', x: 5, y: 6 }, { id: 'p1', type: 'bishop', x: 2, y: 7 }, { id: 'p2', type: 'bishop', x: 2, y: 5 }, { id: 'p3', type: 'rook', x: 5, y: 2 }], [7, 5], [[4, 2], [6, 2], [4, 6], [3, 4], [0, 6], [4, 5], [6, 6], [1, 6]]),
    L('Gravity Gambit', 'A seven-move knight route closes the campaign.', [{ id: 'p0', type: 'knight', x: 1, y: 4 }, { id: 'p1', type: 'rook', x: 1, y: 6 }, { id: 'p2', type: 'pawn', x: 0, y: 2 }], [6, 3], [[3, 3], [7, 2], [7, 5], [0, 4], [4, 7], [6, 7]])
  ];
});
