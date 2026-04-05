/* ============================================================
   DEEPSTRIKE — items.js
   Phase 3: Item definitions loader + drop roll logic
   ============================================================ */

'use strict';

const Items = (() => {

  let _allItems = [];
  let _sets     = [];
  let _byId     = {};

  // Drop weights per rarity
  const RARITY_WEIGHTS = {
    common:    60,
    uncommon:  25,
    rare:      12,
    legendary:  3
  };

  // For soil/rock: these are the per-rarity drop chances (not weights — independent rolls)
  // Total drop chance ~67%; if roll > threshold, return null
  const CELL_DROP = {
    soil: {
      common:    0.60,
      uncommon:  0.05,
      rare:      0.02,
      legendary: 0.00
    },
    rock: {
      common:    0.60,
      uncommon:  0.05,
      rare:      0.02,
      legendary: 0.00
    }
  };

  // ── Ready promise ────────────────────────────────────────────
  const ready = fetch('./items.json')
    .then(r => r.json())
    .then(data => {
      _sets = data.sets || [];
      _allItems = [];
      _byId = {};
      for (const set of _sets) {
        for (const item of (set.items || [])) {
          _allItems.push(item);
          _byId[item.id] = item;
        }
      }
      console.log('[Items] Loaded', _allItems.length, 'items across', _sets.length, 'sets');
    })
    .catch(err => {
      console.error('[Items] Failed to load items.json', err);
    });

  // ── Weighted random pick from item pool ──────────────────────
  function weightedPick(pool) {
    if (!pool.length) return null;
    const total = pool.reduce((sum, item) => sum + (RARITY_WEIGHTS[item.rarity] || 1), 0);
    let r = Math.random() * total;
    for (const item of pool) {
      r -= (RARITY_WEIGHTS[item.rarity] || 1);
      if (r <= 0) return item;
    }
    return pool[pool.length - 1];
  }

  // ── rollDrop ─────────────────────────────────────────────────
  /**
   * Roll for an item drop based on cell type.
   * ore_vein: guaranteed drop, weighted by rarity across all items.
   * soil/rock: probabilistic — ~67% total chance; weights split by rarity.
   * Returns item object or null.
   */
  function rollDrop(cellType) {
    if (!_allItems.length) return null;

    if (cellType === 'ore_vein') {
      // Guaranteed drop — pick weighted from all items
      return weightedPick(_allItems);
    }

    // soil / rock — probabilistic
    const chances = CELL_DROP[cellType];
    if (!chances) return null;

    const r = Math.random();

    // Build rarity-specific pools and pick based on individual chance
    // Strategy: roll once; cascade through rarities by cumulative chance
    if (r < chances.legendary) {
      const pool = _allItems.filter(i => i.rarity === 'legendary');
      return pool.length ? pool[Math.floor(Math.random() * pool.length)] : null;
    }
    if (r < chances.rare + chances.legendary) {
      const pool = _allItems.filter(i => i.rarity === 'rare');
      return pool.length ? pool[Math.floor(Math.random() * pool.length)] : null;
    }
    if (r < chances.uncommon + chances.rare + chances.legendary) {
      const pool = _allItems.filter(i => i.rarity === 'uncommon');
      return pool.length ? pool[Math.floor(Math.random() * pool.length)] : null;
    }
    if (r < chances.common + chances.uncommon + chances.rare + chances.legendary) {
      const pool = _allItems.filter(i => i.rarity === 'common');
      return pool.length ? pool[Math.floor(Math.random() * pool.length)] : null;
    }

    return null; // no drop
  }

  // ── Spawn float animation — arcs from cell to Items tray icon ──
  function spawnItemFloat(item, r, c) {
    const cellEl = document.querySelector('.cell[data-row="' + r + '"][data-col="' + c + '"]');
    if (!cellEl) return;

    const cellRect = cellEl.getBoundingClientRect();
    const trayBtn  = document.querySelector('.tray-btn[data-screen="items"]');
    const trayRect = trayBtn ? trayBtn.getBoundingClientRect() : null;

    const startX = cellRect.left + cellRect.width  / 2;
    const startY = cellRect.top  + cellRect.height / 2;
    const endX   = trayRect ? trayRect.left + trayRect.width  / 2 : startX;
    const endY   = trayRect ? trayRect.top  + trayRect.height / 2 : startY - 80;

    const floater = document.createElement('div');
    floater.className = 'item-float';
    floater.textContent = item.emoji || '✦';
    floater.style.left = (startX - 12) + 'px';
    floater.style.top  = (startY - 12) + 'px';
    floater.style.setProperty('--dx', (endX - startX) + 'px');
    floater.style.setProperty('--dy', (endY - startY) + 'px');
    document.body.appendChild(floater);

    setTimeout(() => {
      floater.remove();
      // Flash the tray icon
      if (trayBtn) {
        trayBtn.classList.add('tray-flash');
        setTimeout(() => trayBtn.classList.remove('tray-flash'), 400);
      }
    }, 700);
  }

  // ── Update overworld collection sub-label ───────────────────
  function updateCollectionBadge() {
    const total = Object.keys(GameState.get('inventory.items') || {}).length;
    const el = document.querySelector('#btn-goto-collection .card-sub');
    if (el) el.textContent = total + ' item' + (total === 1 ? '' : 's');
  }

  // ── Bus listener: inventory:changed ─────────────────────────
  Bus.on('inventory:changed', updateCollectionBadge);

  // ── Public API ───────────────────────────────────────────────
  return {
    ready,
    rollDrop,
    spawnItemFloat,
    getAll()  { return _allItems.slice(); },
    getSets() { return _sets.slice(); },
    byId(id)  { return _byId[id] || null; }
  };

})();
