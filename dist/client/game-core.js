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
  const PROMOTIONS = ['rook', 'bishop', 'knight', 'queen'];

  const key = (x, y) => `${x},${y}`;
  const clone = (value) => JSON.parse(JSON.stringify(value));
  const inside = (level, x, y) => x >= 0 && x < level.width && y >= 0 && y < level.height;

  function createState(level) {
    return {
      pieces: clone(level.pieces).map((piece, index) => ({ fresh: piece.fresh !== false, ...piece, id: piece.id || `p${index}` })),
      kingAlive: true,
      keysCollected: [],
      locksOpen: false,
      promotionPending: null,
      moves: 0,
    };
  }

  function hasPlatform(level, x, y) {
    return (level.platforms || []).some((platform) => platform[0] === x && platform[1] === y + 1);
  }

  function buttonsPressed(level, state) {
    return (level.buttons || []).some(([x, y]) =>
      state.pieces.some((piece) => piece.x === x && piece.y === y));
  }

  function activeButtonBlocks(level, state) {
    return buttonsPressed(level, state) ? [] : (level.buttonBlocks || []);
  }

  function occupancy(level, state, omitId) {
    const cells = new Map();
    for (const wall of level.walls || []) cells.set(key(wall[0], wall[1]), 'wall');
    if (!state.locksOpen) for (const wall of level.locks || []) cells.set(key(wall[0], wall[1]), 'lock');
    for (const wall of activeButtonBlocks(level, state)) cells.set(key(wall[0], wall[1]), 'button-block');
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
    if (!piece || !state.kingAlive || state.promotionPending) return [];
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
    if (state.promotionPending) return promotionMoves(state);
    return state.pieces.flatMap((piece) => legalMoves(level, state, piece.id));
  }

  function applyTriggers(level, state) {
    const promotedPawn = state.pieces.find((piece) => piece.type === 'pawn' && piece.y === 0);
    if (promotedPawn) state.promotionPending = promotedPawn.id;

    for (let index = 0; index < (level.keys || []).length; index += 1) {
      const [x, y] = level.keys[index];
      if (!state.keysCollected.includes(index) && state.pieces.some((piece) => piece.x === x && piece.y === y)) {
        state.keysCollected.push(index);
        state.locksOpen = true;
      }
    }

    if (!buttonsPressed(level, state) && (level.buttonBlocks || []).length) {
      const blocked = new Set(level.buttonBlocks.map(([x, y]) => key(x, y)));
      state.pieces = state.pieces.filter((piece) => !blocked.has(key(piece.x, piece.y)));
    }
  }

  function settleFrames(level, state) {
    const frames = [];
    applyTriggers(level, state);
    if (state.promotionPending) return frames;
    let moved = true;
    while (moved) {
      moved = false;
      const ordered = [...state.pieces].sort((a, b) => b.y - a.y || a.id.localeCompare(b.id));
      for (const piece of ordered) {
        const cells = occupancy(level, state, piece.id);
        const below = cells.get(key(piece.x, piece.y + 1));
        if (!hasPlatform(level, piece.x, piece.y) && inside(level, piece.x, piece.y + 1) && (!below || below === 'king')) {
          piece.y += 1;
          if (piece.type === 'pawn') piece.fresh = false;
          if (below === 'king') state.kingAlive = false;
          moved = true;
          if (!state.kingAlive) break;
        }
      }
      if (moved) {
        applyTriggers(level, state);
        frames.push(clone(state));
      }
      if (!state.kingAlive || state.promotionPending) break;
    }
    return frames;
  }

  function settle(level, state) {
    settleFrames(level, state);
    return state;
  }

  function applyMoveDetailed(level, state, move) {
    if (move?.promotion) return applyPromotionDetailed(level, state, move);
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
    applyTriggers(level, next);
    const frames = [clone(next)];
    if (next.kingAlive) frames.push(...settleFrames(level, next));
    const nextMoves = next.kingAlive ? legalMoves(level, next, piece.id) : [];
    return { state: next, frames, move: valid, nextMoves };
  }

  function promotionMoves(state) {
    if (!state.promotionPending) return [];
    return PROMOTIONS.map((promotion) => ({ pieceId: state.promotionPending, promotion }));
  }

  function applyPromotionDetailed(level, state, move) {
    if (!state.promotionPending || move.pieceId !== state.promotionPending || !PROMOTIONS.includes(move.promotion)) return null;
    const next = clone(state);
    const piece = next.pieces.find((item) => item.id === next.promotionPending);
    if (!piece || piece.type !== 'pawn') return null;
    piece.type = move.promotion;
    piece.fresh = false;
    next.promotionPending = null;
    const frames = [clone(next)];
    if (next.kingAlive) frames.push(...settleFrames(level, next));
    return {
      state: next,
      frames,
      move: { pieceId: piece.id, promotion: move.promotion },
      nextMoves: next.kingAlive && !next.promotionPending ? legalMoves(level, next, piece.id) : [],
    };
  }

  function applyMove(level, state, move) {
    return applyMoveDetailed(level, state, move)?.state || null;
  }

  function stateHash(state) {
    const keys = [...(state.keysCollected || [])].sort((a, b) => a - b).join(',');
    return `${state.kingAlive ? 1 : 0}|${state.locksOpen ? 1 : 0}|${state.promotionPending || ''}|${keys}|${state.pieces.map((piece) => `${piece.id}:${piece.type}:${piece.x},${piece.y},${piece.fresh ? 1 : 0}`).sort().join('|')}`;
  }

  return {
    PROMOTIONS, activeButtonBlocks, allMoves, applyMove, applyMoveDetailed, applyPromotionDetailed,
    buttonsPressed, clone, createState, hasPlatform, legalMoves, occupancy, promotionMoves,
    settle, settleFrames, stateHash,
  };
});
