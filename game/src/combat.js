// combat.js — fighting on foot: fists, the pistol Mara picks up in mission 3,
// and the enforcers who shoot back. Bullets are simple tracers with a short
// life; a hit on an enforcer, a cop car or a pedestrian has consequences.
import { W, dist, angleTo, clamp, addFloat, say } from './state.js';
import { addHeat } from './wanted.js';
import { sfx } from './audio.js';

export function givePistol() {
  if (W.weapon !== 'pistol') {
    W.weapon = 'pistol';
    W.ammo = 24;
    say('Picked up a pistol — aim with the mouse, click to shoot, R to reload.');
  } else {
    W.ammo += 12;
  }
}

export function updateCombat(dt) {
  const p = W.player;
  // Enemies hunt the player and shoot when close.
  for (const e of W.enemies) {
    const d = dist(e.x, e.y, p.x, p.y);
    e.angle = angleTo(e.x, e.y, p.x, p.y);
    if (d > 130) {
      e.x += Math.cos(e.angle) * e.speed * dt;
      e.y += Math.sin(e.angle) * e.speed * dt;
    }
    e.shootT -= dt;
    if (e.shootT <= 0 && d < 520) {
      e.shootT = 1.4 + Math.random();
      fireBullet(e.x, e.y, e.angle + (Math.random() - 0.5) * 0.15, 520, 'enemy');
      sfx('shot');
    }
    // Enforcers also close in on foot when the player hides behind a car.
    if (d < 60 && W.player.car) { e.shootT = Math.min(e.shootT, 0.4); }
  }
  // Bullets fly, hit buildings, enemies, cops, peds or the player.
  for (let i = W.bullets.length - 1; i >= 0; i--) {
    const b = W.bullets[i];
    b.x += Math.cos(b.angle) * b.speed * dt;
    b.y += Math.sin(b.angle) * b.speed * dt;
    b.life -= dt;
    let dead = b.life <= 0;
    if (!dead) {
      const hitB = W.city && W.city.buildings.some(bd => b.x > bd.x && b.x < bd.x + bd.w && b.y > bd.y && b.y < bd.y + bd.h);
      if (hitB || b.x < 100 || b.x > 3100 || b.y < 100 || b.y > 3100) dead = true;
    }
    if (!dead && b.from === 'player') {
      for (let j = W.enemies.length - 1; j >= 0; j--) {
        const e = W.enemies[j];
        if (dist(b.x, b.y, e.x, e.y) < 22) {
          e.hp -= 34;
          addFloat(e.x, e.y - 18, '-34', '#ffd166');
          blood(e.x, e.y);
          if (e.hp <= 0) {
            W.enemies.splice(j, 1);
            W.kills++;
            addHeat(8, 'a shooting in the Docks');
            say('Enforcer down! ' + W.enemies.length + ' left.');
          }
          dead = true;
          break;
        }
      }
      if (!dead) {
        for (const cop of W.cops) {
          if (dist(b.x, b.y, cop.car.x, cop.car.y) < 30) {
            addHeat(20, 'shooting at the police');
            dead = true;
            break;
          }
        }
      }
      if (!dead) {
        for (const ped of W.peds) {
          if (dist(b.x, b.y, ped.x, ped.y) < 16) {
            ped.panic = 4;
            addHeat(15, 'a pedestrian was hit');
            dead = true;
            break;
          }
        }
      }
    }
    if (!dead && b.from === 'enemy' && p.onFoot && dist(b.x, b.y, p.x, p.y) < 16) {
      hurtPlayer(12);
      dead = true;
    }
    if (dead) W.bullets.splice(i, 1);
  }
  // Melee: F swings at whatever is in front of you.
  if (W.punchT > 0) W.punchT -= dt;
}

export function fireBullet(x, y, angle, speed, from) {
  W.bullets.push({ x, y, angle, speed, from, life: 0.9 });
}

export function playerShoot() {
  const p = W.player;
  if (!p.onFoot || W.mode !== 'play') return;
  if (W.weapon === 'pistol') {
    if (W.ammo <= 0) { say('Out of ammo — press R to reload (find ammo by the hideout).'); return; }
    W.ammo--;
    W.stats.shotsFired++;
    const a = angleTo(p.x, p.y, W.cam.x + (W.mouse.x - 640), W.cam.y + (W.mouse.y - 400));
    fireBullet(p.x + Math.cos(a) * 24, p.y + Math.sin(a) * 24, a, 900, 'player');
    addHeat(2, 'gunfire in the street');
    sfx('shot');
  }
}

export function playerPunch() {
  const p = W.player;
  if (!p.onFoot || W.punchT > 0) return;
  W.punchT = 0.35;
  const a = p.angle;
  for (let j = W.enemies.length - 1; j >= 0; j--) {
    const e = W.enemies[j];
    if (dist(p.x, p.y, e.x, e.y) < 52 && Math.abs(((angleTo(p.x, p.y, e.x, e.y) - a + Math.PI * 3) % (Math.PI * 2)) - Math.PI) < 1.1) {
      e.hp -= 25;
      addFloat(e.x, e.y - 18, '-25', '#ffd166');
      if (e.hp <= 0) { W.enemies.splice(j, 1); W.kills++; say('Enforcer down! ' + W.enemies.length + ' left.'); }
    }
  }
  sfx('punch');
}

export function hurtPlayer(n) {
  if (W.armor > 0) {
    const absorbed = Math.min(W.armor, n);
    W.armor -= absorbed;
    n -= absorbed;
  }
  W.health = clamp(W.health - n, 0, 100);
  if (W.health <= 0) {
    W.mode = 'dead';
    say('WASTED — Mara is down. Press R to restart at the hideout.');
  }
}

export function blood(x, y) {
  for (let i = 0; i < 8; i++) {
    W.particles.push({ x, y, vx: (Math.random() - 0.5) * 120, vy: (Math.random() - 0.5) * 120, t: 0.5, color: '#c1121f', r: 2 + Math.random() * 3 });
  }
}
