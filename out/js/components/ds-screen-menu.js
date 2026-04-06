/* ============================================================
   DEEPSTRIKE — ds-screen-menu.js
   Web component: <ds-screen-menu>
   Renders the Game Menu screen.
   game.js's MenuScreen.init() wires button IDs — all preserved.
   ============================================================ */

'use strict';

class DsScreenMenu extends HTMLElement {
  connectedCallback() {
    this.setAttribute('id', 'screen-menu');
    this.setAttribute('class', 'screen');
    this.setAttribute('role', 'region');
    this.setAttribute('aria-label', 'Game menu');
    this.render();
  }

  render() {
    this.innerHTML = `
      <div class="menu-inner">

        <div class="screen-header">
          <h2>Game Menu</h2>
          <p>Save your progress or start fresh</p>
        </div>

        <!-- Save / Load / New Game actions -->
        <div class="menu-actions">

          <button class="menu-action-btn" id="btn-save-game" aria-label="Save game">
            <div class="menu-action-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
                <polyline points="17 21 17 13 7 13 7 21"/>
                <polyline points="7 3 7 8 15 8"/>
              </svg>
            </div>
            <div class="menu-action-text">
              <span class="menu-action-title">Save Game</span>
              <span class="menu-action-sub" id="save-timestamp">Auto-saved</span>
            </div>
          </button>

          <button class="menu-action-btn" id="btn-load-game" aria-label="Load saved game">
            <div class="menu-action-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <polyline points="1 4 1 10 7 10"/>
                <path d="M3.51 15a9 9 0 1 0 .49-4.95"/>
              </svg>
            </div>
            <div class="menu-action-text">
              <span class="menu-action-title">Load Game</span>
              <span class="menu-action-sub">Restore last save</span>
            </div>
          </button>

          <button class="menu-action-btn menu-action-danger" id="btn-new-game" aria-label="Start a new game">
            <div class="menu-action-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <polyline points="23 4 23 10 17 10"/>
                <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
              </svg>
            </div>
            <div class="menu-action-text">
              <span class="menu-action-title">New Game</span>
              <span class="menu-action-sub">Reset all progress</span>
            </div>
          </button>

        </div>

        <!-- Confirm new game panel (hidden by default) -->
        <div id="new-game-confirm" class="menu-confirm" hidden>
          <p>This will erase all progress. Are you sure?</p>
          <div class="menu-confirm-btns">
            <button id="btn-new-game-cancel" class="menu-confirm-cancel">Cancel</button>
            <button id="btn-new-game-ok" class="menu-confirm-ok">Yes, Start Over</button>
          </div>
        </div>

        <!-- Divider -->
        <div class="menu-divider"></div>

        <!-- About section -->
        <div class="menu-about">
          <h3 class="menu-about-title">About DeepStrike</h3>

          <!-- Digging animation -->
          <div class="dig-anim" aria-hidden="true">
            <!-- Sky / surface -->
            <div class="dig-surface"></div>
            <!-- Earth strata layers -->
            <div class="dig-strata">
              <div class="dig-layer dig-layer-1"></div>
              <div class="dig-layer dig-layer-2"></div>
              <div class="dig-layer dig-layer-3"></div>
              <div class="dig-layer dig-layer-4"></div>
            </div>
            <!-- Shaft opening (the hole being dug) -->
            <div class="dig-shaft"></div>
            <!-- Miner figure -->
            <div class="dig-miner">
              <div class="dig-miner-head"></div>
              <div class="dig-miner-body"></div>
              <div class="dig-miner-arm">
                <div class="dig-pickaxe">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.77 3.77z"/>
                  </svg>
                </div>
                <!-- Rock chips fly from pickaxe head -->
                <div class="dig-chip dig-chip-1"></div>
                <div class="dig-chip dig-chip-2"></div>
                <div class="dig-chip dig-chip-3"></div>
              </div>
            </div>
            <!-- Depth label -->
            <div class="dig-depth-label">
              <span class="dig-depth-text">Digging deeper…</span>
            </div>
            <!-- Gem sparkle -->
            <div class="dig-gem">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="var(--rare)" stroke="none">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
              </svg>
            </div>
          </div>

          <p class="menu-about-desc">
            DeepStrike is a tap-excavation adventure set in a crumbling mining territory.
            Strike rock faces, uncover rare relics, and descend through five distinct zones —
            from the brittle Surface Crust to the shimmering Void Depths.
            Each layer grows harder, stranger, and more rewarding.
            Complete item sets, upgrade your tools, and unlock the secrets buried beneath.
          </p>

          <div class="menu-version">v0.5 · Phases 1–5 Complete</div>
        </div>

      </div>
    `;
  }
}

customElements.define('ds-screen-menu', DsScreenMenu);
