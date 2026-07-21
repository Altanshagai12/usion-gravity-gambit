(function () {
  'use strict';

  const Core = window.GravityGambitCore;
  const levels = window.GravityGambitLevels;
  const canvas = document.getElementById('board');
  const context = canvas.getContext('2d');
  const wrap = document.getElementById('boardWrap');
  const undoButton = document.getElementById('undoButton');
  const resetButton = document.getElementById('resetButton');
  const levelsButton = document.getElementById('levelsButton');
  const winOverlay = document.getElementById('winOverlay');
  const levelOverlay = document.getElementById('levelOverlay');
  const levelGrid = document.getElementById('levelGrid');
  const symbols = { rook: '♜', bishop: '♝', knight: '♞', queen: '♛', king: '♚', pawn: '♟' };

  const copy = {
    en: { puzzle: 'PUZZLE', level: 'Level', moves: 'Moves', complete: 'Complete', undo: 'Undo', reset: 'Reset', instruction: 'Capture the red king. Every piece falls after moving.', solved: 'SOLVED', campaign: 'CAMPAIGN', choose: 'Choose a puzzle', next: 'Next puzzle', win: 'Beautiful.', moveLine: (n) => `Solved in ${n} move${n === 1 ? '' : 's'}.` },
    mn: { puzzle: 'ТААВАР', level: 'Үе', moves: 'Нүүдэл', complete: 'Дууссан', undo: 'Буцаах', reset: 'Дахин', instruction: 'Улаан хааныг ид. Нүүдэл бүрийн дараа дүрс доош унана.', solved: 'ШИЙДЛЭЭ', campaign: 'ҮЕҮҮД', choose: 'Үе сонгох', next: 'Дараагийн үе', win: 'Гайхалтай.', moveLine: (n) => `${n} нүүдлээр шийдлээ.` },
  };
  const hintsMn = [
    'Тэрэг шулуун чиглэлд явна.', 'Тэмээ зөвхөн диагоналиар явна.', 'Морь саадыг давж чадна.', 'Бэрс тэрэг, тэмээний нүүдлийг хослуулна.',
    'Хоосон зай руу нүүгээд таталцлыг ашигла.', 'Нэг дүрс нөгөө дээр бууж чадна.', 'Тэмээг хэд хэдэн өөр өндөрт буулга.', 'Морь үсрэх бүрдээ хаана буухыг урьдчилан хар.',
    'Нэг дүрс нөгөөгийн буух газрыг өөрчилнө.', 'Хоёр морь хоёулаа өөр үүрэгтэй.', 'Хамгийн ойр зам үргэлж зөв биш.', 'Зөв өндрийг нэг мориос нөгөөд дамжуул.',
    'Хоёр өнгийн диагоналийг хоёуланг хадгал.', 'Долоон нүүдэлтэй морин замаар төгсгө.',
  ];

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

  function applyTheme(value) {
    const theme = value === 'dark' ? 'dark' : 'light';
    document.documentElement.dataset.theme = theme;
    document.querySelector('meta[name="theme-color"]').content = theme === 'dark' ? '#11120f' : '#f4f1ea';
  }

  function loadLevel(index) {
    levelIndex = Math.max(0, Math.min(index, levels.length - 1));
    state = Core.settle(levels[levelIndex], Core.createState(levels[levelIndex]));
    selectedId = null;
    available = [];
    history = [];
    winOverlay.hidden = true;
    levelOverlay.hidden = true;
    updateUI();
    resize();
  }

  function updateUI() {
    document.getElementById('levelNumber').textContent = `${levelIndex + 1} / ${levels.length}`;
    document.getElementById('moveCount').textContent = state?.moves || 0;
    document.getElementById('progressCount').textContent = `${Math.round(completed.length / levels.length * 100)}%`;
    document.getElementById('levelTitle').textContent = language === 'mn' ? `${t.level} ${levelIndex + 1}` : levels[levelIndex].title;
    document.getElementById('levelHint').textContent = language === 'mn' ? hintsMn[levelIndex] : levels[levelIndex].hint;
    undoButton.disabled = history.length === 0;
  }

  function resize() {
    if (!state) return;
    const level = levels[levelIndex];
    const rect = wrap.getBoundingClientRect();
    cellSize = Math.max(28, Math.floor(Math.min(rect.width / level.width, rect.height / level.height)));
    const ratio = Math.min(devicePixelRatio || 1, 2);
    canvas.style.width = `${cellSize * level.width}px`;
    canvas.style.height = `${cellSize * level.height}px`;
    canvas.width = cellSize * level.width * ratio;
    canvas.height = cellSize * level.height * ratio;
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    draw();
  }

  function palette() {
    const styles = getComputedStyle(document.documentElement);
    return ['--surface', '--ink', '--line', '--blue', '--red'].reduce((result, name) => ({ ...result, [name.slice(2)]: styles.getPropertyValue(name).trim() }), {});
  }

  function draw() {
    const level = levels[levelIndex];
    const p = palette();
    context.clearRect(0, 0, canvas.width, canvas.height);
    for (let y = 0; y < level.height; y += 1) for (let x = 0; x < level.width; x += 1) {
      context.fillStyle = (x + y) % 2 ? p.surface : p.line;
      context.globalAlpha = (x + y) % 2 ? 1 : .44;
      context.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
    }
    context.globalAlpha = 1;
    for (const [x, y] of level.walls) {
      context.fillStyle = p.ink;
      context.fillRect(x * cellSize + 3, y * cellSize + 3, cellSize - 6, cellSize - 6);
      context.strokeStyle = p.surface;
      context.globalAlpha = .28;
      context.strokeRect(x * cellSize + 8, y * cellSize + 8, cellSize - 16, cellSize - 16);
      context.globalAlpha = 1;
    }
    for (const move of available) {
      context.fillStyle = move.capture ? p.red : p.blue;
      context.globalAlpha = move.capture ? .45 : .22;
      context.beginPath(); context.arc((move.to[0] + .5) * cellSize, (move.to[1] + .5) * cellSize, cellSize * .26, 0, Math.PI * 2); context.fill();
    }
    if (state.kingAlive) drawPiece('king', level.king[0], level.king[1], p.red, false);
    state.pieces.forEach((piece) => drawPiece(piece.type, piece.x, piece.y, p.blue, piece.id === selectedId));
  }

  function drawPiece(type, x, y, color, selected) {
    context.fillStyle = selected ? color : palette().surface;
    context.strokeStyle = color;
    context.lineWidth = Math.max(2, cellSize * .06);
    context.beginPath(); context.roundRect(x * cellSize + 5, y * cellSize + 5, cellSize - 10, cellSize - 10, cellSize * .25); context.fill(); context.stroke();
    context.fillStyle = selected ? palette().surface : color;
    context.font = `700 ${Math.round(cellSize * .62)}px Georgia, serif`;
    context.textAlign = 'center'; context.textBaseline = 'middle';
    context.fillText(symbols[type], (x + .5) * cellSize, (y + .51) * cellSize);
  }

  function boardPoint(event) {
    const rect = canvas.getBoundingClientRect();
    return [Math.floor((event.clientX - rect.left) / cellSize), Math.floor((event.clientY - rect.top) / cellSize)];
  }

  async function completeLevel() {
    if (!completed.includes(levelIndex)) completed.push(levelIndex);
    unlocked = Math.min(levels.length, Math.max(unlocked, levelIndex + 2));
    await storage.set('gravity-gambit-progress', { unlocked, completed });
    document.getElementById('winTitle').textContent = t.win;
    document.getElementById('winDetail').textContent = t.moveLine(state.moves);
    document.getElementById('nextButton').textContent = levelIndex === levels.length - 1 ? t.choose : t.next;
    winOverlay.hidden = false;
    updateUI();
  }

  function selectAt(x, y) {
    const move = available.find((item) => item.to[0] === x && item.to[1] === y);
    if (move) {
      history.push(Core.clone(state));
      state = Core.applyMove(levels[levelIndex], state, move);
      selectedId = null; available = [];
      updateUI(); draw();
      if (!state.kingAlive) completeLevel();
      return;
    }
    const piece = state.pieces.find((item) => item.x === x && item.y === y);
    selectedId = piece?.id || null;
    available = selectedId ? Core.legalMoves(levels[levelIndex], state, selectedId) : [];
    draw();
  }

  function renderLevelGrid() {
    levelGrid.replaceChildren();
    levels.forEach((level, index) => {
      const button = document.createElement('button');
      button.type = 'button'; button.textContent = completed.includes(index) ? `✓ ${index + 1}` : String(index + 1);
      button.disabled = index >= unlocked;
      if (completed.includes(index)) button.classList.add('done');
      if (index === levelIndex) button.classList.add('current');
      button.addEventListener('click', () => loadLevel(index));
      levelGrid.appendChild(button);
    });
  }

  async function initialize(config = {}) {
    sdk = Object.keys(config).length > 0 ? (window.Usion || null) : null;
    applyLanguage(config.language || sdk?.getLanguage?.() || navigator.language);
    applyTheme(config.theme || sdk?.getTheme?.() || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'));
    const saved = await storage.get('gravity-gambit-progress');
    unlocked = Math.max(1, Math.min(levels.length, Number(saved?.unlocked) || 1));
    completed = Array.isArray(saved?.completed) ? saved.completed.filter((value) => Number.isInteger(value) && value >= 0 && value < levels.length) : [];
    loadLevel(Math.min(unlocked - 1, levels.length - 1));
  }

  canvas.addEventListener('pointerdown', (event) => selectAt(...boardPoint(event)));
  undoButton.addEventListener('click', () => { if (history.length) { state = history.pop(); selectedId = null; available = []; updateUI(); draw(); } });
  resetButton.addEventListener('click', () => loadLevel(levelIndex));
  levelsButton.addEventListener('click', () => { renderLevelGrid(); levelOverlay.hidden = false; });
  document.getElementById('closeLevels').addEventListener('click', () => { levelOverlay.hidden = true; });
  document.getElementById('nextButton').addEventListener('click', () => levelIndex < levels.length - 1 ? loadLevel(levelIndex + 1) : (renderLevelGrid(), winOverlay.hidden = true, levelOverlay.hidden = false));
  window.addEventListener('resize', resize);
  let initialized = false;
  const startOnce = (config) => {
    if (initialized) return;
    initialized = true;
    initialize(config);
  };
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
