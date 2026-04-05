/* ============================================================
   DEEPSTRIKE — game.js
   App shell: event bus, screen router, global state
   ============================================================ */

'use strict';

/* ── Event Bus ──────────────────────────────────────────────── */
const Bus = (() => {
  const listeners = {};
  return {
    on(event, fn) {
      (listeners[event] = listeners[event] || []).push(fn);
    },
    off(event, fn) {
      if (!listeners[event]) return;
      listeners[event] = listeners[event].filter(f => f !== fn);
    },
    emit(event, data) {
      (listeners[event] || []).forEach(fn => fn(data));
    }
  };
})();

/* ── Global State ───────────────────────────────────────────── */
const GameState = (() => {
  const SAVE_KEY = 'deepstrike_save';

  const defaults = {
    player: {
      toolTier: 1,
      upgradePoints: 0,
      skillPoints: 0,
      unlockedSkills: []
    },
    world: {
      currentLayer: 1,
      clearedLayers: [],
      zoneTheme: 'surface'
    },
    grid: {
      cells: [],
      layerSeed: 1
    },
    inventory: {
      items: {},
      sets: {}
    },
    story: {
      chapter: 1,
      seenDialogue: []
    },
    settings: {
      largeCell: false,
      haptics: true
    }
  };

  let state = null;

  function load() {
    try {
      const saved = localStorage.getItem(SAVE_KEY);
      if (saved) {
        state = JSON.parse(saved);
      }
    } catch (e) {
      console.warn('DeepStrike: could not load save', e);
    }
    if (!state) {
      state = JSON.parse(JSON.stringify(defaults));
    }
  }

  function save() {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(state));
    } catch (e) {
      console.warn('DeepStrike: could not save state', e);
    }
  }

  function get(path) {
    const parts = path.split('.');
    let cur = state;
    for (const p of parts) {
      if (cur == null) return undefined;
      cur = cur[p];
    }
    return cur;
  }

  function set(path, value) {
    const parts = path.split('.');
    let cur = state;
    for (let i = 0; i < parts.length - 1; i++) {
      if (cur[parts[i]] == null) cur[parts[i]] = {};
      cur = cur[parts[i]];
    }
    cur[parts[parts.length - 1]] = value;
    save();
    Bus.emit('state:changed', { path, value });
  }

  function reset() {
    state = JSON.parse(JSON.stringify(defaults));
    save();
    Bus.emit('state:reset', {});
  }

  return { load, save, get, set, reset };
})();

/* ── Screen Router ──────────────────────────────────────────── */
const Router = (() => {
  let currentScreen = null;
  const screens = {};

  function register(id, { onEnter, onExit } = {}) {
    screens[id] = { onEnter, onExit };
  }

  function go(id) {
    if (id === currentScreen) return;

    // Deactivate current
    if (currentScreen) {
      const el = document.getElementById(`screen-${currentScreen}`);
      if (el) el.classList.remove('active');
      const prev = screens[currentScreen];
      if (prev && prev.onExit) prev.onExit();
    }

    // Activate new
    const el = document.getElementById(`screen-${id}`);
    if (el) el.classList.add('active');
    const next = screens[id];
    if (next && next.onEnter) next.onEnter();

    currentScreen = id;

    // Sync tray buttons
    document.querySelectorAll('.tray-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.screen === id);
    });

    Bus.emit('router:navigate', { screen: id });
  }

  function current() { return currentScreen; }

  return { register, go, current };
})();

/* ── Zone Utilities ─────────────────────────────────────────── */
const Zones = {
  themeForLayer(layer) {
    if (layer <= 10)  return 'surface';
    if (layer <= 25)  return 'iron';
    if (layer <= 45)  return 'crystal';
    if (layer <= 65)  return 'magma';
    return 'void';
  },
  nameForLayer(layer) {
    if (layer <= 10)  return 'The Surface Crust';
    if (layer <= 25)  return 'The Iron Seam';
    if (layer <= 45)  return 'Crystal Grottos';
    if (layer <= 65)  return 'The Magma Shelf';
    return 'The Void Depths';
  },
  applyTheme(theme) {
    document.documentElement.setAttribute('data-zone', theme);
    GameState.set('world.zoneTheme', theme);
  }
};

