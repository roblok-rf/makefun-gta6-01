// main.js — Solmar Bay: an open-world crime game in the sun. Boots the world,
// runs the fixed game loop, wires input to the player's actions, and draws the
// city and the HUD every frame. Play it with keyboard and mouse; the game is
// static files only and makes no network request.
import { W, WORLD, clamp, dist, angleTo, angDiff, say } from './state.js';
import { buildCity, hitsBuilding } from './city.js';
import { spawnWorldCars, updateTraffic, updatePlayerCar, nearestCar, enterCar, exitCar } from './vehicles.js';
import { spawnPeds, updatePeds, updateCops } from './people.js';
import { updateWanted } from './wanted.js';
import { startMission, updateMissions, updateTaxi, checkPackages, startTaxi, skipMission, MISSIONS } from './missions.js';
import { updateCombat, playerShoot, playerPunch, givePistol, hurtPlayer } from './combat.js';
import { drawWorld } from './render.js';
import { drawHUD } from './hud.js';
import { bindInput } from './input.js';
import { saveGame, loadGame, hasSave } from './save.js';
import { ensureAudio, engineSound, sirenSound, sfx, setMuted, isMuted } from './audio.js';
import { applyShot } from './shots.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const VW = 1280, VH = 800;
canvas.width = VW;
canvas.height = VH;

function resize() {
  const scale = Math.min(window.innerWidth / VW, window.innerHeight / VH);
  canvas.style.width = Math.floor(VW * scale) + 'px';
  canvas.style.height = Math.floor(VH * scale) + 'px';
}
window.addEventListener('resize', resize);
resize();

// ---- Boot -----------------------------------------------------------------
W.city = buildCity();
spawnWorldCars();
spawnPeds();
// Health, armor and cash pickups scattered around the hideout and the city.
W.pickups = [
  { x: 1520, y: 1400, kind: 'health' }, { x: 1680, y: 1400, kind: 'armor' },
  { x: 620, y: 2620, kind: 'health' }, { x: 2620, y: 620, kind: 'armor' },
  { x: 1020, y: 1020, kind: 'health' }, { x: 2380, y: 2200, kind: 'health' },
];
const params = new URLSearchParams(location.search);
applyShot(params.get('shot'));
if (!W.shot) {
  if (hasSave() && loadGame()) {
    W.mode = 'menu';
    say('Save found — press ENTER to continue your story.');
  }
  startMission(0);
  W.mission = null; // the story starts when the player presses ENTER
}

// ---- Player on foot --------------------------------------------------------
function updatePlayerFoot(dt) {
  const p = W.player;
  const k = W.keys;
  const up = k['KeyW'] || k['ArrowUp'], down = k['KeyS'] || k['ArrowDown'];
  const left = k['KeyA'] || k['ArrowLeft'], right = k['KeyD'] || k['ArrowRight'];
  let mx = (right ? 1 : 0) - (left ? 1 : 0);
  let my = (down ? 1 : 0) - (up ? 1 : 0);
  if (mx || my) {
    const len = Math.hypot(mx, my);
    mx /= len; my /= len;
    const speed = (k['ShiftLeft'] || k['ShiftRight']) ? 300 : 185;
    const nx = p.x + mx * speed * dt;
    const ny = p.y + my * speed * dt;
    if (!hitsBuilding(W.city, nx, p.y, 12)) p.x = nx;
    if (!hitsBuilding(W.city, p.x, ny, 12)) p.y = ny;
    p.x = clamp(p.x, 130, 3070);
    p.y = clamp(p.y, 130, 3070);
    p.angle = angleTo(p.x, p.y, p.x + mx, p.y + my);
    p.speed = speed;
    W.stats.distance += speed * dt;
  } else {
    p.speed = 0;
    // Aim with the mouse while standing still.
    p.angle = angleTo(p.x, p.y, W.cam.x + (W.mouse.x - VW / 2), W.cam.y + (W.mouse.y - VH / 2));
  }
  // Walk into a parked car and press E to steal it.
  if (k['KeyE']) {
    const car = nearestCar(p.x, p.y, 70);
    if (car) {
      W.keys['KeyE'] = false;
      enterCar(car);
      if (!car.police) { /* stealing any car draws a little heat */ }
      sfx('pickup');
    }
  }
  if (k['KeyF']) { W.keys['KeyF'] = false; playerPunch(); }
  if (W.mouse.down) { W.mouse.down = false; playerShoot(); }
}

