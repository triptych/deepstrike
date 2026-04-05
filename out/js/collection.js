/* ============================================================
   DEEPSTRIKE — collection.js
   Phase 3: Inventory state management + collection screen
   ============================================================ */

'use strict';

const Collection = (() => {

  // Track which set completions we've already fired so we don't double-fire
  let _notifiedSets = {};

  // ── addItem ─────────────────────────────────────────────────
  function addItem(itemId) {
    const items = GameState.get('inventory.items') || {};
    items[itemId] = (items[itemId] || 0) + 1;
    GameState.set('inventory.items', items);
    Bus.emit('inventory:changed', { itemId, count: items[itemId] });
  }

  // ── getCount ─────────────────────────────────────────────────
  function getCount(itemId) {
    const items = GameState.get('inventory.items') || {};
    return items[itemId] || 0;
  }

  // ── checkSetCompletion ───────────────────────────────────────
  function checkSetCompletion(setId) {
    const set = Items.getSets().find(s => s.id === setId);
    if (!set) return false;
    return (set.items || []).every(item => getCount(item.id) >= 1);
  }

  // ── getCompletedSets ─────────────────────────────────────────
  function getCompletedSets() {
    return Items.getSets()
      .filter(s => checkSetCompletion(s.id))
      .map(s => s.id);
  }

  // ── totalItems ───────────────────────────────────────────────
  function totalItems() {
    const items = GameState.get('inventory.items') || {};
    return Object.keys(items).length;
  }

  // ── Set completion check & splash ────────────────────────────
  function checkAllSets() {
    const sets = GameState.get('inventory.sets') || {};
    const allSets = Items.getSets();

    for (const set of allSets) {
      if (sets[set.id]) continue; // already completed & saved
      if (checkSetCompletion(set.id)) {
        // Mark as completed in state and persist reward
        sets[set.id] = true;
        GameState.set('inventory.sets', sets);
        // Store reward passive so later phases can read it
        const rewards = GameState.get('inventory.rewards') || {};
        if (set.reward) rewards[set.id] = set.reward;
        GameState.set('inventory.rewards', rewards);
        // Emit
        Bus.emit('set:completed', { setId: set.id, set });
        // Show splash if not already notified this session
        if (!_notifiedSets[set.id]) {
          _notifiedSets[set.id] = true;
          showSetSplash(set);
        }
      }
    }
  }

  // ── Set completion splash overlay ────────────────────────────
  function showSetSplash(set) {
    const splash = document.createElement('div');
    splash.className = 'set-splash';
    splash.innerHTML =
      '<div class="set-splash-title">Set Complete!</div>' +
      '<div class="set-splash-name">' + escHtml(set.name) + '</div>' +
      '<div class="set-splash-reward">' + escHtml(set.reward ? set.reward.passive : '') + '</div>' +
      '<button class="set-splash-close">Claim Reward</button>';

    splash.querySelector('.set-splash-close').addEventListener('click', function () {
      splash.remove();
    });

    document.body.appendChild(splash);
  }

  // ── HTML escape helper ───────────────────────────────────────
  function escHtml(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  // ── renderCollection ─────────────────────────────────────────
  function renderCollection() {
    const container = document.getElementById('collection-sets');
    if (!container) return;

    // Wait for items to be ready
    Items.ready.then(function () {
      _doRender(container);
    });
  }

  function _doRender(container) {
    container.innerHTML = '';
    const sets = Items.getSets();

    if (!sets.length) {
      container.innerHTML = '<p style="color:var(--muted);text-align:center;padding:24px;">No items data loaded.</p>';
      return;
    }

    const inventoryItems = GameState.get('inventory.items') || {};
    const completedSets  = GameState.get('inventory.sets') || {};

    for (const set of sets) {
      const items         = set.items || [];
      const discoveredCnt = items.filter(i => (inventoryItems[i.id] || 0) >= 1).length;
      const totalCnt      = items.length;
      const isComplete    = completedSets[set.id] || false;
      const pct           = totalCnt ? Math.round((discoveredCnt / totalCnt) * 100) : 0;

      // Element badge color
      const elementColor = 'var(--' + set.element + ', var(--muted))';

      const section = document.createElement('div');
      section.className = 'set-section';

      // Header
      const header = document.createElement('div');
      header.className = 'set-header';
      header.innerHTML =
        '<span class="set-name">' + escHtml(set.name) + (isComplete ? ' ✓' : '') + '</span>' +
        '<span class="element-badge" style="background:' + elementColor + ';color:#000;">' +
          escHtml(set.element) +
        '</span>';
      section.appendChild(header);

      // Progress label
      const label = document.createElement('div');
      label.className = 'set-progress-label';
      label.textContent = discoveredCnt + ' / ' + totalCnt + ' items';
      section.appendChild(label);

      // Progress bar
      const bar = document.createElement('div');
      bar.className = 'set-progress-bar';
      const fill = document.createElement('div');
      fill.className = 'set-progress-fill';
      fill.style.width = pct + '%';
      if (isComplete) fill.style.background = 'var(--legendary)';
      bar.appendChild(fill);
      section.appendChild(bar);

      // Item grid
      const grid = document.createElement('div');
      grid.className = 'set-items-grid';

      for (const item of items) {
        const count      = inventoryItems[item.id] || 0;
        const discovered = count >= 1;

        const slot = document.createElement('div');
        slot.className = 'item-slot' + (discovered ? ' discovered' : '');
        if (discovered) slot.dataset.rarity = item.rarity;

        const iconEl = document.createElement('div');
        iconEl.className = 'item-slot-icon' + (discovered ? '' : ' silhouette');
        iconEl.textContent = item.emoji || '✦';
        slot.appendChild(iconEl);

        const nameEl = document.createElement('div');
        nameEl.className = 'item-slot-name' + (discovered ? '' : ' unknown');
        nameEl.textContent = discovered ? item.name : '?';
        slot.appendChild(nameEl);

        if (discovered && count > 1) {
          const cntEl = document.createElement('div');
          cntEl.className = 'item-slot-count';
          cntEl.textContent = '×' + count;
          slot.appendChild(cntEl);
        }

        grid.appendChild(slot);
      }

      section.appendChild(grid);
      container.appendChild(section);
    }
  }

  // ── Bus listener: cell:broken → roll drop ────────────────────
  Bus.on('cell:broken', function (data) {
    var item = Items.rollDrop(data.type);
    if (!item) return;
    addItem(item.id);
    Items.spawnItemFloat(item, data.r, data.c);
  });

  // ── Bus listener: inventory changed → check set completions ──
  Bus.on('inventory:changed', function () {
    // Only run after Items are loaded
    Items.ready.then(checkAllSets);
  });

  // ── renderItemsGrid ──────────────────────────────────────────
  function renderItemsGrid() {
    const container = document.getElementById('items-grid');
    if (!container) return;

    Items.ready.then(function () {
      const inventoryItems = GameState.get('inventory.items') || {};
      const allItems = Items.getAll();
      const discovered = allItems.filter(i => (inventoryItems[i.id] || 0) >= 1);

      container.innerHTML = '';

      if (!discovered.length) {
        container.innerHTML = '<p style="color:var(--muted);text-align:center;padding:32px;grid-column:1/-1;">No items discovered yet.</p>';
        return;
      }

      for (const item of discovered) {
        const count = inventoryItems[item.id] || 0;
        const slot = document.createElement('div');
        slot.className = 'item-slot discovered';
        slot.dataset.rarity = item.rarity;

        const iconEl = document.createElement('div');
        iconEl.className = 'item-slot-icon';
        iconEl.textContent = item.emoji || '✦';
        slot.appendChild(iconEl);

        const nameEl = document.createElement('div');
        nameEl.className = 'item-slot-name';
        nameEl.textContent = item.name;
        slot.appendChild(nameEl);

        if (count > 1) {
          const cntEl = document.createElement('div');
          cntEl.className = 'item-slot-count';
          cntEl.textContent = '×' + count;
          slot.appendChild(cntEl);
        }

        container.appendChild(slot);
      }
    });
  }

  // ── Tab switching ────────────────────────────────────────────
  let _tabsInited = false;
  function initTabs() {
    if (_tabsInited) return;
    _tabsInited = true;
    const tabBtns = document.querySelectorAll('.items-tab');
    tabBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        const tab = btn.dataset.tab;
        tabBtns.forEach(b => { b.classList.toggle('active', b === btn); b.setAttribute('aria-selected', b === btn ? 'true' : 'false'); });
        document.querySelectorAll('.items-tab-panel').forEach(function (panel) {
          panel.classList.toggle('active', panel.id === 'tab-' + tab);
        });
        if (tab === 'items') renderItemsGrid();
        if (tab === 'collections') renderCollection();
      });
    });
  }

  // ── Wire up render via Bus ───────────────────────────────────
  Bus.on('router:navigate', function (data) {
    if (data.screen === 'items') {
      initTabs();
      // Reset to items tab each time screen is opened
      document.querySelectorAll('.items-tab').forEach(b => { b.classList.toggle('active', b.dataset.tab === 'items'); b.setAttribute('aria-selected', b.dataset.tab === 'items' ? 'true' : 'false'); });
      document.querySelectorAll('.items-tab-panel').forEach(p => { p.classList.toggle('active', p.id === 'tab-items'); });
      renderItemsGrid();
    }
  });

  // ── Public API ───────────────────────────────────────────────
  return {
    addItem,
    getCount,
    checkSetCompletion,
    getCompletedSets,
    totalItems,
    renderCollection
  };

})();
