# Chessformer

A browser recreation of Chessformer's original 24-level campaign. Move the blue chess pieces by their normal rules; after each move, unsupported pieces fall. Capture the red king to finish a level.

## Features

- The original 24 levels on their fixed 16×11 boards
- Rook, bishop, knight, queen, king, and pawn movement rules
- Animated deterministic gravity and piece stacking
- Pass-through thin platforms, keys and locks, and purple pressure buttons
- Pawn first-move double advance and four-choice promotion
- Legal-move highlighting, reset, and the original three-level unlock window
- Progress stored per user through `Usion.storage`
- Dependency-free Canvas renderer

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

The test suite validates chess movement, gravity capture, pass-through platforms, keys, locks, pressure buttons, pawn promotion, the campaign data contract, and the opening levels' playability.

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
  "name": "Chessformer",
  "description": "Chess moves meet gravity across the original 24-level campaign.",
  "service_type": "game",
  "cost": 0,
  "tags": ["game", "puzzle", "chess", "single-player", "iframe"],
  "is_published": true
}
```
