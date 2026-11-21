// hud.js — everything drawn on top of the world: the start screen, the HUD
// (cash, health, armor, wanted stars, weapon, clock, district), the mission
// objective panel, the minimap with live blips, pause / dead / win screens,
// and the control hints. The minimap is the same city, shrunk, with the
// player, cops, mission target and taxi fare as coloured dots.
import { W, WORLD } from './state.js';
import { districtAt, ROADS } from './city.js';
import { wantedLabel } from './wanted.js';
import { currentStage } from './missions.js';

const MAP_SIZE = 190;

export function drawHUD(ctx, vw, vh) {
  if (W.mode === 'menu') { drawMenu(ctx, vw, vh); return; }
  drawTopBar(ctx, vw);
  drawObjective(ctx, vw);
  drawMinimap(ctx, vw, vh);
  drawBottomBar(ctx, vw, vh);
  drawMessage(ctx, vw, vh);
  drawLog(ctx, vw, vh);
  if (W.mode === 'pause') drawPause(ctx, vw, vh);
  if (W.mode === 'dead') drawDead(ctx, vw, vh);
  if (W.mode === 'win') drawWin(ctx, vw, vh);
}

function panel(ctx, x, y, w, h) {
  ctx.fillStyle = 'rgba(10,14,22,0.72)';
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = 'rgba(255,255,255,0.25)';
  ctx.lineWidth = 1;
  ctx.strokeRect(x + 0.5, y + 0.5, w, h);
}

function drawTopBar(ctx, vw) {
  panel(ctx, 12, 12, 300, 86);
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillStyle = '#7dff8a';
  ctx.font = 'bold 26px sans-serif';
  ctx.fillText('$' + W.money.toLocaleString(), 24, 20);
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 15px sans-serif';
  ctx.fillText('Mara Reyes  ·  ' + districtAt(W.player.x, W.player.y), 24, 52);
  const hh = String(Math.floor(W.clock / 60) % 24).padStart(2, '0');
  const mm = String(Math.floor(W.clock % 60)).padStart(2, '0');
  ctx.fillStyle = '#ffd166';
  ctx.font = 'bold 15px sans-serif';
  ctx.fillText(hh + ':' + mm + '  ·  Missions ' + W.missionsDone + '/8', 24, 72);
  // Wanted stars, top centre.
  const cx = vw / 2;
  panel(ctx, cx - 130, 12, 260, 58);
  ctx.textAlign = 'center';
  for (let i = 0; i < 5; i++) {
    ctx.fillStyle = i < W.wanted ? '#ffd166' : 'rgba(255,255,255,0.25)';
    ctx.font = '28px sans-serif';
    ctx.fillText('★', cx - 96 + i * 48, 16);
  }
  if (W.wanted > 0) {
    ctx.fillStyle = '#ff7d7d';
    ctx.font = 'bold 13px sans-serif';
    ctx.fillText(wantedLabel().toUpperCase(), cx, 42);
  }
  // Health / armor, below the minimap with a gap so the minimap's
  // SOLMAR BAY label never overlaps it.
  const hy = 12 + MAP_SIZE + 30;
  panel(ctx, vw - 214, hy, 202, 84);
  ctx.textAlign = 'left';
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 13px sans-serif';
  ctx.fillText('HEALTH', vw - 202, hy + 8);
  bar(ctx, vw - 202, hy + 26, 178, 10, W.health / 100, '#ff5d6c');
  ctx.fillText('ARMOR', vw - 202, hy + 42);
  bar(ctx, vw - 202, hy + 56, 178, 8, W.armor / 100, '#4cc9f0');
}

function bar(ctx, x, y, w, h, frac, color) {
  ctx.fillStyle = 'rgba(255,255,255,0.18)';
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w * Math.max(0, Math.min(1, frac)), h);
}

function drawObjective(ctx, vw) {
  const stage = currentStage();
  const lines = [];
  if (W.mission) {
    lines.push('★ ' + W.mission.name + '   (+$' + W.mission.pay + ')');
    lines.push(stage ? stage.text : '');
    if (W.missionTimer > 0) lines.push('⏱ ' + Math.ceil(W.missionTimer) + ' seconds left!');
  } else if (W.missionsDone >= 8) {
    lines.push('All missions complete — Solmar Bay is yours!');
  } else {
    lines.push('No active mission — press ENTER for the next job.');
    lines.push('Side work: T taxi fare · find 12 hidden packages (' + W.packages + '/12)');
  }
  if (W.taxi) lines.push('TAXI → ' + W.taxi.name + '  (+$' + W.taxi.pay + ')');
  const h = 24 + lines.length * 20;
  panel(ctx, 12, 110, 420, h);
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  lines.forEach((ln, i) => {
    ctx.fillStyle = i === 0 ? '#ffd166' : '#fff';
    ctx.font = (i === 0 ? 'bold ' : '') + '15px sans-serif';
    ctx.fillText(ln, 24, 118 + i * 20);
  });
}

