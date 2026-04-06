/* ============================================================
   DEEPSTRIKE — skills.js
   Phase 6: Skill Tree — registry, unlock, passive hooks, UI
   ============================================================ */

'use strict';

const Skills = (() => {

  // ── Skill definitions ─────────────────────────────────────

  const REGISTRY = [
    // ── Striker branch ────────────────────────────────────
    {
      id:     'heavyStrike',
      branch: 'striker',
      tier:   1,
      name:   'Heavy Strike',
      icon:   '⚒',
      cost:   1,
      desc:   '+3 flat damage per tap.',
    },
    {
      id:     'comboExtender',
      branch: 'striker',
      tier:   2,
      name:   'Combo Extender',
      icon:   '⏱',
      cost:   2,
      desc:   'Combo reset timer extended to 3s.',
    },
    {
      id:     'seismicTap',
      branch: 'striker',
      tier:   3,
      name:   'Seismic Tap',
      icon:   '🌊',
      cost:   3,
      desc:   'Every 10th combo tap breaks adjacent cells.',
    },
    {
      id:     'elementalInfusion',
      branch: 'striker',
      tier:   4,
      name:   'Elemental Infusion',
      icon:   '✨',
      cost:   4,
      desc:   '+20% damage multiplier.',
    },

    // ── Warden branch ─────────────────────────────────────
    {
      id:     'stoneSkin',
      branch: 'warden',
      tier:   1,
      name:   'Stone Skin',
      icon:   '🪨',
      cost:   1,
      desc:   'Poison damage penalty ×0.5 instead of ×0.25.',
    },
    {
      id:     'defuse',
      branch: 'warden',
      tier:   2,
      name:   'Defuse',
      icon:   '🔧',
      cost:   2,
      desc:   'Explosive AOE only hits immediate (non-diagonal) neighbors.',
    },
    {
      id:     'cleanse',
      branch: 'warden',
      tier:   3,
      name:   'Cleanse',
      icon:   '🌿',
      cost:   3,
      desc:   'Active: cure all ailments. 30s cooldown.',
    },
    {
      id:     'bedrockSense',
      branch: 'warden',
      tier:   4,
      name:   'Bedrock Sense',
      icon:   '👁',
      cost:   4,
      desc:   'Bedrock cells glow faintly before layer is fully cleared.',
    },

    // ── Seeker branch ─────────────────────────────────────
    {
      id:     'lootSense',
      branch: 'seeker',
      tier:   1,
      name:   'Loot Sense',
      icon:   '✦',
      cost:   1,
      desc:   'Item-containing cells glow faintly.',
    },
    {
      id:     'prospector',
      branch: 'seeker',
      tier:   2,
      name:   'Prospector',
      icon:   '⛏',
      cost:   2,
      desc:   '+1 UP per ore_vein cell broken.',
    },
    {
      id:     'hoarder',
      branch: 'seeker',
      tier:   3,
      name:   'Hoarder',
      icon:   '📦',
      cost:   3,
      desc:   'Duplicate item drops convert to +2 UP instead of being wasted.',
    },
    {
      id:     'setMagnet',
      branch: 'seeker',
      tier:   4,
      name:   'Set Magnet',
      icon:   '🧲',
      cost:   4,
      desc:   'Each completed set grants +1 SP.',
    },
  ];

  // Index for quick lookup
  const _byId = {};
  for (const sk of REGISTRY) {
    _byId[sk.id] = sk;
  }

  // ── Cleanse active ability state ──────────────────────────

  let _cleanseCooldownEnd = 0;  // timestamp ms, 0 = ready
  let _cleanseTimerId     = null;
  let _cleanseBtn         = null;

  // ── SP award tracking (layer-based) ──────────────────────

  let _lastSpLayer = 0;  // track which layer we last awarded SP for

  // ── Helpers ───────────────────────────────────────────────

  function _unlockedSkills() {
    return GameState.get('player.unlockedSkills') || [];
  }

  function has(skillId) {
    return _unlockedSkills().indexOf(skillId) !== -1;
  }

  /**
   * Returns the prerequisite skill id for a given skill (the tier-1-lower
   * skill in the same branch), or null if tier 1.
   */
  function _prereq(skill) {
    if (skill.tier === 1) return null;
    const prevTier = skill.tier - 1;
    const found = REGISTRY.find(function (s) {
      return s.branch === skill.branch && s.tier === prevTier;
    });
    return found ? found.id : null;
  }

  function getSkillPoints() {
    return GameState.get('player.skillPoints') || 0;
  }

  function awardSkillPoints(n) {
    const cur = getSkillPoints();
    GameState.set('player.skillPoints', cur + n);
    Bus.emit('skills:sp_changed', { amount: n, total: cur + n });
    _refreshSpDisplay();
  }

  function _refreshSpDisplay() {
    const el = document.querySelector('#screen-skills .sp-value');
    if (el) el.textContent = getSkillPoints();
  }

  /**
   * Attempt to unlock a skill. Returns { ok, reason }.
   */
  function unlock(skillId) {
    const skill = _byId[skillId];
    if (!skill) return { ok: false, reason: 'unknown_skill' };

    if (has(skillId)) return { ok: false, reason: 'already_unlocked' };

    // Check prereq
    const prereqId = _prereq(skill);
    if (prereqId && !has(prereqId)) {
      return { ok: false, reason: 'prereq_not_met' };
    }

    // Check SP
    const sp = getSkillPoints();
    if (sp < skill.cost) {
      return { ok: false, reason: 'insufficient_sp' };
    }

    // Deduct and unlock
    GameState.set('player.skillPoints', sp - skill.cost);
    const unlocked = _unlockedSkills().slice();
    unlocked.push(skillId);
    GameState.set('player.unlockedSkills', unlocked);

    Bus.emit('skill:unlocked', { skillId, skill });
    Toast.show(skill.name + ' unlocked!');

    // If cleanse just unlocked, inject topbar button
    if (skillId === 'cleanse') {
      _injectCleanseBtn();
    }

    render();
    _refreshSpDisplay();
    return { ok: true };
  }

  // ── Passive effect hooks (called from other modules) ──────

  function flatDamageBonus() {
    return has('heavyStrike') ? 3 : 0;
  }

  function damageMultiplier() {
    return has('elementalInfusion') ? 1.2 : 1.0;
  }

  function poisonMultiplierOverride() {
    return has('stoneSkin') ? 0.5 : null;
  }

  function comboTimeoutMs() {
    return has('comboExtender') ? 3000 : 2000;
  }

  function hasLootSense()    { return has('lootSense'); }
  function hasProspector()   { return has('prospector'); }
  function hasHoarder()      { return has('hoarder'); }
  function hasSetMagnet()    { return has('setMagnet'); }
  function hasDefuse()       { return has('defuse'); }
  function hasSeismicTap()   { return has('seismicTap'); }
  function hasBedrockSense() { return has('bedrockSense'); }
  function hasCleanse()      { return has('cleanse'); }

  function cleanseReady() {
    return Date.now() >= _cleanseCooldownEnd;
  }

  function useCleanse() {
    if (!hasCleanse()) return;
    if (!cleanseReady()) return;
    if (typeof Ailments !== 'undefined') Ailments.cureAll();
    _cleanseCooldownEnd = Date.now() + 30000;
    _startCleanseCooldownTick();
  }

  // ── Cleanse topbar button ──────────────────────────────────

  function _injectCleanseBtn() {
    const container = document.querySelector('#topbar .status-icons');
    if (!container) return;
    // Avoid duplicates
    if (container.querySelector('.cleanse-btn')) return;

    const btn = document.createElement('button');
    btn.className   = 'cleanse-btn';
    btn.textContent = '🌿';
    btn.title       = 'Cleanse — cure all ailments';
    btn.setAttribute('aria-label', 'Cleanse: cure all ailments');
    btn.addEventListener('click', function () {
      if (!cleanseReady()) {
        const secs = Math.ceil((_cleanseCooldownEnd - Date.now()) / 1000);
        Toast.show('Cleanse on cooldown (' + secs + 's remaining).');
        return;
      }
      useCleanse();
    });

    _cleanseBtn = btn;
    container.appendChild(btn);
    _updateCleanseBtn();
  }

  function _updateCleanseBtn() {
    if (!_cleanseBtn) return;
    if (cleanseReady()) {
      _cleanseBtn.classList.remove('on-cooldown');
      _cleanseBtn.classList.add('ready');
      _cleanseBtn.disabled = false;
      _cleanseBtn.title = 'Cleanse — cure all ailments';
    } else {
      const secs = Math.ceil((_cleanseCooldownEnd - Date.now()) / 1000);
      _cleanseBtn.classList.add('on-cooldown');
      _cleanseBtn.classList.remove('ready');
      _cleanseBtn.disabled = true;
      _cleanseBtn.title = 'Cleanse on cooldown (' + secs + 's)';
    }
  }

  function _startCleanseCooldownTick() {
    if (_cleanseTimerId) clearInterval(_cleanseTimerId);
    _cleanseTimerId = setInterval(function () {
      _updateCleanseBtn();
      if (cleanseReady()) {
        clearInterval(_cleanseTimerId);
        _cleanseTimerId = null;
        Toast.show('Cleanse is ready!');
      }
    }, 1000);
    _updateCleanseBtn();
  }

  // ── Render skill tree ──────────────────────────────────────

  function render() {
    const container = document.getElementById('skill-tree-dynamic');
    if (!container) return;

    const sp = getSkillPoints();
    _refreshSpDisplay();

    const branches = ['striker', 'warden', 'seeker'];
    const branchLabels = {
      striker: '⚔ Striker',
      warden:  '🛡 Warden',
      seeker:  '✦ Seeker',
    };

    let html = '<div class="skill-branch-headers">';
    for (const b of branches) {
      html += '<div class="skill-branch-label ' + b + '">' + branchLabels[b] + '</div>';
    }
    html += '</div>';

    for (let tier = 1; tier <= 4; tier++) {
      // Connector row (between tiers, not before tier 1)
      if (tier > 1) {
        html += '<div class="skill-tier-row skill-connector-row">';
        for (const b of branches) {
          html += '<div class="skill-connector"><div class="skill-connector-line"></div></div>';
        }
        html += '</div>';
      }

      html += '<div class="skill-tier-row">';

      for (const b of branches) {
        const skill = REGISTRY.find(function (s) {
          return s.branch === b && s.tier === tier;
        });

        if (!skill) {
          html += '<div class="skill-card locked"></div>';
          continue;
        }

        const isUnlocked = has(skill.id);
        const prereqId   = _prereq(skill);
        const prereqMet  = !prereqId || has(prereqId);
        const canAfford  = sp >= skill.cost;
        const canUnlock  = !isUnlocked && prereqMet;

        let cardClass = 'skill-card ' + b;
        if (isUnlocked)       cardClass += ' unlocked';
        else if (prereqMet)   cardClass += ' available';
        else                  cardClass += ' locked';

        html += '<div class="' + cardClass + '">';
        html +=   '<div class="skill-icon">' + skill.icon + '</div>';
        html +=   '<div class="skill-name">' + skill.name + '</div>';
        html +=   '<div class="skill-desc">' + skill.desc + '</div>';
        html +=   '<div class="skill-cost">' + skill.cost + ' SP</div>';

        if (isUnlocked) {
          html += '<div class="skill-unlocked-badge">✓ Unlocked</div>';
        } else if (canUnlock) {
          const btnDisabled = canAfford ? '' : ' disabled';
          html += '<button class="skill-unlock-btn"'
               + btnDisabled
               + ' data-skill-id="' + skill.id + '"'
               + ' aria-label="Unlock ' + skill.name + ' for ' + skill.cost + ' SP"'
               + '>'
               + (canAfford ? 'Unlock' : 'Need ' + (skill.cost - sp) + ' more SP')
               + '</button>';
        } else {
          html += '<div class="skill-unlocked-badge" style="color:var(--muted)">🔒 Locked</div>';
        }

        html += '</div>'; // .skill-card
      }

      html += '</div>'; // .skill-tier-row
    }

    container.innerHTML = html;

    // Attach unlock button handlers
    container.querySelectorAll('.skill-unlock-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        const skillId = btn.dataset.skillId;
        const result  = unlock(skillId);
        if (!result.ok) {
          const orig = btn.textContent;
          btn.textContent = result.reason === 'insufficient_sp' ? 'Not enough SP!' : 'Cannot unlock';
          btn.disabled = true;
          setTimeout(function () {
            btn.textContent = orig;
            btn.disabled = false;
          }, 1200);
        }
      });
    });
  }

  // ── Init ──────────────────────────────────────────────────

  function init() {
    // Render on screen entry
    Bus.on('router:navigate', function (data) {
      if (data.screen === 'skills') render();
    });

    // SP awards: 1 SP per 5 layers cleared
    Bus.on('layer:cleared', function () {
      const layer = GameState.get('world.currentLayer') || 1;
      const cleared = GameState.get('world.clearedLayers') || [];
      // Award 1 SP every 5th cleared layer (tracked by total cleared count)
      const newCount = cleared.length + 1;  // layer:cleared fires before the list is updated
      if (newCount > 0 && newCount % 5 === 0) {
        awardSkillPoints(1);
        Toast.show('Skill Point earned! (' + getSkillPoints() + ' SP total)');
      }
    });

    // setMagnet: award 1 SP on set completion
    Bus.on('set:completed', function () {
      if (hasSetMagnet()) {
        awardSkillPoints(1);
        Toast.show('Set Magnet: +1 SP!');
      }
    });

    // Keep cleanse button state in sync when ailments are cured externally
    Bus.on('layer:entered', function () {
      _updateCleanseBtn();
    });

    // If cleanse is already unlocked from a previous session, inject button
    if (hasCleanse()) {
      // Wait for DOM to be ready (init() is called from boot() after DOMContentLoaded)
      _injectCleanseBtn();
    }

    // Sync SP display whenever SP changes
    Bus.on('skills:sp_changed', _refreshSpDisplay);

    _refreshSpDisplay();
  }

  // ── Public API ────────────────────────────────────────────

  return {
    has,
    unlock,
    getSkillPoints,
    awardSkillPoints,
    render,
    init,

    // Passive hooks
    flatDamageBonus,
    damageMultiplier,
    poisonMultiplierOverride,
    comboTimeoutMs,
    hasLootSense,
    hasProspector,
    hasHoarder,
    hasSetMagnet,
    hasDefuse,
    hasSeismicTap,
    hasBedrockSense,
    hasCleanse,
    cleanseReady,
    useCleanse,
  };

})();
