(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.GravityGambitLayout = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  function compute(viewportWidth, viewportHeight, railHeight, columns, logicalRows, topRailHeight = 0) {
    const availableHeight = Math.max(1, viewportHeight - railHeight - topRailHeight);
    const visibleRows = logicalRows;
    const cellSize = Math.max(1, Math.min(viewportWidth / columns, availableHeight / logicalRows));
    return {
      cellSize,
      visibleRows,
      rowOffset: 0,
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
      keys: (level.keys || []).map(shiftPoint),
      locks: (level.locks || []).map(shiftPoint),
      buttons: (level.buttons || []).map(shiftPoint),
      buttonBlocks: (level.buttonBlocks || []).map(shiftPoint),
    };
  }

  function shiftState(state, deltaRows) {
    if (!state || deltaRows === 0) return state;
    return { ...state, pieces: state.pieces.map((piece) => ({ ...piece, y: piece.y + deltaRows })) };
  }

  return { compute, expandLevel, shiftState };
});
