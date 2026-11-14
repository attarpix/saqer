/* ============================================================
   HERCULES — the fight in the Roman theatre

   He walks Saqer down and picks an attack:
     club smash   long wind-up, then a shockwave runs along the floor both ways: jump it
     boulder      he swings and hurls a boulder that rolls along the floor (jump it); when he is angry,
                  a second rock flies at head height (stay down). (It was a flying lion's roar, until 2026-11-14.)
     charge       (once he has been hit twice) he runs the length of the arena: jump over him
   After every attack he has to catch his breath (stars over his head).
   That is the only time a stomp on his head counts. At any other time
   the stomp just bounces off, so jumping on him is never punished.
   D.boss stomps bring him down (it depends on the mode: config.js MODES). He gets faster as he loses health.
   ============================================================ */
import { TILE, GROUND_TOP, D } from './config.js';
import { G, W, player } from './state.js';
import { level } from './level.js';
import { overlap, clamp, sign } from './physics.js';
import { sfx, crowd } from './audio.js';
import { hurtPlayer } from './player.js';
import { addScore } from './world.js';

const GY = GROUND_TOP * TILE;

export function spawnBoss() {
  G.boss = {
    x: 20 * TILE, y: GY - 48, w: 26, h: 48,
    facing: -1, hp: D.boss, state: 'intro', t: 0, anim: 0,
    rest: 0, dir: -1, flash: 0, blockT: 0, shots: [], done: false,
  };
}

export const bossPhase = b => (b.hp > D.boss * 2 / 3 ? 1 : b.hp > D.boss / 3 ? 2 : 3);   // three stages, whatever BOSS_HP is
export const bossOpen = b => b.state === 'recover';          // can be hurt right now
const set = (b, s) => { b.state = s; b.t = 0; };

export function updateBoss() {
  const b = G.boss;
  if (!b) return;
  b.t++; b.anim++;
  if (b.flash > 0) b.flash--;
  if (b.blockT > 0) b.blockT--;
  const ph = bossPhase(b);
  const dist = (player.x + player.w / 2) - (b.x + b.w / 2);
  const minX = 6, maxX = level.w * TILE - b.w - 6;

  switch (b.state) {
    case 'intro':
      b.facing = sign(dist) || -1;
      if (b.t === 20) sfx.roar();
      if (b.t > 80) set(b, 'walk');
      break;
    case 'walk':
      b.facing = sign(dist) || b.facing;
      b.x = clamp(b.x + b.facing * (0.5 + ph * 0.22), minX, maxX);
      if (Math.abs(dist) < 44) set(b, 'windup');
      else if (b.t > 105 - ph * 18) {
        if (ph >= 2 && Math.random() < 0.45) { set(b, 'charge'); b.dir = b.facing; sfx.roar(); }
        else set(b, 'roarUp');
      }
      break;
    case 'windup':
      if (b.t > 42 - ph * 5) { set(b, 'smash'); smash(b, ph); }
      break;
    case 'smash':
      if (b.t > 16) { set(b, 'recover'); b.rest = 150 - ph * 16; }
      break;
    case 'roarUp':
      b.facing = sign(dist) || b.facing;
      if (b.t > 36 - ph * 5) set(b, 'roar');
      break;
    case 'roar':
      if (b.t === 8) hurl(b, false);
      if (ph === 3 && b.t === 40) hurl(b, true);
      if (b.t > (ph === 3 ? 66 : 44)) { set(b, 'recover'); b.rest = 160 - ph * 18; }
      break;
    case 'charge':
      b.x += b.dir * (2.0 + ph * 0.25);
      if (b.t % 8 === 0) dust(b.x + b.w / 2, GY - 2, 2);
      if (b.x <= minX || b.x >= maxX) {
        b.x = clamp(b.x, minX, maxX);
        b.facing = -b.dir;
        G.shake = 14; sfx.thud();
        set(b, 'recover'); b.rest = 165 - ph * 15;
      }
      break;
    case 'recover':
      if (b.t > b.rest) set(b, 'walk');
      break;
    case 'hurt':
      if (b.t > 44) set(b, b.hp <= 0 ? 'down' : 'walk');
      break;
    case 'down':
      if (b.t === 1) { sfx.thud(); G.shake = 16; b.shots = []; }
      if (b.t % 50 === 1) crowd.roar();
      G.cheer = 60;
      if (b.t > 250) b.done = true;
      break;
    default: break;
  }

  b.h = b.state === 'recover' && b.t > 10 ? 36 : 48;     // he is down on one knee while he gets his breath back
  b.y = GY - b.h;
  updateShots(b);
  if (b.state !== 'down' && b.state !== 'hurt') touch(b);
}

