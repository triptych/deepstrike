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

  // ── Bus listener: inventory changed → check set & milestone completions ──
  Bus.on('inventory:changed', function () {
    Items.ready.then(function () {
      checkAllSets();
      checkMilestones();
    });
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

  // ── Milestones ───────────────────────────────────────────────
  //
  // A milestone is a goal based on quantity thresholds. There are
  // several categories:
  //   • stack     — collect N copies of the same single item
  //   • type      — collect N total items of the same type (gem/fossil/…)
  //   • element   — collect N total items of the same element
  //   • rarity    — collect N total items of the same rarity
  //   • total     — collect N items overall (unique discoveries)
  //   • complete  — discover every item of a given rarity
  //
  // Each milestone definition:
  //   { id, group, icon, name, desc, threshold, key, category }

  const _STACK_THRESHOLDS   = [5, 10, 25, 50, 100];
  const _COUNT_THRESHOLDS   = [5, 10, 25, 50, 100, 250];
  const _TOTAL_THRESHOLDS   = [1, 5, 10, 25, 50, 100];

  // Reward tables — { up: upgradePoints, sp: skillPoints }
  const _STACK_REWARDS  = { 5: {up:1,sp:0}, 10: {up:1,sp:0}, 25: {up:2,sp:0}, 50: {up:0,sp:1}, 100: {up:0,sp:2} };
  const _COUNT_REWARDS  = { 5: {up:1,sp:0}, 10: {up:1,sp:0}, 25: {up:2,sp:0}, 50: {up:2,sp:0}, 100: {up:0,sp:1}, 250: {up:0,sp:2} };
  const _TOTAL_REWARDS  = { 1: {up:1,sp:0}, 5: {up:1,sp:0}, 10: {up:2,sp:0}, 25: {up:2,sp:0}, 50: {up:0,sp:1}, 100: {up:0,sp:2} };
  const _COMPLETE_RARITY_REWARDS = { common: {up:3,sp:0}, uncommon: {up:0,sp:1}, rare: {up:0,sp:2}, legendary: {up:0,sp:3} };

  // Build the milestone definitions once items are loaded
  let _milestoneDefsCache = null;

  function _buildMilestoneDefs() {
    if (_milestoneDefsCache) return _milestoneDefsCache;

    const defs = [];

    // ── Total unique discoveries ──
    for (const t of _TOTAL_THRESHOLDS) {
      defs.push({
        id:        'total_' + t,
        group:     'Discoveries',
        groupIcon: '🗺️',
        icon:      t >= 50 ? '💎' : t >= 10 ? '🔍' : '📦',
        name:      'Collector ' + (t >= 100 ? 'III' : t >= 25 ? 'II' : t >= 10 ? 'I' : ''),
        desc:      'Discover ' + t + ' unique item' + (t === 1 ? '' : 's'),
        category:  'total',
        threshold: t,
        reward:    _TOTAL_REWARDS[t]
      });
    }

    const allItems = Items.getAll();

    // ── Rarity completions — discover every item of a rarity ──
    const rarityInfo = [
      { id: 'common',    label: 'Common',    icon: '⬜' },
      { id: 'uncommon',  label: 'Uncommon',  icon: '🟩' },
      { id: 'rare',      label: 'Rare',      icon: '🟦' },
      { id: 'legendary', label: 'Legendary', icon: '🟧' }
    ];
    for (const ri of rarityInfo) {
      const cnt = allItems.filter(i => i.rarity === ri.id).length;
      if (!cnt) continue;
      defs.push({
        id:        'complete_rarity_' + ri.id,
        group:     'Completionist',
        groupIcon: '🏆',
        icon:      ri.icon,
        name:      'Full ' + ri.label + ' Roster',
        desc:      'Discover all ' + cnt + ' ' + ri.label + ' items',
        category:  'complete_rarity',
        rarity:    ri.id,
        threshold: cnt,
        reward:    _COMPLETE_RARITY_REWARDS[ri.id]
      });
    }

    // ── Type accumulation — N total of a type ──
    const typeInfo = [
      { id: 'gem',      label: 'Gems',      icon: '💎' },
      { id: 'fossil',   label: 'Fossils',   icon: '🦕' },
      { id: 'relic',    label: 'Relics',    icon: '⚱️' },
      { id: 'mineral',  label: 'Minerals',  icon: '🪨' },
      { id: 'artifact', label: 'Artifacts', icon: '🏺' }
    ];
    for (const ti of typeInfo) {
      const pool = allItems.filter(i => i.type === ti.id);
      if (!pool.length) continue;
      for (const t of _COUNT_THRESHOLDS) {
        defs.push({
          id:        'type_' + ti.id + '_' + t,
          group:     ti.label + ' Hoarder',
          groupIcon: ti.icon,
          icon:      ti.icon,
          name:      ti.label.slice(0, -1) + ' Hoarder ' + _tierLabel(t),
          desc:      'Collect ' + t + ' total ' + ti.label.toLowerCase(),
          category:  'type',
          typeId:    ti.id,
          threshold: t,
          reward:    _COUNT_REWARDS[t]
        });
      }
    }

    // ── Element accumulation — N total of an element ──
    const elementInfo = [
      { id: 'fire',    label: 'Fire',    icon: '🔥' },
      { id: 'earth',   label: 'Earth',   icon: '🌍' },
      { id: 'water',   label: 'Water',   icon: '💧' },
      { id: 'metal',   label: 'Metal',   icon: '⚙️' },
      { id: 'void',    label: 'Void',    icon: '🌑' },
      { id: 'crystal', label: 'Crystal', icon: '🔷' }
    ];
    for (const ei of elementInfo) {
      const pool = allItems.filter(i => i.element === ei.id);
      if (!pool.length) continue;
      for (const t of _COUNT_THRESHOLDS) {
        defs.push({
          id:          'element_' + ei.id + '_' + t,
          group:       ei.label + ' Attunement',
          groupIcon:   ei.icon,
          icon:        ei.icon,
          name:        ei.label + ' Attuned ' + _tierLabel(t),
          desc:        'Collect ' + t + ' total ' + ei.label + ' items',
          category:    'element',
          elementId:   ei.id,
          threshold:   t,
          reward:      _COUNT_REWARDS[t]
        });
      }
    }

    // ── Rarity accumulation — N total of a rarity ──
    for (const ri of rarityInfo) {
      for (const t of _COUNT_THRESHOLDS) {
        defs.push({
          id:        'rarity_' + ri.id + '_' + t,
          group:     ri.label + ' Hoarder',
          groupIcon: ri.icon,
          icon:      ri.icon,
          name:      ri.label + ' Hoarder ' + _tierLabel(t),
          desc:      'Collect ' + t + ' total ' + ri.label + ' items',
          category:  'rarity',
          rarity:    ri.id,
          threshold: t,
          reward:    _COUNT_REWARDS[t]
        });
      }
    }

    // ── Per-item stack milestones ──
    for (const item of allItems) {
      for (const t of _STACK_THRESHOLDS) {
        defs.push({
          id:        'stack_' + item.id + '_' + t,
          group:     'Stacks: ' + item.name,
          groupIcon: item.emoji || '✦',
          icon:      item.emoji || '✦',
          name:      item.name + ' ×' + t,
          desc:      'Collect ' + t + ' copies of ' + item.name,
          category:  'stack',
          itemId:    item.id,
          threshold: t,
          reward:    _STACK_REWARDS[t]
        });
      }
    }

    _milestoneDefsCache = defs;
    return defs;
  }

  function _tierLabel(t) {
    if (t >= 250) return 'IV';
    if (t >= 100) return 'III';
    if (t >= 25)  return 'II';
    if (t >= 10)  return 'I';
    return '';
  }

  // Current milestone progress value (for progress bar).
  // allItems must be pre-fetched by the caller (avoids repeated .slice() copies).
  function _milestoneProgress(def, invItems, allItems) {
    if (def.category === 'total') {
      return Object.keys(invItems).filter(k => (invItems[k] || 0) >= 1).length;
    }
    if (def.category === 'complete_rarity') {
      return allItems.filter(i => i.rarity === def.rarity && (invItems[i.id] || 0) >= 1).length;
    }
    if (def.category === 'type') {
      return allItems
        .filter(i => i.type === def.typeId)
        .reduce((sum, i) => sum + (invItems[i.id] || 0), 0);
    }
    if (def.category === 'element') {
      return allItems
        .filter(i => i.element === def.elementId)
        .reduce((sum, i) => sum + (invItems[i.id] || 0), 0);
    }
    if (def.category === 'rarity') {
      return allItems
        .filter(i => i.rarity === def.rarity)
        .reduce((sum, i) => sum + (invItems[i.id] || 0), 0);
    }
    if (def.category === 'stack') {
      return invItems[def.itemId] || 0;
    }
    return 0;
  }

  // ── Backfill rewards for milestones earned before reward system ─
  // Runs once at boot; skipped if inventory.milestonesBackfilled is set.
  function backfillMilestoneRewards() {
    Items.ready.then(function () {
      if (GameState.get('inventory.milestonesBackfilled')) return;

      const saved    = GameState.get('inventory.milestones') || {};
      const earnedIds = Object.keys(saved).filter(id => saved[id]);
      if (!earnedIds.length) {
        GameState.set('inventory.milestonesBackfilled', true);
        return;
      }

      const defs = _buildMilestoneDefs();
      const defById = {};
      for (const d of defs) defById[d.id] = d;

      let totalUp = 0;
      let totalSp = 0;
      for (const id of earnedIds) {
        const def = defById[id];
        if (!def || !def.reward) continue;
        totalUp += def.reward.up || 0;
        totalSp += def.reward.sp || 0;
      }

      if (totalUp) {
        GameState.set('player.upgradePoints',
          (GameState.get('player.upgradePoints') || 0) + totalUp);
      }
      if (totalSp) {
        GameState.set('player.skillPoints',
          (GameState.get('player.skillPoints') || 0) + totalSp);
      }

      GameState.set('inventory.milestonesBackfilled', true);

      if (totalUp || totalSp) {
        Bus.emit('points:backfilled', { up: totalUp, sp: totalSp });
        console.log('[Milestones] Backfilled ' + earnedIds.length + ' milestones → +' + totalUp + ' UP, +' + totalSp + ' SP');
      }
    });
  }

  // ── Check & notify newly-earned milestones ───────────────────
  let _notifiedMilestones = {};

  function checkMilestones() {
    Items.ready.then(function () {
      const defs     = _buildMilestoneDefs();
      const invItems = GameState.get('inventory.items') || {};
      const saved    = GameState.get('inventory.milestones') || {};
      const allItems = Items.getAll();

      for (const def of defs) {
        if (saved[def.id]) continue; // already persisted
        if (_milestoneProgress(def, invItems, allItems) >= def.threshold) {
          saved[def.id] = true;
          GameState.set('inventory.milestones', saved);
          // Grant reward points
          const reward = def.reward || { up: 0, sp: 0 };
          if (reward.up) {
            GameState.set('player.upgradePoints',
              (GameState.get('player.upgradePoints') || 0) + reward.up);
          }
          if (reward.sp) {
            GameState.set('player.skillPoints',
              (GameState.get('player.skillPoints') || 0) + reward.sp);
          }
          Bus.emit('milestone:earned', { milestoneId: def.id, def, reward });
          if (!_notifiedMilestones[def.id]) {
            _notifiedMilestones[def.id] = true;
            _showMilestoneSplash(def, reward);
          }
        }
      }
    });
  }

  function _showMilestoneSplash(def, reward) {
    const rewardParts = [];
    if (reward && reward.up) rewardParts.push('+' + reward.up + ' upgrade pt' + (reward.up > 1 ? 's' : ''));
    if (reward && reward.sp) rewardParts.push('+' + reward.sp + ' skill pt' + (reward.sp > 1 ? 's' : ''));
    const rewardStr = rewardParts.join(' · ');

    const el = document.createElement('div');
    el.className = 'milestone-splash';
    el.innerHTML =
      '<div class="milestone-splash-icon">' + escHtml(def.icon) + '</div>' +
      '<div>' +
        '<div class="milestone-splash-label">Milestone Unlocked</div>' +
        '<div class="milestone-splash-name">' + escHtml(def.name) + '</div>' +
        (rewardStr ? '<div class="milestone-splash-reward">' + escHtml(rewardStr) + '</div>' : '') +
      '</div>';
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 3400);
  }

  // ── renderMilestones ─────────────────────────────────────────
  function renderMilestones() {
    const container = document.getElementById('milestones-list');
    if (!container) return;

    Items.ready.then(function () {
      const defs     = _buildMilestoneDefs();
      const invItems = GameState.get('inventory.items') || {};
      const saved    = GameState.get('inventory.milestones') || {};
      const allItems = Items.getAll();

      container.innerHTML = '';

      // Group defs
      const groups = {};
      for (const def of defs) {
        const key = def.group;
        if (!groups[key]) groups[key] = { icon: def.groupIcon, defs: [] };
        groups[key].defs.push(def);
      }

      // Filter: show groups that have at least one milestone with progress > 0
      // OR that have at least one earned milestone. Cache progress to avoid double-compute.
      for (const [groupName, group] of Object.entries(groups)) {
        const progCache = {};
        const visibleDefs = group.defs.filter(def => {
          if (saved[def.id]) return true;
          progCache[def.id] = _milestoneProgress(def, invItems, allItems);
          return progCache[def.id] > 0;
        });

        if (!visibleDefs.length) continue;

        const section = document.createElement('div');
        section.className = 'milestone-group';

        const header = document.createElement('div');
        header.className = 'milestone-group-header';
        header.innerHTML =
          '<span class="mg-icon">' + escHtml(group.icon) + '</span>' +
          escHtml(groupName);
        section.appendChild(header);

        for (const def of visibleDefs) {
          const earned  = !!saved[def.id];
          const prog    = earned ? def.threshold : progCache[def.id];
          const pct     = Math.min(100, Math.round((prog / def.threshold) * 100));

          const row = document.createElement('div');
          row.className = 'milestone-row' + (earned ? ' earned' : '');

          const icon = document.createElement('div');
          icon.className = 'milestone-icon';
          icon.textContent = def.icon;
          row.appendChild(icon);

          const body = document.createElement('div');
          body.className = 'milestone-body';

          const name = document.createElement('div');
          name.className = 'milestone-name';
          name.textContent = def.name;
          body.appendChild(name);

          const desc = document.createElement('div');
          desc.className = 'milestone-desc';
          desc.textContent = def.desc;
          body.appendChild(desc);

          // Reward line
          const r = def.reward;
          if (r && (r.up || r.sp)) {
            const rewardParts = [];
            if (r.up) rewardParts.push('+' + r.up + ' UP');
            if (r.sp) rewardParts.push('+' + r.sp + ' SP');
            const rewardEl = document.createElement('div');
            rewardEl.className = 'milestone-reward-hint' + (earned ? ' earned' : '');
            rewardEl.textContent = rewardParts.join(' · ');
            body.appendChild(rewardEl);
          }

          if (!earned) {
            const bar = document.createElement('div');
            bar.className = 'milestone-progress-bar';
            const fill = document.createElement('div');
            fill.className = 'milestone-progress-fill';
            fill.style.width = pct + '%';
            bar.appendChild(fill);
            body.appendChild(bar);
          }

          row.appendChild(body);

          const badge = document.createElement('div');
          badge.className = 'milestone-badge';
          badge.textContent = earned ? '✓ Done' : prog + ' / ' + def.threshold;
          row.appendChild(badge);

          section.appendChild(row);
        }

        container.appendChild(section);
      }

      if (!container.children.length) {
        container.innerHTML = '<p style="color:var(--muted);text-align:center;padding:40px 20px;">No milestones in progress yet.<br>Start digging!</p>';
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
        if (tab === 'milestones') renderMilestones();
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
    renderCollection,
    renderMilestones,
    checkMilestones,
    backfillMilestoneRewards
  };

})();
