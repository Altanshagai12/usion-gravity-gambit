# Gravity Gambit

An original chess-movement + gravity puzzle game built for Usion. Move blue chess pieces by their familiar rules; after every move, all unsupported pieces fall. Capture the anchored red king to solve each room.

This project is inspired by the broad chess-puzzle-platformer genre, but uses an original name, visual system, codebase, campaign, and solver-generated level layouts.

## Features

- 14-level campaign with progressive mechanics and 1–7 move optimal solutions
- Rook, bishop, knight, queen, king, and pawn movement rules
- Deterministic gravity and piece stacking
- Legal-move highlighting, undo, reset, and gated level selection
- English and Mongolian UI; host light/dark theme support
- Progress stored per user through `Usion.storage`
- Dependency-free Canvas renderer; no external assets or gameplay libraries

## Local development

```bash
npm start
```

Open `http://localhost:3000`.

## Verification

```bash
npm test
npm run solve
```

The test suite validates chess movement, collision, gravity, capture, and campaign solvability. The BFS solver reports the shortest solution length and explored state count for every level.

## Usion registration

Recommended service fields:

```json
{
  "name": "Gravity Gambit",
  "description": "Chess moves meet gravity in a handcrafted puzzle campaign.",
  "service_type": "game",
  "cost": 0,
  "tags": ["game", "puzzle", "chess", "single-player", "iframe"],
  "is_published": true
}
```
