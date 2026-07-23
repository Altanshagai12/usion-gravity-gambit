(function (root, factory) {
  const api = factory(typeof module === 'object' && module.exports ? require('./game-core') : root.GravityGambitCore);
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.GravityGambitSolver = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (Core) {
  'use strict';

  function solve(level, options = {}) {
    const maxNodes = options.maxNodes || 50000;
    const initial = Core.settle(level, Core.createState(level));
    const required = options.requireAllPieces ? new Set(initial.pieces.map((piece) => piece.id)) : null;
    const tracksUsage = required !== null;
    const forbidden = new Set(options.forbiddenPieceIds || []);
    const queue = [{ state: initial, path: [], used: new Set() }];
    const visited = new Set([Core.stateHash(initial)]);
    let cursor = 0;

    while (cursor < queue.length && visited.size <= maxNodes) {
      const current = queue[cursor++];
      for (const move of Core.allMoves(level, current.state)) {
        if (forbidden.has(move.pieceId)) continue;
        const next = Core.applyMove(level, current.state, move);
        if (!next) continue;
        const path = move.promotion ? current.path : [...current.path, move];
        const used = tracksUsage && !move.promotion ? new Set(current.used).add(move.pieceId) : current.used;
        const fulfilled = !required || [...required].every((id) => used.has(id));
        if (!next.kingAlive && fulfilled) return { solved: true, moves: path.length, path, explored: visited.size, used: [...used] };
        if (!next.kingAlive) continue;
        const stateKey = Core.stateHash(next);
        const hash = tracksUsage ? `${stateKey}|${[...used].sort().join(',')}` : stateKey;
        if (visited.has(hash)) continue;
        visited.add(hash);
        queue.push({ state: next, path, used });
      }
    }
    return { solved: false, moves: null, path: [], explored: visited.size, truncated: visited.size > maxNodes };
  }

  function requiredPieces(level, options = {}) {
    return level.pieces.map((piece, index) => ({ piece, id: piece.id || `p${index}` })).filter(({ id }) => {
      return !solve(level, { ...options, forbiddenPieceIds: [id] }).solved;
    }).map(({ id }) => id);
  }

  return { requiredPieces, solve };
});
