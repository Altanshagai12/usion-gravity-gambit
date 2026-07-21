(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.GravityGambitCore = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const SLIDERS = {
    rook: [[1, 0], [-1, 0], [0, 1], [0, -1]],
    bishop: [[1, 1], [1, -1], [-1, 1], [-1, -1]],
    queen: [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]],
  };
  const KNIGHT = [[1, 2], [2, 1], [2, -1], [1, -2], [-1, -2], [-2, -1], [-2, 1], [-1, 2]];
  const KING = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]];

  const key = (x, y) => `${x},${y}`;
  const clone = (value) => JSON.parse(JSON.stringify(value));
  const inside = (level, x, y) => x >= 0 && x < level.width && y >= 0 && y < level.height;

  function createState(level) {
    return {
      pieces: clone(level.pieces).map((piece, index) => ({ fresh: piece.fresh !== false, ...piece, id: piece.id || `p${index}` })),
      kingAlive: true,
      moves: 0,
    };
  }

  function occupancy(level, state, omitId) {
    const cells = new Map();
    for (const wall of level.walls || []) cells.set(key(wall[0], wall[1]), 'wall');
    if (state.kingAlive) cells.set(key(level.king[0], level.king[1]), 'king');
    for (const piece of state.pieces) if (piece.id !== omitId) cells.set(key(piece.x, piece.y), piece.id);
    return cells;
  }

  function addMove(level, cells, moves, piece, x, y) {
    if (!inside(level, x, y)) return false;
    const target = cells.get(key(x, y));
    if (!target || target === 'king') moves.push({ pieceId: piece.id, from: [piece.x, piece.y], to: [x, y], capture: target === 'king' });
    return !target;
  }

  function legalMoves(level, state, pieceId) {
    const piece = state.pieces.find((item) => item.id === pieceId);
    if (!piece || !state.kingAlive) return [];
    const cells = occupancy(level, state, piece.id);
    const moves = [];

    if (SLIDERS[piece.type]) {
      for (const [dx, dy] of SLIDERS[piece.type]) {
        for (let step = 1; step < Math.max(level.width, level.height); step += 1) {
          if (!addMove(level, cells, moves, piece, piece.x + dx * step, piece.y + dy * step)) break;
        }
      }
    } else if (piece.type === 'knight') {
      for (const [dx, dy] of KNIGHT) addMove(level, cells, moves, piece, piece.x + dx, piece.y + dy);
    } else if (piece.type === 'king') {
      for (const [dx, dy] of KING) addMove(level, cells, moves, piece, piece.x + dx, piece.y + dy);
    } else if (piece.type === 'pawn') {
      const oneY = piece.y - 1;
      if (inside(level, piece.x, oneY) && !cells.has(key(piece.x, oneY))) {
        moves.push({ pieceId: piece.id, from: [piece.x, piece.y], to: [piece.x, oneY], capture: false });
        const twoY = piece.y - 2;
        if (piece.fresh && inside(level, piece.x, twoY) && !cells.has(key(piece.x, twoY))) {
          moves.push({ pieceId: piece.id, from: [piece.x, piece.y], to: [piece.x, twoY], capture: false });
        }
      }
      for (const dx of [-1, 1]) {
        if (state.kingAlive && piece.x + dx === level.king[0] && oneY === level.king[1]) {
          moves.push({ pieceId: piece.id, from: [piece.x, piece.y], to: [piece.x + dx, oneY], capture: true });
        }
      }
    }
    return moves;
  }

  function allMoves(level, state) {
    return state.pieces.flatMap((piece) => legalMoves(level, state, piece.id));
  }

  function settle(level, state) {
    let moved = true;
    while (moved) {
      moved = false;
      const ordered = [...state.pieces].sort((a, b) => b.y - a.y || a.id.localeCompare(b.id));
      for (const piece of ordered) {
        const cells = occupancy(level, state, piece.id);
        if (inside(level, piece.x, piece.y + 1) && !cells.has(key(piece.x, piece.y + 1))) {
          piece.y += 1;
          moved = true;
        }
      }
    }
    return state;
  }

  function applyMove(level, state, move) {
    const next = clone(state);
    const piece = next.pieces.find((item) => item.id === move.pieceId);
    if (!piece) return null;
    const valid = legalMoves(level, state, move.pieceId).find((item) => item.to[0] === move.to[0] && item.to[1] === move.to[1]);
    if (!valid) return null;
    piece.x = valid.to[0];
    piece.y = valid.to[1];
    piece.fresh = false;
    next.moves += 1;
    if (valid.capture) next.kingAlive = false;
    if (next.kingAlive) settle(level, next);
    return next;
  }

  function stateHash(state) {
    return `${state.kingAlive ? 1 : 0}|${state.pieces.map((piece) => `${piece.id}:${piece.x},${piece.y},${piece.fresh ? 1 : 0}`).sort().join('|')}`;
  }

  return { allMoves, applyMove, clone, createState, legalMoves, occupancy, settle, stateHash };
});
