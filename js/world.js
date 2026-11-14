/* ============================================================
   WORLD — blocks, enemies, lifts, items, effects, scoring
   ============================================================ */
import { TILE, VW, VH, LIRA_VALUE, MAX_HP, D } from './config.js';
import { T } from './tiles.js';
import { level, tileAt, setTile, key, isSolid } from './level.js';
import { G, W, player } from './state.js';
import { moveX, moveY, overlap, sign, rectHitsSolid } from './physics.js';
import { sfx } from './audio.js';
import { hurtPlayer, growPlayer } from './player.js';

/* ---------------- scoring ---------------- */
export function addScore(n, x, y) {
  G.score += n;
  if (x !== undefined) W.popups.push({ x, y, text: String(n), t: 0 });
}
export function oneUp(x, y) {
  G.lives++;
  sfx.oneUp();
  if (x !== undefined) W.popups.push({ x, y, text: '1UP', t: 0 });
}
export function addCoin() {
  G.coins++;
  G.mahr++;
  G.score += 200;
  sfx.coin();
  if (G.coins >= 100) { G.coins -= 100; oneUp(player.x, player.y - 8); }
}
/* a hidden gold lira: worth LIRA_VALUE dinars of mahr */
export function addLira(x, y) {
  G.liras++;
  G.mahr += LIRA_VALUE;
  G.score += 2000;
  sfx.lira();
  W.popups.push({ x: x - 14, y, text: 'GOLD +' + LIRA_VALUE, t: -30, gold: true });
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    W.particles.push({ x, y, vx: Math.cos(a) * 1.6, vy: Math.sin(a) * 1.6 - 1.5, t: 50, spin: 0, spark: true });
  }
}

/* ---------------- blocks ---------------- */
function popCoin(tx, ty) {
  W.coinFx.push({ x: tx * TILE + 4, y: ty * TILE - 4, vy: -4.6, t: 0 });
  addCoin();
}
function popLira(tx, ty) {
  W.coinFx.push({ x: tx * TILE + 2, y: ty * TILE - 6, vy: -5.2, t: 0, lira: true });
  addLira(tx * TILE + 8, ty * TILE - 10);
}
function bump(tx, ty) { W.bumps.set(key(tx, ty), 10); }

export function bumpBlock(tx, ty) {
  const t = tileAt(tx, ty);
  hitFromBelow(tx, ty);
  switch (t) {
    case T.Q_COIN: case T.HIDDEN_COIN:
      popCoin(tx, ty); setTile(tx, ty, T.USED); bump(tx, ty); break;   // boxes are not remembered: they refill after a death
    case T.HIDDEN_LIRA:
      popLira(tx, ty); gone(tx, ty, T.USED); bump(tx, ty); break;
    case T.BRICK_COINS: {
      const k = key(tx, ty), n = (level.multi.get(k) || 1) - 1;
      popCoin(tx, ty); bump(tx, ty);
      if (n <= 0) { level.multi.delete(k); setTile(tx, ty, T.USED); } else level.multi.set(k, n);
      break;
    }
    case T.Q_MAP:                                      // the bonus box: the map of the game (it opens like a pause)
      setTile(tx, ty, T.USED); bump(tx, ty); sfx.oneUp(); G.hasMap = true; G.mapRequest = true; break;
    case T.Q_JAMEED:
      spawnItem(tx, ty, 'jameed'); setTile(tx, ty, T.USED); bump(tx, ty); sfx.item(); break;
    case T.BRICK_MANSAF:
      spawnItem(tx, ty, 'mansaf'); setTile(tx, ty, T.USED); bump(tx, ty); sfx.item(); break;
    case T.BRICK:
      if (player.big) breakBrick(tx, ty);
      else { bump(tx, ty); sfx.bump(); }
      break;
    default:
      sfx.bump();
  }
}

function breakBrick(tx, ty) {
  setTile(tx, ty, T.EMPTY);
  addScore(50);
  for (let i = 0; i < 4; i++) {
    W.particles.push({
      x: tx * TILE + (i % 2 ? 9 : 3), y: ty * TILE + (i < 2 ? 2 : 9),
      vx: (i % 2 ? 1 : -1) * (1 + Math.random() * 0.8), vy: i < 2 ? -5 : -3.5,
      t: 0, spin: Math.random() * 6,
    });
  }
  sfx.brick();
}