function drawMinimap(ctx, vw, vh) {
  const x0 = vw - 12 - MAP_SIZE, y0 = 12;
  const s = MAP_SIZE / WORLD;
  panel(ctx, x0 - 6, y0 - 6, MAP_SIZE + 12, MAP_SIZE + 12);
  ctx.save();
  ctx.beginPath(); ctx.rect(x0, y0, MAP_SIZE, MAP_SIZE); ctx.clip();
  ctx.fillStyle = '#d9c48f';
  ctx.fillRect(x0, y0, MAP_SIZE, MAP_SIZE);
  ctx.fillStyle = '#3aa7c9';
  ctx.fillRect(x0, y0 + 2980 * s, MAP_SIZE, MAP_SIZE - 2980 * s);
  ctx.fillStyle = '#3d4450';
  for (const r of ROADS) {
    ctx.fillRect(x0 + r * s - 2, y0, 4, MAP_SIZE);
    ctx.fillRect(x0, y0 + r * s - 2, MAP_SIZE, 4);
  }
  const dot = (x, y, color, r) => {
    ctx.fillStyle = color;
    ctx.beginPath(); ctx.arc(x0 + x * s, y0 + y * s, r, 0, Math.PI * 2); ctx.fill();
  };
  const stage = currentStage();
  if (stage && stage.target) dot(stage.target.x, stage.target.y, '#ffd166', 6);
  if (W.taxi) dot(W.taxi.x, W.taxi.y, '#7dff8a', 5);
  for (const cop of W.cops) dot(cop.car.x, cop.car.y, '#2d6bff', 4);
  for (const e of W.enemies) dot(e.x, e.y, '#ff2d2d', 4);
  dot(W.player.x, W.player.y, '#ff5d8f', 5);
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.arc(x0 + W.player.x * s, y0 + W.player.y * s, 7, 0, Math.PI * 2); ctx.stroke();
  ctx.restore();
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 12px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('SOLMAR BAY', x0, y0 + MAP_SIZE + 14);
}

function drawBottomBar(ctx, vw, vh) {
  const p = W.player;
  panel(ctx, 12, vh - 52, 460, 40);
  ctx.fillStyle = '#fff';
  ctx.font = '14px sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  let left;
  if (p.car) {
    const mph = Math.round(Math.abs(p.car.speed) * 0.12);
    left = p.car.type.name + '  ·  ' + mph + ' mph  ·  E exit  ·  Space handbrake';
  } else {
    left = (W.weapon === 'pistol' ? 'Pistol ' + W.ammo + ' rds' : 'Fists') +
      '  ·  E enter car  ·  F punch  ·  click shoot  ·  T taxi  ·  C save';
  }
  ctx.fillText(left, 24, vh - 40);
  // Right-hand counters get their own dark panel so they stay legible
  // over the bright sand and never clip at the screen edge.
  const right = 'Kills ' + W.kills + '  ·  Cars ' + W.carsStolen + '  ·  Fares ' + W.fares;
  const rw = ctx.measureText(right).width + 24;
  panel(ctx, vw - 12 - rw, vh - 52, rw, 40);
  ctx.textAlign = 'right';
  ctx.fillStyle = '#ffd166';
  ctx.fillText(right, vw - 24, vh - 40);
}

function drawMessage(ctx, vw, vh) {
  if (W.messageT <= 0 || !W.message) return;
  ctx.textAlign = 'center';
  ctx.font = 'bold 19px sans-serif';
  const w = ctx.measureText(W.message).width + 36;
  panel(ctx, vw / 2 - w / 2, vh - 118, w, 34);
  ctx.fillStyle = '#fff';
  ctx.textBaseline = 'middle';
  ctx.fillText(W.message, vw / 2, vh - 100);
}

function drawLog(ctx, vw, vh) {
  const lines = W.log.slice(0, 4);
  if (!lines.length) return;
  const h = lines.length * 18 + 14;
  // Sit above the message banner so the two never overlap.
  const y = vh - 128 - h;
  ctx.font = '13px sans-serif';
  const w = Math.min(vw - 24, Math.max(...lines.map(l => ctx.measureText(l).width)) + 24);
  panel(ctx, 12, y, w, h);
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.font = '13px sans-serif';
  lines.forEach((ln, i) => {
    ctx.fillStyle = 'rgba(255,255,255,' + (0.95 - i * 0.18) + ')';
    ctx.fillText(ln, 24, y + 8 + i * 18);
  });
}

