/* ============================================================
   DEEPSTRIKE — ailments.js
   Phase 5: Status ailment state machine
   apply · tick · cure · antidote · topbar icons
   ============================================================ */

'use strict';

const Ailments = (() => {

  // ── Ailment definitions ───────────────────────────────────────

  const DEFS = {
    poison: {
      id:    'poison',
      icon:  '☠',
      color: '#7ab830',
      label: 'Poisoned',
      desc:  'Damage ×0.25 for 5 taps. Cures on Crystal hit.',
    },
    explosive: {
      id:    'explosive',
      icon:  '💥',
      color: '#e05540',
      label: 'Explosive',
      desc:  'Breaks surrounding cells on destruction.',
    },
    frost: {
      id:    'frost',
      icon:  '❄',
      color: '#4090d0',
      label: 'Frost',
      desc:  'Cell freezes — cannot re-tap for 3 hits.',
    },
    cursed: {
      id:    'cursed',
      icon:  '☽',
      color: '#9060d0',
      label: 'Cursed',
      desc:  'Drains 5 Upgrade Points when broken.',
    },
    shock: {
      id:    'shock',
      icon:  '⚡',
      color: '#e8c030',
      label: 'Shocked',
      desc:  'Next tap deals no damage.',
    },
    magma: {
      id:    'magma',
      icon:  '🌋',
      color: '#e07030',
      label: 'Magma',
      desc:  'Vent within 3 seconds or lose 10 pts.',
    },
  };

  // ── Player-level active ailments (in-memory, reset per layer) ─

  let _poison = null;   // { tapsLeft: number }
  let _shock  = null;   // { active: true }

  // Whether any ailment was triggered this layer (for ailment-free clear bonus)
  let _hadAilmentThisLayer = false;

  // Active magma vent timers: key = `${r},${c}`, value = { timerId, interval }
  const _magmaTimers = {};

  // ── Apply player-level ailment ────────────────────────────────

  function _applyPoison() {
    _hadAilmentThisLayer = true;
    _poison = { tapsLeft: 5 };
    _updateTopbar();
    Toast.show('Poisoned! Damage reduced for 5 taps.');
  }

  function _applyShock() {
    _hadAilmentThisLayer = true;
    _shock = { active: true };
    _updateTopbar();
    Toast.show('Shocked! Next strike deals no damage.');
  }

  // ── Damage multiplier — consumed by Tools.damage() ────────────
  /**
   * Returns a modifier in [0, 1] to apply to tool damage.
   * Shock consumes itself (one-shot stun).
   * Must be called once per tap from Tools.damage().
   */
  function damageMultiplier() {
    if (_shock && _shock.active) {
      _shock = null;
      _updateTopbar();
      return 0;   // Stun — zero damage this tap
    }
    if (_poison) {
      // Phase 6: stoneSkin skill can override the poison penalty
      const override = typeof Skills !== 'undefined' ? Skills.poisonMultiplierOverride() : null;
      return override !== null ? override : 0.25;
    }
    return 1;
  }

  // ── Tick (called once per tap, after damage is applied) ───────

  function tick() {
    if (_poison) {
      _poison.tapsLeft--;
      if (_poison.tapsLeft <= 0) {
        _poison = null;
        Toast.show('Poison wore off.');
      }
      _updateTopbar();
    }
  }

  // ── Cure ─────────────────────────────────────────────────────

  function cure(ailmentId) {
    if (ailmentId === 'poison' && _poison) {
      _poison = null;
      _updateTopbar();
    } else if (ailmentId === 'shock' && _shock) {
      _shock = null;
      _updateTopbar();
    }
  }

  function cureAll() {
    _poison = null;
    _shock  = null;
    _clearAllMagmaTimers();
    _updateTopbar();
    Toast.show('All ailments cured!');
  }

  function has(ailmentId) {
    if (ailmentId === 'poison') return !!_poison;
    if (ailmentId === 'shock')  return !!_shock;
    return false;
  }

  // ── Antidotes ─────────────────────────────────────────────────

  function getAntidoteCount() {
    return GameState.get('player.antidotes') || 0;
  }

  function buyAntidote() {
    const pts  = GameState.get('player.upgradePoints') || 0;
    const cost = 20;
    if (pts < cost) return { ok: false, reason: 'insufficient_pts' };
    GameState.set('player.upgradePoints', pts - cost);
    GameState.set('player.antidotes', getAntidoteCount() + 1);
    const el = document.querySelector('#topbar .points-display span');
    if (el) el.textContent = pts - cost;
    return { ok: true };
  }

  function useAntidote() {
    const count = getAntidoteCount();
    if (count <= 0) return false;
    GameState.set('player.antidotes', count - 1);
    cureAll();
    return true;
  }

  // ── Magma vent timer ──────────────────────────────────────────

  const MAGMA_VENT_MS = 3000;

  function _startMagmaTimer(r, c) {
    const key = r + ',' + c;
    if (_magmaTimers[key]) return; // already venting

    _hadAilmentThisLayer = true;

    // Countdown display (updates cell every second)
    let remaining = 3;
    const interval = setInterval(() => {
      remaining--;
      Bus.emit('ailment:magma:tick', { r, c, remaining });
    }, 1000);

    const timerId = setTimeout(() => {
      clearInterval(interval);
      delete _magmaTimers[key];
      // Penalty: drain 10 UP
      const pts = GameState.get('player.upgradePoints') || 0;
      const penalty = Math.min(pts, 10);
      GameState.set('player.upgradePoints', pts - penalty);
      const el = document.querySelector('#topbar .points-display span');
      if (el) el.textContent = GameState.get('player.upgradePoints');
      Bus.emit('ailment:magma:expired', { r, c, penalty });
      if (penalty > 0) {
        Toast.show('Magma vented! Lost ' + penalty + ' pts.');
      }
    }, MAGMA_VENT_MS);

    _magmaTimers[key] = { timerId, interval };
    Bus.emit('ailment:magma:venting', { r, c });
  }

  function _cancelMagmaTimer(r, c) {
    const key = r + ',' + c;
    const t = _magmaTimers[key];
    if (!t) return;
    clearTimeout(t.timerId);
    clearInterval(t.interval);
    delete _magmaTimers[key];
    Bus.emit('ailment:magma:vented', { r, c });
  }

  function _clearAllMagmaTimers() {
    for (const key of Object.keys(_magmaTimers)) {
      const t = _magmaTimers[key];
      clearTimeout(t.timerId);
      clearInterval(t.interval);
      const [r, c] = key.split(',').map(Number);
      Bus.emit('ailment:magma:vented', { r, c });
      delete _magmaTimers[key];
    }
  }

  // ── Bus listeners ─────────────────────────────────────────────

  /**
   * When a status cell is first STRUCK (not broken) → cell-level effects.
   *   frost: Grid.freezeCell() is called from here.
   *   magma: start vent timer.
   * Emits include { r, c, type, status, broken } from grid.js.
   */
  Bus.on('cell:struck', function (data) {
    const status = data.status;
    if (!status || data.broken) return;

    if (status === 'frost') {
      Grid.freezeCell(data.r, data.c);
    } else if (status === 'magma') {
      _startMagmaTimer(data.r, data.c);
    }
  });

  /**
   * When a status cell is BROKEN → apply player effects and AOE.
   */
  Bus.on('cell:broken', function (data) {
    const status = data.status;
    if (!status) return;

    if (status === 'explosive' && !data.aoe) {
      // Guard: don't chain-react when this cell was itself broken by an AOE burst
      Grid.aoeBurst(data.r, data.c);
      console.log('[Ailments] Explosive AOE at', data.r, data.c, '— item consumption logged');
    } else if (status === 'poison') {
      _applyPoison();
    } else if (status === 'shock') {
      _applyShock();
    } else if (status === 'cursed') {
      _hadAilmentThisLayer = true;
      const pts     = GameState.get('player.upgradePoints') || 0;
      const drained = Math.min(pts, 5);
      GameState.set('player.upgradePoints', pts - drained);
      const el = document.querySelector('#topbar .points-display span');
      if (el) el.textContent = pts - drained;
      if (drained > 0) {
        Toast.show('Cursed! Lost ' + drained + ' pts.');
      }
    } else if (status === 'magma') {
      // Player broke the magma cell in time → cancel timer (no penalty)
      _cancelMagmaTimer(data.r, data.c);
    } else if (status === 'frost') {
      // Frost cell broken — no lingering player debuff needed
    }
  });

  /**
   * Cure poison when a crystal cell is struck.
   */
  Bus.on('cell:struck', function (data) {
    if (data.type === 'crystal' && _poison) {
      cure('poison');
      Toast.show('Poison cured by Crystal!');
    }
    // Tick poison countdown on every tap (regardless of cell type)
    tick();
  });

  /**
   * Reset ailments on layer clear / new layer start.
   */
  Bus.on('layer:entered', function () {
    _poison = null;
    _shock  = null;
    _hadAilmentThisLayer = false;
    _clearAllMagmaTimers();
    _updateTopbar();
  });

  // ── Topbar status icons ───────────────────────────────────────

  function _updateTopbar() {
    const container = document.querySelector('#topbar .status-icons');
    if (!container) return;
    container.innerHTML = '';

    if (_poison) {
      const icon  = document.createElement('span');
      icon.className     = 'status-icon';
      icon.dataset.ailment = 'poison';
      icon.title         = 'Poisoned (' + _poison.tapsLeft + ' tap' + (_poison.tapsLeft !== 1 ? 's' : '') + ' left)';
      icon.textContent   = DEFS.poison.icon;
      container.appendChild(icon);
    }
    if (_shock) {
      const icon = document.createElement('span');
      icon.className     = 'status-icon';
      icon.dataset.ailment = 'shock';
      icon.title         = 'Shocked — next tap stunned';
      icon.textContent   = DEFS.shock.icon;
      container.appendChild(icon);
    }
  }

  // ── Depot screen renderer ─────────────────────────────────────

  function renderDepot() {
    const container = document.getElementById('depot-stock');
    if (!container) return;

    const pts         = GameState.get('player.upgradePoints') || 0;
    const antidotes   = getAntidoteCount();
    const maxAntidote = 5;
    const cost        = 20;
    const canBuy      = pts >= cost && antidotes < maxAntidote;

    container.innerHTML =
      '<div class="depot-section-title">Consumables</div>' +
      '<div class="depot-item">' +
        '<div class="depot-item-icon">🧪</div>' +
        '<div class="depot-item-info">' +
          '<div class="depot-item-name">Antidote</div>' +
          '<div class="depot-item-desc">Instantly cures all active ailments. Max ' + maxAntidote + '.</div>' +
          '<div class="depot-item-stock">In stock: ' + antidotes + ' / ' + maxAntidote + '</div>' +
        '</div>' +
        '<div class="depot-item-action">' +
          (antidotes >= maxAntidote
            ? '<div class="depot-badge full">Full</div>'
            : canBuy
              ? '<button class="btn-depot-buy" id="btn-buy-antidote">Buy — ' + cost + ' pts</button>'
              : '<div class="depot-badge need-pts">Need ' + (cost - pts) + ' more pts</div>'
          ) +
          (antidotes > 0
            ? '<button class="btn-depot-use" id="btn-use-antidote">Use Antidote</button>'
            : ''
          ) +
        '</div>' +
      '</div>';

    document.getElementById('btn-buy-antidote')?.addEventListener('click', function () {
      const result = buyAntidote();
      if (result.ok) {
        Toast.show('Antidote purchased!');
      } else {
        Toast.show('Not enough pts!');
      }
      renderDepot();
    });

    document.getElementById('btn-use-antidote')?.addEventListener('click', function () {
      const used = useAntidote();
      if (used) {
        Toast.show('Antidote used — all ailments cured!');
      } else {
        Toast.show('No antidotes remaining!');
      }
      renderDepot();
    });
  }

  // ── Public API ─────────────────────────────────────────────────

  return {
    DEFS,
    damageMultiplier,
    tick,
    cure,
    cureAll,
    has,
    getAntidoteCount,
    buyAntidote,
    useAntidote,
    hadAilmentThisLayer: () => _hadAilmentThisLayer,
    renderDepot,
  };

})();
