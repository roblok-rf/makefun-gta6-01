// vehicles.js — every car in Solmar Bay: the player's ride, parked cars to
// steal, and the traffic that fills the avenues. Cars drive on the road grid,
// turn at intersections, and brake for the car ahead.
import { W, clamp, dist, angDiff, mulberry32, pick, say } from './state.js';
import { ROADS, hitsBuilding, onRoad } from './city.js';

export const CAR_TYPES = [
  { name: 'Comet GT', color: '#e63946', top: 460, accel: 320, sport: true },
  { name: 'Solmar Taxi', color: '#f4c20d', top: 330, accel: 240, taxi: true },
  { name: 'Bay Cruiser', color: '#2a9d8f', top: 300, accel: 210 },
  { name: 'Palm Sedan', color: '#f1faee', top: 320, accel: 230 },
  { name: 'Dock Truck', color: '#6c757d', top: 260, accel: 170, truck: true },
  { name: 'Sunset Coupe', color: '#ff8c42', top: 400, accel: 290, sport: true },
  { name: 'Marina Van', color: '#457b9d', top: 280, accel: 190 },
  { name: 'Vice Police', color: '#1d3557', top: 420, accel: 330, police: true },
];

export function makeCar(x, y, angle, typeIdx, opts = {}) {
  const t = CAR_TYPES[typeIdx % CAR_TYPES.length];
  return {
    x, y, angle, speed: 0, type: t, typeIdx,
    w: t.truck ? 58 : 46, h: t.truck ? 24 : 22,
    parked: !!opts.parked, traffic: !!opts.traffic, police: !!t.police,
    dir: opts.dir || 0, // 0 east, 1 south, 2 west, 3 north (traffic only)
    targetSpeed: t.top * (0.55 + Math.random() * 0.2),
    brake: 0, siren: false, driver: opts.driver !== false,
    id: Math.random().toString(36).slice(2, 8),
  };
}

export function spawnWorldCars() {
  const rng = mulberry32(77);
  W.cars = [];
  // Parked cars along the avenues — these are the ones you steal.
  for (let i = 0; i < 26; i++) {
    const road = pick(rng, ROADS);
    const along = 260 + rng() * 2680;
    const horiz = rng() < 0.5;
    const x = horiz ? along : road + (rng() < 0.5 ? 26 : -26);
    const y = horiz ? road + (rng() < 0.5 ? 26 : -26) : along;
    if (hitsBuilding(W.city, x, y, 30)) continue;
    W.cars.push(makeCar(x, y, horiz ? (rng() < 0.5 ? 0 : Math.PI) : (rng() < 0.5 ? Math.PI / 2 : -Math.PI / 2), Math.floor(rng() * 7), { parked: true }));
  }
  // Moving traffic on the grid.
  for (let i = 0; i < 22; i++) {
    const horiz = rng() < 0.5;
    const road = pick(rng, ROADS);
    const along = 240 + rng() * 2720;
    const dir = horiz ? (rng() < 0.5 ? 0 : 2) : (rng() < 0.5 ? 1 : 3);
    const car = makeCar(horiz ? along : road, horiz ? road : along, dir * Math.PI / 2, Math.floor(rng() * 7), { traffic: true, dir });
    car.speed = car.targetSpeed * 0.7;
    W.cars.push(car);
  }
  // The player's own starter car, parked by the hideout on the avenue.
  const starter = makeCar(1700, 1400, 0, 3, { parked: true });
  W.cars.push(starter);
}

export function nearestCar(x, y, maxD = 70) {
  let best = null, bd = maxD;
  for (const c of W.cars) {
    const d = dist(x, y, c.x, c.y);
    if (d < bd) { bd = d; best = c; }
  }
  return best;
}

function roadAhead(car, look) {
  const nx = car.x + Math.cos(car.angle) * look;
  const ny = car.y + Math.sin(car.angle) * look;
  return { nx, ny };
}

