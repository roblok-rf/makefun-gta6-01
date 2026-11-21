// missions.js — the story of Mara Reyes in Solmar Bay: eight missions that
// chain together (meet, steal, fight, escape, deliver, clear, steal, heist),
// plus side work (taxi fares, hidden packages, a checkpoint race) that pays
// between missions. Each mission is stages with a target, a radius and a
// check; the HUD reads mission.text and mission.target for the objective.
import { W, dist, say, addMoney, addFloat } from './state.js';
import { LANDMARKS } from './city.js';
import { makeCar } from './vehicles.js';
import { addHeat } from './wanted.js';

function at(x, y) { return { x, y }; }
// The hideout sits on the avenue at y=1400 (a road, never inside a building),
// so the player can always walk away from it in every direction.
const HIDEOUT = at(1600, 1400);
const GARAGE = at(1000, 2600);
const BANK = at(1800, 1000);
const WAREHOUSE = at(2600, 1800);
const PIER = at(600, 3000);
const HOTEL = at(2600, 600);
const MARKET = at(600, 600);
const HALL = at(1400, 600);

export const MISSIONS = [
  {
    name: '1 · First Light', pay: 300,
    brief: 'Mara Reyes is back in Solmar Bay. Her old friend Jax waits at the Old Town Market with a job.',
    stages: [
      { text: 'Meet Jax at the Old Town Market', target: MARKET, radius: 90, done: 'Jax: "Mara! The Sunset Crew runs this city now. First job — bring me a fast car."', },
      { text: 'Steal any sports car (Comet GT or Sunset Coupe)', target: null, radius: 0, check: () => W.player.car && W.player.car.type.sport, done: 'Nice wheels. Now bring it to the Bayfront Garage.', },
      { text: 'Deliver the sports car to the Bayfront Garage', target: GARAGE, radius: 100, done: 'Jax: "Clean work. The crew is watching you, Mara."', },
    ],
  },
  {
    name: '2 · Hot Wheels', pay: 500,
    brief: 'The crew needs a Comet GT for a buyer at the Marina Pier. Take one and lose anyone who follows.',
    stages: [
      { text: 'Steal a Comet GT (red sports car)', target: null, radius: 0, check: () => W.player.car && W.player.car.type.name === 'Comet GT', done: 'Buyer is waiting at the pier. Go — and the cops are watching.', onStart: () => addHeat(30, 'the pier buyer tipped off the police'), },
      { text: 'Deliver the Comet GT to the Marina Pier', target: PIER, radius: 100, done: 'Buyer: "She drives like the wind. The crew pays well."', },
    ],
  },
  {
    name: '3 · Payback', pay: 700,
    brief: 'Three Sunset Crew enforcers jumped Jax. Mara goes to the Docks to settle it — with fists or a pistol.',
    stages: [
      { text: 'Go to the Docks Warehouse', target: WAREHOUSE, radius: 110, done: 'Enforcers ahead! Take down all 3.', onStart: () => spawnEnemies(WAREHOUSE, 3), },
      { text: 'Defeat the 3 enforcers (0/3)', target: WAREHOUSE, radius: 0, check: () => W.enemies.length === 0, done: 'Jax: "That is how you send a message in Solmar."', },
    ],
  },
  {
    name: '4 · The Getaway', pay: 800,
    brief: 'A crew courier is trapped by police near City Hall. Pick him up and outrun a 2-star chase to the hideout.',
    stages: [
      { text: 'Reach the courier at City Hall', target: HALL, radius: 90, done: 'Courier is in! Police are on you — lose them at the hideout.', onStart: () => addHeat(45, 'the pickup was watched'), },
      { text: 'Escape the police — reach the hideout', target: HIDEOUT, radius: 100, check: () => W.wanted <= 1, done: 'Courier: "You drive like my grandmother — fast and fearless."', },
    ],
  },
  {
    name: '5 · Bayfront Run', pay: 900,
    brief: 'A package must cross the city before the Palm Court Hotel deal closes. Ninety seconds, no excuses.',
    stages: [
      { text: 'Pick up the package at the hideout', target: HIDEOUT, radius: 80, done: 'Package secured. 90 seconds to the Palm Court Hotel!', onStart: () => { W.missionTimer = 90; }, },
      { text: 'Deliver to the Palm Court Hotel — beat the clock!', target: HOTEL, radius: 100, check: () => W.missionTimer > 0, done: 'Delivered with time to spare. The hotel deal is yours.', },
    ],
  },
  {
    name: '6 · Clean Sweep', pay: 1200,
    brief: 'The warehouse at the Docks is guarded by five of the Sunset Crew. Clear it out and take the ledger page.',
    stages: [
      { text: 'Go to the Docks Warehouse', target: WAREHOUSE, radius: 110, done: 'Five guards inside. Clear them all.', onStart: () => spawnEnemies(WAREHOUSE, 5), },
      { text: 'Clear the warehouse guards (0/5)', target: WAREHOUSE, radius: 0, check: () => W.enemies.length === 0, done: 'Ledger page secured — the Sunset Crew’s books are in your hands.', },
    ],
  },
  {
    name: '7 · The Ledger', pay: 1500,
    brief: 'The full ledger sits in the Sunset Bank vault office. Grab it and get out before the alarm brings the city down on you.',
    stages: [
      { text: 'Reach the Sunset Bank', target: BANK, radius: 100, done: 'Alarm tripped! Grab the ledger and run.', onStart: () => { spawnEnemies(BANK, 2); addHeat(50, 'the bank alarm'); }, },
      { text: 'Grab the ledger and escape to the hideout', target: HIDEOUT, radius: 100, check: () => W.wanted <= 2, done: 'The ledger is yours. One last job, Mara — the big one.', },
    ],
  },
  {
    name: '8 · Sunset Score', pay: 3000,
    brief: 'The final heist: rob the Sunset Bank cash van at the Marina, then outrun a 4-star chase home. This is the one they will sing about.',
    stages: [
      { text: 'Intercept the cash van at the Marina Pier', target: PIER, radius: 100, done: 'Van hit! $3,000 in the bag — now RUN. Four stars and counting.', onStart: () => { addHeat(85, 'the Sunset Score'); spawnEnemies(PIER, 3); }, },
      { text: 'Escape to the hideout with the cash', target: HIDEOUT, radius: 100, check: () => W.wanted <= 1, done: 'Mara Reyes owns Solmar Bay. The Sunset Score is legend.', },
    ],
  },
];

