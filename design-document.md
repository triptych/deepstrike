# DEEPSTRIKE — Game Design Document
**Version:** 0.1 · Draft

| Platform | Genre | Input | Status |
|---|---|---|---|
| Mobile (Web) | Idle / Collector | Touch / Tap | Pre-Production |

---

## Table of Contents

1. [Game Overview](#1-game-overview)
2. [Core Loop](#2-core-loop)
3. [Narrative & Storyline](#3-narrative--storyline)
4. [Overworld Map](#4-overworld-map)
5. [Grid & Digging System](#5-grid--digging-system)
6. [Layer Progression](#6-layer-progression)
7. [Tools & Damage](#7-tools--damage)
8. [Item & Collection System](#8-item--collection-system)
9. [Status Ailments](#9-status-ailments)
10. [Skill Tree](#10-skill-tree)
11. [Progression & Economy](#11-progression--economy)
12. [UI & Mobile Design](#12-ui--mobile-design)
13. [Touch Controls](#13-touch-controls)
14. [Open Questions](#14-open-questions)

---

## 1. Game Overview

### Concept

**DeepStrike** is a mobile-first tap excavation game. The player digs through a series of underground layers by tapping grid cells — each cell representing a section of rock, earth, or buried artifact. The goal is to reach the bottom of each layer, unearth collectible items, and grow powerful enough to tackle deeper, more dangerous terrain.

The game blends the tactile satisfaction of incremental "tap to progress" games with the depth of a collector's meta-game and RPG-lite progression. No timers force the player to stop — deeper layers simply require better tools and skills.

### Design Pillars

> **Pillar 01 — Tactile Satisfaction**
> Every tap must feel impactful. Visual and haptic feedback on each strike. Cells crack, crumble, and shatter — not just disappear.

> **Pillar 02 — Collector's Drive**
> Items are the heart of the meta-game. Set completion, rarity hunting, and the "one more dig" pull of not-quite-finishing a set keeps players engaged between sessions.

> **Pillar 03 — Meaningful Progression**
> Skill tree choices and tool upgrades should feel like decisions, not just number increases. Each upgrade opens a new playstyle.

> **Pillar 04 — Mobile-First Controls**
> The grid must be navigable on a small screen. Pinch-to-zoom and pan are first-class interactions, not afterthoughts.

### Comparable Titles

| Title | What We Borrow | What We Differ |
|---|---|---|
| Minesweeper | Grid-tap mental model | No hidden-information guessing; progression-based |
| Minecraft Dungeons | Loot rarity and set bonuses | Turn-based tap, no real-time movement |
| Idle games (AdVenture Capitalist etc.) | "Numbers go up" satisfaction | Active play required; skill matters |
| Puzzle & Dragons | Combo/chaining upgrades | Simpler UI; single-axis depth progression |

---

## 2. Core Loop

The game has three nested loops that reinforce each other:

**Micro Loop (seconds)**
Tap cell → Deal damage → Cell breaks → Reveal contents → Collect item or advance.
Immediate tactile feedback. Fast and satisfying.

**Mid Loop (minutes)**
Clear a layer → Drop to next layer → Encounter new cell types → Manage status effects.
Each layer feels like a mini-level with its own challenge.

**Meta Loop (sessions)**
Collect items → Complete sets → Earn points → Upgrade tools / unlock skills → Return to dig deeper.
The long-term pull that brings players back across sessions.

---

## 3. Narrative & Storyline

### Overview

DeepStrike's story is told in **chapters** that unlock as the player descends through zone thresholds. Narrative is delivered through short dialogue exchanges, journal entries found in buried relics, and brief animated cutscenes at major milestones. The tone is warm, grounded, and lightly humorous — a coming-of-age story set underground.

---

### The Protagonist — Ren

**Ren** is a 17-year-old apprentice digger, the child of a veteran miner who disappeared somewhere below Layer 40 three years ago. Ren is scrappy, curious, and slightly reckless — equipped with a beaten wooden pick and a borrowed headlamp. They are not chosen or special. They just refuse to stop digging.

Ren's voice is present in the UI: brief internal monologue lines appear when discovering rare items, encountering new zones, or completing sets. These are small, characterful moments — not cutscenes, just a line of text with Ren's portrait icon.

---

### Chapter Structure

| Chapter | Trigger | Title | Story Beat |
|---|---|---|---|
| 1 | Start | **First Shift** | Ren arrives at the Digger's Guild, gets laughed at for their wooden pick. Foreman Calla assigns them the shallowest dig site. |
| 2 | Reach Layer 5 | **Something Glints** | Ren finds their first uncommon item — a copper fossil. Guild veteran Dex notices and begrudgingly offers advice. |
| 3 | Reach Layer 10 | **Deeper Reasons** | Ren discovers a journal fragment buried in a relic — their parent's handwriting. The descent becomes personal. |
| 4 | Complete first Set | **The Collector's Eye** | Ren meets Mira, an obsessive item trader who teaches them about set values. A rivalry/friendship begins. |
| 5 | Reach Layer 25 | **The Iron Seam** | A cave-in traps Dex in a side tunnel. Ren uses their skills to blast through and rescue him. Dex becomes a full ally. |
| 6 | First Legendary | **What the Deep Keeps** | The legendary item is engraved with a family crest. The mystery of the parent deepens. |
| 7 | Reach Layer 45 | **Into the Grottos** | The Crystal Grottos are beautiful and dangerous. Ren has a vision while touching a resonance node. |
| 8 | Reach Layer 65 | **The Magma Shelf** | Ren's pick is destroyed. Foreman Calla appears unexpectedly, offering the Enchanted Pick — and an explanation. |
| 9 | Reach Layer 66 | **The Void** | Ren reaches the Void Depths. A silhouette is visible far below. The final chapter begins. |

---

### Cast of Characters

#### Ren *(Player Character)*
Stubborn, perceptive, emotionally guarded. Communicates in dry one-liners when stressed. Has a habit of naming the items they find. Their arc is learning to accept help.

#### Foreman Calla
The Guild's veteran overseer. Weathered, no-nonsense, secretly protective of Ren. Knows more about Ren's parent than she lets on. Acts as a reluctant mentor. Appears at key story gates and milestone unlocks.

> *"You're still here. Thought you'd have quit by Layer 3. Most do."*

#### Dex (Deklan Morrow)
A mid-career digger in his 30s, cynical but skilled. Initially dismissive of Ren. After the cave-in rescue (Chapter 5), becomes Ren's closest ally. His specialization is the **Striker** tree — he teaches combat techniques.

> *"The rock doesn't care how hard you swing. Swing smarter."*

#### Mira
A young item dealer and obsessive collector who runs a stall near the Guild entrance. Cheerful, hypercompetent, slightly chaotic. She maintains a ledger of every known set and openly envies whoever is close to completing one she wants.

> *"Oh that's a Sable Fossil! Do you know what I would give for that? Actually — do you want to trade? I'll give you three commons and a coupon."*

#### The Silhouette *(Chapter 9)*
Only glimpsed. No dialogue. Identity withheld until Chapter 9 resolution.

---

### Narrative Delivery Principles

- Story never interrupts active digging — cutscenes and dialogue only trigger at **layer transitions** or **hub return**
- All story content is **skippable and replayable** via a "Journal" tab in the bottom tray
- Character portraits appear as small circular icons — no full-screen art required for MVP
- Relic journal fragments serve double duty: lore delivery *and* collectible item category
- Tone reference: the warmth of *Spiritfarer*, the wit of early *Stardew Valley* dialogue

---

## 4. Overworld Map

### Concept

Between dig sessions the player returns to the **Overworld** — a hand-drawn-style top-down map of the Digger's Guild territory. This is the hub layer that connects the social story, the Guild facilities, and the dig sites. It is navigated by tapping named locations, not by free movement.

The overworld is not a minigame — it is a **menu dressed as a world**. Every location on the map is a shortcut to a system (shop, skill tree, collection, etc.) wrapped in a sense of place.

---

### Map Layout

```
┌─────────────────────────────────────────────────────────┐
│  ☁  THE DIGGER'S TERRITORY  ☁                           │
│                                                         │
│   [Mira's Stall]    [The Guild Hall]    [Calla's Office] │
│         │                │                   │          │
│    ─────┴────────────────┴───────────────────┴────      │
│                    GUILD PLAZA                          │
│    ─────┬────────────────┬───────────────────┬────      │
│         │                │                   │          │
│  [Dex's Workshop]  [Descent Shaft]   [The Depot]        │
│                          │                              │
│               ▼▼▼ UNDERGROUND ▼▼▼                       │
└─────────────────────────────────────────────────────────┘
```

---

### Map Locations

| Location | Owner | Function | Unlocks |
|---|---|---|---|
| **Guild Hall** | Foreman Calla | Story dialogue, milestone tracking, chapter triggers | Start |
| **Mira's Stall** | Mira | Item viewer, set browser, item trading | Chapter 2 |
| **Dex's Workshop** | Dex | Tool upgrades, combo training mini-tips | Chapter 5 |
| **The Depot** | NPC (Harv) | Buy consumables (antidotes, vent tools), sell duplicates | Layer 3 |
| **Calla's Office** | Calla | Skill tree access, milestone rewards | Layer 10 |
| **Descent Shaft** | — | Enter the active dig layer | Always |
| **The Ruin Board** | — | Daily/weekly challenge board | Layer 15 |

---

### Map Progression

The map starts sparse — only the Descent Shaft and Guild Hall are visible. Locations **appear and animate in** as the player progresses through chapters:

- **Chapter 1:** Guild Hall + Descent Shaft visible
- **Chapter 2:** Mira's Stall fades in from the fog
- **Chapter 4:** The Depot opens (Harv arrives with a cart)
- **Chapter 5:** Dex's Workshop becomes active
- **Chapter 6+:** Calla's Office light turns on; she can be visited

This gives the map a sense of a town coming alive around Ren's growing reputation.

---

### Map Visual Style

The overworld uses a **parchment-and-ink** aesthetic — warm cream backgrounds, hand-drawn building outlines, soft drop shadows. It should feel like a map from an explorer's notebook. Key visual details:

- Buildings have small animated smoke/light tells (chimney smoke, lantern flicker) to indicate they're open
- Story-relevant NPCs show a **speech bubble indicator** when they have new dialogue
- The Descent Shaft pulses with a faint underground glow, deepening in color as the player descends further
- Weather/time-of-day cycles cosmetically (dawn light when starting a session, night lanterns after extended play)

---

## 5. Grid & Digging System

### Grid Structure

Each layer is represented as a 2D grid of cells. The grid size scales with layer depth:

| Layers | Grid Size | Notes |
|---|---|---|
| 1–5 | 8 × 8 | Tutorial density, sparse hazards |
| 6–15 | 12 × 12 | Standard play |
| 16–30 | 16 × 16 | Pan required on mobile |
| 31+ | 20 × 20 | Zoom required; dense hazards |

### Cell Types

Each cell has a **type**, a **durability** (HP), and optionally a **status modifier** or **buried item**.

| Cell Type | Durability | First Layer | Notes |
|---|---|---|---|
| Soil | 1–2 | 1 | Breaks in 1–2 hits; no drops usually |
| Rock | 4–8 | 3 | Common mineral drops |
| Dense Rock | 12–20 | 10 | Requires iron pickaxe or better |
| Ore Vein | 8–15 | 6 | Guaranteed item drop on break |
| Crystal Node | 20–30 | 15 | High-rarity drops; visual glow |
| Bedrock | Impassable | Varies | Blocks path; requires special skill |
| Hollow | 1 | 8 | Reveals hidden chamber (bonus grid) |

### Visual State of a Cell

Cells communicate their HP state through visual cracking stages — **4 visual stages** from intact to broken:

| Stage | HP Remaining | Visual |
|---|---|---|
| Intact | 100% | Solid texture |
| Cracked | ~75% | Fine cracks |
| Damaged | ~50% | Deep cracks, color shift |
| Critical | ~25% | Heavy fractures, glow |
| Broken | 0% | Destroyed, reveals drop |

Additional cell indicators:
- **Item cell** — subtle teal glow to signal it contains a collectible
- **Status cell** — warning icon/color tint visible before tapping

### Layer Completion Condition

A layer is considered cleared when **all non-Bedrock cells** have been broken. This reveals a *descent shaft* — a tap target that drops the player to the next layer. Bonus XP is awarded for clearing a layer without triggering any status ailments.

---

## 6. Layer Progression

### Depth & Theme

Layers are grouped into **zones**, each with a distinct visual theme, cell palette, hazards, and item pools:

| Layers | Zone Name | Element | Notes |
|---|---|---|---|
| 1–10 | The Surface Crust | Earth | Soil, loose rock, common minerals |
| 11–25 | The Iron Seam | Metal | Dense rock, ore veins, first traps |
| 26–45 | Crystal Grottos | Crystal | Crystal nodes, resonance hazards, rare drops |
| 46–65 | The Magma Shelf | Fire | Lava cells, exploding gems, fire immunity needed |
| 66+ | The Void Depths | Void | Corrupted cells, legendary-only drops, no recovery |

> **Design Note:** Zone transitions should be visually dramatic — a dust-settle animation, a palette shift, and a short zone-title splash. Players should feel like they've crossed a threshold.

---

## 7. Tools & Damage

### Tool Tiers

The player's primary tool is their **pickaxe**. Tool tier determines base damage and which cell types can be broken at all. Some cells are simply **impassable** to underpowered tools.

| Tier | Name | Base DMG | Can Break | Unlock Cost |
|---|---|---|---|---|
| 1 | Wooden Pick | 2 | Soil, Loose Rock | Starting tool |
| 2 | Stone Pick | 5 | + Rock | 50 pts |
| 3 | Iron Pick | 12 | + Dense Rock | 200 pts |
| 4 | Enchanted Pick | 25 | + Crystal Node | 600 pts |
| 5 | Void Drill | 60 | All types | 2000 pts + skill req. |

### Damage Formula

```
damage = (baseDamage + flatBonus) × multiplier × elementBonus
```

- `elementBonus` = **1.5×** if pickaxe element matches cell's weakness
- `elementBonus` = **0.75×** if it matches cell's resistance
- `multiplier` comes from active skills and combo chains

### Combo System

Tapping cells in quick succession builds a **combo meter**. At certain thresholds the multiplier increases temporarily:

| Combo Count | Multiplier | Visual |
|---|---|---|
| 1–4 | ×1.0 | Normal |
| 5–9 | ×1.25 | Subtle glow on pick |
| 10–19 | ×1.5 | Orange sparks |
| 20+ | ×2.0 | Pick ignites; screen edge glow |

The combo resets if the player pauses for more than **2 seconds** without tapping. Status ailments that stun or slow can break combos.

---

## 8. Item & Collection System

### Item Anatomy

Every item has four attributes that determine its identity and value:

| Attribute | Options | Effect on Gameplay |
|---|---|---|
| **Type** | Gem, Fossil, Relic, Mineral, Artifact | Determines which Sets it counts toward |
| **Element** | Fire, Earth, Water, Metal, Void, Crystal | Set bonuses; elemental synergies |
| **Rarity** | Common, Uncommon, Rare, Legendary | Point value; set bonus multiplier |
| **Color** | Red, Blue, Green, Gold, White, Black, Purple, Teal | Color-match bonuses; cosmetic display |

### Sets

Sets are predefined collections of items grouped by *type + element* or *type + color*. Completing a set awards a **set bonus** — a permanent passive buff and a one-time point award.

**Example Set — "Ember Gems"**
Requires: 5× Fire Gems of any rarity.
Reward: +10% damage to Fire-element cells permanently + 150 pts.

**Example Set — "The Void Trinity"**
Requires: 1× Legendary Gem + 1× Legendary Relic + 1× Legendary Artifact, all Void element.
Reward: Unlock Void Drill tool + 1000 pts.

The set screen should show **partial completion progress** at all times — the gap between what the player has and what they need is the core tension driver.

### Drop Rates

| Rarity | Base Drop Chance | Drops From |
|---|---|---|
| Common | 60% | Any broken cell |
| Uncommon | 25% | Rock+, Ore Veins |
| Rare | 12% | Crystal Nodes, Ore Veins |
| Legendary | 3% | Crystal Nodes, Void cells only |

Skills and set bonuses can modify these rates. A *Loot Sense* skill, for example, might reveal which cells contain items before they're broken.

---

## 9. Status Ailments

Some cells carry a hidden or visible **status modifier**. When the cell is struck for the first time (or broken), the ailment triggers on the player. Managing ailments is a core mid-loop challenge.

### ☠ Poison Rock
On strike, applies Poison: player's next 5 taps deal 50% reduced damage. Cured by striking a Crystal cell or using an Antidote skill.

### 💥 Explosive Gem
On break, deals AOE damage to 3×3 surrounding cells — both breaking them (bonus!) and consuming any items inside. High risk, high reward.

### ❄ Frost Crystal
On first strike, freezes the cell — it cannot be damaged again for 3 taps. The player must hit other cells first. Breaks combos.

### 👁 Cursed Relic
On break, temporarily reduces item drop rates by 30% for the remainder of the layer. Can be countered with the Cleanse skill.

### ⚡ Shock Ore
On strike, stuns adjacent cells — they visually flash and temporarily become immune to damage for 2 taps. Chain reactions possible.

### 🔥 Magma Pocket
On break, activates a short timer. Player must tap a "vent cell" (highlighted) within 3 seconds or lose their current combo and take a point penalty.

> **Design Note — Visibility:** Status cells should always be *visually indicated* before they're tapped — a shimmer, color tint, or icon. The player should be able to make informed decisions about tap order. "Unfair surprise" ailments erode trust; *known risk* ailments create strategy.

---

## 10. Skill Tree

### Structure

The skill tree has a single root node and branches into three distinct specializations. Players spend **skill points** (earned separately from upgrade points) to unlock nodes. Each branch rewards a different playstyle.

```
              ⛏ DEEP MINER (Root)
         ┌──────────┼──────────┐
    ⚔ STRIKER   🛡 WARDEN   ✦ SEEKER
  (Damage Tree) (Defense)  (Loot Tree)
```

### Branch Details

#### ⚔ Striker — Damage Tree
Focus: Maximize damage output and combo potential.

- **Heavy Strike** — +20% base damage
- **Combo Extender** — combo timeout increased to 3s
- **Seismic Tap** — every 10th tap deals 3× damage (AOE)
- **Elemental Infusion** — imbue pick with an element for 10 taps

#### 🛡 Warden — Defense Tree
Focus: Resist and manage status ailments.

- **Stone Skin** — Poison duration reduced by 2 taps
- **Defuse** — 30% chance to nullify Explosive Gem
- **Cleanse** — Active skill: remove all current ailments (cooldown)
- **Bedrock Sense** — Reveal all status cells before tapping

#### ✦ Seeker — Loot Tree
Focus: Improve loot quality and collection.

- **Loot Sense** — Cells with items glow faintly
- **Prospector** — +5% rare drop rate
- **Hoarder** — Duplicate items converted to points
- **Set Magnet** — If a set is 1 item short, +15% drop rate for that item

> **Hybrid Builds:** Players should be encouraged to mix branches. A Striker/Seeker hybrid (high combo + loot sense) is a valid and rewarding archetype. The tree should not penalize cross-branch investment beyond opportunity cost.

---

## 11. Progression & Economy

### Two-Currency System

| Currency | Source | Spent On |
|---|---|---|
| **Upgrade Points** | Set completions, layer clears, daily bonuses | Tool tier upgrades, flat damage/speed boosts |
| **Skill Points** | Level-up milestones, rare item discovery | Skill tree nodes only |

Separating currencies prevents players from ignoring one half of the progression system. Upgrade Points are common; Skill Points are scarce and meaningful.

### Milestone Rewards

| Milestone | Reward |
|---|---|
| Reach Layer 10 | +1 Skill Point + unlock Iron Seam zone music |
| First Legendary item | +50 Upgrade Points + Gallery badge |
| Complete 5 Sets | +2 Skill Points + unlock Skill Tree branch 2 |
| Reach Layer 25 | Stone Pick auto-upgrade offered free |
| Survive an Explosive Gem without losing items | +1 Skill Point |

---

## 12. UI & Mobile Design

### Screen Layout (Portrait)

The game is designed for **portrait orientation** on mobile. The screen is divided into three regions:

**Top Bar (10% of screen)**
Layer indicator, current combo meter, active status icons. Minimal — no obstruction.

**Grid Viewport (75% of screen)**
The zoomable, draggable grid. Touch-first controls. No buttons inside this region except the grid cells themselves.

**Bottom Tray (15% of screen)**
Persistent icons: Collection, Skill Tree, Tool. Tray slides up into a modal on tap. Does not cover the grid.

### Visual Hierarchy Priorities

At any moment the player's eye should land on: **(1) the cell they're about to tap**, **(2) the combo meter**, **(3) any active status warning**. Everything else is secondary. UI elements should dim slightly when the combo meter is active to focus attention on the grid.

### Accessibility

- Cell states must not rely on color alone — use both color and texture/pattern changes
- Status ailments must have both color and icon indicators
- Minimum tap target size: **44×44px** (Apple HIG standard)
- Consider a "large cell" option in settings for motor accessibility

---

## 13. Touch Controls

### Gestures

| Gesture | Action | Notes |
|---|---|---|
| Single tap | Strike cell | Core action; must feel snappy (<16ms response) |
| Pinch in/out | Zoom grid | Range: 0.5× – 3× of default; smooth interpolation |
| Two-finger drag | Pan grid | Inertia-based scrolling; snap to grid on release |
| Long press on cell | Inspect cell | Shows type, HP bar, any known status |
| Double tap | Auto-zoom to fit | Resets to default zoom level, centers grid |
| Swipe up (bottom tray) | Open menu | Collection, Skills, Upgrades |

### Implementation Notes

> **Critical — Tap vs Pan Disambiguation**
> The system must distinguish between a tap (strike) and the beginning of a pan gesture. Implement a **movement threshold**: if the touch moves >8px before release, treat as pan, not tap. This prevents accidental strikes while panning large grids.

> **Zoom State Persistence**
> Zoom level and pan position should persist when the player opens/closes the bottom tray or switches screens. Losing viewport position is frustrating on large grids.

---

## 14. Open Questions

The following design decisions are deferred for further iteration:

| # | Question | Options to Explore |
|---|---|---|
| 1 | Is there a stamina/energy system? | Unlimited taps (idle-style) vs. limited swings per session |
| 2 | Can layers be revisited? | Locked once descended vs. free re-entry to grind |
| 3 | Are there enemies or only hazard cells? | Animate hazards (mini-boss blocking a cell) adds complexity |
| 4 | Multiplayer or social features? | Shared leaderboards, co-op grid clearing, trading items |
| 5 | Monetization model? | Premium one-time, cosmetic IAP, or energy refill IAP |
| 6 | Procedural vs. designed layers? | Full procedural, hand-authored, or hybrid seeded templates |
| 7 | Daily/weekly challenges? | Special layer with modifier (all cells are status cells, etc.) |
| 8 | Item crafting? | Break down duplicates to synthesize missing set items |

---

*DeepStrike GDD · v0.1 · Draft · All systems subject to revision*