/* enemies / items / coins resting on a bumped block get knocked */
function hitFromBelow(tx, ty) {
  const top = ty * TILE;
  const zone = { x: tx * TILE, y: top - 4, w: TILE, h: 5 };
  for (const e of W.entities) {
    if (!e.active || !overlap(e, zone) || e.y + e.h > top + 1) continue;
    if (e.type === 'naughty' && !e.flipped && !e.squash) {
      flipNaughty(e, sign(e.x + e.w / 2 - (tx * TILE + 8)) || 1);
      addScore(100, e.x, e.y);
    } else if (e.type === 'item' && !e.emerge) {
      e.vy = -4.5;
      e.vx = Math.abs(e.vx || 1) * (sign(e.x + e.w / 2 - (tx * TILE + 8)) || 1);
    }
  }
  const above = tileAt(tx, ty - 1);
  if (above === T.COIN) { gone(tx, ty - 1, T.EMPTY); popCoin(tx, ty - 1); }
  else if (above === T.LIRA) { gone(tx, ty - 1, T.EMPTY); popLira(tx, ty - 1); }
}

/* ---------------- spawning ---------------- */
function makeEntity(s) {
  const foe = { type: 'naughty', active: true, awake: false, vy: 0, onGround: false, anim: 0, squash: 0, flipped: false };
  switch (s.type) {
    case 'scorpion':
      return Object.assign({}, foe, { kind: 'scorpion', x: s.x * TILE + 1, y: (s.y + 1) * TILE - 9, w: 14, h: 9, vx: -0.85 * D.speed });
    case 'flyer': {
      const x = s.x * TILE + 1, y = s.y * TILE + 3;
      return Object.assign({}, foe, { kind: 'flyer', x, y, w: 13, h: 9, vx: -0.7 * D.speed, homeX: x, baseY: y, range: (s.range || 0) * TILE, t: (s.x * 37) % 90 });
    }
    case 'plat': {
      const x = s.x * TILE, y = s.y * TILE;
      return { type: 'plat', active: true, x, y, x0: x, y0: y, w: s.w * TILE, h: 6, tiles: s.w,
        dx: s.dx * TILE, dy: s.dy * TILE, period: s.period, t: Math.round(s.phase * s.period), locked: s.lock || null };
    }
    default:
      return Object.assign({}, foe, { kind: 'walker', x: s.x * TILE + 2, y: (s.y + 1) * TILE - 15, w: 12, h: 15, vx: -0.55 * D.speed });
  }
}
export function spawnLevelEntities() {
  // normal (easy) mode: every second enemy stays home, and those marked hardOnly in quest.js (config.js MODES); lifts always come
  let k = 0;
  const spawns = level.spawns.filter(s => s.type === 'plat' || !D.fewer || (k++ % 2 === 0 && !s.hard));   // (k counts the hard-only ones too, so the rest stay the same)
  W.entities = spawns.map(makeEntity);
  let n = 0;                                           // every enemy gets a number (the attar debug view)
  for (const e of W.entities) if (e.type === 'naughty') e.num = ++n;
  for (const e of W.entities) if (e.type === 'plat') placeLift(e);
}

function spawnItem(tx, ty, kind) {
  const w = kind === 'jameed' ? 14 : 16, h = kind === 'jameed' ? 13 : 11;
  W.entities.push({
    type: 'item', kind, active: true,
    x: tx * TILE + (TILE - w) / 2, y: ty * TILE + (TILE - h), w, h,
    targetY: ty * TILE - h, emerge: true,
    vx: kind === 'mansaf' ? 1.1 : 0.9, vy: 0, onGround: false,
  });
}

/* ---------------- updates ---------------- */
export function updateEntities() {
  for (const e of W.entities) {
    if (!e.active) continue;
    if (e.type === 'plat') updateLift(e);
    else if (e.type === 'naughty') (e.kind === 'flyer' ? updateFlyer : updateNaughty)(e);
    else if (e.type === 'item') updateItem(e);
  }
  W.entities = W.entities.filter(e => e.active);
}

function flipNaughty(c, dir) {
  c.flipped = true; c.vy = -4; c.vx = dir * 0.8;
  sfx.kick();
}

const STOMP_CHAIN = [100, 200, 400, 500, 800, 1000, 2000, 4000, 5000, 8000];

