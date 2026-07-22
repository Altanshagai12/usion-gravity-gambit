# Gravity Gambit

An original chess-movement + gravity puzzle game built for Usion. Move blue chess pieces by their familiar rules; after every move, all unsupported pieces fall. Capture the anchored red king to solve each room.

This project is inspired by the broad chess-puzzle-platformer genre, but uses an original name, visual system, codebase, campaign, and solver-generated level layouts.

## Features

- 24-level campaign with progressive mechanics and 1–10 move optimal solutions
- Rook, bishop, knight, queen, king, and pawn movement rules
- Animated deterministic gravity and piece stacking
- Pass-through one-way line platforms and a pawn's first-move double advance
- Solver-enforced campaign quality: 84.3% of all placed pieces are required (minimum target: 80%)
- Legal-move highlighting, undo, reset, and gated level selection
- English and Mongolian UI with a mobile-first Usion layout
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

The test suite validates chess movement, wall collision, pass-through platforms, pawn double-step, gravity animation frames, capture, campaign solvability, and the 80% piece-utilization target. The BFS solver reports the shortest solution and required-piece count for every level.

## Publish the Usion profile image

Set the scoped creator token locally, then run the idempotent publisher. Never commit or paste the token into source files.

```powershell
$env:USION_API_TOKEN = '<your usion_sk_ token>'
npm run publish:profile
Remove-Item Env:USION_API_TOKEN
```

Use `npm run publish:profile -- --dry-run` to verify the public PNG without changing the registry.

## Usion registration

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
