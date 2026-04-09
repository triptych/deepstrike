# DEEPSTRIKE — Implementation Plan

**Constraints:** Vanilla HTML, CSS, JS, SVG only — no frameworks, no build tools, no dependencies.
**Target:** Mobile-first, portrait orientation, touch-friendly.

---

## Phase 1 — Scaffolding & Shell

**Goal:** A working single-page app skeleton with navigation between screens. No gameplay yet — just structure.

### Deliverables
- `index.html` — single entry point, all screens live here as hidden `<section>` elements
- `style.css` — CSS custom properties for the design system (colors, spacing, fonts), portrait layout, bottom tray
- `game.js` — app shell: screen router, event bus, basic state object
- Basic screens present but empty:
  - Overworld Map (start screen)
  - Grid View (placeholder 8×8 grid, no interaction)
  - Collection screen (empty)
  - Skill Tree screen (empty)

### Acceptance Criteria
- App loads on mobile without horizontal scroll
- Bottom tray visible and tappable; tapping icons switches active screen
- CSS variables define the full color palette (zone themes, rarity colors, UI chrome)
- Tap targets meet 44×44px minimum

---

## Phase 2 — Grid & Digging Core

**Goal:** A functional dig grid. Player can tap cells, they take damage, and break. No items or progression yet.

### Deliverables
- `grid.js` — grid state manager: cell types, HP, visual stage calculation
- `grid.css` — cell rendering with 4 crack stages (CSS classes + SVG crack overlays)
- Tap handler with pan/tap disambiguation (>8px movement threshold)
- Pinch-to-zoom and two-finger pan on the grid
- Combo meter: tap streak counter, 2s reset timer, visual indicator in top bar
- Cell HP bar on long-press inspect
- Layer clear detection (all non-Bedrock cells broken → descent shaft appears)
- Layer 1–5 cell types: Soil, Rock, Ore Vein

### Acceptance Criteria
- Tapping a Soil cell breaks it in 1–2 hits with visual feedback
- Panning a large grid does not accidentally trigger taps
- Combo meter increments on rapid taps and resets on pause
- Clearing all cells reveals a "Descend" tap target

---

## Phase 3 — Items, Drops & Collection

**Goal:** Cells drop items. Player has an inventory. Collection screen shows set progress.

### Deliverables
- `items.js` — item definitions loader (reads from `items.json`), drop roll logic using rarity weights
- Item pickup animation: item floats up from broken cell, lands in tray icon
- `collection.js` — inventory state, set completion checker
- Collection screen: item grid grouped by set, partial-completion progress bars
- Set completion triggers passive bonus (stored in game state, not yet applied to gameplay)
- Rarity colors and icons defined in CSS/SVG

### Acceptance Criteria
- Breaking an Ore Vein has a guaranteed item drop
- Common items drop at ~60% from any cell
- Collection screen shows all discovered items; undiscovered slots show silhouettes
- Completing a set shows a reward splash

---

## Phase 4 — Tools & Damage Formula

**Goal:** Full damage system. Tool upgrades purchasable with points. Elemental bonuses active.

