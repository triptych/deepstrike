# Changelog

All notable changes to DeepStrike will be documented here.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

---

## [Unreleased]

### Planned
- Phase 4: Tools & Damage Formula
- Phase 5: Status Ailments
- Phase 6: Skill Tree
- Phase 7: Layer Progression & Zones
- Phase 8: Overworld Map & Narrative
- Phase 9: Polish & Accessibility
- Phase 10: Daily Challenges & Economy Tuning

---

## [0.2.0] — 2026-04-04

### Added — Phase 3: Items, Drops & Collection

- `items.js` — item registry loader (reads `items.json`), weighted drop-roll logic per cell type
  - Ore Vein: guaranteed drop, weighted by rarity
  - Soil / Rock: probabilistic drops (~67% total chance, rarity cascade)
- `collection.js` — inventory state manager and collection screen renderer
  - `addItem`, `getCount`, `totalItems` inventory API
  - Set completion checker; fires `set:completed` event
  - Set passive reward stored to `inventory.rewards` in game state
  - Set completion splash overlay with "Claim Reward" dismiss
- Items screen with two tabs — **Items** (flat discovered-item grid) and **Collections** (sets with progress bars)
  - Tab state resets to Items on each screen open
  - Flat grid shows only discovered items with rarity-colored borders and stack counts
  - Collections tab: items grouped by set with element badge, progress bar, partial silhouette slots
- Item pickup float animation — emoji arcs from broken cell toward the Items tray icon, tray flashes on arrival
- `inventory:changed` bus event keeps the overworld Collection badge count up to date
- Added `dense_rock`, `crystal`, and `hollow` cell type definitions to `grid.js` (preparation for Phase 4)
- `inventory.rewards` added to GameState defaults

---

## [0.1.1] — 2026-04-04

### Changed
- Restructured project: web files moved into `out/` directory
- JS files (`game.js`, `grid.js`) moved to `out/js/`
- CSS files (`style.css`, `grid.css`) moved to `out/css/`
- `index.html`, `item-viewer.html`, `items.json` moved to `out/`
- Updated asset references in `index.html` to reflect new paths

---

## [0.1.0] — 2026-04-04

### Added
- Phase 1 scaffolding: `index.html`, `style.css`, `game.js`
- Single-page app shell with screen router and event bus
- Bottom tray navigation (Overworld, Grid, Collection, Skill Tree)
- CSS design system: custom properties for colors, spacing, zone themes
- Mobile-first portrait layout; tap targets meet 44×44px minimum
- `items.json` item definitions with rarity data
- `design-document.md` and `plan.md` implementation roadmap
