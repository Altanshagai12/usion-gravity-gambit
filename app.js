(function () {
  'use strict';

  const Core = window.GravityGambitCore;
  const Layout = window.GravityGambitLayout;
  const levels = window.GravityGambitLevels;
  const canvas = document.getElementById('board');
  const context = canvas.getContext('2d');
  const wrap = document.getElementById('boardWrap');
  const controlRail = document.querySelector('.control-rail');
  const undoButton = document.getElementById('undoButton');
  const winOverlay = document.getElementById('winOverlay');
  const levelOverlay = document.getElementById('levelOverlay');
  const symbols = { rook: '\u265c', bishop: '\u265d', knight: '\u265e', queen: '\u265b', king: '\u265a', pawn: '\u2659\ufe0e' };
  const colors = { tanA: '#c9a06b', tanB: '#b78a49', green: '#63d64e', blue: '#55a8df', red: '#e35f62', ink: '#11130f' };
  const copy = {
    en: { moves: 'Moves', solved: 'SOLVED', campaign: 'CAMPAIGN', choose: 'Choose a puzzle', next: 'Next puzzle', win: 'Beautiful.', moveLine: (n) => `Solved in ${n} move${n === 1 ? '' : 's'}.` },
    mn: { moves: 'Нүүдэл', solved: 'ШИЙДЛЭЭ', campaign: 'ҮЕҮҮД', choose: 'Үе сонгох', next: 'Дараагийн үе', win: 'Гайхалтай.', moveLine: (n) => `${n} нүүдлээр шийдлээ.` },
  };
  const hintsMn = [
    'Тэрэг шулуун чиглэлд явна.', 'Тэмээ диагоналиар явна.', 'Морь саадыг давж үсэрнэ.', 'Бэрс шулуун болон диагональ нүүдлийг хослуулна.',
    'Хүү эхний нүүдлээрээ хоёр нүд урагшилж болно.', 'Нарийн шугам уналтыг тогтоох боловч нүүдлийг хаахгүй.', 'Хоосон зай руу нүүгээд таталцлаар буухыг ажигла.',
    'Хоёр дүр хоёулаа шийдэлд оролцоно.', 'Тэрэг морины замыг нээнэ.', 'Моринд өндөр өгөхийн тулд тэргийг хөдөлгө.', 'Нэг морь нөгөөгийн буух газрыг бий болгоно.',
    'Тэрэг, морь хоёр өндрөө солилцоно.', 'Эхлээд морь босоо замыг чөлөөлнө.', 'Энэ үед нэг дүр нь санаатай хуурмаг сонголт.',
  ];
  const [liftMn, verticalMn, threeMn] = hintsMn.slice(11, 14);
  hintsMn.splice(11, 3, threeMn, verticalMn, liftMn);
  hintsMn.push(
    'Морийг эхэлж хөдөлгөн тэргэнд тавцанг нь ашиглуул.',
    'Тэмээ, морь хоёр аюулгүй буух замаа солилцоно.',
    'Бэрс талбайг гатлахаас өмнө тэргийг өргө.',
    'Тэмээ, тэрэг хоёр бие биеийнхээ буух шугамыг эзэлнэ.',
    'Хоёр тэмээг нэг диагоналиар дараалан буулга.',
    'Тэрэг долоон нүүдэлт морины өгсөлтийг нээнэ.',
    'Нэг тэмээ нөгөө тэмээний эцсийн диагоналийг бэлтгэнэ.',
    'Хоёр морь замаа огтлолцуулахдаа доод буултыг хадгал.',
    'Морины дамжуулалтыг гурван өөр өндөрт давт.',
    'Хоёр тэмээ есөн нарийн нүүдлээр буух өндрөө солилцоно.',
  );

  let sdk = null;
  let language = 'en';
  let t = copy.en;
  let levelIndex = 0;
  let unlocked = 1;
  let completed = [];
  let state = null;
  let selectedId = null;
  let available = [];
  let history = [];
  let cellSize = 40;
  let visibleRows = 9;
  let rowOffset = 0;
  let animating = false;

  const storage = {
    async get(key) {
      if (sdk?.storage?.get) return sdk.storage.get(key);
      try { return JSON.parse(localStorage.getItem(key)); } catch { return null; }
    },
    async set(key, value) {
      if (sdk?.storage?.set) return sdk.storage.set(key, value);
      localStorage.setItem(key, JSON.stringify(value));
    },
  };

  function applyLanguage(value) {
    language = String(value || '').toLowerCase().startsWith('mn') ? 'mn' : 'en';
    t = copy[language];
    document.documentElement.lang = language;
    document.querySelectorAll('[data-i18n]').forEach((node) => { node.textContent = t[node.dataset.i18n]; });
  }

  function loadLevel(index) {
    levelIndex = Math.max(0, Math.min(index, levels.length - 1));
    state = Core.settle(levels[levelIndex], Core.createState(levels[levelIndex]));
    selectedId = null; available = []; history = []; animating = false;
    winOverlay.hidden = true; levelOverlay.hidden = true;
    updateUI(); resize();
  }

  function updateUI() {
    document.getElementById('levelNumber').textContent = `${levelIndex + 1} / ${levels.length}`;
    document.getElementById('moveCount').textContent = state?.moves || 0;
    document.getElementById('levelTitle').textContent = language === 'mn' ? `Үе ${levelIndex + 1}` : levels[levelIndex].title;
    document.getElementById('levelHint').textContent = language === 'mn' ? hintsMn[levels[levelIndex].hintIndex ?? levelIndex] : levels[levelIndex].hint;
    undoButton.disabled = history.length === 0 || animating;
  }

  function resize() {
    if (!state) return;
    const level = levels[levelIndex];
    const rect = wrap.getBoundingClientRect();
    const railHeight = controlRail.getBoundingClientRect().height;
    const layout = Layout.compute(rect.width, rect.height, railHeight, level.width, level.height);
    ({ cellSize, visibleRows, rowOffset } = layout);
    wrap.style.setProperty('--grid-size', `${cellSize}px`);
    const ratio = Math.min(devicePixelRatio || 1, 2);
    canvas.style.width = `${layout.width}px`;
    canvas.style.height = `${layout.height}px`;
    canvas.width = layout.width * ratio;
    canvas.height = layout.height * ratio;
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    draw(state);
  }

  function draw(boardState) {
    const level = levels[levelIndex];
    context.clearRect(0, 0, canvas.width, canvas.height);
    for (let y = 0; y < visibleRows; y += 1) for (let x = 0; x < level.width; x += 1) {
      context.fillStyle = (x + y) % 2 ? colors.tanB : colors.tanA;
      context.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
    }
    drawWalls(level);
    (level.platforms || []).forEach(([x, y]) => drawPlatform(x, y));
    for (const move of available) {
      context.fillStyle = move.capture ? 'rgba(227,95,98,.58)' : 'rgba(104,74,37,.46)';
      context.beginPath(); context.arc((move.to[0] + .5) * cellSize, (move.to[1] + rowOffset + .5) * cellSize, cellSize * .22, 0, Math.PI * 2); context.fill();
    }
    if (boardState.kingAlive) drawPiece('king', level.king[0], level.king[1], colors.red);
    boardState.pieces.forEach((piece) => drawPiece(piece.type, piece.x, piece.y, colors.blue));
    context.fillStyle = colors.green;
    context.strokeStyle = colors.ink;
    context.lineWidth = Math.max(2, cellSize * .045);
    const floorY = (level.height + rowOffset) * cellSize;
    context.fillRect(0, floorY - 7, level.width * cellSize, 7);
    context.strokeRect(-2, floorY - 9, level.width * cellSize + 4, 10);
  }

  function drawWalls(level) {
    for (const [x, y] of level.walls) {
      const pad = cellSize * .06;
      context.fillStyle = colors.green; context.strokeStyle = colors.ink; context.lineWidth = Math.max(2, cellSize * .045);
      const visualY = y + rowOffset;
      context.beginPath(); context.roundRect(x * cellSize + pad, visualY * cellSize + pad, cellSize - pad * 2, cellSize - pad * 2, cellSize * .12); context.fill(); context.stroke();
      context.beginPath();
      context.roundRect((x + .27) * cellSize, (visualY + .27) * cellSize, cellSize * .46, cellSize * .46, cellSize * .04);
      context.stroke();
    }
  }

  function drawPlatform(x, y) {
    const width = cellSize * .78;
    context.fillStyle = colors.green; context.strokeStyle = colors.ink; context.lineWidth = Math.max(2, cellSize * .045);
    context.beginPath(); context.roundRect((x + .5) * cellSize - width / 2, (y + rowOffset + .84) * cellSize, width, cellSize * .1, cellSize * .05); context.fill(); context.stroke();
  }

  function drawPiece(type, x, y, color) {
    const size = cellSize * .78;
    context.font = `900 ${size}px "Arial Unicode MS", "DejaVu Sans", Georgia, serif`;
    context.textAlign = 'center'; context.textBaseline = 'middle'; context.lineJoin = 'round';
    context.lineWidth = Math.max(2, cellSize * .055); context.strokeStyle = colors.ink; context.fillStyle = color;
    const visualY = y + rowOffset;
    context.strokeText(symbols[type], (x + .5) * cellSize, (visualY + .49) * cellSize);
    context.fillText(symbols[type], (x + .5) * cellSize, (visualY + .49) * cellSize);
  }

  function interpolate(from, to, amount) {
    const visual = Core.clone(to);
    for (const piece of visual.pieces) {
      const prior = from.pieces.find((item) => item.id === piece.id) || piece;
      piece.x = prior.x + (piece.x - prior.x) * amount;
      piece.y = prior.y + (piece.y - prior.y) * amount;
    }
    visual.kingAlive = amount < .72 ? from.kingAlive : to.kingAlive;
    return visual;
  }

  function tween(from, to, duration) {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) { draw(to); return Promise.resolve(); }
    return new Promise((resolve) => {
      const start = performance.now();
      const frame = (now) => {
        const raw = Math.min(1, (now - start) / duration);
        const eased = 1 - Math.pow(1 - raw, 3);
        draw(interpolate(from, to, eased));
        if (raw < 1) requestAnimationFrame(frame); else resolve();
      };
      requestAnimationFrame(frame);
    });
  }

  async function playMove(move) {
    const result = Core.applyMoveDetailed(levels[levelIndex], state, move);
    if (!result) return;
    history.push(Core.clone(state));
    selectedId = move.pieceId; available = []; animating = true; updateUI();
    let previous = state;
    for (let index = 0; index < result.frames.length; index += 1) {
      const frame = result.frames[index];
      await tween(previous, frame, index === 0 ? 170 : 92);
      previous = frame;
    }
    state = result.state; animating = false;
    selectedId = state.kingAlive && state.pieces.some((piece) => piece.id === move.pieceId) ? move.pieceId : null;
    available = selectedId ? result.nextMoves : [];
    updateUI(); draw(state);
    if (!state.kingAlive) completeLevel();
  }

  function selectAt(x, y) {
    if (animating) return;
    const move = available.find((item) => item.to[0] === x && item.to[1] === y);
    if (move) { playMove(move); return; }
    const piece = state.pieces.find((item) => item.x === x && item.y === y);
    selectedId = piece?.id || null;
    available = selectedId ? Core.legalMoves(levels[levelIndex], state, selectedId) : [];
    draw(state);
  }

  async function completeLevel() {
    if (!completed.includes(levelIndex)) completed.push(levelIndex);
    unlocked = Math.min(levels.length, Math.max(unlocked, levelIndex + 2));
    await storage.set('gravity-gambit-progress-v2', { unlocked, completed });
    document.getElementById('winTitle').textContent = t.win;
    document.getElementById('winDetail').textContent = t.moveLine(state.moves);
    document.getElementById('nextButton').textContent = levelIndex === levels.length - 1 ? t.choose : t.next;
    winOverlay.hidden = false;
  }

  function renderLevelGrid() {
    const grid = document.getElementById('levelGrid');
    grid.replaceChildren();
    levels.forEach((level, index) => {
      const button = document.createElement('button');
      button.type = 'button'; button.textContent = completed.includes(index) ? `✓ ${index + 1}` : String(index + 1);
      button.disabled = index >= unlocked;
      if (completed.includes(index)) button.classList.add('done');
      if (index === levelIndex) button.classList.add('current');
      button.addEventListener('click', () => loadLevel(index));
      grid.appendChild(button);
    });
  }

  async function initialize(config = {}) {
    sdk = Object.keys(config).length ? (window.Usion || null) : null;
    applyLanguage(config.language || sdk?.getLanguage?.() || navigator.language);
    document.documentElement.dataset.theme = config.theme || sdk?.getTheme?.() || 'light';
    const saved = await storage.get('gravity-gambit-progress-v2');
    unlocked = Math.max(1, Math.min(levels.length, Number(saved?.unlocked) || 1));
    completed = Array.isArray(saved?.completed) ? saved.completed.filter((value) => Number.isInteger(value) && value >= 0 && value < levels.length) : [];
    loadLevel(Math.min(unlocked - 1, levels.length - 1));
  }

  canvas.addEventListener('pointerdown', (event) => {
    const rect = canvas.getBoundingClientRect();
    const logicalY = Layout.logicalRowAt(event.clientY - rect.top, cellSize, rowOffset);
    if (logicalY >= 0 && logicalY < levels[levelIndex].height) {
      selectAt(Math.floor((event.clientX - rect.left) / cellSize), logicalY);
    }
  });
  undoButton.addEventListener('click', () => { if (!animating && history.length) { state = history.pop(); selectedId = null; available = []; updateUI(); draw(state); } });
  document.getElementById('resetButton').addEventListener('click', () => loadLevel(levelIndex));
  document.getElementById('levelsButton').addEventListener('click', () => { renderLevelGrid(); levelOverlay.hidden = false; });
  document.getElementById('closeLevels').addEventListener('click', () => { levelOverlay.hidden = true; });
  document.getElementById('nextButton').addEventListener('click', () => levelIndex < levels.length - 1 ? loadLevel(levelIndex + 1) : (renderLevelGrid(), winOverlay.hidden = true, levelOverlay.hidden = false));
  window.addEventListener('resize', resize);

  let initialized = false;
  const startOnce = (config) => { if (!initialized) { initialized = true; initialize(config); } };
  function boot(attempt = 0) {
    if (window.Usion?.init) {
      const pending = window.Usion.init(startOnce);
      if (pending?.catch) pending.catch(() => startOnce({}));
      window.setTimeout(() => startOnce({}), 900);
    } else if (attempt < 12) window.setTimeout(() => boot(attempt + 1), 50);
    else startOnce({});
  }
  boot();
})();