function dust(x, y, n) {
  for (let i = 0; i < n; i++) {
    W.particles.push({ x: x + (Math.random() - 0.5) * 14, y, vx: (Math.random() - 0.5) * 2.4, vy: -2 - Math.random() * 2, t: 40, spin: Math.random() * 6 });
  }
}

/* the club comes down: whoever is under it is hit, and a shockwave runs along the floor each way */
function smash(b, ph) {
  G.shake = 12; sfx.thud();
  const cx = b.facing > 0 ? b.x + b.w : b.x - 34;
  if (overlap(player, { x: cx, y: GY - 34, w: 34, h: 34 })) hurtPlayer('HERCULES');
  const x = b.facing > 0 ? b.x + b.w + 14 : b.x - 14;
  dust(x, GY - 2, 8);
  for (const d of [-1, 1]) b.shots.push({ kind: 'wave', x: x - 6, y: GY - 11, w: 12, h: 11, vx: d * (2.1 + ph * 0.2), life: 48 + ph * 14, t: 0 });
}

/* he swings and hurls a boulder: low, it rolls along the floor (jump over it); high, it flies at head height (stay down) */
function hurl(b, high) {
  sfx.roar(); G.shake = 4;
  const x = b.facing > 0 ? b.x + b.w + 2 : b.x - 16;
  b.shots.push({ kind: 'rock', x, y: high ? GY - 62 : GY - 18, w: 16, h: 16, vx: b.facing * (high ? 3 : 2.5), life: 190, t: 0, high });
  dust(x + 7, GY - 2, 4);
}


function updateShots(b) {
  for (const s of b.shots) {
    s.x += s.vx; s.t++; s.life--;
    if (s.kind === 'wave' && s.t % 5 === 0) dust(s.x + 6, GY - 1, 1);
    if (s.kind === 'rock' && !s.high && s.t % 7 === 0) dust(s.x + 8, GY - 1, 1);   // the boulder kicks up dust as it rolls
    if (G.state === 'play' && overlap(player, s)) hurtPlayer('HERCULES');
  }
  b.shots = b.shots.filter(s => s.life > 0 && s.x > -40 && s.x < level.w * TILE + 40);
}

/* Saqer and Hercules meet: a stomp on the head, or a hit */
function touch(b) {
  if (G.state !== 'play' || player.morph) return;
  const body = { x: b.x + 2, y: b.y + 2, w: b.w - 4, h: b.h - 2 };
  if (!overlap(player, body)) return;
  const prevBottom = player.y + player.h - player.vy;
  if (player.vy > 0 && prevBottom <= b.y + 14) {
    player.vy = player.jumpHeld ? -7.5 : -5.8;
    player.jumping = player.jumpHeld;
    if (bossOpen(b)) {
      b.hp--; b.flash = 44; G.shake = 8; G.cheer = 130;
      addScore(b.hp <= 0 ? 10000 : 1000, b.x, b.y - 10);
      sfx.stomp(); sfx.kick(); crowd.roar();
      set(b, 'hurt');
    } else if (!b.blockT) {
      b.blockT = 30; sfx.block();
      W.popups.push({ x: b.x - 6, y: b.y - 12, text: 'NOT YET!', t: 0 });
    }
  } else if (player.y + player.h > b.y + 14) {
    hurtPlayer('HERCULES');
  }
}
