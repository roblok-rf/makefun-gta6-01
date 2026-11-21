// render.js — draws Solmar Bay: warm sand ground, the beach and marina water
// on the south shore, asphalt avenues with lane dashes, sidewalks, buildings
// with roofs and windows, palm trees, cars, people, bullets and particles.
// Everything is canvas 2D with a sun-soaked palette; no images are loaded.
import { W, WORLD, clamp } from './state.js';
import { ROADS, DISTRICTS, districtAt } from './city.js';

const SAND = '#e8d5a8';
const GRASS = '#8fbf6f';
const WATER = '#3aa7c9';
const ROAD = '#3d4450';
const SIDEWALK = '#c9bfa8';

export function drawWorld(ctx, vw, vh) {
  const cam = W.cam;
  const ox = vw / 2 - cam.x, oy = vh / 2 - cam.y;
  ctx.save();
  ctx.translate(ox, oy);
  // Ground: sand base, grass park blocks, water along the south shore.
  ctx.fillStyle = SAND;
  ctx.fillRect(cam.x - vw / 2 - 40, cam.y - vh / 2 - 40, vw + 80, vh + 80);
  ctx.fillStyle = WATER;
  ctx.fillRect(cam.x - vw / 2 - 40, 2980, vw + 80, 260);
  ctx.fillStyle = '#7fd4e8';
  ctx.fillRect(cam.x - vw / 2 - 40, 2980, vw + 80, 10);
  // Park blocks.
  ctx.fillStyle = GRASS;
  ctx.fillRect(1455, 1855, 290, 290);
  ctx.fillRect(655, 1055, 290, 290);
  // City blocks (sidewalk slabs) then roads on top.
  ctx.fillStyle = SIDEWALK;
  for (let bx = 0; bx < 7; bx++) {
    for (let by = 0; by < 7; by++) {
      ctx.fillRect(ROADS[bx] + 40, ROADS[by] + 40, 320, 320);
    }
  }
  // Roads.
  ctx.fillStyle = ROAD;
  for (const r of ROADS) {
    ctx.fillRect(r - 40, 140, 80, WORLD - 280);
    ctx.fillRect(140, r - 40, WORLD - 280, 80);
  }
  // Lane dashes.
  ctx.fillStyle = '#f5d76e';
  for (const r of ROADS) {
    for (let v = 180; v < WORLD - 180; v += 80) {
      ctx.fillRect(r - 2, v, 4, 34);
      ctx.fillRect(v, r - 2, 34, 4);
    }
  }
  // Crosswalks at intersections.
  ctx.fillStyle = '#e8e8e8';
  for (const rx of ROADS) for (const ry of ROADS) {
    for (let i = -3; i <= 3; i++) {
      ctx.fillRect(rx + i * 11 - 4, ry - 40, 7, 14);
      ctx.fillRect(rx + i * 11 - 4, ry + 26, 7, 14);
    }
  }
  drawBuildings(ctx);
  drawTrees(ctx);
  drawPackages(ctx);
  drawPickups(ctx);
  drawCars(ctx);
  drawPeds(ctx);
  drawEnemies(ctx);
  drawPlayer(ctx);
  drawBullets(ctx);
  drawParticles(ctx);
  drawFloats(ctx);
  drawMissionTarget(ctx);
  ctx.restore();
}

function drawBuildings(ctx) {
  for (const b of W.city.buildings) {
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.fillRect(b.x + 6, b.y + 8, b.w, b.h);
    ctx.fillStyle = b.color;
    ctx.fillRect(b.x, b.y, b.w, b.h);
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    ctx.fillRect(b.x, b.y, b.w, 8);
    if (b.tall) {
      ctx.fillStyle = 'rgba(255,255,255,0.35)';
      for (let f = 0; f < Math.min(b.floors, 10); f++) {
        for (let wx = 10; wx < b.w - 10; wx += 22) {
          ctx.fillRect(b.x + wx, b.y + 12 + f * ((b.h - 20) / 10), 12, 8);
        }
      }
    } else {
      ctx.fillStyle = 'rgba(0,0,0,0.35)';
      ctx.fillRect(b.x + b.w / 2 - 10, b.y + b.h - 22, 20, 22);
    }
  }
}

