# Changelog

All notable changes to DeepStrike will be documented here.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

---

## [Unreleased]

### Planned
- Phase 7: Layer Progression & Zones
- Phase 8: Overworld Map & Narrative
- Phase 9: Polish & Accessibility
- Phase 10: Daily Challenges & Economy Tuning

---

## [0.6.0] — 2026-04-06

### Refactor — Web Components

- **index.html** refactored from a 515-line monolithic shell into a 60-line declarative document using custom HTML elements
- **9 web components** added under `out/js/components/`, each owning its template and preserving all existing IDs and class names:
  - `<ds-topbar>` — layer badge, combo meter, status icons, upgrade points display
  - `<ds-tray>` — bottom navigation tray with 6 screen buttons
  - `<ds-screen-overworld>` — SVG territory map and overworld action cards
  - `<ds-screen-grid>` — dig grid viewport and info bar
  - `<ds-screen-items>` — items / collections / milestones tabbed screen
  - `<ds-screen-skills>` — skill tree screen with SP bar
  - `<ds-screen-upgrade>` — Workshop tool upgrade screen
  - `<ds-screen-depot>` — The Depot consumables screen
  - `<ds-screen-menu>` — save / load / new game menu with about section
- All components use **Light DOM** (no Shadow DOM) so existing CSS rules and JS `querySelector` calls continue to work without modification
- Component scripts load in `<head>` (synchronous) so `connectedCallback` fires during HTML parsing before `DOMContentLoaded` — no timing changes to `boot()`
- Zero changes to any existing JS module (`game.js`, `grid.js`, `tools.js`, `items.js`, `collection.js`, `ailments.js`, `skills.js`) or CSS files

---

## [0.5.0] — 2026-04-05

### Added — Phase 5: Status Ailments

- **ailments.js** — full ailment state machine with apply, tick, cure and antidote logic
- **6 status ailments** — each cell type can carry one of: Poison, Explosive, Frost, Cursed, Shock, Magma
  - **Poison Rock** — breaks apply Poisoned debuff (×0.25 damage for 5 taps); cures on Crystal hit
  - **Explosive Gem** — AOE burst breaks all 8 surrounding cells on destruction; no item drops from AOE cells (item consumption logged)
  - **Frost Crystal** — first hit freezes the cell; cannot re-tap for 3 further hits
  - **Cursed Relic** — drains 5 Upgrade Points on break
  - **Shock Ore** — breaks apply Shocked debuff; next tap deals 0 damage (stun)
  - **Magma Pocket** — first hit starts a 3-second vent timer; cell pulses red with countdown; failing to break in time costs 10 pts
- **Status cell visuals** — each status type renders a shimmer glow and icon overlay (`data-status` CSS attribute + `::after` emoji) before the cell is broken
- **Active ailment icons** in topbar status bar (Poisoned ☠ / Shocked ⚡)
- **The Depot stub screen** — navigable from the overworld map (unlocks at Layer 3); sells Antidote consumable (20 pts, max 5) that cures all active ailments
- **Ailment-free clear bonus** — layer clear awards 15 pts (instead of 10) when no ailments triggered; toast notification
- **Frozen / Stunned visual labels** float up from the tapped cell
- Status cells gradually introduced: Poison + Frost from Layer 2, Shock + Explosive from Layer 3, Cursed from Layer 4, Magma from Layer 5; Layer 1 is status-free (tutorial)
- Damage formula (`Tools.damage()`) now applies `Ailments.damageMultiplier()` for poison/shock
- Chain-explosion guard: AOE-broken explosive cells do not re-trigger further AOE bursts

---

## [0.3.4] — 2026-04-05

### Added
- Pickaxe swing and rock-chip particles now scale with the grid zoom level — SVG dimensions, position offsets, particle size and travel distance all multiply by the current `scale` value so effects match the zoomed cell size

### Fixed
- Overworld "Upgrade" action card icon now updates to the current tool's emoji after each purchase — previously the static wrench SVG never changed

---

## [0.3.3] — 2026-04-05

### Added
- Workshop "next upgrade" card now shows a native `<progress>` bar with current pts vs. cost, so players can see exactly how close they are to affording the next tool tier

### Fixed
- Pickaxe animation pivot was still at the head after the 180° SVG flip, making the handle strike the cell — `transform-origin` changed to `bottom center` and keyframes shifted to 140°→179° so the head correctly arcs through the cell on impact; element repositioned to `cy-96` to keep the grip anchor at the same screen position

---

## [0.3.2] — 2026-04-05

