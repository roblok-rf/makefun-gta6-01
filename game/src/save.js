// save.js — save and load through localStorage, plus an autosave every 30 s
// and one on every mission completion. The save holds money, progress, the
// player's spot and the hidden packages; cars and traffic respawn fresh.
import { W, say } from './state.js';

const KEY = 'solmar-bay-save-v1';

export function saveGame(silent = false) {
  try {
    const data = {
      money: W.money, score: W.score, health: W.health, armor: W.armor,
      weapon: W.weapon, ammo: W.ammo, kills: W.kills, carsStolen: W.carsStolen,
      missionsDone: W.missionsDone, missionIdx: W.missionIdx, packages: W.packages,
      fares: W.fares, wanted: W.wanted,
      x: W.player.x, y: W.player.y,
      taken: W.city.packages.filter(p => p.taken).map(p => p.x + ',' + p.y),
      when: new Date().toISOString(),
    };
    localStorage.setItem(KEY, JSON.stringify(data));
    if (!silent) say('Game saved. Progress is safe in this browser.');
    return true;
  } catch {
    if (!silent) say('Save failed — this browser blocked local storage.');
    return false;
  }
}

export function loadGame() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return false;
    const d = JSON.parse(raw);
    if (typeof d.money !== 'number' || typeof d.x !== 'number') return false;
    W.money = d.money; W.score = d.score; W.health = d.health; W.armor = d.armor;
    W.weapon = d.weapon; W.ammo = d.ammo; W.kills = d.kills;
    W.carsStolen = d.carsStolen; W.missionsDone = d.missionsDone;
    W.missionIdx = d.missionIdx; W.packages = d.packages; W.fares = d.fares;
    W.player.x = d.x; W.player.y = d.y;
    W.player.onFoot = true; W.player.car = null;
    const taken = new Set(d.taken || []);
    for (const p of W.city.packages) if (taken.has(p.x + ',' + p.y)) p.taken = true;
    return true;
  } catch {
    return false;
  }
}

export function hasSave() {
  try { return !!localStorage.getItem(KEY); } catch { return false; }
}

export function clearSave() {
  try { localStorage.removeItem(KEY); } catch { /* best-effort */ }
}
