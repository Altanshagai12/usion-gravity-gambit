(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.GravityGambitLayout = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  function compute(viewportWidth, viewportHeight, railHeight, columns, logicalRows) {
    const availableHeight = Math.max(1, viewportHeight - railHeight);
    const cellSize = Math.max(1, Math.floor(Math.min(viewportWidth / columns, availableHeight / logicalRows)));
    const visibleRows = Math.max(logicalRows, Math.ceil(availableHeight / cellSize));
    return {
      cellSize,
      visibleRows,
      rowOffset: visibleRows - logicalRows,
      width: cellSize * columns,
      height: cellSize * visibleRows,
      availableHeight,
    };
  }

  function logicalRowAt(pixelY, cellSize, rowOffset) {
    return Math.floor(pixelY / cellSize) - rowOffset;
  }

  return { compute, logicalRowAt };
});