function drawMenu(ctx, vw, vh) {
  const g = ctx.createLinearGradient(0, 0, 0, vh);
  g.addColorStop(0, '#ff9e5e');
  g.addColorStop(0.55, '#e63946');
  g.addColorStop(1, '#3a0ca3');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, vw, vh);
  ctx.fillStyle = 'rgba(255,255,255,0.12)';
  for (let i = 0; i < 24; i++) {
    const x = (i * 173) % vw;
    ctx.fillRect(x, vh - 120 - ((i * 37) % 90), 60, 120);
  }
  ctx.textAlign = 'center';
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 84px sans-serif';
  ctx.fillText('SOLMAR BAY', vw / 2, 190);
  ctx.fillStyle = '#ffd166';
  ctx.font = 'bold 30px sans-serif';
  ctx.fillText('An open-world crime story in the sun', vw / 2, 240);
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 17px sans-serif';
  ctx.fillText('8 story missions  ·  5 wanted levels  ·  cars to steal  ·  a living city', vw / 2, 272);
  ctx.fillStyle = '#fff';
  ctx.font = '18px sans-serif';
  const lines = [
    'Mara Reyes is back in Solmar Bay — and the Sunset Crew runs the city.',
    'Steal cars, outrun the police, run 8 story missions, and take the city back.',
    '',
    'WASD drive / walk   ·   E enter & steal cars   ·   Mouse aim, click shoot   ·   F punch',
    'T taxi fare   ·   C save   ·   N restart mission   ·   P pause   ·   M mute',
    '',
    '8 missions  ·  wanted levels & police chases  ·  traffic & pedestrians',
    'hidden packages  ·  taxi fares  ·  a living minimap',
  ];
  lines.forEach((ln, i) => ctx.fillText(ln, vw / 2, 300 + i * 28));
  const blink = Math.sin(W.time * 4) > -0.2;
  if (blink) {
    ctx.fillStyle = '#ffd166';
    ctx.font = 'bold 26px sans-serif';
    ctx.fillText('— PRESS ENTER TO START —', vw / 2, 590);
  }
  ctx.fillStyle = 'rgba(255,255,255,0.75)';
  ctx.font = '14px sans-serif';
  ctx.fillText('A fully original game: its own city, characters, vehicles and story. No network needed.', vw / 2, vh - 30);
}

function drawPause(ctx, vw, vh) {
  dim(ctx, vw, vh);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 52px sans-serif';
  ctx.fillText('PAUSED', vw / 2, vh / 2 - 40);
  ctx.font = '20px sans-serif';
  ctx.fillText('P or Esc to resume  ·  C save  ·  R restart at the hideout', vw / 2, vh / 2 + 10);
  ctx.fillText('Progress: ' + W.missionsDone + '/8 missions  ·  $' + W.money.toLocaleString() + '  ·  ' + W.packages + '/12 packages', vw / 2, vh / 2 + 44);
}

function drawDead(ctx, vw, vh) {
  dim(ctx, vw, vh);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ff5d6c';
  ctx.font = 'bold 72px sans-serif';
  ctx.fillText('WASTED', vw / 2, vh / 2 - 30);
  ctx.fillStyle = '#fff';
  ctx.font = '20px sans-serif';
  ctx.fillText('Mara is down. Press R to wake up at the hideout — the city is still waiting.', vw / 2, vh / 2 + 20);
}

function drawWin(ctx, vw, vh) {
  dim(ctx, vw, vh);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffd166';
  ctx.font = 'bold 56px sans-serif';
  ctx.fillText('THE SUNSET SCORE', vw / 2, vh / 2 - 60);
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 26px sans-serif';
  ctx.fillText('Mara Reyes owns Solmar Bay.', vw / 2, vh / 2 - 10);
  ctx.font = '19px sans-serif';
  ctx.fillText('All 8 missions complete  ·  $' + W.money.toLocaleString() + '  ·  ' + W.kills + ' takedowns  ·  ' + W.carsStolen + ' cars stolen', vw / 2, vh / 2 + 30);
  ctx.fillText('Press ENTER to keep playing the open city, or R to start the story again.', vw / 2, vh / 2 + 64);
}

function dim(ctx, vw, vh) {
  ctx.fillStyle = 'rgba(0,0,0,0.6)';
  ctx.fillRect(0, 0, vw, vh);
}
