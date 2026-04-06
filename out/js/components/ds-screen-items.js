/* ============================================================
   DEEPSTRIKE — ds-screen-items.js
   Web component: <ds-screen-items>
   Renders the items / collections / milestones tabbed screen.
   collection.js targets #items-grid, #collection-sets,
   #milestones-list and .items-tab by ID/class — preserved here.
   ============================================================ */

'use strict';

class DsScreenItems extends HTMLElement {
  connectedCallback() {
    this.setAttribute('id', 'screen-items');
    this.setAttribute('class', 'screen');
    this.setAttribute('role', 'region');
    this.setAttribute('aria-label', 'Items and collection');
    this.render();
  }

  render() {
    this.innerHTML = `
      <div class="items-screen-inner">

        <!-- Tab bar -->
        <div class="items-tabs" role="tablist">
          <button class="items-tab active" data-tab="items" role="tab" aria-selected="true">Items</button>
          <button class="items-tab" data-tab="collections" role="tab" aria-selected="false">Collections</button>
          <button class="items-tab" data-tab="milestones" role="tab" aria-selected="false">Milestones</button>
        </div>

        <!-- Tab: Items grid -->
        <div id="tab-items" class="items-tab-panel active" role="tabpanel">
          <div id="items-grid" class="items-flat-grid"></div>
        </div>

        <!-- Tab: Collections / sets -->
        <div id="tab-collections" class="items-tab-panel" role="tabpanel">
          <div id="collection-sets" class="collection-sets"></div>
        </div>

        <!-- Tab: Milestones -->
        <div id="tab-milestones" class="items-tab-panel" role="tabpanel">
          <div id="milestones-list" class="milestones-list"></div>
        </div>

      </div>
    `;
  }
}

customElements.define('ds-screen-items', DsScreenItems);
