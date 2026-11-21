// state.js — the single shared world state for Solmar Bay, plus tiny helpers.
// Every other module imports W from here and reads or mutates it; nothing
// else holds game state, so save/load and the ?shot= staging only touch W.
export const WORLD = 3200; // the city is a 3200 x 3200 square of streets

export function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export const clamp = (v, lo, hi) => (v < lo ? lo : v > hi ? hi : v);
export const dist = (ax, ay, bx, by) => Math.hypot(ax - bx, ay - by);
export const angleTo = (ax, ay, bx, by) => Math.atan2(by - ay, bx - ax);
export function angDiff(a, b) {
  let d = b - a;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
}
export function pick(rng, arr) { return arr[Math.floor(rng() * arr.length)]; }

export const W = {
  mode: 'menu', // menu | play | pause | dead | win
  time: 0, // seconds since the run started
  clock: 9 * 60 + 12, // in-game minutes since midnight (sun-soaked morning)
  money: 250,
  score: 0,
  health: 100,
  armor: 0,
  wanted: 0, // 0..5 stars
  heat: 0, // 0..100, drives the wanted level up and down
  weapon: 'fists',
  ammo: 0,
  punchT: 0, // melee swing cooldown
  missionTimer: 0, // seconds left on a timed mission stage, 0 = none
  kills: 0,
  carsStolen: 0,
  missionsDone: 0,
  packages: 0, // hidden packages found, of 12
  fares: 0, // taxi fares completed
  player: { x: 1600, y: 1400, angle: -Math.PI / 2, speed: 0, onFoot: true, car: null, run: false },
  cam: { x: 1600, y: 1400 },
  keys: {},
  mouse: { x: 640, y: 400, down: false },
  cars: [], // traffic + parked + the player's car
  peds: [],
  cops: [],
  enemies: [],
  bullets: [],
  particles: [],
  pickups: [],
  floats: [], // floating score / message text
  city: null, // built by city.js
  mission: null, // active mission object from missions.js
  missionIdx: 0,
  missionStage: 0,
  objective: 'Press ENTER to start',
  log: [], // recent event lines shown bottom-left
  message: '',
  messageT: 0,
  shot: null, // ?shot= staging name, set by shots.js
  muted: false,
  stats: { shotsFired: 0, distance: 0 },
};

export function say(text, secs = 4) {
  W.message = text;
  W.messageT = secs;
  W.log.unshift(text);
  if (W.log.length > 5) W.log.pop();
}
export function addFloat(x, y, text, color = '#fff') {
  W.floats.push({ x, y, text, color, t: 1.4 });
}
export function addMoney(n, x, y) {
  W.money += n;
  W.score += Math.max(0, n);
  if (x !== undefined) addFloat(x, y, (n > 0 ? '+$' : '-$') + Math.abs(n), n > 0 ? '#7dff8a' : '#ff7d7d');
}