/* shared by every enemy: stomped from above, or it hurts Saqer */
function meetPlayer(c) {
  if (G.state !== 'play' || player.morph) return;
  // normal mode: a hidden magnet. Coming down from above, a wider and taller box counts as landing on him;
  // the box that hurts Saqer stays the same (config.js MODES: magnet, in world units)
  const m = D.magnet || 0;
  const falling = player.vy > 0 && player.y + player.h - player.vy <= c.y + 8 + m;
  if (!overlap(c, player) && !(m && falling && overlap({ x: c.x - m, y: c.y - m, w: c.w + m * 2, h: c.h + m }, player))) return;
  if (player.star > 0) {                                // the mansaf's power: whatever he touches is knocked away
    flipNaughty(c, sign(c.x + c.w / 2 - (player.x + player.w / 2)) || 1);
    addScore(200, c.x, c.y - 4);
    return;
  }
  const prevBottom = player.y + player.h - player.vy;
  // a stomp. Just after one stomp (stompT) anything else under his feet counts too,
  // so landing on two enemies at once squashes both instead of hurting him.
  const again = player.stompT > 0 && player.y + player.h <= c.y + c.h * 0.8;
  if ((player.vy > 0 && prevBottom <= c.y + 8 + m) || again) {
    player.stompT = 8;
    if (c.kind === 'flyer') { c.flipped = true; c.vy = 0.5; c.vx = 0; }   // knocked out of the sky
    else { c.squash = 26; c.vx = 0; }
    player.vy = player.jumpHeld ? -7.5 : -5.5;
    player.jumping = player.jumpHeld;
    const pts = STOMP_CHAIN[Math.min(player.stompChain, STOMP_CHAIN.length - 1)];
    if (player.stompChain >= STOMP_CHAIN.length) oneUp(c.x, c.y); else addScore(pts, c.x, c.y - 4);
    player.stompChain++;
    sfx.stomp();
  } else {
    hurtPlayer('#' + c.num);
  }
}

function fallAway(c) {
  c.vy += 0.4; c.y += c.vy; c.x += c.vx;
  if (c.y > VH + 40) c.active = false;
}
function wakes(c) {
  if (c.awake) return true;
  if (c.x < G.camX + VW + 24 && (!level.def.roam || c.x + c.w > G.camX - 24)) c.awake = true;
  return c.awake;
}

function updateNaughty(c) {
  if (c.squash > 0) { if (--c.squash === 0) c.active = false; return; }
  if (c.flipped) { fallAway(c); return; }
  if (!wakes(c)) return;
  if (!level.def.roam && c.x + c.w < G.camX - 48) { c.active = false; return; }   // left behind for good (one-way stages only)

  c.anim++;
  // scorpions keep to their ledge: turn round when the ground ahead runs out
  if (c.kind === 'scorpion' && c.onGround) {
    const ax = c.vx < 0 ? c.x - 1 : c.x + c.w + 1;
    if (!isSolid(Math.floor(ax / TILE), Math.floor((c.y + c.h + 1) / TILE))) c.vx = -c.vx;
  }
  c.vy = Math.min(c.vy + 0.5, 8);
  c.onGround = false;
  const vx = c.vx;
  moveX(c, c.vx);
  if (c.vx === 0) c.vx = -vx;
  moveY(c, c.vy);
  if (c.y > VH + 40) { c.active = false; return; }

  // walkers bounce off each other instead of walking through
  for (const o of W.entities) {
    if (o === c || o.type !== 'naughty' || o.kind === 'flyer' || !o.active || !o.awake || o.flipped || o.squash) continue;
    if (overlap(c, o)) {
      const dir = sign(c.x - o.x) || 1;
      if (sign(c.vx) !== dir) c.vx = Math.abs(c.vx) * dir;
      if (sign(o.vx) === dir) o.vx = -Math.abs(o.vx) * dir;
    }
  }
  meetPlayer(c);
}

function updateFlyer(c) {
  if (c.flipped) { fallAway(c); return; }
  if (!wakes(c)) return;
  if (!c.range && c.x + c.w < G.camX - 48) { if (level.def.roam) c.x = G.camX + VW + 60; else { c.active = false; return; } }
  c.anim++; c.t++;
  c.x += c.vx;
  if (c.range && Math.abs(c.x - c.homeX) > c.range) c.vx = -sign(c.x - c.homeX) * Math.abs(c.vx);
  c.y = c.baseY + Math.sin(c.t * 0.07) * 13;
  meetPlayer(c);
}

/* ---------------- moving lifts ---------------- */
function placeLift(p) {
  const k = (1 - Math.cos((p.t / p.period) * Math.PI * 2)) / 2;
  p.x = p.x0 + p.dx * k; p.y = p.y0 + p.dy * k;
}
function updateLift(p) {
  if (p.locked) { tryChains(p); return; }            // chained: it stays down until the key frees it
  const ox = p.x, oy = p.y;
  p.t++;
  placeLift(p);
  if (player.riding !== p || G.state !== 'play') return;
  if (p.x !== ox) moveX(player, p.x - ox);
  const keep = player.y;
  player.y = p.y - player.h;
  if (p.y < oy && rectHitsSolid(player.x, player.y, player.w, player.h)) { player.y = keep; player.riding = null; }   // never lift him into a ceiling
}

