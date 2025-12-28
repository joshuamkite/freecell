# FreeCell Solitaire

TypeScript/React FreeCell implementation with Microsoft's original RNG algorithm for reproducible deals (games 1-1,000,000).

## Features

- Microsoft FreeCell RNG: `seed = (seed * 214013 + 2531011) & 0x7FFFFFFF`
- Smart game number selector:
  - Green input indicates current game number
  - Black input when typing a different number
  - "Set Deal" button to apply selected game
  - "New Game" button to generate random game
  - 20-second auto-revert if deal not applied
- Click-to-move, drag-and-drop, double-click auto-move
- Auto-play: cards automatically move to foundations when safe
- Undo functionality
- SVG card images from Wikimedia Commons (Byron Knoll, public domain)
- Static deployment ready (S3/CloudFront)

## Tech Stack

React 18, TypeScript, Vite, Bun

## Setup

```bash
bun install
bun dev         # http://localhost:5173
bun run build   # outputs to dist/
```

## Project Structure

```
src/
├── components/      # Card, GameBoard
├── game/            # freecellLogic.ts (rules, state)
├── types/           # card.ts, gameState.ts
├── utils/           # freecellRng.ts (Microsoft RNG)
└── assets/cards/    # 54 SVG files

dev_tooling/download_cards/  # Go tool: downloads cards from Wikimedia
```

## Attribution

Card images: [Byron Knoll](https://commons.wikimedia.org/wiki/Category:Playing_cards_set_by_Byron_Knoll) via Wikimedia Commons (public domain)
