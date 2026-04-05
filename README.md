# DeepStrike

A mobile-first, portrait-orientation digging game built with vanilla HTML, CSS, and JavaScript — no frameworks, no build tools, no dependencies.

## Gameplay

Tap cells on a layered grid to break through the earth. Dig deeper to unlock new zones, earn upgrade points, collect items, and build your skill tree. Manage status ailments, combo streaks, and tool upgrades as you descend through 66+ layers.

## Zones

| Layers | Zone |
|--------|------|
| 1–10 | Surface Crust |
| 11–25 | Iron Seam |
| 26–45 | Crystal Grottos |
| 46–65 | Magma Shelf |
| 66+ | Void Depths |

## Running

Open `index.html` in a browser. No server required.

For the best experience, use a mobile device or browser dev tools in portrait mode (375px+).

## Project Structure

```
deepstrike/
├── index.html        # Single-page app entry point
├── style.css         # Design system, layout, zone themes
├── game.js           # App shell, router, event bus, game state
├── items.json        # Item definitions and rarity data
├── design-document.md
└── plan.md           # Phased implementation roadmap
```

## Development

All game state lives in a single `window.GameState` object, serialized to `localStorage` on every meaningful change. Events flow through a simple pub/sub bus in `game.js`.

See [plan.md](plan.md) for the full phased implementation roadmap.

## License

MIT — see [LICENSE.md](LICENSE.md).