export function updateTraffic(dt) {
  for (const car of W.cars) {
    if (!car.traffic) continue;
    // At an intersection, sometimes turn onto the cross street.
    const nearX = ROADS.some(r => Math.abs(car.x - r) < 14);
    const nearY = ROADS.some(r => Math.abs(car.y - r) < 14);
    if (nearX && nearY && Math.random() < dt * 0.25) {
      car.dir = (car.dir + (Math.random() < 0.5 ? 1 : 3)) % 4;
    }
    const want = car.dir * Math.PI / 2;
    car.angle += clamp(angDiff(car.angle, want), -2.2 * dt, 2.2 * dt);
    // Brake for the car ahead or the player.
    let blocked = false;
    const { nx, ny } = roadAhead(car, 55);
    for (const o of W.cars) {
      if (o !== car && dist(nx, ny, o.x, o.y) < 42) { blocked = true; break; }
    }
    if (!blocked && W.player.car !== car && dist(nx, ny, W.player.x, W.player.y) < 40 && W.player.onFoot) blocked = true;
    const target = blocked ? 0 : car.targetSpeed;
    car.speed += clamp(target - car.speed, -500 * dt, 160 * dt);
    car.x += Math.cos(car.angle) * car.speed * dt;
    car.y += Math.sin(car.angle) * car.speed * dt;
    // Wrap around the city edge so traffic never runs out.
    if (car.x < 120) { car.x = 120; car.dir = 0; }
    if (car.x > 3080) { car.x = 3080; car.dir = 2; }
    if (car.y < 120) { car.y = 120; car.dir = 1; }
    if (car.y > 3080) { car.y = 3080; car.dir = 3; }
    car.x = clamp(car.x, 140, 3060);
    car.y = clamp(car.y, 140, 3060);
  }
}

// Player driving: arcade physics — accelerate, steer, handbrake, collide
// with buildings and other cars (a bump costs speed and sparks, not health).
export function updatePlayerCar(dt) {
  const p = W.player, car = p.car;
  if (!car) return;
  const k = W.keys;
  const fwd = (k['KeyW'] || k['ArrowUp'] ? 1 : 0) - (k['KeyS'] || k['ArrowDown'] ? 1 : 0);
  const steer = (k['KeyA'] || k['ArrowLeft'] ? 1 : 0) - (k['KeyD'] || k['ArrowRight'] ? 1 : 0);
  const hand = !!k['Space'];
  const top = car.type.top * (hand ? 0.55 : 1);
  car.speed += fwd * car.type.accel * dt;
  car.speed -= car.speed * (hand ? 2.2 : 0.35) * dt;
  car.speed = clamp(car.speed, -top * 0.45, top);
  if (Math.abs(car.speed) > 8) car.angle += steer * (car.speed > 0 ? 1 : -1) * 1.9 * dt * clamp(Math.abs(car.speed) / 120, 0.35, 1);
  const nx = car.x + Math.cos(car.angle) * car.speed * dt;
  const ny = car.y + Math.sin(car.angle) * car.speed * dt;
  const hit = hitsBuilding(W.city, nx, ny, 16);
  if (hit || nx < 130 || nx > 3070 || ny < 130 || ny > 3070) {
    car.speed *= -0.25;
    spark(car.x, car.y);
  } else {
    car.x = nx; car.y = ny;
  }
  // Bumping another car shoves it aside and costs a little speed — arcade
  // ramming, so a traffic jam never traps the player at 0 mph. A short
  // cooldown keeps one bump from firing every frame.
  for (const o of W.cars) {
    if (o !== car && dist(car.x, car.y, o.x, o.y) < 44) {
      if (!car._bumpT || W.time - car._bumpT > 0.35) {
        car._bumpT = W.time;
        const pa = car.angle + Math.PI / 2;
        o.x += Math.cos(pa) * 26;
        o.y += Math.sin(pa) * 26;
        if (o.traffic) o.speed = 0;
        car.speed *= 0.85;
        spark((car.x + o.x) / 2, (car.y + o.y) / 2);
      }
    }
  }
  p.x = car.x; p.y = car.y; p.angle = car.angle; p.speed = car.speed;
  W.stats.distance += Math.abs(car.speed) * dt;
  if (Math.abs(car.speed) > 200) car.siren = false;
}

export function spark(x, y) {
  for (let i = 0; i < 6; i++) {
    W.particles.push({ x, y, vx: (Math.random() - 0.5) * 160, vy: (Math.random() - 0.5) * 160, t: 0.4, color: '#ffd166', r: 2 + Math.random() * 2 });
  }
}

export function enterCar(car) {
  const p = W.player;
  p.car = car; p.onFoot = false; car.parked = false; car.traffic = false; car.driver = true;
  if (car.police) { /* police cars are drivable too, once emptied */ }
  W.carsStolen++;
  say('Stolen: ' + car.type.name + ' — drive with W A S D, E to get out');
}

export function exitCar() {
  const p = W.player, car = p.car;
  if (!car) return;
  p.car = null; p.onFoot = true;
  p.x = car.x - Math.cos(car.angle) * 34;
  p.y = car.y - Math.sin(car.angle) * 34;
  p.speed = 0;
}