/* ── Haptics ────────────────────────────────────────────────── */
const Haptics = {
  tap()   { if (GameState.get('settings.haptics') && navigator.vibrate) navigator.vibrate(8); },
  break() { if (GameState.get('settings.haptics') && navigator.vibrate) navigator.vibrate([12, 4, 8]); }
};

/* ── Placeholder Grid ───────────────────────────────────────── */
const PlaceholderGrid = (() => {
  const CELL_SIZE = 44; // px — meets 44×44 minimum tap target
  const GAP = 2;

  let gridSize = 8;
  let cells = [];

  // Very basic cell type distribution for placeholder display
  const CELL_TYPES = ['soil', 'soil', 'soil', 'rock', 'rock', 'ore_vein'];

  function randomType() {
    return CELL_TYPES[Math.floor(Math.random() * CELL_TYPES.length)];
  }

  function init(layer) {
    if (layer <= 5)       gridSize = 8;
    else if (layer <= 15) gridSize = 12;
    else if (layer <= 30) gridSize = 16;
    else                  gridSize = 20;

    cells = [];
    for (let r = 0; r < gridSize; r++) {
      cells[r] = [];
      for (let c = 0; c < gridSize; c++) {
        cells[r][c] = {
          type: randomType(),
          hp: 4,
          maxHp: 4,
          stage: 0,
          broken: false,
          hasItem: Math.random() < 0.1
        };
      }
    }
  }

  function render() {
    const canvas = document.getElementById('grid-canvas');
    if (!canvas) return;
    canvas.innerHTML = '';

    const total = gridSize * (CELL_SIZE + GAP) - GAP;
    canvas.style.width  = total + 'px';
    canvas.style.height = total + 'px';

    for (let r = 0; r < gridSize; r++) {
      for (let c = 0; c < gridSize; c++) {
        const cell = cells[r][c];
        const el = document.createElement('div');
        el.className = 'cell' + (cell.broken ? ' broken' : '') + (cell.hasItem ? ' has-item' : '');
        el.dataset.type  = cell.type;
        el.dataset.stage = cell.stage;
        el.dataset.row   = r;
        el.dataset.col   = c;
        el.style.cssText = `
          width: ${CELL_SIZE}px;
          height: ${CELL_SIZE}px;
          left: ${c * (CELL_SIZE + GAP)}px;
          top:  ${r * (CELL_SIZE + GAP)}px;
        `;

        // Crack SVG overlay
        el.innerHTML = `
          <svg class="crack-svg" viewBox="0 0 44 44" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <polyline points="22,0 18,12 26,16 14,28 20,44" fill="none" stroke="rgba(0,0,0,0.7)" stroke-width="1.2"/>
            <polyline points="44,10 30,18 36,22 24,36" fill="none" stroke="rgba(0,0,0,0.5)" stroke-width="0.8"/>
          </svg>`;

        el.addEventListener('pointerdown', onCellPointerDown);
        canvas.appendChild(el);
      }
    }

    // Center and fit the grid in viewport
    fitGrid();
  }

  function fitGrid() {
    const viewport = document.getElementById('grid-viewport');
    const canvas   = document.getElementById('grid-canvas');
    if (!viewport || !canvas) return;

    const vw = viewport.clientWidth;
    const vh = viewport.clientHeight;
    const total = gridSize * (CELL_SIZE + GAP) - GAP;

    // Scale so grid fits with 16px padding on each side
    const scale = Math.min((vw - 32) / total, (vh - 32) / total, 1);
    canvas.style.transform = `translate(-50%, -50%) scale(${scale})`;
  }

  // ── Touch / pointer handling ─────────────────────────────────
  const PAN_THRESHOLD = 8; // px — below this = tap, above = pan

  let pointerState = null;
  let panOffset  = { x: 0, y: 0 };
  let panCurrent = { x: 0, y: 0 };
  let currentScale = 1;

  function onCellPointerDown(e) {
    // Only handle primary pointer on the cell directly
    e.stopPropagation();
    const el = e.currentTarget;
    const startX = e.clientX;
    const startY = e.clientY;
    let moved = false;

    function onMove(ev) {
      if (Math.abs(ev.clientX - startX) > PAN_THRESHOLD ||
          Math.abs(ev.clientY - startY) > PAN_THRESHOLD) {
        moved = true;
        el.removeEventListener('pointermove', onMove);
        el.removeEventListener('pointerup',   onUp);
      }
    }

    function onUp() {
      el.removeEventListener('pointermove', onMove);
      el.removeEventListener('pointerup',   onUp);
      if (!moved) strikeCell(+el.dataset.row, +el.dataset.col, el);
    }

    el.addEventListener('pointermove', onMove);
    el.addEventListener('pointerup',   onUp);
  }

  function strikeCell(r, c, el) {
    const cell = cells[r][c];
    if (!cell || cell.broken) return;

    Haptics.tap();
    cell.hp = Math.max(0, cell.hp - 1);
    cell.stage = 4 - Math.ceil((cell.hp / cell.maxHp) * 4);

    el.dataset.stage = cell.stage;

    // Ripple effect
    const ripple = document.createElement('div');
    ripple.className = 'tap-ripple';
    ripple.style.left = '50%';
    ripple.style.top  = '50%';
    el.appendChild(ripple);
    setTimeout(() => ripple.remove(), 400);

    if (cell.hp <= 0) {
      cell.broken = true;
      el.classList.add('broken');
      el.classList.remove('has-item');
      Haptics.break();
      Bus.emit('cell:broken', { r, c, type: cell.type, hadItem: cell.hasItem });
      checkLayerClear();
    }

    Bus.emit('cell:struck', { r, c });
  }

  function checkLayerClear() {
    const allBroken = cells.every(row => row.every(cell => cell.broken || cell.type === 'bedrock'));
    if (allBroken) {
      Bus.emit('layer:cleared', { layer: GameState.get('world.currentLayer') });
      showDescentShaft();
    }
  }

  function showDescentShaft() {
    const canvas = document.getElementById('grid-canvas');
    if (!canvas) return;
    const total = gridSize * (CELL_SIZE + GAP) - GAP;

    const shaft = document.createElement('div');
    shaft.className = 'cell-descent';
    shaft.style.cssText = `
      width: ${total * 0.4}px;
      height: ${CELL_SIZE * 1.5}px;
      left:  ${total * 0.3}px;
      top:   ${(total - CELL_SIZE * 1.5) / 2}px;
    `;
    shaft.innerHTML = `
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
        <line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/>
      </svg>
      <span class="descent-label">Descend</span>
    `;
    shaft.addEventListener('click', () => descend());
    canvas.appendChild(shaft);
  }

  function descend() {
    const layer = GameState.get('world.currentLayer') + 1;
    GameState.set('world.currentLayer', layer);
    const theme = Zones.themeForLayer(layer);
    Zones.applyTheme(theme);
    updateLayerUI();
    init(layer);
    render();
    Bus.emit('layer:entered', { layer });
  }

  function updateLayerUI() {
    const layer = GameState.get('world.currentLayer');
    const el = document.querySelector('#topbar .layer-badge');
    if (el) el.textContent = `Layer ${layer}`;
    const zoneEl = document.querySelector('.grid-info-bar .zone-name');
    if (zoneEl) zoneEl.textContent = Zones.nameForLayer(layer);
    const progressEl = document.querySelector('.grid-info-bar .layer-progress');
    if (progressEl) {
      const total = cells.flat().filter(c => c.type !== 'bedrock').length;
      const broken = cells.flat().filter(c => c.broken).length;
      progressEl.textContent = `${broken} / ${total} cells`;
    }
  }

  // Update progress text on each break
  Bus.on('cell:broken', () => updateLayerUI());

  function start(layer) {
    init(layer);
    render();
    updateLayerUI();
  }

  return { start, render, fitGrid };
})();