function updateItem(m) {
  if (m.emerge) {
    m.y -= 0.5;
    if (m.y <= m.targetY) { m.y = m.targetY; m.emerge = false; }
    return;
  }
  m.vy = Math.min(m.vy + 0.42, 8);
  m.onGround = false;
  const vx = m.vx;
  moveX(m, m.vx);
  if (m.vx === 0) m.vx = -vx;
  moveY(m, m.vy);
  if (m.y > VH + 40) { m.active = false; return; }

  if (G.state === 'play' && overlap(m, player)) {
    m.active = false;
    if (m.kind === 'mansaf') { oneUp(m.x, m.y); heal(); player.star = 600; }   // and 10 seconds of invincibility
    else if (G.golden) { heal(); addScore(1000, m.x, m.y); sfx.grow(); }
    else if (!player.big && !player.wantBig) { growPlayer(); addScore(1000, m.x, m.y); }
    else { addScore(1000, m.x, m.y); sfx.coin(); }
  }
}

export function updateEffects() {
  for (const p of W.particles) {
    if (p.spark) { p.vy += 0.08; p.x += p.vx; p.y += p.vy; p.t++; continue; }
    p.vy += 0.42; p.x += p.vx; p.y += p.vy; p.t++;
  }
  W.particles = W.particles.filter(p => p.t < 90 && p.y < VH + 20);
  for (const c of W.coinFx) { c.vy += 0.42; c.y += c.vy; c.t++; }
  for (const c of W.coinFx) if (c.t === 22 && !c.lira) W.popups.push({ x: c.x, y: c.y, text: '200', t: 0 });
  W.coinFx = W.coinFx.filter(c => c.t < 22);
  for (const p of W.popups) p.t++;
  W.popups = W.popups.filter(p => p.t < 45);
  for (const [k, v] of W.bumps) { if (v <= 1) W.bumps.delete(k); else W.bumps.set(k, v - 1); }
}

/* floating dinars and gold liras: collected by touching them */
export function collectCoins(e) {
  const x0 = Math.floor(e.x / TILE), x1 = Math.floor((e.x + e.w - 0.01) / TILE);
  const y0 = Math.floor(e.y / TILE), y1 = Math.floor((e.y + e.h - 0.01) / TILE);
  for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) {
    const t = tileAt(tx, ty);
    if (t === T.COIN) { gone(tx, ty, T.EMPTY); addCoin(); }
    else if (t === T.LIRA) { gone(tx, ty, T.EMPTY); addLira(tx * TILE + 8, ty * TILE); }
    else if (t === T.KEY) { setTile(tx, ty, T.EMPTY); takeKey(tx, ty); }
    else if (t === T.GOLD) { gone(tx, ty, T.EMPTY); takeGolden(tx, ty); }
  }
}

/* thorn bushes: the lower part of the tile is the prickly bit */
export function touchesThorn(e) {
  const x0 = Math.floor(e.x / TILE), x1 = Math.floor((e.x + e.w - 0.01) / TILE);
  const y0 = Math.floor(e.y / TILE), y1 = Math.floor((e.y + e.h - 0.01) / TILE);
  for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) {
    if (tileAt(tx, ty) !== T.THORN) continue;
    if (overlap(e, { x: tx * TILE + 3, y: ty * TILE + 7, w: 10, h: 9 })) return true;
  }
  return false;
}

/* ---------------- the golden jameed, the hit bar, the bronze key ---------------- */
export function say(lines, frames = 260) { G.banner = { lines, t: frames }; }

export function heal() { G.hp = MAX_HP; }

function sparkle(x, y, n = 14) {
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    W.particles.push({ x, y, vx: Math.cos(a) * 2, vy: Math.sin(a) * 2 - 1.2, t: 30, spin: 0, spark: true });
  }
}

/* from here on Saqer stays grown: three hits, refilled by any jameed or mansaf */
function takeGolden(tx, ty) {
  G.golden = true;
  G.lives = D.lives;                    // the owner's rule: lives only exist from here on. Whatever happened before (mansafs
                                        // eaten, deaths) does not count: everyone starts the real game with the same 3
  heal();
  if (!player.big) growPlayer();
  G.score += 5000;
  sfx.oneUp();
  sparkle(tx * TILE + 8, ty * TILE + 8, 20);
  say(['THE GOLDEN JAMEED!', 'SAQER STAYS GROWN FOR GOOD.', 'HE CAN TAKE 3 HITS NOW.', 'JAMEED AND MANSAF REFILL THEM.'], 330);
}

