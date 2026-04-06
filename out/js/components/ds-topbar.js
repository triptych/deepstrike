/* ============================================================
   DEEPSTRIKE — ds-topbar.js
   Web component: <ds-topbar>
   Renders the top bar with layer badge, combo meter,
   status icons, and upgrade points display.
   Uses Light DOM so existing CSS rules apply unchanged.
   ============================================================ */

'use strict';

class DsTopbar extends HTMLElement {
  connectedCallback() {
    this.setAttribute('id', 'topbar');
    this.setAttribute('role', 'banner');
    this.render();
  }

  render() {
    this.innerHTML = `
      <span class="layer-badge" aria-live="polite">Layer 1</span>

      <div class="combo-meter" role="status" aria-label="Combo meter">
        <span class="combo-label">Combo</span>
        <span class="combo-count" data-tier="0" aria-live="polite"></span>
      </div>

      <div class="status-icons" aria-label="Active status effects" aria-live="polite"></div>

      <div class="points-display" aria-label="Upgrade points">
        <span>0</span> pts
      </div>
    `;
  }
}

customElements.define('ds-topbar', DsTopbar);