/* ── Combo Meter ────────────────────────────────────────────── */
const ComboMeter = (() => {
  let count  = 0;
  let timer  = null;
  const TIMEOUT_MS = 2000;

  function tier(n) {
    if (n >= 20) return 3;
    if (n >= 10) return 2;
    if (n >= 5)  return 1;
    return 0;
  }

  function update() {
    const el = document.querySelector('#topbar .combo-count');
    if (!el) return;
    el.textContent = count > 1 ? `×${count}` : '';
    el.dataset.tier = tier(count);
  }

  function increment() {
    count++;
    if (timer) clearTimeout(timer);
    timer = setTimeout(reset, TIMEOUT_MS);
    update();
    Bus.emit('combo:update', { count, tier: tier(count) });
  }

  function reset() {
    count = 0;
    timer = null;
    update();
    Bus.emit('combo:reset', {});
  }

  Bus.on('cell:struck', () => increment());

  return { increment, reset };
})();

/* ── Overworld Screen ───────────────────────────────────────── */
function updateOverworldLayerSub() {
  const layer = GameState.get('world.currentLayer');
  const el = document.getElementById('card-layer-sub');
  if (el) el.textContent = `Layer ${layer} · ${Zones.nameForLayer(layer)}`;
}

function initOverworldScreen() {
  // Both the SVG shaft and the card button descend
  document.getElementById('btn-descend')?.addEventListener('click', () => Router.go('grid'));
  document.getElementById('btn-descend-card')?.addEventListener('click', () => Router.go('grid'));

  // Workshop / collection shortcuts
  document.getElementById('btn-goto-collection')?.addEventListener('click', () => Router.go('collection'));
  document.getElementById('btn-goto-skills')?.addEventListener('click', () => Router.go('skills'));
  document.getElementById('btn-goto-upgrade')?.addEventListener('click', () => Router.go('upgrade'));

  // Update layer label whenever overworld is shown
  Bus.on('router:navigate', ({ screen }) => {
    if (screen === 'overworld') updateOverworldLayerSub();
  });
  Bus.on('layer:entered', updateOverworldLayerSub);
  updateOverworldLayerSub();
}

