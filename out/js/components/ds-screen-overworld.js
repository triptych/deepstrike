/* ============================================================
   DEEPSTRIKE — ds-screen-overworld.js
   Web component: <ds-screen-overworld>
   Renders the overworld map screen with SVG map and action cards.
   Uses Light DOM; game.js's initOverworldScreen() wires events.
   ============================================================ */

'use strict';

class DsScreenOverworld extends HTMLElement {
  connectedCallback() {
    this.setAttribute('id', 'screen-overworld');
    this.setAttribute('class', 'screen');
    this.setAttribute('role', 'region');
    this.setAttribute('aria-label', 'Overworld map');
    this.render();
  }

  render() {
    this.innerHTML = `
      <div class="overworld-inner">

        <div class="overworld-title">
          <h1>DeepStrike</h1>
          <p>The Digger's Territory</p>
        </div>

        <!-- SVG Overworld Map -->
        <div class="map-container" role="img" aria-label="Territory map">
          <svg viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg">
            <!-- Parchment background -->
            <rect width="400" height="300" fill="#16130e"/>

            <!-- Ground horizon line -->
            <line x1="0" y1="200" x2="400" y2="200" stroke="#3d3326" stroke-width="1.5" stroke-dasharray="4 4"/>

            <!-- Underground gradient hint -->
            <defs>
              <linearGradient id="underground" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="#1a1510"/>
                <stop offset="100%" stop-color="#0e0c0a"/>
              </linearGradient>
              <radialGradient id="shaft-glow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stop-color="#7ab850" stop-opacity="0.3"/>
                <stop offset="100%" stop-color="#7ab850" stop-opacity="0"/>
              </radialGradient>
            </defs>
            <rect x="0" y="200" width="400" height="100" fill="url(#underground)"/>

            <!-- ── Buildings ─────────────────────────────────── -->

            <!-- Guild Hall (center) -->
            <g class="map-location" data-location="guild" role="button" aria-label="Guild Hall" tabindex="0">
              <rect x="155" y="130" width="90" height="60" rx="4" fill="#211c16" stroke="#574a38" stroke-width="1.5"/>
              <rect x="155" y="118" width="90" height="14" rx="2" fill="#2a2318" stroke="#574a38" stroke-width="1"/>
              <!-- Door -->
              <rect x="191" y="158" width="18" height="32" rx="2" fill="#16130e"/>
              <!-- Windows -->
              <rect x="163" y="138" width="14" height="10" rx="1" fill="#1a2010" stroke="#3d5020" stroke-width="0.5"/>
              <rect x="223" y="138" width="14" height="10" rx="1" fill="#1a2010" stroke="#3d5020" stroke-width="0.5"/>
              <!-- Chimney smoke (animated) -->
              <g opacity="0.6">
                <circle cx="175" cy="112" r="3" fill="#3d3326">
                  <animate attributeName="cy" values="112;106;112" dur="3s" repeatCount="indefinite"/>
                  <animate attributeName="opacity" values="0.6;0;0.6" dur="3s" repeatCount="indefinite"/>
                </circle>
                <circle cx="181" cy="109" r="2.5" fill="#3d3326">
                  <animate attributeName="cy" values="109;103;109" dur="3.5s" repeatCount="indefinite"/>
                  <animate attributeName="opacity" values="0.5;0;0.5" dur="3.5s" repeatCount="indefinite"/>
                </circle>
              </g>
              <!-- Label -->
              <text x="200" y="103" text-anchor="middle" fill="#7a6e5a" font-size="9" font-family="Georgia, serif" letter-spacing="1">GUILD HALL</text>
            </g>

            <!-- Mira's Stall (left) — locked until ch2 -->
            <g class="map-location locked" id="loc-mira" data-location="mira" role="button" aria-label="Mira's Stall (locked)" tabindex="0">
              <rect x="40" y="148" width="70" height="46" rx="4" fill="#211c16" stroke="#3d3326" stroke-width="1.5"/>
              <rect x="40" y="138" width="70" height="12" rx="2" fill="#2a2318" stroke="#3d3326" stroke-width="1"/>
              <text x="75" y="132" text-anchor="middle" fill="#4a3f30" font-size="8" font-family="Georgia, serif" letter-spacing="1">MIRA'S STALL</text>
            </g>

            <!-- Calla's Office (right) -->
            <g class="map-location locked" id="loc-calla" data-location="calla" role="button" aria-label="Calla's Office (locked)" tabindex="0">
              <rect x="290" y="138" width="72" height="54" rx="4" fill="#211c16" stroke="#3d3326" stroke-width="1.5"/>
              <text x="326" y="132" text-anchor="middle" fill="#4a3f30" font-size="8" font-family="Georgia, serif" letter-spacing="1">CALLA'S OFFICE</text>
            </g>

            <!-- Dex's Workshop (bottom left) — locked until ch5 -->
            <g class="map-location locked" id="loc-dex" data-location="dex" role="button" aria-label="Dex's Workshop (locked)" tabindex="0">
              <rect x="50" y="206" width="80" height="50" rx="4" fill="#1a1510" stroke="#3d3326" stroke-width="1.5"/>
              <text x="90" y="203" text-anchor="middle" fill="#4a3f30" font-size="8" font-family="Georgia, serif" letter-spacing="1">DEX'S WORKSHOP</text>
            </g>

            <!-- The Depot (bottom right) — locked until layer 3 -->
            <g class="map-location locked" id="loc-depot" data-location="depot" role="button" aria-label="The Depot (locked)" tabindex="0">
              <rect x="270" y="206" width="80" height="50" rx="4" fill="#1a1510" stroke="#3d3326" stroke-width="1.5"/>
              <text x="310" y="203" text-anchor="middle" fill="#4a3f30" font-size="8" font-family="Georgia, serif" letter-spacing="1">THE DEPOT</text>
            </g>

            <!-- ── Descent Shaft (always visible) ─────────────── -->
            <g id="btn-descend" class="map-location" data-location="descent" role="button" aria-label="Descent Shaft — enter dig layer" tabindex="0" style="cursor:pointer;">
              <!-- Shaft opening -->
              <ellipse cx="200" cy="218" rx="22" ry="10" fill="#0e0c0a" stroke="#7ab850" stroke-width="1.5"/>
              <rect x="178" y="218" width="44" height="30" fill="#0e0c0a"/>
              <ellipse cx="200" cy="248" rx="22" ry="8" fill="#111309"/>
              <!-- Glow -->
              <ellipse cx="200" cy="220" rx="28" ry="14" fill="url(#shaft-glow)">
                <animate attributeName="rx" values="28;34;28" dur="2.5s" repeatCount="indefinite"/>
                <animate attributeName="ry" values="14;18;14" dur="2.5s" repeatCount="indefinite"/>
              </ellipse>
              <!-- Down arrow -->
              <line x1="200" y1="224" x2="200" y2="240" stroke="#7ab850" stroke-width="2" stroke-linecap="round"/>
              <polyline points="194,235 200,242 206,235" fill="none" stroke="#7ab850" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <!-- Label -->
              <text x="200" y="262" text-anchor="middle" fill="#7ab850" font-size="9" font-family="Georgia, serif" letter-spacing="1.5">DESCENT SHAFT</text>
            </g>

            <!-- Path lines connecting buildings -->
            <line x1="110" y1="175" x2="155" y2="175" stroke="#3d3326" stroke-width="1" stroke-dasharray="3 3"/>
            <line x1="245" y1="175" x2="290" y2="175" stroke="#3d3326" stroke-width="1" stroke-dasharray="3 3"/>
            <line x1="200" y1="190" x2="200" y2="210" stroke="#3d3326" stroke-width="1" stroke-dasharray="3 3"/>

            <!-- Ground label -->
            <text x="16" y="196" fill="#3d3326" font-size="8" font-family="Georgia, serif" letter-spacing="1">SURFACE</text>
            <text x="16" y="216" fill="#3d3326" font-size="8" font-family="Georgia, serif" letter-spacing="1">▼ UNDERGROUND</text>
          </svg>
        </div>

        <!-- Quick actions -->
        <div class="overworld-actions">
          <button class="action-card primary" id="btn-descend-card" aria-label="Enter the descent shaft and begin digging">
            <svg class="card-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M12 2L8 8h3v6l-5 3 1 4h10l1-4-5-3V8h3z"/>
            </svg>
            <div>
              <div class="card-title">Descend</div>
              <div class="card-sub" id="card-layer-sub">Layer 1 · The Surface Crust</div>
            </div>
          </button>

          <button class="action-card" id="btn-goto-collection" aria-label="Open items and collection">
            <svg class="card-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
            </svg>
            <div>
              <div class="card-title">Collection</div>
              <div class="card-sub">0 items</div>
            </div>
          </button>

          <button class="action-card" id="btn-goto-skills" aria-label="Open skill tree">
            <svg class="card-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="3"/>
              <path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/>
            </svg>
            <div>
              <div class="card-title">Skills</div>
              <div class="card-sub">0 / — pts</div>
            </div>
          </button>

          <button class="action-card" id="btn-goto-upgrade" aria-label="Upgrade tools">
            <svg class="card-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.77 3.77z"/>
            </svg>
            <div>
              <div class="card-title">Upgrade</div>
              <div class="card-sub">Wooden Pick · Tier 1</div>
            </div>
          </button>
        </div>

      </div>
    `;
  }
}

customElements.define('ds-screen-overworld', DsScreenOverworld);