function drawTrees(ctx) {
  for (const t of W.city.trees) {
    ctx.fillStyle = '#5e8c4a';
    ctx.beginPath(); ctx.arc(t.x, t.y, t.r, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#7fbf5f';
    ctx.beginPath(); ctx.arc(t.x - 3, t.y - 3, t.r * 0.6, 0, Math.PI * 2); ctx.fill();
  }
}

function drawPackages(ctx) {
  for (const p of W.city.packages) {
    if (p.taken) continue;
    const pulse = 1 + Math.sin(W.time * 4) * 0.15;
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.scale(pulse, pulse);
    ctx.fillStyle = '#ffd166';
    ctx.fillRect(-9, -9, 18, 18);
    ctx.fillStyle = '#e63946';
    ctx.fillRect(-9, -3, 18, 6);
    ctx.restore();
  }
}

function drawPickups(ctx) {
  for (const pk of W.pickups) {
    ctx.save();
    ctx.translate(pk.x, pk.y);
    ctx.fillStyle = pk.kind === 'health' ? '#ff5d8f' : pk.kind === 'armor' ? '#4cc9f0' : '#ffd166';
    ctx.beginPath(); ctx.arc(0, 0, 12, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 13px sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(pk.kind === 'health' ? '+' : pk.kind === 'armor' ? 'A' : '$', 0, 1);
    ctx.restore();
  }
}

function drawCarShape(ctx, car) {
  ctx.save();
  ctx.translate(car.x, car.y);
  ctx.rotate(car.angle);
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.fillRect(-car.w / 2 + 4, -car.h / 2 + 5, car.w, car.h);
  ctx.fillStyle = car.type.color;
  roundRect(ctx, -car.w / 2, -car.h / 2, car.w, car.h, 7);
  ctx.fill();
  ctx.fillStyle = 'rgba(180,220,255,0.85)';
  ctx.fillRect(car.w * 0.08, -car.h / 2 + 3, car.w * 0.22, car.h - 6);
  ctx.fillStyle = 'rgba(0,0,0,0.55)';
  ctx.fillRect(-car.w / 2 + 2, -car.h / 2 - 2, 5, 5);
  ctx.fillRect(-car.w / 2 + 2, car.h / 2 - 3, 5, 5);
  ctx.fillRect(car.w / 2 - 7, -car.h / 2 - 2, 5, 5);
  ctx.fillRect(car.w / 2 - 7, car.h / 2 - 3, 5, 5);
  if (car.police) {
    ctx.fillStyle = '#fff';
    ctx.fillRect(-6, -car.h / 2 + 2, 12, car.h - 4);
    ctx.fillStyle = '#111';
    ctx.font = 'bold 8px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('POLICE', 0, -car.h / 2 - 5);
    if (car.siren) {
      const flash = Math.sin(W.time * 10) > 0;
      ctx.fillStyle = flash ? '#ff2d2d' : '#2d6bff';
      ctx.beginPath(); ctx.arc(0, 0, 7, 0, Math.PI * 2); ctx.fill();
    }
  }
  if (car.type.taxi) {
    ctx.fillStyle = '#111';
    ctx.font = 'bold 8px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('TAXI', 0, -car.h / 2 - 5);
  }
  ctx.restore();
}

export function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawCars(ctx) {
  for (const car of W.cars) drawCarShape(ctx, car);
}

function drawPeds(ctx) {
  for (const ped of W.peds) {
    const bob = Math.sin(ped.walkPhase) * 2;
    ctx.save();
    ctx.translate(ped.x, ped.y + bob * 0.3);
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.beginPath(); ctx.ellipse(0, 6, 7, 3, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = ped.shirt;
    ctx.beginPath(); ctx.arc(0, 0, 9, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#f2c89b';
    ctx.beginPath(); ctx.arc(0, -2, 5, 0, Math.PI * 2); ctx.fill();
    if (ped.panic > 0) {
      ctx.fillStyle = '#ff2d2d';
      ctx.font = 'bold 14px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('!', 0, -16);
    }
    ctx.restore();
  }
}

function drawEnemies(ctx) {
  for (const e of W.enemies) {
    ctx.save();
    ctx.translate(e.x, e.y);
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath(); ctx.ellipse(0, 7, 9, 4, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#3a0ca3';
    ctx.beginPath(); ctx.arc(0, 0, 11, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#f2c89b';
    ctx.beginPath(); ctx.arc(0, -2, 5, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#222';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(Math.cos(e.angle) * 18, Math.sin(e.angle) * 18);
    ctx.stroke();
    // Health bar.
    ctx.fillStyle = '#111';
    ctx.fillRect(-14, -24, 28, 5);
    ctx.fillStyle = '#ff2d2d';
    ctx.fillRect(-14, -24, 28 * Math.max(0, e.hp / 60), 5);
    ctx.restore();
  }
}

function drawPlayer(ctx) {
  const p = W.player;
  if (!p.onFoot) return;
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.rotate(p.angle);
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.beginPath(); ctx.ellipse(2, 6, 9, 4, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#ff5d8f';
  ctx.beginPath(); ctx.arc(0, 0, 11, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.beginPath(); ctx.arc(4, 0, 4, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#222';
  ctx.beginPath(); ctx.arc(0, -3, 5, 0, Math.PI * 2); ctx.fill();
  if (W.weapon === 'pistol') {
    ctx.strokeStyle = '#222';
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(6, 0); ctx.lineTo(22, 0); ctx.stroke();
  }
  if (W.punchT > 0) {
    ctx.fillStyle = '#ffd166';
    ctx.beginPath(); ctx.arc(20, 0, 6, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
  // A soft ring so the player is always findable in a crowd.
  ctx.strokeStyle = 'rgba(255,255,255,0.7)';
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(p.x, p.y, 18 + Math.sin(W.time * 3) * 2, 0, Math.PI * 2); ctx.stroke();
}

function drawBullets(ctx) {
  ctx.strokeStyle = '#ffe66d';
  ctx.lineWidth = 3;
  for (const b of W.bullets) {
    ctx.beginPath();
    ctx.moveTo(b.x - Math.cos(b.angle) * 14, b.y - Math.sin(b.angle) * 14);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
  }
}

function drawParticles(ctx) {
  for (const pt of W.particles) {
    ctx.globalAlpha = Math.max(0, pt.t / 0.5);
    ctx.fillStyle = pt.color;
    ctx.beginPath(); ctx.arc(pt.x, pt.y, pt.r, 0, Math.PI * 2); ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function drawFloats(ctx) {
  ctx.font = 'bold 15px sans-serif';
  ctx.textAlign = 'center';
  for (const f of W.floats) {
    ctx.globalAlpha = Math.max(0, f.t / 1.4);
    ctx.fillStyle = f.color;
    ctx.fillText(f.text, f.x, f.y);
  }
  ctx.globalAlpha = 1;
}

function drawMissionTarget(ctx) {
  const m = W.mission;
  const target = m ? (m.stages[m.stageIdx] || {}).target : null;
  const taxi = W.taxi;
  const spots = [];
  if (target) spots.push({ x: target.x, y: target.y, color: '#ffd166' });
  if (taxi) spots.push({ x: taxi.x, y: taxi.y, color: '#7dff8a' });
  for (const s of spots) {
    const bob = Math.sin(W.time * 5) * 6;
    ctx.save();
    ctx.translate(s.x, s.y + bob - 30);
    ctx.fillStyle = s.color;
    ctx.beginPath();
    ctx.moveTo(0, 18); ctx.lineTo(-13, -8); ctx.lineTo(13, -8); ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#111';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();
    ctx.strokeStyle = s.color;
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(s.x, s.y, 26 + Math.sin(W.time * 5) * 4, 0, Math.PI * 2); ctx.stroke();
  }
}
