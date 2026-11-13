/* ============================================================
   SAQER — player control
   ============================================================ */
import { TILE, VH, PHYS, PLAYER_SIZE } from './config.js';
import { level, linkAt } from './level.js';
import { G, W, player } from './state.js';
import { keys } from './input.js';
import { moveX, moveY, rectHitsSolid, clamp, sign } from './physics.js';
import { bumpBlock, collectCoins, touchesThorn, tryBars } from './world.js';
import { sfx, music } from './audio.js';

export const MORPH_FRAMES = 30;   // 6 grow/shrink sprite frames × 5 ticks

export function placePlayer(tileX, groundRow) {
  const s = PLAYER_SIZE.small;
  Object.assign(player, {
    w: s.w, h: s.h, x: tileX * TILE + (TILE - s.w) / 2, y: groundRow * TILE - s.h,
    vx: 0, vy: 0, onGround: false, facing: 1,
    big: false, wantBig: false, jumping: false, jumpHeld: true,
    invuln: 0, morph: 0, morphDir: 0, walkT: 0, landT: 0, hurtT: 0,
    stompChain: 0, deathKind: '', visible: true, riding: null,
  });
}

/* Moving lifts are one-way: Saqer lands on them from above and can jump up through them. */
function landOnLifts(prevBottom) {
  player.riding = null;
  if (player.vy < 0) return;
  const bottom = player.y + player.h;
  for (const p of W.entities) {
    if (p.type !== 'plat' || p.hidden) continue;
    if (player.x + player.w <= p.x + 1 || player.x >= p.x + p.w - 1) continue;
    if (prevBottom <= p.y + 2.5 && bottom >= p.y) {
      player.y = p.y - player.h; player.vy = 0; player.onGround = true; player.riding = p;
      return;
    }
  }
}

function resize(big) {
  const s = big ? PLAYER_SIZE.big : PLAYER_SIZE.small;
  const cx = player.x + player.w / 2, bottom = player.y + player.h;
  player.w = s.w; player.h = s.h;
  player.x = cx - s.w / 2; player.y = bottom - s.h;
}

function canGrow() {
  const s = PLAYER_SIZE.big;
  const cx = player.x + player.w / 2, bottom = player.y + player.h;
  return !rectHitsSolid(cx - s.w / 2, bottom - s.h, s.w, s.h);
}

/* Growing used to shove the hero up into a ceiling when there was no head-room.
   Now it waits (wantBig) until there's space. */
export function growPlayer() {
  if (player.big) return;
  if (!canGrow()) { player.wantBig = true; return; }
  player.wantBig = false;
  player.big = true; resize(true);
  player.morph = MORPH_FRAMES; player.morphDir = 1;
  sfx.grow();
}

export function hurtPlayer() {
  if (player.invuln > 0 || player.morph > 0 || G.state !== 'play' || G.god) return;
  if (G.golden) {                       // grown for good: a hit costs one bar, never his size
    G.hp--;
    if (G.hp <= 0) { killPlayer('hit'); return; }
    player.invuln = 110; player.hurtT = 24;
    player.vy = Math.min(player.vy, -3); player.vx = -player.facing * 1.6;
    sfx.shrink();
    return;
  }
  if (player.big || player.wantBig) {
    player.wantBig = false;
    if (player.big) {
      player.big = false; resize(false);
      player.morph = MORPH_FRAMES; player.morphDir = -1;
    }
    player.invuln = 130; player.hurtT = 24;
    sfx.shrink();
  } else {
    killPlayer('hit');
  }
}

export function killPlayer(kind) {
  if (G.state !== 'play') return;
  if (G.god) {                          // the attar10X cheat: put him back on the last solid ground he stood on
    player.x = (player.safeX != null ? player.safeX : player.x); player.y = (player.safeY != null ? player.safeY : 100) - 1; player.vx = 0; player.vy = 0; player.invuln = 40;
    return;
  }
  G.state = 'dying'; G.stateTimer = 0;
  player.deathKind = kind;
  player.riding = null;
  player.vx = 0;
  player.vy = kind === 'pit' ? player.vy : 0;
  music.stop();
  sfx.die();
}

export function updatePlayer() {
  if (player.morph > 0) { player.morph--; return; }     // brief freeze while growing/shrinking
  if (player.invuln > 0) player.invuln--;
  if (player.stompT > 0) player.stompT--;
  if (player.hurtT > 0) player.hurtT--;
  if (player.landT > 0) player.landT--;
  if (player.wantBig && canGrow()) growPlayer();

  const run = keys.run;
  const maxSpd = run ? PHYS.runMax : PHYS.walkMax;
  const acc = run ? PHYS.runAcc : PHYS.walkAcc;

  if (keys.left && !keys.right) { player.vx -= acc; player.facing = -1; }
  else if (keys.right && !keys.left) { player.vx += acc; player.facing = 1; }
  else if (Math.abs(player.vx) < 0.08) player.vx = 0;
  else player.vx -= sign(player.vx) * PHYS.friction;
  // releasing run while faster than walk speed now eases down instead of snapping
  if (Math.abs(player.vx) > maxSpd) player.vx = sign(player.vx) * maxSpd;   // one top speed: he never goes faster than this

  if (keys.jump && player.onGround && !player.jumpHeld) {
    player.vy = PHYS.jumpVel - Math.abs(player.vx) * 0.12;   // a little extra height at speed
    player.onGround = false; player.jumping = true; player.jumpHeld = true;
    player.fullJump = true;                                   // every jump goes to its full height, however short the tap
    player.big ? sfx.bigJump() : sfx.jump();
  }
  if (!keys.jump) { player.jumpHeld = false; player.jumping = false; }

  if (player.vy >= 0) player.fullJump = false;
  const g = player.vy < 0 && (player.fullJump || (player.jumping && keys.jump)) ? PHYS.gravityHeld : PHYS.gravity;
  player.vy = Math.min(player.vy + g, PHYS.maxFall);

  const wasAir = !player.onGround, fallSpeed = player.vy;
  const prevBottom = player.y + player.h;
  player.onGround = false;
  moveX(player, player.vx);
  moveY(player, player.vy, bumpBlock, 4);
  landOnLifts(prevBottom);

  if (player.onGround && !player.riding) { player.safeX = player.x; player.safeY = player.y; }
  if (player.onGround) {
    player.stompChain = 0;
    if (wasAir && fallSpeed > 3) player.landT = 8;
  }
  const minX = level.def.roam ? 0 : G.camX;          // one-way stages: he can't walk back off the screen
  if (player.x < minX) { player.x = minX; if (player.vx < 0) player.vx = 0; }
  if (player.onGround && Math.abs(player.vx) > 0.1) player.walkT += Math.abs(player.vx) * 0.11;

  collectCoins(player);
  if (touchesThorn(player)) hurtPlayer();
  tryBars(player);
  if (player.y > VH + 16 && !linkAt('down', player)) killPlayer('pit');
}

/* walk on rails during the end-of-stage sequence */
export function autoWalk(speed) {
  player.facing = 1; player.vx = speed;
  player.vy = Math.min(player.vy + PHYS.gravity, PHYS.maxFall);
  player.onGround = false;
  moveX(player, player.vx);
  moveY(player, player.vy);
  player.walkT += speed * 0.11;
}

export { clamp };

/* grown at once, no animation (he has the golden jameed) */
export function makeBig() {
  if (player.big) return;
  player.big = true; player.wantBig = false;
  resize(true);
}
