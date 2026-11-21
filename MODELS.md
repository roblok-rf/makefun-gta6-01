# MODELS.md — Solmar Bay (make.fun gta6-01)

## ATM study (amati, tiru, modifikasi)

The live leaderboard API (`https://make.fun/api/competitions/gta6-01/leaderboard`)
returned an empty body when fetched during this build (2026-11-21), and web
search surfaced only other GTA bounties, not this competition's entries — so no
individual rival entry could be inspected. The study therefore used what the
competition itself publishes: the judge criteria (most important first) and the
kit starter, which is the second of the four fixed house games.

What the starter / house game does: a plain 2D canvas dodger — one screen, one
mechanic, no city, no cars, no police, no missions, no minimap, no story. Any
entry that shows a real open world with traffic, wanted police, missions and a
minimap beats it on every criterion.

What the judge rewards, in order:
1. A complete open world shown in screenshots: city on foot and by car,
   traffic, pedestrians, wanted level with responding police, missions.
2. Depth and fun: missions and a story, vehicles to steal and drive,
   activities, combat, progression.
3. Feel and polish: controls and camera, HUD with minimap, effects, menus.
4. Look and originality: a coherent sun-soaked modern city of its own —
   original names, characters, story, art and sound; nothing from Rockstar.
5. Structure: source split into files with one clear job each, named for
   what they do.

Design consequences for Solmar Bay: every screenshot shows several systems at
once (HUD + minimap + wanted stars + objective + traffic + police); the city
is a fixed-seed grid so the minimap and the world always agree; missions chain
into a story instead of standing alone; sound is synthesized (no audio files,
no network); the source is split by job (city, vehicles, people, wanted,
missions, combat, audio, save, hud, render, shots, input, state, main).

## 15 models — model 11 is the game built here

1. **Sunset Courier** — a delivery-only game: one bike, timed drops, no police.
   Too thin: fails criterion 1 (no wanted level, no missions arc).
2. **Vice Nights** — a neon night city, all driving, no on-foot play.
   Loses the on-foot half of the open world and the minimap reads poorly.
3. **Harbor Heist** — a single big heist mission, no story chain, no side work.
   Strong one scene, weak depth; one screenshot cannot carry the judge.
4. **Beach Bum** — a comedy beach game: jet skis, no cars, no combat.
   Fun but not a crime game; wanted/police systems missing entirely.
5. **Downtown Drift** — a pure driving/racing game with a big map.
   Great feel, but no missions, no story, no combat — depth score collapses.
6. **Cop Hunter** — you play the police, chasing criminals.
   Flips the fantasy; the bounty asks for the criminal's side and car theft.
7. **Island Getaway** — a small island with 3 missions and a boat.
   Coherent but small: the city feels empty in screenshots.
8. **Neon Empire** — a 3D low-poly city in three.js.
   Beautiful in theory, but heavy, slow to load, and screenshots go muddy
   at thumbnail size; a long build risk with three days left.
9. **Palm City Stories** — a story-heavy game with dialogue trees, little driving.
   Dialogue reads well but the open world is a backdrop, not a playground.
10. **Street King** — a territory-control game: take over districts one by one.
    Strong progression, but missions blur into repetition and the story is thin.
11. **Solmar Bay (BUILT)** — a sun-soaked coastal city, top-down 2D canvas:
    8-mission story (meet, steal, fight, getaway, timed run, clear-out, ledger,
    final heist), 5 wanted levels with chasing police cars, traffic and
    pedestrians, 8 car types to steal and drive, pistol/fist combat, taxi fares,
    12 hidden packages, health/armor pickups, save/load, synthesized sound,
    HUD with live minimap, start/pause/dead/win screens, and 4 staged
    screenshots each showing several systems at once. Combines the best of
    models 3 (heist), 5 (driving feel), 7 (coherent small city, grown bigger),
    9 (story) and 10 (progression) — and beats the house starter on all five
    judge criteria.
12. **Bayfront Tycoon** — buy property, earn rent, hire drivers.
    A management game wearing a crime coat; the action screenshots are dull.
13. **Midnight Run** — a night-only stealth game: avoid cones of vision.
    Atmospheric, but the sun-soaked city criterion and the driving half suffer.
14. **Crew Wars** — gang-vs-gang turf battles with many enemy types.
    Combat-heavy; the city, missions and police become scenery.
15. **Solmar Bay: After Dark** — model 11 plus a day/night cycle and rain.
    A future upgrade: night lighting would hurt screenshot legibility at
    thumbnail size, so the shipped game stays in golden daylight.

## What was built (model 11)

- City: fixed-seed 3200×3200 grid, 6 named districts, beach + marina water,
  park blocks, downtown towers, 8 landmarks, 12 hidden packages.
- Vehicles: 8 types (sports, taxi, truck, van, police…), parked cars to steal,
  22 traffic cars that follow the grid and brake for each other.
- People: 60 pedestrians who stroll and flee gunfire; police cars that spawn
  at the city edge, chase, ram and bust the player.
- Wanted: heat 0–120, 5 stars, cools when unseen, holds during chase missions.
- Missions: 8 chained story missions with staged objectives, timers and pay.
- Combat: fists + pistol (mouse aim, click shoot), enforcers who shoot back.
- HUD: cash, health, armor, wanted stars, clock, district, objective panel,
  live minimap with blips, speed, kill/car/fare counters, message + event log.
- Save: localStorage save/load, autosave every 30 s, save on mission complete.
- Sound: WebAudio synthesis only — engine hum, sirens, shots, jingles.
- Screenshots: 4 staged real renders (start, driving, police chase, mission).
- Edit pass: fixed the final-mission win flow (no mission restarts after the
  win screen), the kill-counter text (stored template, recomputed live),
  the health/armor panel overflow, and the 404 label in serve.ts.
