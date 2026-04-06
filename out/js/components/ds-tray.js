/* ============================================================
   DEEPSTRIKE — ds-tray.js
   Web component: <ds-tray>
   Renders the bottom navigation tray with 6 screen buttons.
   Uses Light DOM so Router's tray-btn sync works unchanged.
   ============================================================ */

'use strict';

class DsTray extends HTMLElement {
  connectedCallback() {
    this.setAttribute('id', 'tray');
    this.setAttribute('role', 'navigation');
    this.setAttribute('aria-label', 'Main navigation');
    this.render();
  }

  render() {
    this.innerHTML = `
      <button class="tray-btn" data-screen="overworld" aria-label="Overworld map">
        <svg class="tray-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <polygon points="3 11 22 2 13 21 11 13 3 11"/>
        </svg>
        <span class="tray-label">Map</span>
      </button>

      <button class="tray-btn" data-screen="grid" aria-label="Dig grid">
        <svg class="tray-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
          <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
        </svg>
        <span class="tray-label">Dig</span>
      </button>

      <button class="tray-btn" data-screen="items" aria-label="Items and collection">
        <svg class="tray-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
        </svg>
        <span class="tray-label">Items</span>
      </button>

      <button class="tray-btn" data-screen="skills" aria-label="Skill tree">
        <svg class="tray-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="3"/>
          <path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/>
        </svg>
        <span class="tray-label">Skills</span>
      </button>

      <button class="tray-btn" data-screen="upgrade" aria-label="Tool upgrades">
        <svg class="tray-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.77 3.77z"/>
        </svg>
        <span class="tray-label">Upgrade</span>
      </button>

      <button class="tray-btn" data-screen="menu" aria-label="Game menu">
        <svg class="tray-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
          <polyline points="17 21 17 13 7 13 7 21"/>
          <polyline points="7 3 7 8 15 8"/>
        </svg>
        <span class="tray-label">Menu</span>
      </button>
    `;
  }
}

customElements.define('ds-tray', DsTray);
