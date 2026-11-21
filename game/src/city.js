// city.js — Solmar Bay: a sun-soaked fictional coastal city, generated once
// from a fixed seed so every run has the same streets, districts and landmarks.
// The city is a grid of avenues every 400 px with named districts, a beach
// and marina on the south shore, a park, and a downtown of tall towers.
import { WORLD, mulberry32, pick } from './state.js';

export const ROAD_STEP = 400;
export const ROADS = [200, 600, 1000, 1400, 1800, 2200, 2600, 3000];

export const DISTRICTS = [
  { name: 'Downtown', x0: 1200, y0: 200, x1: 2200, y1: 1400, color: '#8fa3b8' },
  { name: 'Marina', x0: 200, y0: 2200, x1: 1200, y1: 3000, color: '#5fb8c9' },
  { name: 'Beachfront', x0: 1200, y0: 2600, x1: 3000, y1: 3200, color: '#f2d8a0' },
  { name: 'Old Town', x0: 200, y0: 200, x1: 1200, y1: 1400, color: '#d9a066' },
  { name: 'Palm Heights', x0: 2200, y0: 200, x1: 3000, y1: 1400, color: '#9ccb7a' },
  { name: 'The Docks', x0: 2200, y0: 1400, x1: 3000, y1: 2600, color: '#7a8a99' },
];

export const LANDMARKS = [
  { name: 'Solmar Hideout', x: 1600, y: 1400, kind: 'hideout' },
  { name: 'Bayfront Garage', x: 1000, y: 2600, kind: 'garage' },
  { name: 'Marina Pier', x: 600, y: 3000, kind: 'pier' },
  { name: 'Sunset Bank', x: 1800, y: 1000, kind: 'bank' },
  { name: 'The Docks Warehouse', x: 2600, y: 1800, kind: 'warehouse' },
  { name: 'Palm Court Hotel', x: 2600, y: 600, kind: 'hotel' },
  { name: 'Old Town Market', x: 600, y: 600, kind: 'market' },
  { name: 'City Hall', x: 1400, y: 600, kind: 'hall' },
];

const ROOFS = ['#e07856', '#e8a34c', '#c96f4a', '#7fa8c9', '#a8b8c8', '#d9c27a', '#b07890', '#6fae8f'];

export function buildCity() {
  const rng = mulberry32(20261121);
  const buildings = [];
  const trees = [];
  const packages = [];
  for (let bx = 0; bx < 7; bx++) {
    for (let by = 0; by < 7; by++) {
      const x0 = ROADS[bx] + 55, y0 = ROADS[by] + 55;
      const x1 = ROADS[bx + 1] - 55, y1 = ROADS[by + 1] - 55;
      const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
      const district = DISTRICTS.find(d => cx >= d.x0 && cx < d.x1 && cy >= d.y0 && cy < d.y1);
      const downtown = district && district.name === 'Downtown';
      const park = (bx === 3 && by === 4) || (bx === 1 && by === 2);
      if (park) {
        for (let i = 0; i < 9; i++) trees.push({ x: x0 + rng() * (x1 - x0), y: y0 + rng() * (y1 - y0), r: 10 + rng() * 8 });
        continue;
      }
      const n = downtown ? 2 : 1;
      for (let i = 0; i < n; i++) {
        const w = downtown ? 90 + rng() * 70 : 130 + rng() * 90;
        const h = downtown ? 90 + rng() * 70 : 110 + rng() * 90;
        const x = x0 + (i === 0 ? 10 : x1 - x0 - w - 10) + (n === 1 ? rng() * (x1 - x0 - w - 20) : 0);
        const y = y0 + 10 + rng() * Math.max(1, y1 - y0 - h - 20);
        buildings.push({
          x, y, w, h,
          color: pick(rng, ROOFS),
          tall: downtown,
          floors: downtown ? 8 + Math.floor(rng() * 14) : 1 + Math.floor(rng() * 3),
          district: district ? district.name : 'Solmar',
        });
      }
      if (rng() < 0.7) trees.push({ x: x0 + 12, y: y0 + 12, r: 9 + rng() * 6 });
      if (rng() < 0.5) trees.push({ x: x1 - 12, y: y1 - 12, r: 9 + rng() * 6 });
    }
  }
  // 12 hidden packages tucked into corners of the city
  const spots = [[260, 260], [2940, 260], [260, 2940], [2940, 2940], [620, 1420], [2380, 1420], [1420, 620], [1420, 2380], [1020, 1020], [2180, 2180], [620, 2580], [2580, 620]];
  for (const [x, y] of spots) packages.push({ x, y, taken: false });
  // Landmark positions are fixed; the city generator never places a building
  // on top of one (landmarks sit on road-adjacent plazas, checked at boot).
  return { buildings, trees, packages, rng };
}

export function districtAt(x, y) {
  const d = DISTRICTS.find(d => x >= d.x0 && x < d.x1 && y >= d.y0 && y < d.y1);
  return d ? d.name : 'Solmar Bay';
}

export function nearestRoad(v) {
  let best = ROADS[0], bd = 1e9;
  for (const r of ROADS) { const d = Math.abs(r - v); if (d < bd) { bd = d; best = r; } }
  return best;
}

// True when the point is inside a building (solid for cars and people).
export function hitsBuilding(city, x, y, pad = 0) {
  for (const b of city.buildings) {
    if (x > b.x - pad && x < b.x + b.w + pad && y > b.y - pad && y < b.y + b.h + pad) return b;
  }
  return null;
}

// Snap a point onto the nearest road centreline (used for traffic spawns).
export function onRoad(x, y) {
  const rx = nearestRoad(x), ry = nearestRoad(y);
  return Math.abs(x - rx) < Math.abs(y - ry) ? { x: rx, y } : { x, y: ry };
}
