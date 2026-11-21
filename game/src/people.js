// people.js — pedestrians who stroll the sidewalks and flee gunfire, and the
// Solmar Bay police who chase, ram and arrest you when your wanted level rises.
// Cops spawn at the city edge and home in on the player; losing them for a
// while cools your heat and drops the wanted level.
import { W, clamp, dist, angleTo, angDiff, mulberry32, pick, say } from './state.js';
import { ROADS, hitsBuilding, onRoad } from './city.js';
import { makeCar, CAR_TYPES } from './vehicles.js';

const SHIRTS = ['#e63946', '#2a9d8f', '#f4a261', '#6d6875', '#e9c46a', '#90be6d', '#577590', '#f28482'];
const NAMES = ['Ana', 'Ben', 'Cleo', 'Dario', 'Elsa', 'Finn', 'Gus', 'Hana', 'Ivo', 'Jules', 'Kiko', 'Lena', 'Milo', 'Nina', 'Otto', 'Pia'];

export function spawnPeds() {
  const rng = mulberry32(4242);
  W.peds = [];
  for (let i = 0; i < 60; i++) {
    const road = pick(rng, ROADS);
    const along = 220 + rng() * 2760;
    const horiz = rng() < 0.5;
    W.peds.push({
      x: horiz ? along : road + (rng() < 0.5 ? 34 : -34),
      y: horiz ? road + (rng() < 0.5 ? 34 : -34) : along,
      angle: rng() * Math.PI * 2,
      speed: 28 + rng() * 30,
      shirt: pick(rng, SHIRTS),
      name: pick(rng, NAMES),
      panic: 0,
      walkPhase: rng() * Math.PI * 2,
    });
  }
}

export function updatePeds(dt) {
  const p = W.player;
  for (const ped of W.peds) {
    const d = dist(ped.x, ped.y, p.x, p.y);
    const gunfire = W.bullets.length > 0;
    if ((d < 160 && W.wanted > 0) || (gunfire && d < 260)) ped.panic = 2.5;
    if (ped.panic > 0) {
      ped.panic -= dt;
      const a = angleTo(p.x, p.y, ped.x, ped.y);
      ped.angle = a;
      ped.x += Math.cos(a) * 150 * dt;
      ped.y += Math.sin(a) * 150 * dt;
    } else {
      ped.walkPhase += dt * 6;
      // Stroll along the sidewalk; turn at random corners.
      if (Math.random() < dt * 0.08) ped.angle += (Math.random() < 0.5 ? 1 : -1) * Math.PI / 2;
      const nx = ped.x + Math.cos(ped.angle) * ped.speed * dt;
      const ny = ped.y + Math.sin(ped.angle) * ped.speed * dt;
      if (!hitsBuilding(W.city, nx, ny, 12) && nx > 130 && nx < 3070 && ny > 130 && ny < 3070) {
        ped.x = nx; ped.y = ny;
      } else {
        ped.angle += Math.PI / 2;
      }
    }
  }
}

export function spawnCop() {
  const p = W.player;
  const edge = [
    { x: 240, y: p.y }, { x: 2960, y: p.y },
    { x: p.x, y: 240 }, { x: p.x, y: 2960 },
  ];
  const s = edge[Math.floor(Math.random() * edge.length)];
  const spot = onRoad(clamp(s.x, 200, 3000), clamp(s.y, 200, 3000));
  const car = makeCar(spot.x, spot.y, angleTo(spot.x, spot.y, p.x, p.y), 7, {});
  car.police = true; car.siren = true; car.traffic = false;
  W.cars.push(car);
  W.cops.push({ car, bust: 0, hp: 100 });
}

export function updateCops(dt) {
  const p = W.player;
  const want = Math.min(2 + W.wanted, 8);
  while (W.cops.length < want && W.wanted > 0) spawnCop();
  while (W.cops.length > want) {
    const gone = W.cops.pop();
    const i = W.cars.indexOf(gone.car);
    if (i >= 0) W.cars.splice(i, 1);
  }
  for (const cop of W.cops) {
    const car = cop.car;
    const d = dist(car.x, car.y, p.x, p.y);
    const a = angleTo(car.x, car.y, p.x, p.y);
    car.angle += clamp(angDiff(car.angle, a), -3.2 * dt, 3.2 * dt);
    const target = d > 90 ? car.type.top * (0.8 + W.wanted * 0.04) : 60;
    car.speed += clamp(target - car.speed, -600 * dt, 420 * dt);
    const nx = car.x + Math.cos(car.angle) * car.speed * dt;
    const ny = car.y + Math.sin(car.angle) * car.speed * dt;
    if (!hitsBuilding(W.city, nx, ny, 16)) { car.x = nx; car.y = ny; }
    else { car.angle += 1.4 * dt; car.speed *= 0.7; }
    // Ram the player's car, or bust them on foot at close range.
    // A ram is a nudge, not a full stop: the player can still power away.
    if (d < 52 && p.car && Math.random() < dt * 3) {
      p.car.speed *= 0.9;
    }
    if (d < 46 && p.onFoot) {
      cop.bust += dt;
      if (cop.bust > 2.2) {
        W.health = Math.max(10, W.health - 25);
        addFine();
        cop.bust = 0;
        // Dump the player across town, away from the arrest spot.
        p.x = clamp(p.x + 400, 200, 3000); p.y = clamp(p.y + 400, 200, 3000);
        say('BUSTED! The Solmar Bay police took $150 and dumped you across town.');
      }
    } else cop.bust = Math.max(0, cop.bust - dt);
  }
}

function addFine() {
  const fine = Math.min(150, W.money);
  W.money -= fine;
  W.wanted = Math.max(0, W.wanted - 1);
  W.heat = 20;
}
