(function (root, factory) {
  const levels = factory();
  if (typeof module === 'object' && module.exports) module.exports = levels;
  else root.GravityGambitLevels = levels;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const L = (title, hint, pieces, king, walls = [], platforms = []) => ({
    title, hint, pieces, king, walls, platforms, width: 8, height: 9,
  });

  return [
    L('Open File', 'Rooks travel in straight lines.', [{ type: 'rook', x: 0, y: 8 }], [6, 8]),
    L('Clean Diagonal', 'Bishops stay on their color.', [{ type: 'bishop', x: 0, y: 8 }], [4, 4]),
    L('The Jump', 'Knights leap over solid blocks.', [{ type: 'knight', x: 1, y: 8 }], [2, 6], [[1, 7], [2, 7], [3, 7]]),
    L('Royal Reach', 'Queens combine straight and diagonal movement.', [{ type: 'queen', x: 0, y: 8 }], [5, 3]),
    L('First Advance', 'A fresh pawn may move two cells on its first turn.', [{ type: 'pawn', x: 3, y: 7 }], [4, 4], [], [[3, 7], [3, 5]]),
    L('Soft Line', 'Thin lines catch falling pieces but do not block chess moves.', [{ type: 'rook', x: 0, y: 2 }], [7, 5], [], [[0, 2], [4, 5]]),
    L('Gravity Drop', 'Move sideways into open air and watch the landing.', [{ type: 'rook', x: 0, y: 3 }], [6, 8], [[0, 4]]),
    L('Clear the File', 'Both pieces are part of the solution.', [
      { id: 'knight', type: 'knight', x: 4, y: 6 }, { id: 'rook', type: 'rook', x: 1, y: 7 },
    ], [5, 2], [[7, 3], [6, 5], [0, 6], [7, 2], [1, 6]]),
    L('Hook and Ladder', 'The rook opens the knight route.', [
      { id: 'knight', type: 'knight', x: 5, y: 7 }, { id: 'rook', type: 'rook', x: 0, y: 6 },
    ], [7, 5], [[4, 6], [4, 3], [3, 6], [4, 4], [6, 3], [5, 3], [6, 5]], [[5, 3], [5, 4]]),
    L('Borrowed Height', 'Move the rook so the knight can climb.', [
      { id: 'rook', type: 'rook', x: 4, y: 3 }, { id: 'knight', type: 'knight', x: 4, y: 7 },
    ], [5, 2], [[2, 2], [4, 5], [4, 6], [1, 4], [0, 4], [5, 4]], [[7, 3], [3, 6], [2, 2]]),
    L('Shared Landing', 'One knight creates the other knight’s route.', [
      { id: 'left', type: 'knight', x: 4, y: 5 }, { id: 'right', type: 'knight', x: 2, y: 3 },
    ], [6, 5], [[2, 5], [1, 3], [3, 3], [7, 3], [3, 6], [0, 2], [7, 4], [4, 6], [4, 4], [1, 2]], [[6, 6], [0, 6], [3, 4], [0, 4], [2, 1]]),
    L('Lift and Leap', 'The rook and knight must trade heights.', [
      { id: 'rook', type: 'rook', x: 0, y: 7 }, { id: 'knight', type: 'knight', x: 3, y: 3 },
    ], [7, 3], [[2, 4], [7, 5], [3, 6], [1, 6], [6, 4], [2, 3], [5, 3]], [[4, 5], [7, 6], [2, 5]]),
    L('Vertical Relay', 'The knight first clears a vertical relay.', [
      { id: 'rook', type: 'rook', x: 3, y: 7 }, { id: 'knight', type: 'knight', x: 4, y: 3 },
    ], [7, 1], [[1, 7], [0, 7], [5, 7], [5, 4], [6, 5], [7, 7], [1, 6], [1, 4], [2, 4], [0, 2]], [[4, 2], [1, 2], [7, 7]]),
    L('Three Hands', 'Most puzzles need every piece; this one keeps one alternate decoy.', [
      { id: 'bishop', type: 'bishop', x: 2, y: 3 }, { id: 'knight', type: 'knight', x: 5, y: 6 },
      { id: 'pawn', type: 'pawn', x: 0, y: 7 },
    ], [6, 4], [[0, 4], [2, 4], [4, 7], [2, 2], [5, 5], [2, 7]], [[3, 4], [5, 4], [2, 2]]),
  ];
});