// ---- Input actions ----------------------------------------------------------
function onKey(code) {
  if (code === 'Enter') {
    if (W.mode === 'menu') {
      W.mode = 'play';
      ensureAudio();
      if (!W.mission) startMission(W.missionIdx);
      sfx('mission');
    } else if (W.mode === 'win') {
      W.mode = 'play';
      W.missionsDone = 0;
      startMission(0);
    }
    return;
  }
  if (code === 'KeyM') { setMuted(!isMuted()); return; }
  if (W.mode !== 'play') {
    if (code === 'KeyR' && W.mode === 'dead') respawn();
    return;
  }
  if (code === 'KeyP' || code === 'Escape') { W.mode = 'pause'; return; }
  if (code === 'KeyC') { saveGame(); return; }
  if (code === 'KeyN') { skipMission(); return; }
  if (code === 'KeyT') { startTaxi(); return; }
  if (code === 'KeyR') {
    if (W.weapon === 'pistol') { W.ammo = 24; say('Reloaded.'); }
    return;
  }
  if (code === 'KeyE' && W.player.car) {
    exitCar();
    return;
  }
}

function onMouseDown(button) {
  if (button === 0 && W.mode === 'play' && W.player.onFoot) playerShoot();
}

bindInput(canvas, { onKey, onMouseDown });

function respawn() {
  W.health = 100;
  W.armor = 25;
  W.wanted = 0;
  W.heat = 0;
  W.player.x = 1600; W.player.y = 1400;
  W.player.onFoot = true; W.player.car = null;
  W.enemies = [];
  W.cops = [];
  W.mode = 'play';
  say('Back on your feet at the hideout. The city is still yours to take.');
}

// ---- Main loop ---------------------------------------------------------------
let last = performance.now();
let autosaveT = 0;

function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  W.time += dt;
  W.clock = (W.clock + dt * 0.6) % 1440;
  if (W.messageT > 0) W.messageT -= dt;
  if (W.mode === 'play') {
    const p = W.player;
    if (p.onFoot) updatePlayerFoot(dt);
    else updatePlayerCar(dt);
    updateTraffic(dt);
    updatePeds(dt);
    updateCops(dt);
    updateWanted(dt);
    updateCombat(dt);
    updateMissions(dt);
    updateTaxi(dt);
    checkPackages();
    // Pickups: walk over one to take it.
    for (let i = W.pickups.length - 1; i >= 0; i--) {
      const pk = W.pickups[i];
      if (dist(p.x, p.y, pk.x, pk.y) < 40) {
        if (pk.kind === 'health') W.health = clamp(W.health + 40, 0, 100);
        if (pk.kind === 'armor') W.armor = clamp(W.armor + 50, 0, 100);
        if (pk.kind === 'cash') { W.money += 200; }
        sfx('pickup');
        W.pickups.splice(i, 1);
      }
    }
    // The pistol waits by the hideout from mission 3 on.
    if (W.missionIdx >= 2 && W.weapon === 'fists' && dist(p.x, p.y, 1560, 1400) < 50) givePistol();
    // Driving fast through downtown in a sports car is the fastest way to
    // build distance — the score quietly tracks how far you have driven.
    if (p.car && Math.abs(p.car.speed) > 350) W.score += dt * 2;
    // Particles and floats age out.
    for (let i = W.particles.length - 1; i >= 0; i--) {
      const pt = W.particles[i];
      pt.t -= dt;
      pt.x += pt.vx * dt;
      pt.y += pt.vy * dt;
      if (pt.t <= 0) W.particles.splice(i, 1);
    }
    for (let i = W.floats.length - 1; i >= 0; i--) {
      const f = W.floats[i];
      f.t -= dt; f.y -= 30 * dt;
      if (f.t <= 0) W.floats.splice(i, 1);
    }
    engineSound(p.car ? p.car.speed : 0, !!p.car);
    sirenSound(dt, W.wanted);
    autosaveT += dt;
    if (autosaveT > 30) { autosaveT = 0; saveGame(true); }
  }
  // Camera follows the player smoothly.
  const tx = clamp(W.player.x, VW / 2 - 100, WORLD - VW / 2 + 100);
  const ty = clamp(W.player.y, VH / 2 - 100, WORLD - VH / 2 + 100);
  W.cam.x += (tx - W.cam.x) * Math.min(1, dt * 5);
  W.cam.y += (ty - W.cam.y) * Math.min(1, dt * 5);
  ctx.clearRect(0, 0, VW, VH);
  if (W.mode === 'menu') {
    drawHUD(ctx, VW, VH);
  } else {
    drawWorld(ctx, VW, VH);
    drawHUD(ctx, VW, VH);
  }
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

// Expose a tiny handle for the screenshot script and for debugging.
window.__solmar = { W, startMission, saveGame };