export function spawnEnemies(atPos, n) {
  W.enemies = [];
  for (let i = 0; i < n; i++) {
    W.enemies.push({
      x: atPos.x + (Math.random() - 0.5) * 160,
      y: atPos.y + (Math.random() - 0.5) * 160,
      hp: 60, angle: 0, speed: 95, shootT: 1 + Math.random(), kind: 'enforcer',
    });
  }
}

export function startMission(idx) {
  const m = MISSIONS[idx];
  if (!m) { W.mission = null; return; }
  W.mission = { ...m, stageIdx: 0, holdHeat: m.name.startsWith('4') || m.name.startsWith('8') };
  W.mission.stages = m.stages.map(s => ({ ...s, baseText: s.text }));
  W.missionIdx = idx;
  W.missionStage = 0;
  W.missionTimer = 0;
  W.enemies = [];
  say('MISSION: ' + m.name + ' — ' + m.brief, 6);
}

export function currentStage() {
  if (!W.mission) return null;
  return W.mission.stages[W.mission.stageIdx];
}

export function updateMissions(dt) {
  if (W.missionTimer > 0) {
    W.missionTimer -= dt;
    if (W.missionTimer <= 0 && W.mission) {
      say('Too slow! The deal closed. Mission failed — try again (press N).', 5);
      failMission();
      return;
    }
  }
  const m = W.mission;
  if (!m) return;
  const stage = currentStage();
  if (!stage) return;
  // Update the kill-count text live from the stored template.
  if (stage.baseText && stage.baseText.includes('(0/')) {
    const total = m.name.startsWith('3') ? 3 : 5;
    const left = W.enemies.length;
    stage.text = stage.baseText.replace('(0/' + total + ')', `(${total - left}/${total})`);
  }
  const p = W.player;
  let done = false;
  if (stage.target && dist(p.x, p.y, stage.target.x, stage.target.y) < stage.radius) done = true;
  if (!done && stage.check && stage.check()) done = true;
  if (!done) return;
  if (stage.done) say(stage.done, 5);
  m.stageIdx++;
  W.missionStage = m.stageIdx;
  const next = currentStage();
  if (next && next.onStart) next.onStart();
  if (!next) {
    addMoney(m.pay, p.x, p.y - 30);
    W.missionsDone++;
    say('MISSION COMPLETE: ' + m.name + ' — +$' + m.pay, 6);
    W.mission = null;
    W.missionTimer = 0;
    if (W.missionIdx + 1 >= MISSIONS.length) {
      W.mode = 'win';
    } else {
      const nextIdx = W.missionIdx + 1;
      setTimeout(() => { if (W.mode === 'play' && !W.mission) startMission(nextIdx); }, 2500);
    }
  }
}

export function failMission() {
  W.mission = null;
  W.missionTimer = 0;
  W.enemies = [];
}

export function skipMission() {
  if (!W.mission) return;
  failMission();
  startMission(W.missionIdx);
}

// ---- Side work -----------------------------------------------------------
export function startTaxi() {
  const p = W.player;
  if (!p.car) { say('You need a car to drive a taxi fare.'); return; }
  const dest = LANDMARKS[Math.floor(Math.random() * LANDMARKS.length)];
  W.taxi = { x: dest.x, y: dest.y, name: dest.name, pay: 120 + Math.floor(Math.random() * 120) };
  say('TAXI FARE: take your passenger to ' + dest.name + ' (+$' + W.taxi.pay + ')', 5);
}

export function updateTaxi(dt) {
  if (!W.taxi) return;
  const p = W.player;
  if (dist(p.x, p.y, W.taxi.x, W.taxi.y) < 90) {
    addMoney(W.taxi.pay, p.x, p.y - 30);
    W.fares++;
    say('Fare complete! +$' + W.taxi.pay + ' — press T for another fare.', 4);
    W.taxi = null;
  }
}

export function checkPackages() {
  const p = W.player;
  for (const pkg of W.city.packages) {
    if (!pkg.taken && dist(p.x, p.y, pkg.x, pkg.y) < 46) {
      pkg.taken = true;
      W.packages++;
      addMoney(100, pkg.x, pkg.y - 20);
      say('Hidden package found! ' + W.packages + '/12 — +$100', 4);
    }
  }
}
