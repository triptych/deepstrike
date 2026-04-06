/* ============================================================
   DEEPSTRIKE — ds-screen-skills.js
   Web component: <ds-screen-skills>
   Renders the skill tree screen shell.
   skills.js targets #skill-tree-dynamic and .sp-value — preserved.
   ============================================================ */

'use strict';

class DsScreenSkills extends HTMLElement {
  connectedCallback() {
    this.setAttribute('id', 'screen-skills');
    this.setAttribute('class', 'screen');
    this.setAttribute('role', 'region');
    this.setAttribute('aria-label', 'Skill tree');
    this.render();
  }

  render() {
    this.innerHTML = `
      <div class="skills-inner">

        <div class="screen-header">
          <h2>Skill Tree</h2>
          <p>Spend Skill Points to unlock new abilities</p>
        </div>

        <div class="skill-points-bar">
          <span class="sp-label">Skill Points Available</span>
          <span class="sp-value">0</span>
        </div>

        <div id="skill-tree-dynamic" class="skill-tree-dynamic" role="region" aria-label="Skill tree"></div>

      </div>
    `;
  }
}

customElements.define('ds-screen-skills', DsScreenSkills);