### Fixed
- Returning to a cleared grid layer (after visiting collection or another screen) no longer shows an empty grid with no way to descend — `start()` now restores the descent shaft if all breakable cells are already broken
- Multiple milestones earned in the same pass no longer stack their toast notifications — toasts are queued and shown one at a time, each waiting 3.4 s before the next appears

---

## [0.3.1] — 2026-04-05

### Fixed
- Pickaxe swing animation was rendering upside-down — SVG content now wrapped in `rotate(180,20,20)` so the head points down into the cell on each tap

---

## [0.3.0] — 2026-04-05

### Added — Phase 4: Tools & Damage Formula

- `tools.js` — tool tier registry and damage formula module
  - Five tool tiers: Wooden Pick (T1) → Stone Pick (T2) → Iron Pick (T3) → Enchanted Pick (T4) → Void Drill (T5)
  - Damage formula `(base + flat) × multiplier × element` — flat/multiplier/element are placeholders for Phase 5 & 6 expansion
  - `Tools.canStrike(cellType)` — returns false if current tier is below the cell's minimum requirement
  - `Tools.damage()` — computes damage from current tool's base stat
- **Dense Rock** and **Crystal Node** cell types are now live in the iron zone distribution (layers 6+); both require Iron Pick (T3) or better
- **Upgrade Points (UP) economy** — points awarded automatically on every cell break:
  - Soil / Hollow: 1 UP · Rock / Ore Vein: 2–3 UP · Dense Rock: 4 UP · Crystal: 5 UP
  - Layer clear: 15 UP bonus (10 base + 5 ailment-free; Phase 5 will gate the 5-pt bonus)
- **Workshop screen** — upgrade screen now dynamically rendered by `tools.js`:
  - All five tiers shown with name, base damage, description, and tier-dot indicator
  - Current tier highlighted; next purchasable tier shows cost and "Upgrade" button
  - Insufficient-points state shows the gap ("Need X more pts")
  - Future tiers dimmed and locked
  - Screen re-renders whenever navigated to, keeping points and ownership in sync
- **"Too Tough!" feedback** — tapping a Dense Rock or Crystal Node below the required tier shows a floating label and cell shake
- Overworld "Upgrade" action card subtitle updates to reflect the currently equipped tool

### Changed
- `grid.js` `strike()` no longer accepts a `damage` argument — damage is always sourced from `Tools.damage()` ensuring formula consistency
- Iron zone cell distribution updated: Dense Rock (18 wt) and Crystal Node (7 wt) added; Soil reduced to 25 wt
- `game.js` — duplicate `_refreshPointsDisplay` listeners removed; `tools.js` now owns all points-display synchronisation including milestone and backfill events
- Script load order in `index.html`: `tools.js` inserted between `game.js` and `grid.js` so `Tools` is defined before the grid module runs

---

## [0.2.1] — 2026-04-05

### Added — Milestones System

- **Milestones tab** added to the Items screen (third tab alongside Items and Collections)
- Six milestone categories tracked automatically as items are collected:
  - **Stack** — collect N copies of the same single item (×5, ×10, ×25, ×50, ×100)
  - **Type hoarder** — accumulate N total items of a type (gem, fossil, relic, mineral, artifact)
  - **Element attunement** — accumulate N total items of an element (fire, earth, water, metal, void, crystal)
  - **Rarity hoarder** — accumulate N total items of a rarity tier
  - **Completionist** — discover every item of a given rarity (common / uncommon / rare / legendary)
  - **Discoveries** — reach N unique items discovered (1, 5, 10, 25, 50, 100)
- Milestones panel only shows groups where progress has begun (no spoilers for untouched categories)
- Progress bar shown for each in-progress milestone; earned milestones show a filled badge
- Toast notification animates in from the top when a milestone is newly unlocked
- Earned milestones persisted to `inventory.milestones` in game state

### Changed
- Milestone rewards: each milestone now grants upgrade points (UP) or skill points (SP) on first completion — stack milestones reward UP at low tiers and SP at high tiers; completionist and discovery milestones reward SP
- Reward amount shown on each milestone row and in the unlock toast
- Topbar upgrade-point counter updates immediately when a milestone reward is granted
- `inventory:changed` bus listener consolidated — set-completion and milestone checks now run in a single `Items.ready` callback instead of two
- `_milestoneProgress` accepts a pre-fetched `allItems` array to avoid repeated `.slice()` allocations per milestone def
- Render pass caches progress values computed during the visibility filter, eliminating redundant recalculations

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
