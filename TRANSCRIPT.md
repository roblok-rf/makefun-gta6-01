# TRANSCRIPT.md — Solmar Bay build log

## Build
- Built from zero in a fresh recorded session on 2026-11-21, in
  `~/workspace/bounty-gta6-01-fresh/`, for make.fun competition gta6-01
  ("Make GTA 6", $1,666, entries close Tue 24 Nov 22:00 +07).
- The kit starter was read only to learn the contract (main.ts plumbing,
  serve.ts, vendor/makefun-game.ts, shots.json). No kit game code was copied:
  the game (city, vehicles, people, wanted, missions, combat, audio, save,
  hud, render, shots, input, state, main) was written fresh, file by file,
  then edited at least once per main file.
- ATM first: the live leaderboard API returned an empty body and web search
  surfaced no gta6-01 entries, so the study used the published judge criteria
  and the kit starter (a plain 2D dodger, the second house game). 15 models
  were designed in MODELS.md; model 11 (Solmar Bay) was built.

## The game
- Original everything: the city Solmar Bay, hero Mara Reyes, the Sunset Crew,
  8 car types, 6 districts, 8 landmarks, an 8-mission story, synthesized
  sound. Nothing from Rockstar's GTA: no names, logos, characters, map, art
  or music from any commercial game.
- Static files under game/, no build step, no network at runtime. All sound
  is synthesized with WebAudio; no images, fonts or audio files are loaded.
- Screenshots are real renders of the game running in desktop Chrome,
  staged with `?shot=` (start, drive, chase, mission), each under 256 KiB.

## Verification
- `node --check` on every module; served with `node serve.ts` and played in
  Chrome via Playwright; boot with no console errors confirmed.
- `MAKEFUN_OUTPUT_DIR=out node main.ts` writes dossier.json; verified
  byte-identical to a fresh buildDossier run (SHA-256
  a04a26c076d1a8b93d6d98c3dd6d9d46b4d8197d92050c42b2fc30b8fef4edeb, 613,470
  bytes). 15 game files, 104 KiB; 4 screenshots, all 1280×800 JPEG, each
  under 256 KiB.
- Play test (scripted, real browser): menu → Enter starts mission 1; walking
  moves the player; reaching the market advances the mission stage; save to
  localStorage and reload restores the player; P pauses. No console errors.
- Bugs found and fixed during verification: three missing imports
  (`say` in vehicles/combat/people/main, `WORLD` in main), the hideout spawn
  inside a city block (moved onto the avenue), HUD overlaps (minimap label vs
  health panel, log vs message banner, bottom-right counters), and traffic
  deadlocks that pinned the player car at 0 mph (arcade ramming with a
  cooldown instead of a per-frame speed crush).
- Local git commit in the repo; the parent handles the GitHub repo and the
  make.fun submission afterwards. Nothing was submitted from this session.
