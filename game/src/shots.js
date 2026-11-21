// shots.js — staged scenes for the screenshots, driven by ?shot=<name>.
// Each scene puts the real game in a real state (start screen, driving,
// a police chase, a mission in progress) so the screenshots are honest
// renders of the game itself, never composites. window.__shotReady is set
// once the scene has settled, so the screenshot script can wait on it.
import { W, say } from './state.js';
import { startMission, spawnEnemies } from './missions.js';
import { makeCar, enterCar } from './vehicles.js';
import { addHeat } from './wanted.js';
import { givePistol } from './combat.js';

export function applyShot(name) {
  if (!name) return;
  W.shot = name;
  if (name === 'start') {
    W.mode = 'menu';
  } else if (name === 'drive') {
    W.mode = 'play';
    // On the avenue x=1400, heading north, so holding W drives along the
    // road instead of into a city block.
    const car = makeCar(1400, 2000, -Math.PI / 2, 0, {});
    W.cars.push(car);
    W.player.x = 1400; W.player.y = 2000;
    enterCar(car);
    car.speed = 380;
    W.money = 1250;
    startMission(1);
    say('Mission 2 · Hot Wheels — deliver the Comet GT to the Marina Pier', 8);
  } else if (name === 'chase') {
    W.mode = 'play';
    // On the avenue y=1400, heading east, so the chase runs along a road
    // with the police coming up behind.
    const car = makeCar(1800, 1400, 0, 5, {});
    W.cars.push(car);
    W.player.x = 1800; W.player.y = 1400;
    enterCar(car);
    car.speed = 360;
    addHeat(70, 'the Sunset Score');
    W.wanted = 3;
    W.money = 2450;
    W.missionsDone = 6;
    startMission(7);
    say('WANTED LEVEL 3 — lose the Solmar Bay police!', 8);
  } else if (name === 'mission') {
    W.mode = 'play';
    W.player.x = 2560; W.player.y = 1760;
    W.player.onFoot = true;
    W.player.car = null;
    givePistol();
    W.ammo = 18;
    W.money = 1900;
    W.missionsDone = 5;
    startMission(5);
    spawnEnemies({ x: 2600, y: 1800 }, 5);
    say('Mission 6 · Clean Sweep — clear the warehouse guards', 8);
  }
  // Let the world settle one frame, then signal readiness.
  requestAnimationFrame(() => {
    requestAnimationFrame(() => { window.__shotReady = true; });
  });
}