### Deliverables
- `tools.js` — tool tier definitions, damage formula implementation
- Tool upgrade UI in bottom tray (Dex's Workshop screen — simplified for now)
- Upgrade Points currency: earned on cell break and layer clear, displayed in top bar
- Dense Rock and Crystal Node cell types added (require Iron Pick or better)
- Bedrock cell type: impassable, renders differently
- Points awarded for layer clear; bonus for ailment-free clear

### Acceptance Criteria
- Wooden Pick cannot damage Dense Rock (visual shake + "too tough" feedback)
- Purchasing Stone Pick unlocks Rock breakage
- Damage formula `(base + flat) × multiplier × element` fires correctly
- Upgrade Points persist across layers (stored in localStorage)

---

## Phase 5 — Status Ailments

**Goal:** Cells carry status modifiers. Player must manage ailments mid-dig.

### Deliverables
- `ailments.js` — ailment state machine: apply, tick, cure logic
- All 6 ailments implemented:
  - Poison Rock, Explosive Gem, Frost Crystal, Cursed Relic, Shock Ore, Magma Pocket
- Status cells visually indicated before tapping (shimmer, icon overlay via SVG)
- Active ailment icons in top bar
- Vent cell mechanic for Magma Pocket (3-second highlight + timer)
- Antidote consumable purchasable at The Depot (stub screen)

### Acceptance Criteria
- Poison applies reduced damage for 5 taps; cures on Crystal cell hit
- Explosive Gem AOE breaks surrounding cells and logs item consumption
- Frost Crystal blocks re-tapping for 3 taps
- Magma Pocket vent timer displays and penalizes on timeout

---

## Phase 6 — Skill Tree

**Goal:** Three-branch skill tree unlockable with Skill Points. Skills actively modify gameplay.

### Deliverables
- `skills.js` — skill registry, unlock checker, passive application hooks
- Skill tree screen: SVG-rendered tree with three branches (Striker, Warden, Seeker)
- Skill Points currency: scarce, earned at milestones
- All 12 skills implemented as passive modifiers or active abilities:
  - Striker: Heavy Strike, Combo Extender, Seismic Tap, Elemental Infusion
  - Warden: Stone Skin, Defuse, Cleanse, Bedrock Sense
  - Seeker: Loot Sense, Prospector, Hoarder, Set Magnet
- Skills persist in localStorage

### Acceptance Criteria
- Skill tree renders correctly on mobile without overflow
- Unlocking Heavy Strike increases damage on next dig
- Cleanse removes all active ailments when tapped (with cooldown indicator)
- Loot Sense adds a faint glow to item-containing cells

---

## Phase 7 — Layer Progression & Zones

**Goal:** Multiple zone themes, full 66+ layer depth, zone transition animations.

### Deliverables
- Zone definitions: Surface Crust (1–10), Iron Seam (11–25), Crystal Grottos (26–45), Magma Shelf (46–65), Void Depths (66+)
- CSS theme switching on zone entry: color palette swap via CSS custom property overrides
- Zone transition: dust-settle animation, palette shift, zone-title splash (CSS animation)
- Grid size scaling: 8×8 → 12×12 → 16×16 → 20×20 with zoom-to-fit on entry
- Layer state persists: returning to overworld preserves layer progress
- Void Depths cell type: corrupted cells, legendary-only drops

### Acceptance Criteria
- Entering Layer 11 triggers Iron Seam palette and splash
- 20×20 grid is navigable via pinch/pan on a 375px-wide screen
- Zone-specific cell types appear at correct layer thresholds

---

## Phase 8 — Overworld Map & Narrative

**Goal:** Overworld hub screen. Characters unlock as player progresses. Chapter story beats fire.

### Deliverables
- Overworld map rendered as SVG with parchment aesthetic
- Location tap targets: Guild Hall, Mira's Stall, Dex's Workshop, The Depot, Calla's Office, Descent Shaft
- Fog-of-war reveal: locations animate in at chapter thresholds
- `story.js` — chapter trigger checker, dialogue display
- Character dialogue system: portrait icon + text bubble overlay, skippable
- Journal tab in bottom tray: replayable story entries
- NPC speech bubble indicator on overworld when new dialogue is available

### Acceptance Criteria
- New game shows only Guild Hall + Descent Shaft
- Mira's Stall fades in after reaching Layer 5 / Chapter 2
- Tapping Guild Hall plays Chapter 1 dialogue
- Journal tab shows all previously seen story entries

---

## Phase 9 — Polish & Accessibility

**Goal:** Visual feedback, haptics, accessibility compliance, and QoL pass.

### Deliverables
- Haptic feedback on cell break via `navigator.vibrate()` (where supported)
- Cell break particle effect (CSS/SVG keyframe animation)
- Item pickup float animation
- Combo ignite effect at ×2.0 (SVG fire overlay, screen edge glow via CSS box-shadow)
- Accessibility: dual-indicator (color + texture) for all cell states
- "Large cell" display option in settings
- Settings screen: large cell toggle, haptics toggle, sound placeholder toggle
- Milestone reward splashes for all milestones in §11
- localStorage save/load for all persistent state

### Acceptance Criteria
- All cell states distinguishable without color (WCAG AA for patterns)
- Tap targets verified at 44×44px minimum on 375px screen
- Save/load round-trips correctly on page refresh

---

## Phase 10 — Daily Challenges & Economy Tuning

**Goal:** End-game loop hooks, economy balance, and the Ruin Board.

### Deliverables
- Ruin Board screen (unlocks Layer 15): daily/weekly special layers
- Daily challenge: modifier-tagged layer (e.g. all status cells, combo-only damage)
- Challenge completion rewards: bonus Upgrade Points, exclusive cosmetic item
- Economy tuning pass: calibrate point costs against progression speed from playtesting data
- Duplicate item → points conversion (Hoarder skill prerequisite behavior even without skill)
- Item trading stub at Mira's Stall (offer duplicates, receive a random item of same rarity)

### Acceptance Criteria
- Ruin Board shows a daily challenge distinct from normal layers
- Completing a daily challenge awards bonus points
- Trading 3 commons at Mira's gives 1 random common/uncommon

---

## Known Gaps (as of Phase 7)

These are incomplete items that must be resolved before the game is shippable.

### Overworld locations not unlockable
- Mira's Stall, Calla's Office, and Dex's Workshop are permanently locked — no unlock logic is wired to chapter or layer thresholds (Phase 8 work)

---

## State Architecture (cross-phase)

All game state lives in a single `window.GameState` object and is serialized to `localStorage` on every meaningful change.

```
GameState {
  player: { toolTier, upgradePoints, skillPoints, unlockedSkills[] }
  world:  { currentLayer, clearedLayers[], zoneTheme }
  grid:   { cells[][], layerSeed }
  inventory: { items{}, sets{} }
  story:  { chapter, seenDialogue[] }
  settings: { largeCell, haptics }
}
```

Events flow through a simple pub/sub bus (`game.js`):
`emit(event, data)` / `on(event, handler)` — no framework needed.

---

## File Map (end state)

```
deepstrike/
├── index.html
├── style.css
├── game.js          # app shell, router, event bus, state
├── grid.js          # grid state, cell types, damage
├── items.js         # item definitions, drop logic
├── tools.js         # tool tiers, damage formula
├── ailments.js      # ailment state machine
├── skills.js        # skill registry & effects
├── story.js         # chapter triggers, dialogue
├── collection.js    # inventory, set checker
├── items.json       # item data (existing)
├── design-document.md
└── plan.md
```

---

*DeepStrike Plan · v0.3 · Phases 1–7 complete. Phases 8–10 + known gaps remaining.*
