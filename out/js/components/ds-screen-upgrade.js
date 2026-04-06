/* ============================================================
   DEEPSTRIKE — ds-screen-upgrade.js
   Web component: <ds-screen-upgrade>
   Renders the Workshop / tool upgrade screen shell.
   tools.js's renderUpgradeScreen() does a full innerHTML rewrite
   of .upgrade-inner — that container is preserved here.
   The static placeholder cards shown before JS runs are included
   so the screen is not blank on first paint.
   ============================================================ */

'use strict';

class DsScreenUpgrade extends HTMLElement {
  connectedCallback() {
    this.setAttribute('id', 'screen-upgrade');
    this.setAttribute('class', 'screen');
    this.setAttribute('role', 'region');
    this.setAttribute('aria-label', 'Tool upgrades');
    this.render();
  }

  render() {
    this.innerHTML = `
      <div class="upgrade-inner">

        <div class="screen-header">
          <h2>Workshop</h2>
          <p>Upgrade your tools with Upgrade Points</p>
        </div>

        <!-- Current tool card (static placeholder — replaced by tools.js on init) -->
        <div class="tool-card">
          <div class="tool-icon" aria-hidden="true">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
              <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.77 3.77z"/>
            </svg>
          </div>
          <div class="tool-info">
            <div class="tool-name">Wooden Pick</div>
            <div class="tool-stats">Base DMG: 2 · Breaks: Soil, Loose Rock</div>
            <div class="tool-tier-dots">
              <div class="tier-dot filled" title="Tier 1"></div>
              <div class="tier-dot" title="Tier 2 — Stone Pick"></div>
              <div class="tier-dot" title="Tier 3 — Iron Pick"></div>
              <div class="tier-dot" title="Tier 4 — Enchanted Pick"></div>
              <div class="tier-dot" title="Tier 5 — Void Drill"></div>
            </div>
          </div>
        </div>

        <!-- Next upgrade hint (static placeholder) -->
        <div class="tool-card" style="opacity:0.5; pointer-events:none;">
          <div class="tool-icon" style="color:var(--muted)" aria-hidden="true">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
              <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
          </div>
          <div class="tool-info">
            <div class="tool-name" style="color:var(--muted)">Stone Pick</div>
            <div class="tool-stats">Requires 50 pts · Base DMG: 5</div>
            <div class="tool-tier-dots">
              <div class="tier-dot filled"></div>
              <div class="tier-dot" style="border:1px solid var(--uncommon); background:none;"></div>
              <div class="tier-dot"></div>
              <div class="tier-dot"></div>
              <div class="tier-dot"></div>
            </div>
          </div>
        </div>

      </div>
    `;
  }
}

customElements.define('ds-screen-upgrade', DsScreenUpgrade);