/* ── Tray Navigation ────────────────────────────────────────── */
function initTray() {
  document.querySelectorAll('.tray-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      Router.go(btn.dataset.screen);
    });
  });
}

/* ── Screen Registrations ───────────────────────────────────── */
function registerScreens() {
  Router.register('overworld', {
    onEnter() {
      // Overworld doesn't need special setup each time yet
    }
  });

  Router.register('grid', {
    onEnter() {
      const layer = GameState.get('world.currentLayer');
      PlaceholderGrid.start(layer);
    }
  });

  Router.register('collection', {});
  Router.register('skills', {});
  Router.register('upgrade', {});
}

/* ── Boot ───────────────────────────────────────────────────── */
function boot() {
  GameState.load();

  // Apply saved zone theme
  const theme = GameState.get('world.zoneTheme') || 'surface';
  Zones.applyTheme(theme);

  // Update layer badge
  const layer = GameState.get('world.currentLayer');
  const badge = document.querySelector('#topbar .layer-badge');
  if (badge) badge.textContent = `Layer ${layer}`;

  // Update points display
  const pts = GameState.get('player.upgradePoints');
  const ptsEl = document.querySelector('#topbar .points-display span');
  if (ptsEl) ptsEl.textContent = pts;

  initOverworldScreen();
  initTray();
  registerScreens();

  Router.go('overworld');
}

document.addEventListener('DOMContentLoaded', boot);

// Resize: refit grid when orientation changes
window.addEventListener('resize', () => {
  if (Router.current() === 'grid') PlaceholderGrid.fitGrid();
});
