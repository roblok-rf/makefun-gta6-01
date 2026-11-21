// wanted.js — the wanted system: heat builds when you steal, shoot or kill
// in view, stars rise at thresholds, and staying out of sight cools you down.
// Police presence scales with stars; at 5 stars the whole city is after you.
import { W, clamp, say } from './state.js';

const THRESHOLDS = [0, 25, 45, 65, 85, 100];

export function addHeat(n, why) {
  W.heat = clamp(W.heat + n, 0, 120);
  const stars = starsForHeat(W.heat);
  if (stars > W.wanted) {
    W.wanted = stars;
    say('WANTED LEVEL ' + stars + ' — ' + why, 5);
  }
}

export function starsForHeat(heat) {
  let s = 0;
  for (let i = 0; i < THRESHOLDS.length; i++) if (heat >= THRESHOLDS[i]) s = i;
  return s;
}

export function updateWanted(dt) {
  // Cool down when no cop can see you (far from every cop car).
  let seen = false;
  for (const cop of W.cops) {
    const d = Math.hypot(cop.car.x - W.player.x, cop.car.y - W.player.y);
    if (d < 420) { seen = true; break; }
  }
  if (W.wanted > 0 && !seen) {
    W.heat -= dt * 6;
    if (W.heat < THRESHOLDS[Math.max(0, W.wanted - 1)]) {
      W.wanted = starsForHeat(W.heat);
      if (W.wanted === 0) say('You lost the cops. Lay low, Mara.');
    }
  }
  // In a mission chase the heat holds steady instead of cooling.
  if (W.mission && W.mission.holdHeat) W.heat = Math.max(W.heat, 45);
  // A busted player who paid the fine cools faster once free.
  if (W.health < 30 && W.wanted > 0) W.heat -= dt * 2;
}

export function wantedLabel() {
  return ['Clean', 'Petty theft', 'Grand theft', 'Armed & dangerous', 'Citywide alert', 'Maximum heat'][W.wanted];
}