/* The puzzle, in order:
   1. the bronze key (in the vaults) unchains the lift at the west end of the street;
   2. that lift climbs to the Temple of Hercules in the sky, where his key lies at the door;
   3. his key opens the bars in the east vault, beyond which a lift climbs to the theatre.
   Which key an area holds, and which key its bars want, is set on the area in quest.js. */
const KEYS = {
  vault:  { got: ['THE BRONZE KEY!', 'IT FREES THE CHAINED LIFT', 'AT THE WEST END OF THE STREET.'] },
  temple: { got: ['THE KEY OF HERCULES!', 'IT OPENS THE GATE IN THE EAST VAULT,', 'ON THE WAY TO THE THEATRE.'] },
};
function takeKey(tx, ty) {
  const name = level.def.keyName || 'vault';
  G.keys[name] = true;
  G.score += 1000;
  sfx.lira();
  sparkle(tx * TILE + 8, ty * TILE + 8, 20);
  say(KEYS[name].got, 320);
}

/* bars: they open when Saqer walks up to them with the right key */
let lockedMsg = 0;
export function tryBars(e) {
  if (lockedMsg > 0) lockedMsg--;
  const ty = Math.floor((e.y + e.h - 1) / TILE);
  const need = level.def.barsNeed || 'vault';
  for (const tx of [Math.floor((e.x - 3) / TILE), Math.floor((e.x + e.w + 3) / TILE)]) {
    if (tileAt(tx, ty) !== T.BARS) continue;
    if (!G.keys[need]) {
      if (!lockedMsg) {
        say(need === 'temple' ? ['LOCKED.', 'ITS KEY IS IN THE TEMPLE OF HERCULES,', 'HIGH ABOVE THE CITY.'] : ['LOCKED.', 'THE BRONZE KEY IS IN ANOTHER VAULT.'], 220);
        sfx.bump(); lockedMsg = 240;
      }
      return;
    }
    for (let y = 0; y < 15; y++) if (tileAt(tx, y) === T.BARS) { setTile(tx, y, T.EMPTY); sparkle(tx * TILE + 8, y * TILE + 8, 6); }
    G.keys[need] = false;
    sfx.brick(); sfx.lira();
    say(['THE GATE IS OPEN.', 'THE LIFT BEYOND IT CLIMBS TO THE THEATRE.']);
  }
}

/* a chained lift (lock: 'vault'): it waits at the bottom until Saqer walks up with the key */
let chainMsg = 0;
function tryChains(p) {
  if (chainMsg > 0) chainMsg--;
  const near = Math.abs((player.x + player.w / 2) - (p.x + p.w / 2)) < p.w / 2 + 14 && player.y + player.h > p.y - 30;
  if (!near || G.state !== 'play') return;
  if (!G.keys[p.locked]) {
    if (!chainMsg) { say(['THE LIFT IS CHAINED.', 'THE BRONZE KEY IN THE VAULTS', 'WILL FREE IT.'], 220); sfx.bump(); chainMsg = 260; }
    return;
  }
  G.keys[p.locked] = false;
  p.locked = null;
  p.t = 0;
  sfx.brick(); sfx.item();
  sparkle(p.x + p.w / 2, p.y, 22);
  say(['THE CHAINS FALL AWAY.', 'RIDE THE LIFT UP TO THE TEMPLE OF HERCULES.'], 300);
}

/* ---------------- what is gone for good ----------------
   Coins, gold liras and the golden jameed are taken once per playthrough: dying does not bring them back
   (only a new game does). Jameed and mansaf boxes are not remembered: they come back after every death. */
function gone(tx, ty, t, n) {
  setTile(tx, ty, t);
  let m = G.gone.get(G.area);
  if (!m) G.gone.set(G.area, m = new Map());
  m.set(key(tx, ty), n === undefined ? t : { t, n });
}
/* a freshly built area: take out what was already collected this playthrough */
export function applyGone(id) {
  const m = G.gone.get(id);
  if (!m) return;
  for (const [k, v] of m) {
    const [x, y] = k.split(',').map(Number);
    if (typeof v === 'number') { setTile(x, y, v); level.multi.delete(k); }
    else level.multi.set(k, v.n);
  }
}
/* after a death: every box is full again (coins, jameed, mansaf) */
export function refillBoxes(boxes) {
  for (const [x, y, t, n] of boxes) { setTile(x, y, t); if (n) level.multi.set(x + ',' + y, n); }
  W.entities = W.entities.filter(e => !(e.type === 'item' && (e.kind === 'jameed' || e.kind === 'mansaf')));
}
