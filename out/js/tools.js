/* ============================================================
   DEEPSTRIKE — tools.js
   Phase 4: Tool tiers, damage formula, upgrade screen UI,
            Upgrade Points economy
   ============================================================ */

'use strict';

const Tools = (() => {

  // ── Tool tier definitions ─────────────────────────────────

  const TIERS = [
    null, // index 0 unused — tiers are 1-indexed
    {
      id:      1,
      name:    'Wooden Pick',
      icon:    '&#x26CF;',    // ⛏
      baseDmg: 2,
      cost:    0,
      unlocks: [],
      desc:    'Breaks soil, rock and ore veins.',
    },
    {
      id:      2,
      name:    'Stone Pick',
      icon:    '&#x1FA93;',  // 🪓-adjacent — wrench stand-in
      baseDmg: 5,
      cost:    50,
      unlocks: [],
      desc:    'Heavier head — hits rock harder.',
    },
    {
      id:      3,
      name:    'Iron Pick',
      icon:    '&#x2699;',   // ⚙
      baseDmg: 9,
      cost:    150,
      unlocks: ['dense_rock', 'crystal'],
      desc:    'Unlocks Dense Rock and Crystal Nodes.',
    },
    {
      id:      4,
      name:    'Enchanted Pick',
      icon:    '&#x2728;',   // ✨
      baseDmg: 15,
      cost:    400,
      unlocks: [],
      desc:    'Elemental resonance — far greater damage.',
    },
    {
      id:      5,
      name:    'Void Drill',
      icon:    '&#x1F300;',  // 🌀
      baseDmg: 25,
      cost:    1000,
      unlocks: [],
      desc:    'Pierces through all known matter.',
    },
  ];

  // Minimum tool tier required to break each cell type.
  // Infinity = truly impassable.
  const MIN_TIER = {
    soil:       1,
    rock:       1,
    ore_vein:   1,
    hollow:     1,
    dense_rock: 3,
    crystal:    3,
    bedrock:    Infinity,
  };

  // Upgrade Points earned per cell break by type
  const BREAK_UP = {
    soil:       1,
    rock:       2,
    ore_vein:   3,
    hollow:     1,
    dense_rock: 4,
    crystal:    5,
  };

  // ── Accessors ─────────────────────────────────────────────

  function getTierNum() {
    return GameState.get('player.toolTier') || 1;
  }

  function getTool(n) {
    return TIERS[n] || TIERS[1];
  }

  function current() {
    return getTool(getTierNum());
  }

  /**
   * Returns true if the current tool can break this cell type.
   */
  function canStrike(cellType) {
    const min = MIN_TIER[cellType];
    if (min === undefined) return true;
    return getTierNum() >= min;
  }

  /**
   * Damage formula: (base + flat) × multiplier × element
   * flat = 0, multiplier = 1, element = 1 — expanded in Phase 5 & 6.
   */
  function damage(/* cellType */) {
    const tool = current();
    const base = tool.baseDmg;
    const flat = 0;   // Phase 6: skill flat bonus
    const mult = 1;   // Phase 6: skill multiplier
    const elem = 1;   // Phase 5: elemental coefficient
    return Math.max(1, (base + flat) * mult * elem);
  }

  // ── Point economy ─────────────────────────────────────────

  function awardPoints(amount) {
    const cur = GameState.get('player.upgradePoints') || 0;
    GameState.set('player.upgradePoints', cur + amount);
    Bus.emit('points:earned', { amount, total: cur + amount });
    _refreshPointsDisplay();
  }

  function _refreshPointsDisplay() {
    const el = document.querySelector('#topbar .points-display span');
    if (el) el.textContent = GameState.get('player.upgradePoints') || 0;
  }

  // Award points when a cell is broken
  Bus.on('cell:broken', function (data) {
    var up = BREAK_UP[data.type] || 1;
    awardPoints(up);
  });

  // Award points on layer clear — 10 base + 5 ailment-free bonus (Phase 5 will gate this)
  Bus.on('layer:cleared', function () {
    awardPoints(15);
  });

  // ── Purchase ──────────────────────────────────────────────

  function purchase(targetTier) {
    var tier = getTierNum();
    if (targetTier !== tier + 1) return { ok: false, reason: 'not_next' };

    var tool = TIERS[targetTier];
    if (!tool) return { ok: false, reason: 'invalid_tier' };

    var pts = GameState.get('player.upgradePoints') || 0;
    if (pts < tool.cost) return { ok: false, reason: 'insufficient_pts' };

    GameState.set('player.upgradePoints', pts - tool.cost);
    GameState.set('player.toolTier', targetTier);

    Bus.emit('tool:upgraded', { tier: targetTier, tool: tool });
    _refreshPointsDisplay();
    renderUpgradeScreen();
    return { ok: true };
  }

  // ── Upgrade screen renderer ────────────────────────────────

  function renderUpgradeScreen() {
    var container = document.querySelector('#screen-upgrade .upgrade-inner');
    if (!container) return;

    var currentTier = getTierNum();
    var pts         = GameState.get('player.upgradePoints') || 0;

    var html = '<div class="screen-header">'
             + '<h2>Workshop</h2>'
             + '<p>Upgrade your tools with Upgrade Points</p>'
             + '</div>';

    for (var i = 1; i <= 5; i++) {
      var tool      = TIERS[i];
      var isOwned   = i <= currentTier;
      var isCurrent = i === currentTier;
      var isNext    = i === currentTier + 1;
      var isLocked  = i > currentTier + 1;
      var canAfford = pts >= tool.cost;

      var cardClass = 'tool-card';
      if (isCurrent) cardClass += ' tool-current';
      else if (isOwned) cardClass += ' tool-owned';
      else if (isNext)  cardClass += ' tool-next';
      else              cardClass += ' tool-locked';

      // Tier dots
      var dots = '';
      for (var d = 1; d <= 5; d++) {
        var cls = 'tier-dot';
        if (d <= i)          cls += ' filled';
        if (d === i)         cls += ' active';
        dots += '<div class="' + cls + '" title="Tier ' + d + '"></div>';
      }

      // Unlock hint
      var unlockHint = '';
      if (tool.unlocks.length) {
        var names = tool.unlocks.map(function (t) {
          return t === 'dense_rock' ? 'Dense Rock' : t === 'crystal' ? 'Crystal Nodes' : t;
        });
        unlockHint = '<div class="tool-unlock">Unlocks: ' + names.join(', ') + '</div>';
      }

      // Progress meter (next tier only)
      var progressMeter = '';
      if (isNext) {
        var pct = Math.min(100, Math.round((pts / tool.cost) * 100));
        progressMeter = '<div class="upgrade-progress">'
          + '<div class="upgrade-progress-header">'
          +   '<span class="upgrade-progress-label">Progress</span>'
          +   '<span class="upgrade-progress-value">' + pts + ' / ' + tool.cost + ' pts</span>'
          + '</div>'
          + '<progress class="upgrade-progress-bar" max="' + tool.cost + '" value="' + pts + '">'
          +   pct + '%'
          + '</progress>'
          + '</div>';
      }

      // Action area
      var action = '';
      if (isCurrent) {
        action = '<div class="tool-badge equipped">Equipped</div>';
      } else if (isOwned) {
        action = '<div class="tool-badge owned">Owned</div>';
      } else if (isNext) {
        if (canAfford) {
          action = '<button class="btn-upgrade" data-tier="' + i
                 + '" aria-label="Buy ' + tool.name + ' for ' + tool.cost + ' pts">'
                 + 'Upgrade &mdash; ' + tool.cost + ' pts'
                 + '</button>';
        } else {
          action = '<div class="tool-badge need-pts">Need ' + (tool.cost - pts) + ' more pts</div>';
        }
      } else {
        action = '<div class="tool-badge locked-badge">Tier ' + i + '</div>';
      }

      // DMG / desc line
      var statsLine = 'Base DMG: ' + tool.baseDmg;
      if (isCurrent) statsLine += ' &nbsp;<span class="tag-equipped">Active</span>';

      html += '<div class="' + cardClass + '">'
            + '  <div class="tool-icon-wrap" aria-hidden="true">'
            + '    <span class="tool-icon-char">' + tool.icon + '</span>'
            + '  </div>'
            + '  <div class="tool-info">'
            + '    <div class="tool-name">' + tool.name + '</div>'
            + '    <div class="tool-stats">' + statsLine + '</div>'
            + '    <div class="tool-desc">' + tool.desc + '</div>'
            + unlockHint
            + '    <div class="tool-tier-dots">' + dots + '</div>'
            + progressMeter
            + '  </div>'
            + '  <div class="tool-action">' + action + '</div>'
            + '</div>';
    }

    container.innerHTML = html;

    // Attach purchase handlers
    container.querySelectorAll('.btn-upgrade').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var tier   = parseInt(btn.dataset.tier, 10);
        var result = purchase(tier);
        if (!result.ok) {
          var orig = btn.textContent;
          btn.textContent = 'Not enough pts!';
          btn.disabled = true;
          setTimeout(function () {
            btn.textContent = orig;
            btn.disabled = false;
          }, 1200);
        }
      });
    });

    // Sync overworld upgrade card subtitle + icon
    var overworldBtn = document.querySelector('#btn-goto-upgrade');
    if (overworldBtn) {
      var tool = current();
      var sub = overworldBtn.querySelector('.card-sub');
      if (sub) sub.textContent = tool.name + ' \u00B7 Tier ' + currentTier;

      // Replace the static SVG icon with a span showing the current tool emoji.
      // On first upgrade the element is still an <svg>; after that it's a <span>.
      var iconEl = overworldBtn.querySelector('.card-icon');
      if (iconEl) {
        if (iconEl.tagName.toLowerCase() === 'svg') {
          var span = document.createElement('span');
          span.className = 'card-icon';
          span.setAttribute('aria-hidden', 'true');
          iconEl.parentNode.replaceChild(span, iconEl);
          iconEl = span;
        }
        iconEl.innerHTML = tool.icon;
      }
    }
  }

  // ── Init ──────────────────────────────────────────────────

  function init() {
    // Initial render (screen might not be active yet)
    renderUpgradeScreen();

    // Re-render whenever the upgrade screen is entered
    Bus.on('router:navigate', function (data) {
      if (data.screen === 'upgrade') renderUpgradeScreen();
    });

    // Keep points badge fresh when milestones award points
    Bus.on('milestone:earned',  _refreshPointsDisplay);
    Bus.on('points:backfilled', _refreshPointsDisplay);
    Bus.on('tool:upgraded',     _refreshPointsDisplay);
  }

  return {
    getTierNum:          getTierNum,
    getTool:             getTool,
    current:             current,
    canStrike:           canStrike,
    damage:              damage,
    purchase:            purchase,
    renderUpgradeScreen: renderUpgradeScreen,
    init:                init,
  };
})();
