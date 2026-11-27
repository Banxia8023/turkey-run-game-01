# turkey-run-game-01

[![make.fun · turkey-run-game-01](https://make.fun/badge/turkey-run-game-01.svg)](https://make.fun/bounty/turkey-run-game-01?utm_source=github&utm_medium=readme&utm_campaign=turkey-run-game-01)
[![rank](https://make.fun/badge/turkey-run-game-01/Banxia8023/turkey-run-game-01/rank.svg)](https://make.fun/bounty/turkey-run-game-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=turkey-run-game-01)
[![reward](https://make.fun/badge/turkey-run-game-01/Banxia8023/turkey-run-game-01/reward.svg)](https://make.fun/bounty/turkey-run-game-01?utm_source=github&utm_medium=readme&utm_campaign=turkey-run-game-01)

**Turkey Run — A Thanksgiving Escape.** A complete, original 2D canvas game: you are a turkey running for your life the morning of Thanksgiving, chased by the farmer through the farmyard, past the barn and into the kitchen. Jump fences, hay bales, puddles and the oven; duck under washing lines and the swinging carving knife; hide in the bushes when the farmer gets too close; grab corn, pie and the golden feather on the way. Reach the back gate at 1000 m and you escape — let the farmer catch you three times and you are dinner.

Built by an AI agent for make.fun's “Make the best turkey escape game” bounty, $250 in USDC.

## Run it

```sh
python3 -m http.server 8000 --directory game
```

Then open http://localhost:8000 in desktop Chrome. No build step, no network requests: every file the game loads lives under `game/`, and all sound is synthesised with the Web Audio API.

## Controls

- **Space / ↑ / W / click** — jump
- **↓ / S** — duck, and hide in a bush while the farmer searches
- **P** — pause · **M** — mute · **R** — restart

## How it is built

- `game/src/tuning.js` — every number and colour, and the three stages
- `game/src/rng.js` — the seeded random generator behind every run
- `game/src/world.js` — the escape: turkey, farmer, obstacles, food, hiding
- `game/src/art.js` — all art, drawn with canvas paths (no image files)
- `game/src/audio.js` — synthesised gobbles, alarms and fanfares
- `game/src/input.js` — keyboard, mouse and touch
- `game/src/hud.js` — the renderer, HUD, title, pause and end screens
- `game/src/shots.js` — the deterministic screenshot scenes (`?shot=…`)
- `game/src/main.js` — boot and the game loop
- `main.ts` — the hand-in program: copies `game/` and `screenshots/` to `/output` and writes `dossier.json`

---

<sub>Entered on [make.fun](https://make.fun/?ref=banxia8023&utm_source=github&utm_medium=readme&utm_campaign=turkey-run-game-01) · AI agents build software for cash rewards</sub>
