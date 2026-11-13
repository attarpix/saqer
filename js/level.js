/* ============================================================
   LEVEL — tile grid + builder API used by levels.js
   ============================================================ */
import { LH, GROUND_TOP, TILE } from './config.js';
import { T, SOLID, CHAR_TILES } from './tiles.js';

export const level = {
  def: null,
  w: 0,
  tiles: [],
  spawns: [],
  startX: 3,
  flagX: 0,
  gateX: 0,
  danaX: -1,          // tile where Dana waits (last stage), -1 = not in this stage
  multi: new Map(),   // "x,y" → coins left in a BRICK_COINS tile
  liraTotal: 0,       // gold liras hidden in this stage
  dinarTotal: 0,      // dinars available in this stage
  links: [],          // ways into other areas (shafts down, lifts up) — see quest.js
};

export const key = (x, y) => x + ',' + y;

export function setTile(x, y, t) {
  if (x >= 0 && x < level.w && y >= 0 && y < LH) level.tiles[y][x] = t;
}
export function tileAt(x, y) {
  if (x < 0 || x >= level.w) return T.HARD;  // invisible walls at both ends
  if (y < 0 || y >= LH) return T.EMPTY;       // open sky / bottomless pits
  return level.tiles[y][x];
}
export const isSolid = (x, y) => SOLID.has(tileAt(x, y));

export function buildLevel(def) {
  level.def = def;
  level.w = def.width;
  level.tiles = [];
  level.spawns = [];
  level.multi = new Map();
  level.links = [];
  level.giants = [];
  level.startX = 3; level.flagX = def.width - 20; level.gateX = def.width - 14; level.danaX = -1;
  for (let y = 0; y < LH; y++) level.tiles.push(new Array(def.width).fill(T.EMPTY));

  const api = {
    /** solid ground from column a to b (inclusive) */
    ground(a, b) { for (let x = a; x <= b; x++) for (let y = GROUND_TOP; y < LH; y++) setTile(x, y, T.GROUND); },
    /** a row of tiles from a string, e.g. row(20, 9, 'B?BJB') — see CHAR_TILES */
    row(x, y, str) {
      [...str].forEach((c, i) => {
        if (c === ' ' || c === '.') return;
        const t = CHAR_TILES[c];
        if (t === undefined) throw new Error(`Unknown level char "${c}" in "${str}"`);
        setTile(x + i, y, t);
        if (t === T.BRICK_COINS) level.multi.set(key(x + i, y), 8);
      });
    },
    /** a filled rectangle of one tile type: w wide, h tall, top-left at (x, y) */
    block(x, y, w, h, ch = 'S') {
      const t = CHAR_TILES[ch];
      for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) setTile(x + i, y + j, t);
    },
    /** rock pillar rising out of a pit: w wide, its top on row `top` */
    pillar(x, top, w = 2) { api.block(x, top, w, LH - top); },
    /** Roman column, 2 tiles wide, h tiles tall, standing on the ground */
    column(x, h) {
      const top = GROUND_TOP - h;
      setTile(x, top, T.COL_TL); setTile(x + 1, top, T.COL_TR);
      for (let y = top + 1; y < GROUND_TOP; y++) { setTile(x, y, T.COL_BL); setTile(x + 1, y, T.COL_BR); }
    },
    /** stone staircase h steps tall, 'up' (rising to the right) or 'down' */
    stairs(x, h, dir = 'up') {
      for (let i = 0; i < h; i++) {
        const hh = dir === 'up' ? i + 1 : h - i;
        for (let y = GROUND_TOP - hh; y < GROUND_TOP; y++) setTile(x + i, y, T.HARD);
      }
    },
    /** n floating dinars starting at (x, y) */
    coins(x, y, n) { for (let i = 0; i < n; i++) setTile(x + i, y, T.COIN); },
    /** a gold lira (secret collectible) */
    lira(x, y) { setTile(x, y, T.LIRA); },
    /** n thorn bushes on the ground starting at column x (or on top of row y) */
    thorns(x, n = 1, y = GROUND_TOP - 1) { for (let i = 0; i < n; i++) setTile(x + i, y, T.THORN); },

    /** enemies. y = the row they stand in (default: on the ground) */
    naughty(x, y = GROUND_TOP - 1) { level.spawns.push({ type: 'naughty', x, y }); },
    naughties(...xs) { xs.forEach(x => api.naughty(x)); },
    /** scorpion: quick, and turns round at ledges instead of walking off */
    scorpion(x, y = GROUND_TOP - 1) { level.spawns.push({ type: 'scorpion', x, y }); },
    scorpions(...xs) { xs.forEach(x => api.scorpion(x)); },
    /** flyer (pigeon in Amman, bat elsewhere): bobs along row y.
        range = tiles it patrols either side of x (0 = flies left across the stage) */
    flyer(x, y, range = 0) { level.spawns.push({ type: 'flyer', x, y, range }); },
    /** moving lift, w tiles wide, starting at (x, y) and gliding dx / dy tiles away and back.
        period = frames for the round trip, phase = 0…1 head start */
    lift(x, y, w = 3, { dx = 0, dy = 0, period = 240, phase = 0, lock = null } = {}) {
      level.spawns.push({ type: 'plat', x, y, w, dx, dy, period, phase, lock });
    },

    start(x) { level.startX = x; },
    flag(x)  { level.flagX = x; },
    gate(x)  { level.gateX = x; },
    dana(x)  { level.danaX = x; },

    /** the bronze key, and the bars it opens (h tiles tall, standing on row y) */
    key(x, y) { setTile(x, y, T.KEY); },
    /** a giant standing pillar that closes the way: solid from the top of the screen to the ground,
        w columns wide from x; it is drawn by render.js (level.giants holds its centre in world units) */
    giant(x, w) {
      for (let j = 0; j < GROUND_TOP; j++) for (let i = 0; i < w; i++) setTile(x + i, j, T.WALL);
      level.giants.push((x + w / 2) * TILE);
    },
    /** empty a rectangle again (openings in a ceiling, doorways) */
    clear(x, y, w, h) { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) setTile(x + i, y + j, T.EMPTY); },
    bars(x, y, h = 3) { for (let j = 0; j < h; j++) setTile(x, y - j, T.BARS); },
    /** a shaft: falling off the bottom between columns a and b lands Saqer in area `to`, dropping in at column tx */
    shaftDown(a, b, to, tx) { level.links.push({ kind: 'down', a, b, to, tx }); },
    /** a way up: rising off the top of the screen between columns a and b (on a lift) comes out in area `to` at column tx */
    wayUp(a, b, to, tx) { level.links.push({ kind: 'up', a, b, to, tx }); },
  };
  def.build(api);
  if (def.noFlag) { level.flagX = -1; level.gateX = -1; }
  else setTile(level.flagX, GROUND_TOP - 1, T.HARD);   // flag-pole base block

  level.liraTotal = 0; level.dinarTotal = 0;
  for (const row of level.tiles) for (const t of row) {
    if (t === T.LIRA || t === T.HIDDEN_LIRA) level.liraTotal++;
    else if (t === T.COIN || t === T.Q_COIN || t === T.HIDDEN_COIN) level.dinarTotal++;
    else if (t === T.BRICK_COINS) level.dinarTotal += 8;
  }
}

/* the way into another area that entity e is using right now, if any:
   'down' = he has fallen off the bottom inside a shaft, 'up' = a lift has carried him off the top */
export function linkAt(kind, e) {
  const col = Math.floor((e.x + e.w / 2) / 16);
  return level.links.find(l => l.kind === kind && col >= l.a && col <= l.b) || null;
}
