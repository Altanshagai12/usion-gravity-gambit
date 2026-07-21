(function (root, factory) {
  const api = factory(typeof module === 'object' && module.exports ? require('./game-core') : root.GravityGambitCore);
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.GravityGambitSolver = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (Core) {
  'use strict';

  function solve(level, options = {}) {
    const maxNodes = options.maxNodes || 50000;
    const initial = Core.settle(level, Core.createState(level));
    const queue = [{ state: initial, path: [] }];
    const visited = new Set([Core.stateHash(initial)]);
    let cursor = 0;

    while (cursor < queue.length && visited.size <= maxNodes) {
      const current = queue[cursor++];
      for (const move of Core.allMoves(level, current.state)) {
        const next = Core.applyMove(level, current.state, move);
        if (!next) continue;
        const path = [...current.path, move];
        if (!next.kingAlive) return { solved: true, moves: path.length, path, explored: visited.size };
        const hash = Core.stateHash(next);
        if (visited.has(hash)) continue;
        visited.add(hash);
        queue.push({ state: next, path });
      }
    }
    return { solved: false, moves: null, path: [], explored: visited.size, truncated: visited.size > maxNodes };
  }

  return { solve };
});
