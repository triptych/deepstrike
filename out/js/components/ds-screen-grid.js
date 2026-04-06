/* ============================================================
   DEEPSTRIKE — ds-screen-grid.js
   Web component: <ds-screen-grid>
   Renders the dig grid screen shell.
   grid.js's GridRenderer targets #grid-canvas and #grid-viewport
   by ID — those IDs are preserved here in Light DOM.
   ============================================================ */

'use strict';

class DsScreenGrid extends HTMLElement {
  connectedCallback() {
    this.setAttribute('id', 'screen-grid');
    this.setAttribute('class', 'screen');
    this.setAttribute('role', 'region');
    this.setAttribute('aria-label', 'Dig grid');
    this.render();
  }

  render() {
    this.innerHTML = `
      <div class="grid-screen-inner">
        <div class="grid-info-bar">
          <span class="zone-name">The Surface Crust</span>
          <span class="layer-progress" aria-live="polite">0 / 0 cells</span>
        </div>

        <div id="grid-viewport" role="grid" aria-label="Excavation grid">
          <div id="grid-canvas"></div>
        </div>
      </div>
    `;
  }
}

customElements.define('ds-screen-grid', DsScreenGrid);
