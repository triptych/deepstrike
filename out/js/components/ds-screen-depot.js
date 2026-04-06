/* ============================================================
   DEEPSTRIKE — ds-screen-depot.js
   Web component: <ds-screen-depot>
   Renders the Depot screen shell.
   ailments.js's renderDepot() targets #depot-stock — preserved.
   ============================================================ */

'use strict';

class DsScreenDepot extends HTMLElement {
  connectedCallback() {
    this.setAttribute('id', 'screen-depot');
    this.setAttribute('class', 'screen');
    this.setAttribute('role', 'region');
    this.setAttribute('aria-label', 'The Depot');
    this.render();
  }

  render() {
    this.innerHTML = `
      <div class="depot-inner">

        <div class="screen-header">
          <h2>The Depot</h2>
          <p>Supplies &amp; remedies for the deep digger</p>
        </div>

        <div id="depot-stock"></div>

      </div>
    `;
  }
}

customElements.define('ds-screen-depot', DsScreenDepot);
