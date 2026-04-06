# DeepStrike

A mobile-first, portrait-orientation digging game built with vanilla HTML, CSS, and JavaScript — no frameworks, no build tools, no dependencies.

## Running

Open `out/index.html` in a browser. No server required.

For the best experience, use a mobile device or browser dev tools in portrait mode (375px+).

---

## Player's Guide

### The Basics

Tap cells on the grid to break them. Each cell has HP — tap it enough times and it shatters. Clear every non-bedrock cell on a layer to reveal the Descent Shaft and drop to the next layer.

**Bedrock** (dark border, impassable) lines the edges of every layer. You cannot break it — dig around it.

---

### Cells

| Cell | HP | Notes |
|------|----|-------|
| Soil | 2 | Breaks in 1–2 hits. Common. |
| Loose Rock | 4 | Standard rock. |
| Ore Vein | 3 | Guaranteed item drop on break. |
| Dense Rock | 8 | Requires Iron Pick (Tier 3) or better. |
| Crystal Node | 5 | Item drop. Cures Poison on hit. Requires Iron Pick. |
| Hollow Pocket | 1 | Breaks in one tap. |
| Bedrock | ∞ | Impassable. |

Dense Rock and Crystal Nodes won't respond to weaker tools — you'll see a shake and "too tough" feedback. Upgrade your pick first.

---

### Status Ailments

Some cells carry a status modifier shown as a shimmer or overlay. Breaking them triggers an effect.

| Cell | Trigger | Effect |
|------|---------|--------|
| Poison Rock | On break | Damage ×0.25 for 5 taps. Cures if you hit a Crystal Node. |
| Shock Ore | On break | Your next tap deals zero damage. |
| Explosive Gem | On break | AOE burst — breaks all surrounding cells instantly. |
| Cursed Relic | On break | Drains 5 Upgrade Points. |
| Frost Crystal | On first strike | Cell freezes — cannot re-tap for 3 hits. |
| Magma Pocket | On first strike | 3-second vent timer appears. Break it in time or lose 10 pts. |

You can buy **Antidotes** at The Depot (unlocks at Layer 3) for 20 pts each. Using one cures all active ailments instantly. You can carry up to 5.

Status ailments only appear from Layer 2 onward, and the full set (including Magma) is not active until Layer 5+.

**Ailment-free clear bonus:** Finishing a layer without triggering any ailment awards +5 extra Upgrade Points on top of the standard 10.

---

### Combo Meter

Tapping cells rapidly builds a combo streak shown in the top bar. The meter resets if you pause for 2 seconds (3 seconds with the Combo Extender skill).

| Combo | Color |
|-------|-------|
| ×5 | Green |
| ×10 | Blue |
| ×20 | Gold |

Higher combos don't increase damage directly — that's what skills are for — but they interact with the Seismic Tap skill.

---

### Upgrade Points & Tools

Every cell you break earns **Upgrade Points (UP)**. Ore Veins and Crystal Nodes are worth more. Clearing a layer awards 10 pts (15 if ailment-free).

Spend UP at the **Workshop** (Upgrade screen) to buy better tools.

| Tier | Tool | Base DMG | Cost | Unlocks |
|------|------|----------|------|---------|
| 1 | Wooden Pick | 2 | — | Soil, Rock, Ore Vein |
| 2 | Stone Pick | 5 | 50 pts | — |
| 3 | Iron Pick | 9 | 150 pts | Dense Rock, Crystal Nodes |
| 4 | Enchanted Pick | 15 | 400 pts | — |
| 5 | Void Drill | 25 | 1000 pts | — |

You must buy tiers in order. Upgrade Points persist across layers.

---

### Items & Collection

Breaking Ore Veins and Crystal Nodes can drop items. Common items also drop from any cell at roughly 60% chance.

- The **Items** tab shows everything you've found.
- The **Collections** tab groups items into sets. Completing a set triggers a reward splash and unlocks a passive bonus.
- Undiscovered items show as silhouettes until found.

---

### Skill Points & The Skill Tree

**Skill Points (SP)** are rare. You earn 1 SP every 5 layers cleared.

Spend SP in the **Skills** screen to unlock abilities across three branches. Each branch has 4 tiers — you must unlock earlier tiers before later ones.

#### Striker — offense
| Tier | Skill | Cost | Effect |
|------|-------|------|--------|
| 1 | Heavy Strike | 1 SP | +3 flat damage per tap |
| 2 | Combo Extender | 2 SP | Combo reset timer extends to 3s |
| 3 | Seismic Tap | 3 SP | Every 10th combo tap breaks adjacent cells |
| 4 | Elemental Infusion | 4 SP | ×1.2 damage multiplier |

#### Warden — defense & ailment management
| Tier | Skill | Cost | Effect |
|------|-------|------|--------|
| 1 | Stone Skin | 1 SP | Poison damage penalty reduced to ×0.5 |
| 2 | Defuse | 2 SP | Explosive AOE only hits direct (non-diagonal) neighbors |
| 3 | Cleanse | 3 SP | Active ability: cure all ailments (30s cooldown) |
| 4 | Bedrock Sense | 4 SP | Bedrock cells glow faintly |

**Cleanse** adds a 🌿 button to the top bar. Tap it to instantly cure all active ailments. It goes on a 30-second cooldown after use.

#### Seeker — loot & economy
| Tier | Skill | Cost | Effect |
|------|-------|------|--------|
| 1 | Loot Sense | 1 SP | Item-containing cells (Ore Vein, Crystal) glow faintly |
| 2 | Prospector | 2 SP | +1 bonus UP per Ore Vein broken |
| 3 | Hoarder | 3 SP | Duplicate item drops convert to +2 UP |
| 4 | Set Magnet | 4 SP | Completing a collection set awards +1 SP |

---

### Zones

The deeper you go, the harder (and stranger) the rock.

| Layers | Zone | Notes |
|--------|------|-------|
| 1–10 | Surface Crust | Mostly soil and loose rock |
| 11–25 | Iron Seam | Dense Rock appears |
| 26–45 | Crystal Grottos | Crystal Nodes common |
| 46–65 | Magma Shelf | Magma Pockets frequent |
| 66+ | Void Depths | Corrupted cells, legendary drops |

---

### Saving

Your game saves automatically on every meaningful action. Use the **Menu** screen to manually save, load, or start a new game.

---

## Project Structure

```
deepstrike/
├── out/
│   ├── index.html        # Single-page app entry point
│   ├── css/
│   │   ├── style.css     # Design system, layout, zone themes
│   │   └── grid.css      # Grid and cell rendering
│   ├── js/
│   │   ├── game.js       # App shell, router, event bus, state
│   │   ├── grid.js       # Grid state, cell types, damage
│   │   ├── tools.js      # Tool tiers, damage formula
│   │   ├── items.js      # Item definitions, drop logic
│   │   ├── collection.js # Inventory, set completion
│   │   ├── ailments.js   # Status ailment state machine
│   │   └── skills.js     # Skill tree, passive hooks
│   └── items.json        # Item data
├── design-document.md
└── plan.md               # Phased implementation roadmap
```

All game state lives in a single `GameState` object, serialized to `localStorage` on every change. Events flow through a pub/sub bus (`Bus`) in `game.js`.

See [plan.md](plan.md) for the full implementation roadmap.

## License

MIT — see [LICENSE.md](LICENSE.md).
