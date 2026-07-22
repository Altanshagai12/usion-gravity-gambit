(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.GravityGambitLayout = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  function compute(viewportWidth, viewportHeight, railHeight, columns, logicalRows, topRailHeight = 0) {
    const availableHeight = Math.max(1, viewportHeight - railHeight - topRailHeight);
    const maxCellSize = viewportWidth / columns;
    const visibleRows = Math.max(logicalRows, Math.ceil(availableHeight / maxCellSize));
    const cellSize = Math.max(1, Math.min(maxCellSize, availableHeight / visibleRows));
    return {
      cellSize,
      visibleRows,
      rowOffset: visibleRows - logicalRows,
      width: cellSize * columns,
      height: cellSize * visibleRows,
      availableHeight,
    };
  }

  function expandLevel(level, extraRows) {
    const shiftPoint = ([x, y]) => [x, y + extraRows];
    return {
      ...level,
      height: level.height + extraRows,
      pieces: level.pieces.map((piece) => ({ ...piece, y: piece.y + extraRows })),
      king: shiftPoint(level.king),
      walls: (level.walls || []).map(shiftPoint),
      platforms: (level.platforms || []).map(shiftPoint),
    };
  }

  function shiftState(state, deltaRows) {
    if (!state || deltaRows === 0) return state;
    return { ...state, pieces: state.pieces.map((piece) => ({ ...piece, y: piece.y + deltaRows })) };
  }

  return { compute, expandLevel, shiftState };
});
