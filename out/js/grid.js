/* ============================================================
   DEEPSTRIKE — grid.js
   Phase 2: Grid state manager + renderer
   Cell types, HP, crack stages, pinch-zoom, pan, long-press
   ============================================================ */

'use strict';

/* ── Grid State Manager ─────────────────────────────────────── */
const Grid = (() => {

  // Cell definitions — HP and behaviour
  const DEFS = {
    soil: {
      hp: 2,
      label: 'Soil',
      breakable: true,
    },
    rock: {
      hp: 4,
      label: 'Loose Rock',
      breakable: true,
    },
    dense_rock: {
      hp: 8,
      label: 'Dense Rock',
      breakable: true,   // Phase 4: requires Iron Pick or better
    },
    ore_vein: {
      hp: 3,
      label: 'Ore Vein',
      breakable: true,
      dropItem: true,
    },
    crystal: {
      hp: 5,
      label: 'Crystal Node',
      breakable: true,
      dropItem: true,
    },
    hollow: {
      hp: 1,
      label: 'Hollow Pocket',
      breakable: true,
    },
    bedrock: {
      hp: Infinity,
      label: 'Bedrock',
      breakable: false,
    },
  };

  // Cell-type distributions per zone depth
  const DISTS = {
    surface: [   // layers 1–5
      { type: 'soil',     weight: 60 },
      { type: 'rock',     weight: 30 },
      { type: 'ore_vein', weight: 10 },
    ],
    iron: [      // layers 6–10
      { type: 'soil',     weight: 40 },
      { type: 'rock',     weight: 40 },
      { type: 'ore_vein', weight: 20 },
    ],
  };

  const CELL_SIZE = 44;
  const GAP       = 2;

  let gridSize = 8;
  let cells    = [];

  // Seeded RNG — mulberry32
  function makeRng(seed) {
    let s = (seed ^ 0xDEADBEEF) >>> 0;
    return function () {
      s += 0x6D2B79F5;
      let t = Math.imul(s ^ (s >>> 15), 1 | s);
      t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function weightedPick(rng, dist) {
    const total = dist.reduce((n, d) => n + d.weight, 0);
    let r = rng() * total;
    for (const d of dist) {
      r -= d.weight;
      if (r <= 0) return d.type;
    }
    return dist[dist.length - 1].type;
  }

  function sizeForLayer(layer) {
    if (layer <= 5)  return 8;
    if (layer <= 15) return 12;
    if (layer <= 30) return 16;
    return 20;
  }

  function distForLayer(layer) {
    return layer <= 5 ? DISTS.surface : DISTS.iron;
  }

  /* Crack stage from current HP:
     0 = intact, 1–3 = progressive damage, 4 = near-break */
  function calcStage(hp, maxHp) {
    if (!isFinite(maxHp) || maxHp === 0) return 0;
    const f = hp / maxHp;
    if (f >= 1.0)  return 0;
    if (f > 0.66)  return 1;
    if (f > 0.33)  return 2;
    if (f > 0)     return 3;
    return 4;
  }

  // ── Public ─────────────────────────────────────────────────

  function init(layer) {
    // Restore persisted state if it matches this layer
    const saved = GameState.get('grid.cells');
    const savedLayer = GameState.get('grid.layerSeed');
    if (saved && saved.length && savedLayer === layer) {
      gridSize = sizeForLayer(layer);
      cells = saved;
      return;
    }

    gridSize   = sizeForLayer(layer);
    const rng  = makeRng(layer * 7919 + 42);
    const dist = distForLayer(layer);

    cells = [];
    for (let r = 0; r < gridSize; r++) {
      cells[r] = [];
      for (let c = 0; c < gridSize; c++) {
        const type = weightedPick(rng, dist);
        const def  = DEFS[type];
        cells[r][c] = {
          type,
          hp:     def.hp,
          maxHp:  def.hp,
          stage:  0,
          broken: false,
        };
      }
    }

    GameState.set('grid.layerSeed', layer);
    GameState.set('grid.cells', cells);
  }

  function getCell(r, c) {
    return cells[r]?.[c] ?? null;
  }

  function getDef(type) {
    return DEFS[type];
  }

  /**
   * Strike cell at (r, c) with given damage.
   * Returns { result: 'blocked' | 'struck' | 'broken', type?, stage? }
   * Always emits 'cell:struck' (for combo meter); also 'cell:broken' on break.
   */
  function strike(r, c, damage = 1) {
    const cell = cells[r]?.[c];
    if (!cell || cell.broken) return null;

    const def = DEFS[cell.type];
    if (!def.breakable) {
      Bus.emit('cell:blocked', { r, c });
      return { result: 'blocked' };
    }

    cell.hp    = Math.max(0, cell.hp - damage);
    cell.stage = calcStage(cell.hp, cell.maxHp);

    // Always fire for combo meter
    Bus.emit('cell:struck', { r, c, stage: cell.stage });

    if (cell.hp <= 0) {
      cell.broken = true;
      GameState.set('grid.cells', cells);
      Bus.emit('cell:broken', { r, c, type: cell.type, dropItem: !!def.dropItem });
      checkLayerClear();
      return { result: 'broken', type: cell.type };
    }

    GameState.set('grid.cells', cells);
    return { result: 'struck', stage: cell.stage };
  }

  function checkLayerClear() {
    const remaining = cells.flat().filter(c => !c.broken && DEFS[c.type].breakable);
    if (remaining.length === 0) {
      Bus.emit('layer:cleared', { layer: GameState.get('world.currentLayer') });
    }
  }

  function brokenCount()    { return cells.flat().filter(c => c.broken).length; }
  function totalBreakable() { return cells.flat().filter(c => DEFS[c.type]?.breakable).length; }
  function getSize()        { return gridSize; }
  function getCellSize()    { return CELL_SIZE; }
  function getGap()         { return GAP; }

  return { init, getCell, getDef, strike, brokenCount, totalBreakable, getSize, getCellSize, getGap };
})();


/* ── Grid Renderer ──────────────────────────────────────────── */
const GridRenderer = (() => {

  const PAN_THRESHOLD = 8;    // px — below = tap, above = pan
  const LONG_PRESS_MS = 450;  // ms — hold to reveal HP bar

  let canvas   = null;
  let viewport = null;

  // Transform state
  let scale = 1;
  let panX  = 0;
  let panY  = 0;

  // Touch tracking
  const touches = new Map(); // identifier → {x, y}

  // Single-touch state
  let stStart = null;  // { id, x, y, el, moved }
  let stPan0  = null;  // { panX, panY, x, y } — snapshot at touch-start

  // Pinch state
  let pinch0 = null;   // { dist, scale, panX, panY, midX, midY }

  // Long-press
  let lpTimer  = null;
  let hpPopup  = null;

  // ── Crack SVG markup per stage ─────────────────────────────

  const CRACK_SVG = [
    '', // 0 — intact
    // 1 — hairline crack
    `<svg class="crack-svg" viewBox="0 0 44 44" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <polyline points="22,1 20,14 24,17" fill="none" stroke="rgba(0,0,0,0.55)" stroke-width="1" stroke-linecap="round"/>
    </svg>`,
    // 2 — two cracks
    `<svg class="crack-svg" viewBox="0 0 44 44" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <polyline points="22,0 19,12 25,17 18,28" fill="none" stroke="rgba(0,0,0,0.7)" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/>
      <polyline points="34,6 28,16 34,21" fill="none" stroke="rgba(0,0,0,0.4)" stroke-width="0.8" stroke-linecap="round"/>
    </svg>`,
    // 3 — heavy fracture
    `<svg class="crack-svg" viewBox="0 0 44 44" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <polyline points="22,0 17,12 26,17 13,30 19,44" fill="none" stroke="rgba(0,0,0,0.85)" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
      <polyline points="40,10 27,19 35,25 23,36" fill="none" stroke="rgba(0,0,0,0.55)" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"/>
      <polyline points="5,18 14,24 9,34" fill="none" stroke="rgba(0,0,0,0.4)" stroke-width="0.7" stroke-linecap="round"/>
    </svg>`,
    // 4 — spider-web, near break
    `<svg class="crack-svg" viewBox="0 0 44 44" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <polyline points="22,0 15,10 24,16 10,28 17,44" fill="none" stroke="rgba(0,0,0,0.95)" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
      <polyline points="44,8 27,18 37,25 20,37" fill="none" stroke="rgba(0,0,0,0.75)" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/>
      <polyline points="2,15 13,22 7,33" fill="none" stroke="rgba(0,0,0,0.6)" stroke-width="1" stroke-linecap="round"/>
      <polyline points="0,32 11,27 9,40" fill="none" stroke="rgba(0,0,0,0.45)" stroke-width="0.8" stroke-linecap="round"/>
      <line x1="22" y1="16" x2="7" y2="22" stroke="rgba(0,0,0,0.3)" stroke-width="0.6"/>
    </svg>`,
  ];

  // ── DOM helpers ────────────────────────────────────────────

  function makeCellEl(r, c, cell) {
    const cs  = Grid.getCellSize();
    const gap = Grid.getGap();
    const el  = document.createElement('div');
    el.className = 'cell' + (cell.broken ? ' broken' : '');
    el.dataset.type  = cell.type;
    el.dataset.stage = cell.stage;
    el.dataset.row   = r;
    el.dataset.col   = c;
    el.style.cssText = `width:${cs}px;height:${cs}px;left:${c*(cs+gap)}px;top:${r*(cs+gap)}px;`;
    if (CRACK_SVG[cell.stage]) {
      el.innerHTML = CRACK_SVG[cell.stage];
    }
    return el;
  }

  function getCellEl(r, c) {
    return canvas?.querySelector(`.cell[data-row="${r}"][data-col="${c}"]`) ?? null;
  }

  function updateCellEl(r, c) {
    const el   = getCellEl(r, c);
    const cell = Grid.getCell(r, c);
    if (!el || !cell) return;

    el.dataset.stage = cell.stage;
    if (cell.broken) el.classList.add('broken');

    // Swap crack overlay
    const old = el.querySelector('.crack-svg');
    if (old) old.remove();
    const svg = CRACK_SVG[cell.stage];
    if (svg) {
      const tmpl = document.createElement('template');
      tmpl.innerHTML = svg.trim();
      el.prepend(tmpl.content.firstChild);
    }
  }

  // ── Transform ──────────────────────────────────────────────

  function applyTransform() {
    if (canvas) {
      canvas.style.transform =
        `translate(-50%,-50%) translate(${panX}px,${panY}px) scale(${scale})`;
    }
  }

  function fitGrid() {
    if (!viewport || !canvas) return;
    const vw    = viewport.clientWidth;
    const vh    = viewport.clientHeight;
    const sz    = Grid.getSize();
    const cs    = Grid.getCellSize();
    const gap   = Grid.getGap();
    const total = sz * (cs + gap) - gap;
    scale = Math.min((vw - 32) / total, (vh - 32) / total, 1);
    panX  = 0;
    panY  = 0;
    applyTransform();
  }

  // ── Render ─────────────────────────────────────────────────

  function render() {
    if (!canvas) return;
    canvas.innerHTML = '';

    const sz    = Grid.getSize();
    const cs    = Grid.getCellSize();
    const gap   = Grid.getGap();
    const total = sz * (cs + gap) - gap;
    canvas.style.width  = total + 'px';
    canvas.style.height = total + 'px';

    const frag = document.createDocumentFragment();
    for (let r = 0; r < sz; r++) {
      for (let c = 0; c < sz; c++) {
        frag.appendChild(makeCellEl(r, c, Grid.getCell(r, c)));
      }
    }
    canvas.appendChild(frag);
    fitGrid();
  }

  // ── Touch handling ─────────────────────────────────────────

  function touchDist(a, b) {
    const dx = a.x - b.x, dy = a.y - b.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  function onTouchStart(e) {
    e.preventDefault();
    for (const t of e.changedTouches) {
      touches.set(t.identifier, { x: t.clientX, y: t.clientY });
    }

    if (touches.size === 1) {
      const t      = e.changedTouches[0];
      const cellEl = document.elementFromPoint(t.clientX, t.clientY)?.closest?.('.cell');
      stStart = { id: t.identifier, x: t.clientX, y: t.clientY, el: cellEl, moved: false };
      stPan0  = { panX, panY, x: t.clientX, y: t.clientY };
      if (cellEl && !cellEl.classList.contains('broken')) {
        lpTimer = setTimeout(() => showHpPopup(cellEl, t.clientX, t.clientY), LONG_PRESS_MS);
      }
    } else if (touches.size === 2) {
      cancelSingleTouch();
      const arr  = [...touches.values()];
      pinch0 = {
        dist:  touchDist(arr[0], arr[1]),
        scale, panX, panY,
        midX: (arr[0].x + arr[1].x) / 2,
        midY: (arr[0].y + arr[1].y) / 2,
      };
    }
  }

  function onTouchMove(e) {
    e.preventDefault();
    for (const t of e.changedTouches) {
      touches.set(t.identifier, { x: t.clientX, y: t.clientY });
    }

    if (touches.size === 1 && stStart && stPan0) {
      const cur = touches.get(stStart.id) ?? { x: stStart.x, y: stStart.y };
      const dx  = cur.x - stPan0.x;
      const dy  = cur.y - stPan0.y;
      if (!stStart.moved &&
          (Math.abs(dx) > PAN_THRESHOLD || Math.abs(dy) > PAN_THRESHOLD)) {
        stStart.moved = true;
        cancelLongPress();
      }
      if (stStart.moved) {
        panX = stPan0.panX + dx;
        panY = stPan0.panY + dy;
        applyTransform();
      }
    } else if (touches.size === 2 && pinch0) {
      const arr  = [...touches.values()];
      const d    = touchDist(arr[0], arr[1]);
      const midX = (arr[0].x + arr[1].x) / 2;
      const midY = (arr[0].y + arr[1].y) / 2;
      scale = Math.max(0.4, Math.min(5, pinch0.scale * (d / pinch0.dist)));
      panX  = pinch0.panX + (midX - pinch0.midX);
      panY  = pinch0.panY + (midY - pinch0.midY);
      applyTransform();
    }
  }

  function onTouchEnd(e) {
    e.preventDefault();
    cancelLongPress();
    for (const t of e.changedTouches) {
      touches.delete(t.identifier);
    }
    if (stStart && !stStart.moved) {
      const el = stStart.el;
      if (el && !el.classList.contains('broken')) {
        tapCell(+el.dataset.row, +el.dataset.col, el);
      }
    }
    stStart = null;
    stPan0  = null;
    if (touches.size < 2) pinch0 = null;
  }

  function onTouchCancel(e) {
    for (const t of e.changedTouches) touches.delete(t.identifier);
    cancelSingleTouch();
    pinch0 = null;
  }

  function cancelSingleTouch() {
    cancelLongPress();
    stStart = null;
    stPan0  = null;
  }

  function cancelLongPress() {
    if (lpTimer) { clearTimeout(lpTimer); lpTimer = null; }
    dismissHpPopup();
  }

  // Mouse / pointer fallback (desktop testing)
  function onPointerDown(e) {
    if (e.pointerType === 'touch') return; // handled by touch events
    const cellEl = e.target.closest('.cell');
    const startX = e.clientX;
    const startY = e.clientY;
    const pan0   = { panX, panY };
    let moved    = false;
    const lp     = (cellEl && !cellEl.classList.contains('broken'))
      ? setTimeout(() => showHpPopup(cellEl, e.clientX, e.clientY), LONG_PRESS_MS)
      : null;

    function onMove(ev) {
      const dx = ev.clientX - startX;
      const dy = ev.clientY - startY;
      if (!moved && (Math.abs(dx) > PAN_THRESHOLD || Math.abs(dy) > PAN_THRESHOLD)) {
        moved = true;
        clearTimeout(lp);
        dismissHpPopup();
      }
      if (moved) {
        panX = pan0.panX + dx;
        panY = pan0.panY + dy;
        applyTransform();
      }
    }
    function onUp() {
      clearTimeout(lp);
      viewport.removeEventListener('pointermove', onMove);
      viewport.removeEventListener('pointerup',   onUp);
      if (!moved && cellEl && !cellEl.classList.contains('broken')) {
        tapCell(+cellEl.dataset.row, +cellEl.dataset.col, cellEl);
      }
    }
    viewport.addEventListener('pointermove', onMove);
    viewport.addEventListener('pointerup',   onUp);
  }

  // ── Cell interaction ───────────────────────────────────────

  function tapCell(r, c, el) {
    dismissHpPopup();
    Haptics.tap();

    const result = Grid.strike(r, c);
    if (!result) return;

    if (result.result === 'blocked') {
      // Visual feedback: shake + implicit "too tough" (Phase 4 adds text)
      el.classList.add('shake');
      setTimeout(() => el.classList.remove('shake'), 320);
      return;
    }

    // Tap ripple
    const ripple = document.createElement('div');
    ripple.className = 'tap-ripple';
    ripple.style.cssText = 'left:50%;top:50%;';
    el.appendChild(ripple);
    setTimeout(() => ripple.remove(), 400);

    updateCellEl(r, c);

    if (result.result === 'broken') {
      Haptics.break();
    }
    updateProgressBar();
  }

  // ── HP Popup ───────────────────────────────────────────────

  function showHpPopup(cellEl, cx, cy) {
    dismissHpPopup();
    const r    = +cellEl.dataset.row;
    const c    = +cellEl.dataset.col;
    const cell = Grid.getCell(r, c);
    if (!cell || cell.broken) return;

    const def  = Grid.getDef(cell.type);
    const pct  = isFinite(cell.maxHp) ? Math.round((cell.hp / cell.maxHp) * 100) : 100;
    const rect = cellEl.getBoundingClientRect();

    const popup = document.createElement('div');
    popup.className = 'hp-popup';
    popup.innerHTML = `
      <div class="hp-popup-label">${def.label}</div>
      <div class="hp-popup-track">
        <div class="hp-popup-fill" style="width:${pct}%"></div>
      </div>
      <div class="hp-popup-value">${isFinite(cell.hp) ? cell.hp : '∞'} / ${isFinite(cell.maxHp) ? cell.maxHp : '∞'}</div>
    `;
    popup.style.cssText = `
      position:fixed;
      left:${rect.left + rect.width / 2}px;
      top:${rect.top - 6}px;
      transform:translate(-50%,-100%);
    `;
    document.body.appendChild(popup);
    hpPopup = popup;
    // Auto-dismiss after 2.5s
    setTimeout(dismissHpPopup, 2500);
  }

  function dismissHpPopup() {
    hpPopup?.remove();
    hpPopup = null;
  }

  // ── Descent shaft ──────────────────────────────────────────

  function showDescentShaft() {
    if (!canvas) return;
    const sz    = Grid.getSize();
    const cs    = Grid.getCellSize();
    const gap   = Grid.getGap();
    const total = sz * (cs + gap) - gap;

    const shaft = document.createElement('div');
    shaft.className = 'cell-descent';
    shaft.style.cssText = `
      width:${total * 0.4}px;
      height:${cs * 1.5}px;
      left:${total * 0.3}px;
      top:${(total - cs * 1.5) / 2}px;
    `;
    shaft.innerHTML = `
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
           stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">
        <line x1="12" y1="5" x2="12" y2="19"/>
        <polyline points="19 12 12 19 5 12"/>
      </svg>
      <span class="descent-label">Descend</span>
    `;
    shaft.addEventListener('click', descend);
    shaft.addEventListener('touchend', e => { e.preventDefault(); descend(); }, { once: true });
    canvas.appendChild(shaft);
  }

  function descend() {
    const layer = GameState.get('world.currentLayer') + 1;
    GameState.set('grid.cells', []);
    GameState.set('world.currentLayer', layer);
    const theme = Zones.themeForLayer(layer);
    Zones.applyTheme(theme);
    Bus.emit('layer:entered', { layer });
    start(layer);
  }

  // ── Progress bar ───────────────────────────────────────────

  function updateProgressBar() {
    const el = document.querySelector('.grid-info-bar .layer-progress');
    if (el) el.textContent = `${Grid.brokenCount()} / ${Grid.totalBreakable()} cells`;
  }

  // ── Bus listeners (registered at module load) ───────────────

  Bus.on('layer:cleared', showDescentShaft);
  Bus.on('cell:broken',   updateProgressBar);

  // ── Public API ─────────────────────────────────────────────

  function init() {
    canvas   = document.getElementById('grid-canvas');
    viewport = document.getElementById('grid-viewport');
    if (!viewport) return;

    viewport.addEventListener('touchstart',  onTouchStart,  { passive: false });
    viewport.addEventListener('touchmove',   onTouchMove,   { passive: false });
    viewport.addEventListener('touchend',    onTouchEnd,    { passive: false });
    viewport.addEventListener('touchcancel', onTouchCancel, { passive: false });
    viewport.addEventListener('pointerdown', onPointerDown);
  }

  function start(layer) {
    Grid.init(layer);
    render();
    updateProgressBar();

    const badge = document.querySelector('#topbar .layer-badge');
    if (badge) badge.textContent = `Layer ${layer}`;
    const zoneEl = document.querySelector('.grid-info-bar .zone-name');
    if (zoneEl) zoneEl.textContent = Zones.nameForLayer(layer);
  }

  return { init, start, fitGrid };
})();
