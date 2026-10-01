# FreeCell Card Game - Agent Guide

## Project Overview
This is a TypeScript React implementation of the classic FreeCell solitaire card game. The game runs entirely client-side and is designed to be deployed to AWS S3/CloudFront as a static website.

## Technology Stack
- **Framework**: React 19 with TypeScript
- **Build Tool**: Vite
- **Package Manager**: Bun
- **Lint/Format**: Biome
- **Tests**: Vitest
- **Deployment Target**: AWS S3 + CloudFront

## Project Structure
```
/frontend/src
  /components      - React components (Card, GameBoard, etc.)
  /game           - Game logic, state management, and rules
  /utils          - Utility functions (RNG, shuffling, etc.)
  /assets         - Card images from Wikimedia Commons
  /types          - TypeScript type definitions
/dev_tooling      - Card image downloader and deal checker (test-canonical.ts)
/terraform        - AWS S3 + CloudFront infrastructure
```

## Key Features
1. **Microsoft FreeCell RNG Algorithm**: Uses seeded random number generator for reproducible deals (games numbered 1-1,000,000)
2. **Smart Game Number Selector**:
   - Visual feedback: green background when number matches current game, black when typing different number
   - Dynamic button: "New Game" generates random game, "Set Deal" applies selected game number
   - 20-second auto-revert timer if deal not applied after changing number
3. **Card Images**: SVG card images from Wikimedia Commons
4. **Game Mechanics**: Full FreeCell rules implementation
5. **UI Interaction**: Drag-and-drop or click-to-move card interaction
6. **Auto-play**: Cards automatically move to foundations when safe
7. **Undo System**: Full move history with undo functionality
8. **Win Detection**: Automatic detection when game is won

## Development Commands
Run from the `frontend` directory:
- `bun install` - Install dependencies
- `bun dev` - Start development server
- `bun run build` - Typecheck and build for production
- `bun preview` - Preview production build
- `bun run test` - Run unit tests (Vitest)
- `bun run lint` - Lint with Biome
- `bun run format` - Format with Biome

## Deal Verification
Game numbers must match the classic Microsoft FreeCell deals. Reference layouts live in
`frontend/src/game/msReferenceDeals.ts` and are enforced by the unit tests. Add new references
there only from a trustworthy source; any change to the RNG or dealing code must keep them passing.

## FreeCell Rules
- 52 cards dealt face-up into 8 tableau columns (first 4 columns have 7 cards, last 4 have 6)
- 4 free cells (top left) - temporary storage for single cards
- 4 foundations (top right) - build from Ace to King by suit
- Tableau cards can be moved to another column if descending rank and alternating color
- Multiple cards can be moved as a unit if there are enough free cells/empty columns

## Randomness Implementation
Uses a Linear Congruential Generator (LCG) matching Microsoft's FreeCell algorithm:
- `seed = (seed * 214013 + 2531011) & 0x7FFFFFFF`
- This allows games to be identified by number and replayed

## Deployment
The built application (`dist/` folder) is deployed to AWS S3 as a static website with CloudFront CDN for global distribution.
