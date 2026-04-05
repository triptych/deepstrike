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
      sets: {},
      rewards: {}
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

// Grid state and rendering handled by grid.js (GridRenderer + Grid)

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
  document.getElementById('btn-goto-collection')?.addEventListener('click', () => Router.go('items'));
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
      GridRenderer.start(layer);
    }
  });

  Router.register('items', {});
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
  GridRenderer.init();

  Router.go('overworld');
}

// Keep topbar upgrade-points display in sync whenever points are granted
Bus.on('milestone:earned', function (data) {
  if (!data.reward || !data.reward.up) return;
  const ptsEl = document.querySelector('#topbar .points-display span');
  if (ptsEl) ptsEl.textContent = GameState.get('player.upgradePoints') || 0;
});

document.addEventListener('DOMContentLoaded', boot);

// Resize: refit grid when orientation changes
window.addEventListener('resize', () => {
  if (Router.current() === 'grid') GridRenderer.fitGrid();
});
