/* ============================================================
   PROCEDURAL PIXEL ART
   Tiles, props, enemies, gates and the Petra / Wadi Rum backdrops
   are painted here once at boot into small canvases at full 32-px
   tile resolution. Swap any of these for real art later: just put
   an <img>/canvas in ART with the same name and size.

   Each stage picks a THEME (levels.js → theme: 'amman' | 'petra' |
   'rum'), which decides the stone colours, the gate at the end of
   the stage and the backdrop.
   ============================================================ */
import { Buf } from './pix.js';

export const ART = {};

function cv(w, h) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const g = c.getContext('2d');
  g.imageSmoothingEnabled = false;
  return [c, g];
}
function rng(seed) {
  let s = seed >>> 0 || 1;
  return () => { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 4294967296; };
}
const R = (g, x, y, w, h, c) => { g.fillStyle = c; g.fillRect(x, y, w, h); };
const P = (g, x, y, c) => { g.fillStyle = c; g.fillRect(x, y, 1, 1); };

/* draw a pixel map: array of strings + palette {char: colour} */
function pmap(g, rows, pal, ox = 0, oy = 0, flip = false) {
  const w = Math.max(...rows.map(r => r.length));
  rows.forEach((row, y) => {
    for (let x = 0; x < row.length; x++) {
      const c = pal[row[x]];
      if (c) P(g, ox + (flip ? w - 1 - x : x), oy + y, c);
    }
  });
}

/* ---------- themes ---------- */
const THEMES = {
  amman: {                                                      // Amman limestone
    stone: { mortar: '#7a5f3e', base: '#d9c08f', light: '#f0dfb5', dark: '#a8885a', speck: '#c2a573' },
    brick: { mortar: '#5e4430', base: '#e3c49b', light: '#f7e3c3', dark: '#b38b5e', speck: '#cfa97c' },
    col:   { out: '#5a4630', d: '#a68a62', m: '#ccb48a', l: '#e9d9b4', w: '#fbf1d8', leaf: '#b5a06c', leafD: '#8c7a4c' },
    hard:  { out: '#4a3420', base: '#d4b986', hi: '#f1e0b8', lo: '#8f7048', in: '#c3a671', inLo: '#a68a5a', inHi: '#e6d2a8', dot: '#b89c66', w: '#fbf1d8' },
    top: ['#f6ead0', '#c9ab78', '#e7d3a8'], tuft: ['#7f8f3a', '#6a7a2e', '#93a24a'],
  },
  petra: {                                                      // rose sandstone
    stone: { mortar: '#7a3b34', base: '#cf7f69', light: '#eaa58c', dark: '#a65a4b', speck: '#bf705c' },
    brick: { mortar: '#6b2f2c', base: '#dd937a', light: '#f5bca2', dark: '#b06454', speck: '#cb806a' },
    col:   { out: '#5c2a28', d: '#a65f50', m: '#d38a73', l: '#eeae95', w: '#fcd6c3', leaf: '#c07763', leafD: '#96574a' },
    hard:  { out: '#5c2a28', base: '#d48a73', hi: '#f4bca4', lo: '#9c5547', in: '#c57a65', inLo: '#a65f50', inHi: '#e9a890', dot: '#b86e5b', w: '#fbd9c8' },
    top: ['#f3c0a6', '#b0604f', '#dd957e'], tuft: null,
  },
  rum: {                                                        // red desert under the moon
    stone: { mortar: '#3a1f33', base: '#9c5240', light: '#bd6e4f', dark: '#703a37', speck: '#874839' },
    brick: { mortar: '#33192e', base: '#b0664a', light: '#d18a5e', dark: '#80443c', speck: '#9c5843' },
    col:   { out: '#33192e', d: '#80443c', m: '#b0664a', l: '#d18a5e', w: '#e9ae82', leaf: '#9c5843', leafD: '#703a37' },
    hard:  { out: '#2b1730', base: '#8f4c48', hi: '#bd7058', lo: '#5a2c3c', dot: '#743a40', rock: true },
    top: ['#e7aa72', '#7a3f38', '#c68058'], tuft: ['#7b8752', '#5b653c', '#97a268'],
  },
};

function stoneBlock(g, X, Y, W, H, r, pal) {
  R(g, X, Y, W, H, pal.mortar);
  R(g, X + 1, Y + 1, W - 2, H - 2, pal.base);
  R(g, X + 1, Y + 1, W - 2, 1, pal.light); R(g, X + 1, Y + 1, 1, H - 2, pal.light);
  R(g, X + 1, Y + H - 2, W - 2, 1, pal.dark); R(g, X + W - 2, Y + 1, 1, H - 2, pal.dark);
  const n = Math.floor(W * H * 0.07);
  for (let i = 0; i < n; i++) {
    const sx = X + 2 + Math.floor(r() * (W - 4)), sy = Y + 2 + Math.floor(r() * (H - 4));
    P(g, sx, sy, r() < 0.65 ? pal.speck : pal.light);
  }
}

/* ---------- ground ---------- */
function groundTile(top, seed, th) {
  const [c, g] = cv(32, 32); const r = rng(seed);
  const pal = th.stone;
  stoneBlock(g, 0, 0, 16, 16, r, pal); stoneBlock(g, 16, 0, 16, 16, r, pal);
  stoneBlock(g, -8, 16, 16, 16, r, pal); stoneBlock(g, 8, 16, 16, 16, r, pal); stoneBlock(g, 24, 16, 16, 16, r, pal);
  if (top) {
    R(g, 0, 0, 32, 3, th.top[0]); R(g, 0, 3, 32, 1, th.top[1]); R(g, 0, 4, 32, 1, th.top[2]);
    for (let i = 0; i < 3; i++) {
      const x = 2 + Math.floor(r() * 27);
      if (th.tuft) {                         // dry grass tufts
        P(g, x, 0, th.tuft[0]); P(g, x + 1, 1, th.tuft[1]); P(g, x - 1, 1, th.tuft[2]); P(g, x, 2, th.tuft[1]);
      } else {                               // pebbles
        R(g, x, 1, 2, 1, th.top[1]); P(g, x, 0, th.top[2]);
      }
    }
  }
  return c;
}

/* ---------- brick ---------- */
function brickTile(seed, pal) {
  const [c, g] = cv(32, 32); const r = rng(seed);
  for (let row = 0; row < 4; row++) {
    const off = row % 2 ? -8 : 0;
    for (let x = off; x < 32; x += 16) stoneBlock(g, x, row * 8, 16, 8, r, pal);
  }
  return c;
}

/* ---------- star (Rub el Hizb) block ---------- */
function starMask(x, y, s = 1) {
  const dx = x + 0.5 - 16, dy = y + 0.5 - 16;
  return (Math.abs(dx) <= 6.5 * s && Math.abs(dy) <= 6.5 * s) || (Math.abs(dx) + Math.abs(dy) <= 9.3 * s);
}
function qTile(frame) {
  const [c, g] = cv(32, 32);
  const gold = ['#f2b632', '#f5c04a', '#ffd166', '#e8a72a'][frame];
  R(g, 0, 0, 32, 32, '#5c3608');
  R(g, 1, 1, 30, 30, '#b87414');
  R(g, 2, 2, 28, 28, gold);
  R(g, 2, 2, 28, 1, '#ffe7a3'); R(g, 2, 2, 1, 28, '#ffe7a3');
  R(g, 2, 29, 28, 1, '#a8650f'); R(g, 29, 2, 1, 28, '#a8650f');
  for (const [x, y] of [[4, 4], [26, 4], [4, 26], [26, 26]]) { R(g, x, y, 2, 2, '#7a4a0c'); P(g, x, y, '#ffe7a3'); }
  const teal = ['#1f8a8a', '#239a98', '#2fb0aa', '#1a7c7c'][frame];
  for (let y = 0; y < 32; y++) for (let x = 0; x < 32; x++) {
    if (!starMask(x, y)) continue;
    const edge = !starMask(x - 1, y) || !starMask(x + 1, y) || !starMask(x, y - 1) || !starMask(x, y + 1);
    let col = edge ? '#0d4549' : teal;
    if (!edge && (!starMask(x - 1, y - 1) || !starMask(x - 2, y))) col = '#6fd6cf';
    const dx = x + 0.5 - 16, dy = y + 0.5 - 16;
    if (Math.abs(dx) + Math.abs(dy) <= 3.2) col = '#ffe08a';
    P(g, x, y, col);
  }
  if (frame === 2) { P(g, 12, 10, '#fff'); P(g, 13, 9, '#fff'); }
  return c;
}
function usedTile() {
  const [c, g] = cv(32, 32);
  R(g, 0, 0, 32, 32, '#3e2a18');
  R(g, 1, 1, 30, 30, '#8f7048');
  R(g, 1, 1, 30, 2, '#ad8c5e'); R(g, 1, 1, 2, 30, '#ad8c5e');
  R(g, 1, 29, 30, 2, '#6b5233'); R(g, 29, 1, 2, 30, '#6b5233');
  for (let y = 0; y < 32; y++) for (let x = 0; x < 32; x++) {
    if (!starMask(x, y)) continue;
    const edge = !starMask(x - 1, y) || !starMask(x + 1, y) || !starMask(x, y - 1) || !starMask(x, y + 1);
    if (edge) P(g, x, y, '#6b5233');
  }
  return c;
}

/* ---------- hard block: carved stone, or raw rock in the desert ---------- */
function hardTile(p) {
  const [c, g] = cv(32, 32); const r = rng(77);
  R(g, 0, 0, 32, 32, p.out);
  R(g, 1, 1, 30, 30, p.base);
  R(g, 1, 1, 30, 3, p.hi); R(g, 1, 1, 3, 30, p.hi);
  R(g, 1, 28, 30, 3, p.lo); R(g, 28, 1, 3, 30, p.lo);
  if (p.rock) {
    for (let i = 0; i < 46; i++) P(g, 5 + Math.floor(r() * 22), 5 + Math.floor(r() * 22), r() < 0.6 ? p.dot : p.hi);
    for (const [x, y, len] of [[7, 11, 9], [15, 19, 10], [9, 24, 6]]) {      // cracks
      for (let i = 0; i < len; i++) P(g, x + i, y + Math.floor(i / 3), p.lo);
    }
    return c;
  }
  R(g, 6, 6, 20, 20, p.in); R(g, 6, 6, 20, 1, p.inLo); R(g, 6, 6, 1, 20, p.inLo);
  R(g, 6, 25, 20, 1, p.inHi); R(g, 25, 6, 1, 20, p.inHi);
  const ros = ['..k..', '.klk.', 'klwlk', '.klk.', '..k..'];      // rosette
  pmap(g, ros, { k: p.lo, l: p.inHi, w: p.w }, 13, 13);
  for (let i = 0; i < 30; i++) P(g, 7 + Math.floor(r() * 18), 7 + Math.floor(r() * 18), p.dot);
  return c;
}

/* ---------- Roman column (2 tiles wide → 64 px; capital overhangs 4 px) ---------- */
function columnCap(COL) {
  const [c, g] = cv(72, 32);
  // abacus slab
  R(g, 0, 0, 72, 6, COL.out); R(g, 1, 1, 70, 4, COL.l); R(g, 1, 1, 70, 1, COL.w); R(g, 1, 4, 70, 1, COL.d);
  // volutes
  for (const cx of [9, 62]) {
    for (let y = 5; y < 20; y++) for (let x = cx - 8; x <= cx + 8; x++) {
      const d = Math.hypot(x + 0.5 - cx, y + 0.5 - 12);
      if (d <= 7.2) P(g, x, y, d > 6 ? COL.out : d > 4.6 ? COL.l : d > 3.4 ? COL.d : d > 1.6 ? COL.m : COL.out);
    }
  }
  // echinus with acanthus leaves
  R(g, 16, 6, 40, 14, COL.out); R(g, 17, 6, 38, 13, COL.m);
  for (let i = 0; i < 6; i++) {
    const lx = 18 + i * 6;
    R(g, lx, 8, 4, 10, COL.leaf); R(g, lx + 1, 7, 2, 1, COL.leaf); P(g, lx + 1, 9, COL.w); P(g, lx + 1, 12, COL.l);
    R(g, lx + 3, 10, 1, 8, COL.leafD);
  }
  // necking
  R(g, 4, 20, 64, 12, COL.out);
  R(g, 5, 20, 62, 12, COL.m);
  R(g, 5, 22, 62, 2, COL.w); R(g, 5, 24, 62, 1, COL.d); R(g, 5, 27, 62, 1, COL.l);
  fluting(g, 5, 28, 62, 4, COL);
  return c;
}
function fluting(g, X, Y, W, H, COL) {
  for (let x = 0; x < W; x++) {
    const t = x / W;
    let col = t < 0.2 ? COL.l : t < 0.65 ? COL.m : COL.d;
    if (x % 6 === 0) col = COL.d; else if (x % 6 === 1) col = COL.w;
    if (t > 0.65 && x % 6 === 1) col = COL.m;
    R(g, X + x, Y, 1, H, col);
  }
}
function columnShaft(base, COL) {
  const [c, g] = cv(64, 32);
  R(g, 1, 0, 62, 32, COL.out);
  fluting(g, 2, 0, 60, 32, COL);
  if (base) {
    R(g, 0, 22, 64, 10, COL.out);
    R(g, 1, 23, 62, 3, COL.l); R(g, 1, 23, 62, 1, COL.w);
    R(g, 1, 26, 62, 1, COL.d);
    R(g, 1, 27, 62, 4, COL.m); R(g, 1, 27, 62, 1, COL.l);
  }
  return c;
}

/* ---------- dinar coin (4 spin frames, 16×16) ---------- */
function coin(frame) {
  const [c, g] = cv(16, 16);
  const rx = [6.5, 4.5, 1.5, 4.5][frame];
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
    const dx = (x + 0.5 - 8) / rx, dy = (y + 0.5 - 8) / 7.5;
    const d = dx * dx + dy * dy;
    if (d > 1) continue;
    let col = d > 0.62 ? '#b87414' : '#f2b632';
    if (d > 0.88) col = '#5c3608';
    if (d <= 0.62 && dx < -0.2 && dy < -0.1) col = '#ffe08a';
    P(g, x, y, col);
  }
  if (frame === 0) { R(g, 7, 5, 2, 6, '#b87414'); P(g, 6, 6, '#b87414'); }   // "1"
  if (frame === 1) { R(g, 7, 5, 1, 6, '#b87414'); }
  return c;
}

/* ---------- gold lira (secret collectible, 4 spin frames, 24×24) ---------- */
function lira(frame) {
  const [c, g] = cv(24, 24);
  const rx = [10.5, 7.5, 2.5, 7.5][frame];
  for (let y = 0; y < 24; y++) for (let x = 0; x < 24; x++) {
    const dx = (x + 0.5 - 12) / rx, dy = (y + 0.5 - 12) / 11;
    const d = dx * dx + dy * dy;
    if (d > 1) continue;
    let col = d > 0.86 ? '#6b3d06' : d > 0.68 ? '#d9930f' : '#ffcf40';
    if (d > 0.4 && d <= 0.5) col = '#e3a51c';
    if (d <= 0.4 && dx < -0.1 && dy < -0.1) col = '#fff3b8';
    P(g, x, y, col);
  }
  if (frame === 0) pmap(g, ['..k..', '.kkk.', 'kkkkk', '.kkk.', '..k..'], { k: '#b87414' }, 10, 10);   // star stamp
  const sp = [[19, 3], [4, 18], [20, 17], [5, 4]][frame];                                           // twinkle
  pmap(g, ['.w.', 'www', '.w.'], { w: '#ffffff' }, sp[0] - 1, sp[1] - 1);
  return c;
}

/* ---------- jameed (power-up) 28×26 — dried yoghurt ball ---------- */
function jameed() {
  const [c, g] = cv(28, 26);
  const r = rng(9);
  // rounded cone: radius grows from tip (y=1) to belly (y≈18), flat-ish base
  const half = y => (y < 1 ? 0 : y < 18 ? 2 + Math.pow((y - 1) / 17, 0.62) * 10.5 : 12.5 - Math.pow((y - 18) / 6, 2) * 3.2);
  for (let y = 0; y < 25; y++) {
    const hw = half(y);
    for (let x = 0; x < 28; x++) {
      const dx = x + 0.5 - 14;
      if (Math.abs(dx) > hw) continue;
      const edge = Math.abs(dx) > hw - 1 || y === 24 || y === 1;
      const t = (dx / hw + 1) / 2;     // 0 left … 1 right
      let col = t < 0.28 ? '#fffdf5' : t < 0.62 ? '#f3ecdc' : t < 0.85 ? '#ddd2bb' : '#c4b79c';
      if (y > 20) col = t < 0.5 ? '#e9e0cb' : '#cfc3a8';
      if (edge) col = '#6e6250';
      P(g, x, y, col);
    }
  }
  // powdery texture
  for (let i = 0; i < 45; i++) {
    const y = 3 + Math.floor(r() * 19), hw = half(y) - 2;
    if (hw < 1) continue;
    const x = Math.round(14 + (r() * 2 - 1) * hw);
    P(g, x, y, r() < 0.5 ? '#e3d8c1' : '#ffffff');
  }
  // tiny face so it reads as a pick-up
  R(g, 10, 13, 2, 3, '#3a2a1c'); R(g, 16, 13, 2, 3, '#3a2a1c');
  P(g, 10, 13, '#ffffff'); P(g, 16, 13, '#ffffff');
  P(g, 8, 17, '#f2b8a8'); P(g, 19, 17, '#f2b8a8');
  return c;
}

/* ---------- mansaf (1-UP) 32×22 ---------- */
function mansaf() {
  const [c, g] = cv(32, 22);
  const r = rng(5);
  for (let y = 0; y < 22; y++) for (let x = 0; x < 32; x++) {
    const dx = (x + 0.5 - 16) / 15.5, dyTray = (y + 0.5 - 16) / 5.5, dyRice = (y + 0.5 - 13) / 9;
    const tray = dx * dx + dyTray * dyTray <= 1 && y >= 12;
    const rice = dx * dx * 1.25 + dyRice * dyRice <= 1 && y <= 16;
    if (rice) P(g, x, y, (dx * dx * 1.25 + dyRice * dyRice > 0.82) ? '#a8842c' : (dx < -0.2 && y < 10 ? '#fbe9a6' : '#f1d77a'));
    else if (tray) P(g, x, y, y >= 19 ? '#6e6e78' : (dx < 0 ? '#e6e6ee' : '#b8b8c4'));
  }
  // meat
  pmap(g, ['.kkkk.', 'kbbmbk', 'kbmmbk', '.kkkk.'], { k: '#3a1d0e', b: '#7a3f1c', m: '#a85a2c' }, 9, 4);
  pmap(g, ['.kkk.', 'kbmbk', '.kkk.'], { k: '#3a1d0e', b: '#7a3f1c', m: '#a85a2c' }, 17, 3);
  // almonds + parsley
  for (let i = 0; i < 10; i++) {
    const x = 6 + Math.floor(r() * 20), y = 6 + Math.floor(r() * 8);
    P(g, x, y, i % 3 === 0 ? '#3f8a2e' : '#fff6dc');
  }
  return c;
}

/* ---------- naughty guy (enemy) 22×32, faces left ----------
   Backwards cap, cheeky grin, striped shirt, red-soled sneakers. */
const NG_PAL = {
  k: '#1d1418', h: '#2a1a14', r: '#d13a2f', R: '#8f1f19', s: '#d49a6a', S: '#a8703f',
  w: '#fbf4e8', m: '#6e1f1f', t: '#f2b632', T: '#1f8a8a', j: '#3d5f9e', J: '#2a4374',
  b: '#eeeeee', B: '#9a2a22', x: '#1d1418',
};
const NG_BODY = [
  '......kkkkkkk.........',
  '....kkrrrrrrrkk.......',
  '...krrrrrrrrrrrk......',
  '..krrwrrrrrrrrRRk.....',
  '..krrrrrrrrrrRRRkkkkk.',
  '..kRRRRRRRRRRRRRRRRRRk',
  '..khhhhhhhhhhhhkkkkkk.',
  '..kshhhshhhhhhhhk.....',
  '.kssssssssshhhhhk.....',
  '.kswkssswksssShhk.....',
  '.kskksssskksssShk.....',
  'kSsssssssssssssSk.....',
  '.ksmmmmmmssssSSk......',
  '.kskwwwwmsssSSk.......',
  '..kssmmmsssSSk........',
  '...kkkkkkkkkk.........',
  '...kttTTttTTtk........',
  '..kttTTttTTttTk.......',
  '.ksttTTttTTttTtsk.....',
  '.ksktTTttTTttTksk.....',
  '.kSktTTttTTttTkSk.....',
  '..kktTTttTTttTkk......',
  '...kjjjjjjjjjjk.......',
  '...kjjJjjjjJjjk.......',
];
const NG_LEGS = [
  ['...kjjjk.kjjjk........',
   '...kjjJk.kjJjk........',
   '...kjjjk.kjjjk........',
   '...kjjjk.kjjjk........',
   '..kbbbbk.kbbbbk.......',
   '.kbbbbbk.kbbbbbk......',
   '.kBBBBBk.kBBBBBk......',
   '.kkkkkkk.kkkkkkk......'],
  ['...kjjjkkjjjk.........',
   '..kjjjk..kjjjk........',
   '.kjjjk....kjjjk.......',
   '.kjjjk.....kjjjk......',
   'kbbbbk.....kbbbbk.....',
   'kbbbbbk....kbbbbbk....',
   'kBBBBBk....kBBBBBk....',
   'kkkkkkk....kkkkkkk....'],
];
function naughty(frame) {
  const [c, g] = cv(22, 32);
  pmap(g, NG_BODY, NG_PAL);
  pmap(g, NG_LEGS[frame], NG_PAL, 0, 24);
  return c;
}
function naughtyFlat() {
  const [c, g] = cv(22, 32);
  pmap(g, [
    '....kkkkkkkkkkkkkk....',
    '..kkrrrrrrrrrrRRRRkk..',
    '.ksskxssxkssshhhhhhk..',
    '.kssssmmmssssshhhhhk..',
    'kttTTttTTttTTtjjjjbbk.',
    'kkkkkkkkkkkkkkkkkkkkk.',
  ], NG_PAL, 0, 26);
  return c;
}

/* ---------- scorpion (enemy) 34×24, faces left ---------- */
const SC = { b: '#e0aa45', d: '#a8742a', h: '#f7d98a', k: '#3a2410' };
/* ---------- creatures at the size of Saqer's pixels ----------
   The creatures are drawn with the same shapes as before, but K times finer
   (1 canvas px per pixel instead of 2) and a little larger, so they sit with
   Saqer's detail and all share one size. map() can push a figure's parts
   out from its middle (the bat is drawn small, so it is enlarged). */
const CK = 2.6;                     // fine pixels per old pixel
const CREATURE_DIV = 4;             // canvas px per world unit (RES): their pixels land 1:1 on the screen
function zbuf(w, h, map = null, pad = 0) {
  const b = new Buf(Math.round((w + pad * 2) * CK), Math.round((h + pad * 2) * CK));
  const P = (x, y) => { if (map) [x, y] = map(x, y); return [(x + pad) * CK, (y + pad) * CK]; };
  const S = v => v * CK * (map ? map.k || 1 : 1);
  const z = {
    ell(x, y, rx, ry, c) { const [X, Y] = P(x, y); b.ell(X, Y, S(rx), S(ry), c); return z; },
    rect(x, y, w2, h2, c) { const [X, Y] = P(x, y); b.rect(X, Y, Math.max(1, Math.round(S(w2))), Math.max(1, Math.round(S(h2))), c); return z; },
    line(x0, y0, x1, y1, t, c) { const [A, B] = P(x0, y0), [C, D] = P(x1, y1); b.line(A, B, C, D, Math.max(1, S(t)), c); return z; },
    tri(x0, y0, x1, y1, x2, y2, c) { const [a, bb] = P(x0, y0), [cc, d] = P(x1, y1), [e, f] = P(x2, y2); b.tri(a, bb, cc, d, e, f, c); return z; },
    set(x, y, c) { return z.rect(x, y, 1, 1, c); },
    outline() { b.outline(); return z; },
    canvas() { const c = b.canvas(); c.div = CREATURE_DIV; return c; },
  };
  return z;
}
/* the bat's body is drawn small in its box: enlarged about its middle so it matches the pigeon and the scorpion */
const batMap = Object.assign((x, y) => [16 + (x - 16) * 1.1, 13 + (y - 13) * 1.1], { k: 1.1 });

function scorpion(frame) {
  const s = zbuf(34, 24);
  // tail curling up over the back, sting pointing forward
  [[26, 15], [29, 12], [30, 8], [28, 5], [25, 4]].forEach(([x, y], i) => s.ell(x + 0.5, y + 0.5, 2.5 - i * 0.2, 2.5 - i * 0.2, i % 2 ? SC.d : SC.b));
  s.rect(21, 4, 3, 1, SC.k); s.rect(20, 5, 2, 1, SC.k);
  // legs
  for (let i = 0; i < 4; i++) {
    const lx = 12 + i * 4, fwd = (i + frame) % 2 ? -2 : 2;
    s.line(lx, 18, lx + fwd, 22, 1, SC.d);
  }
  // body
  s.ell(18, 16, 8.5, 3.8, SC.b);
  s.ell(16, 14.6, 5, 1.3, SC.h);
  for (let x = 15; x < 26; x += 3) s.rect(x, 14, 1, 5, SC.d);
  // pincers
  s.line(10, 15, 6, 12 - frame, 2, SC.b); s.ell(4.5, 10.5 - frame, 3.2, 2.4, SC.b); s.rect(1, 10 - frame, 4, 1, SC.k);
  s.line(10, 17, 6, 18, 2, SC.d); s.ell(4, 18, 2.8, 2, SC.b); s.rect(1, 18, 3, 1, SC.k);
  s.rect(10, 14, 2, 2, SC.k);
  return s.outline().canvas();
}
function scorpionFlat() {
  const s = zbuf(34, 24);
  s.ell(17, 21, 13, 2.2, SC.b);
  s.rect(8, 21, 18, 1, SC.d);
  s.rect(9, 20, 2, 1, SC.k); s.rect(13, 20, 2, 1, SC.k);
  return s.outline().canvas();
}

/* ---------- flyer (enemy) 32×24, faces left: pigeon in Amman, bat in the south ---------- */
function flyer(kind, frame) {
  const bat = kind === 'bat';
  const C = bat
    ? { b: '#74509f', d: '#4a2d66', h: '#9a74c8', eye: '#ffd166', pupil: '#3a1f10' }
    : { b: '#aab3c2', d: '#788191', h: '#e3e8ef', eye: '#ffffff', pupil: '#d9482b', beak: '#f2a03c', neck: '#4f9a7a' };
  const s = bat ? zbuf(32, 24, batMap, 2) : zbuf(32, 24, null, 1);
  const up = frame === 0;
  if (up) s.tri(14, 11, 24, 11, 22, 2, C.d); else s.tri(14, 13, 24, 13, 22, 22, C.d);       // far wing
  if (!bat) s.tri(22, 11, 31, 9, 31, 14, C.d);                                               // tail
  s.ell(16.5, 12.5, 7.5, 4.3, C.b);
  s.ell(9, 10.5, 4.2, 3.9, C.b);
  if (bat) {
    s.tri(6, 8, 7, 2, 9.5, 8, C.b); s.tri(9.5, 8, 12, 2, 13, 8, C.b);                         // ears
    s.rect(6, 13, 1, 2, '#ffffff'); s.rect(9, 13, 1, 2, '#ffffff');                           // fangs
  } else {
    s.ell(12, 12.5, 2.4, 3, C.neck);
    s.tri(1.5, 11.5, 6, 9.5, 6, 12.5, C.beak);
    s.ell(17, 14.6, 5, 1.6, C.h);
  }
  s.rect(7, 9, 2, 2, C.eye); s.set(7, 10, C.pupil);
  if (up) s.tri(12, 11, 21, 12, 17, 0.5, C.h); else s.tri(12, 13, 21, 12, 17, 23, C.h);     // near wing
  return s.outline().canvas();
}

/* ---------- thorn bush (hazard) 32×32 ---------- */
function thorn() {
  const s = new Buf(32, 32);
  const r = rng(321);
  for (let i = 0; i < 11; i++) {
    const a = -Math.PI * (0.08 + 0.84 * (i / 10));
    const len = 11 + r() * 7;
    const bx = 16 + (i - 5) * 0.9, by = 30;
    const ex = bx + Math.cos(a) * len, ey = by + Math.sin(a) * len;
    s.line(bx, by, ex, ey, 2, i % 2 ? '#c9b76a' : '#a39350');            // pale straw: has to show up at night
    s.set(ex, ey - 1, '#fffbe0'); s.set(ex + (Math.cos(a) > 0 ? 1 : -1), ey, '#fffbe0');
    s.set((bx + ex) / 2 + 1, (by + ey) / 2 - 1, '#fffbe0');
  }
  s.rect(11, 29, 10, 2, '#7a6c38');
  return s.outline().canvas();
}

/* ---------- moving lift: a plank deck, w tiles wide (12 px thick) ---------- */
function lift(w) {
  const Wd = w * 32;
  const [c, g] = cv(Wd, 14);
  R(g, 0, 0, Wd, 12, '#2e1c12');
  R(g, 1, 1, Wd - 2, 10, '#a3703f');
  R(g, 1, 1, Wd - 2, 2, '#d19a5c');
  R(g, 1, 8, Wd - 2, 3, '#70482a');
  for (let x = 16; x < Wd; x += 16) R(g, x, 1, 1, 10, '#5a3920');          // plank seams
  for (const x of [2, Wd - 8]) { R(g, x, 1, 6, 10, '#4d4d58'); R(g, x + 1, 2, 4, 2, '#8a8a98'); P(g, x + 2, 6, '#c9c9d6'); }
  R(g, 4, 12, Wd - 8, 2, 'rgba(0,0,0,0.28)');
  return c;
}

/* ---------- Jordanian flag (3 wave frames) 44×24 ---------- */
function flag(frame) {
  const [c, g] = cv(44, 26);
  const FW = 40, FH = 20;
  for (let x = 0; x < FW; x++) {
    const off = Math.round(Math.sin(x * 0.22 - frame * 2.1) * 1.6 * (x / FW));
    for (let y = 0; y < FH; y++) {
      const tri = x <= 20 * (1 - Math.abs(y + 0.5 - FH / 2) / (FH / 2));
      let col = y < FH / 3 ? '#111111' : y < (2 * FH) / 3 ? '#f5f5f5' : '#007a3d';
      if (tri) col = '#ce1126';
      P(g, x + 2, y + 3 + off, col);
    }
  }
  // seven-pointed star (simplified)
  const sx = 2 + 7, sy = 3 + 9;
  pmap(g, ['.w.', 'www', '.w.'], { w: '#ffffff' }, sx - 1, sy - 1);
  P(g, sx - 2, sy - 2, '#ffffff'); P(g, sx + 2, sy - 2, '#ffffff'); P(g, sx - 2, sy + 2, '#ffffff'); P(g, sx + 2, sy + 2, '#ffffff');
  return c;
}

/* ---------- gate (Amman): Roman triumphal arch, 6×7 tiles → 192×224 px ---------- */
function gate() {
  const Wd = 192, Ht = 224;
  const [c, g] = cv(Wd, Ht); const r = rng(1234);
  const pal = { mortar: '#8a6d48', base: '#e2cc9c', light: '#f5e7c4', dark: '#b39467', speck: '#cdb383' };
  // body
  for (let row = 0; row * 16 < Ht - 40; row++) {
    const off = row % 2 ? -12 : 0;
    for (let x = off; x < Wd; x += 24) stoneBlock(g, x, 40 + row * 16, 24, 16, r, pal);
  }
  // attic
  g.save(); g.beginPath(); g.rect(16, 0, Wd - 32, 40); g.clip();
  for (let row = 0; row < 3; row++) for (let x = 16 + (row % 2 ? -10 : 0); x < Wd - 16; x += 20) stoneBlock(g, x, row * 14, 20, 14, r, pal);
  g.restore();
  R(g, 16, 0, Wd - 32, 2, '#5a4630');
  // cornice + dentils
  R(g, 0, 40, Wd, 10, '#5a4630'); R(g, 1, 41, Wd - 2, 8, '#f5e7c4'); R(g, 1, 47, Wd - 2, 2, '#b39467');
  for (let x = 2; x < Wd - 2; x += 5) R(g, x, 50, 3, 4, '#b39467');
  R(g, 0, 54, Wd, 1, '#5a4630');
  // pilasters
  for (const px of [6, 54, 130, 178]) {
    R(g, px, 56, 10, Ht - 56, '#5a4630'); R(g, px + 1, 56, 8, Ht - 56, '#ead6a8');
    R(g, px + 1, 56, 2, Ht - 56, '#fbf1d8'); R(g, px + 7, 56, 2, Ht - 56, '#bfa274');
    R(g, px - 2, 56, 14, 6, '#5a4630'); R(g, px - 1, 57, 12, 4, '#f5e7c4');
    R(g, px - 2, Ht - 10, 14, 10, '#5a4630'); R(g, px - 1, Ht - 9, 12, 8, '#e2cc9c');
  }
  // arches
  const arch = (cx, top, rw, bottom, inner, glow) => {
    for (let y = top - rw; y < bottom; y++) for (let x = cx - rw - 4; x <= cx + rw + 4; x++) {
      const dx = x + 0.5 - cx, dy = y + 0.5 - top;
      const inA = y >= top ? Math.abs(dx) <= rw : Math.hypot(dx, dy) <= rw;
      const inF = y >= top ? Math.abs(dx) <= rw + 4 : Math.hypot(dx, dy) <= rw + 4;
      if (inA) {
        const t = (y - (top - rw)) / (bottom - top + rw);
        P(g, x, y, glow ? (t > 0.75 ? '#5b3c4a' : t > 0.4 ? '#3c2738' : '#2a1a28') : inner);
      } else if (inF && y < top + 2) P(g, x, y, ((Math.floor(Math.atan2(dy, dx) * 6)) % 2) ? '#f5e7c4' : '#c9ad7c');
    }
  };
  arch(96, 112, 26, Ht, '#2a1a28', true);
  arch(32, 150, 12, Ht, '#3a2a30', false);
  arch(160, 150, 12, Ht, '#3a2a30', false);
  // keystone
  R(g, 92, 80, 8, 10, '#5a4630'); R(g, 93, 81, 6, 8, '#fbf1d8');
  return c;
}

/* ---------- gate (Petra): the Treasury, cut into the cliff, 192×224 px ---------- */
function treasury() {
  const Wd = 192, Ht = 224;
  const [c, g] = cv(Wd, Ht); const r = rng(77);
  const K = { rock: '#c27a64', rockD: '#a35f4d', rockL: '#dc9a82', face: '#e6a98f', faceL: '#f9cdb5', faceD: '#b8705c', line: '#7a3b34', dark: '#3a1a20', dark2: '#57272c' };
  // the cliff
  for (let x = 0; x < Wd; x++) {
    const top = Math.round(7 + 5 * Math.sin(x * 0.11) + 3 * Math.sin(x * 0.37 + 1));
    R(g, x, top, 1, Ht - top, K.rock); R(g, x, top, 1, 2, K.rockL);
  }
  for (let y = 30; y < Ht; y += 22) R(g, 0, y, Wd, 1, K.rockD);
  for (let i = 0; i < 260; i++) P(g, Math.floor(r() * Wd), 12 + Math.floor(r() * (Ht - 12)), r() < 0.5 ? K.rockD : K.rockL);
  // recessed facade
  R(g, 22, 22, 148, Ht - 22, K.line); R(g, 24, 24, 144, Ht - 24, K.faceD);

  const column = (x, y, w, h) => {
    R(g, x, y, w, h, K.line); R(g, x + 1, y, w - 2, h, K.face);
    R(g, x + 1, y, 2, h, K.faceL); R(g, x + w - 3, y, 2, h, K.faceD);
    R(g, x - 2, y, w + 4, 5, K.line); R(g, x - 1, y + 1, w + 2, 3, K.faceL);
    R(g, x - 2, y + h - 5, w + 4, 5, K.line); R(g, x - 1, y + h - 4, w + 2, 3, K.face);
  };
  const pediment = (cx, baseY, hw, h) => {
    for (let i = 0; i < h; i++) {
      const w = Math.round(hw * (1 - i / h));
      R(g, cx - w, baseY - 1 - i, w * 2, 1, K.face);
      P(g, cx - w, baseY - 1 - i, K.line); P(g, cx + w - 1, baseY - 1 - i, K.line);
      if (w > 2) P(g, cx - w + 1, baseY - 1 - i, K.faceL);
    }
    R(g, cx - hw, baseY - 1, hw * 2, 1, K.line);
  };

  // upper storey: round tholos between two pavilions
  R(g, 24, 100, 144, 5, K.line); R(g, 25, 101, 142, 2, K.faceL);
  for (const x0 of [28, 126]) {
    R(g, x0, 56, 38, 5, K.line); R(g, x0 + 1, 57, 36, 3, K.faceL);
    column(x0 + 3, 61, 7, 39); column(x0 + 28, 61, 7, 39);
    R(g, x0 + 12, 64, 14, 36, K.dark2);
    pediment(x0 + 19, 56, 19, 12);
  }
  R(g, 78, 52, 36, 5, K.line); R(g, 79, 53, 34, 3, K.faceL);
  column(80, 57, 6, 43); column(93, 57, 6, 43); column(106, 57, 6, 43);
  R(g, 87, 60, 5, 40, K.dark2); R(g, 100, 60, 5, 40, K.dark2);
  for (let i = 0; i < 16; i++) {                                      // conical roof
    const w = Math.round(20 * (1 - i / 17));
    R(g, 96 - w, 51 - i, w * 2, 1, K.face); P(g, 96 - w, 51 - i, K.line); P(g, 96 + w - 1, 51 - i, K.line);
  }
  R(g, 92, 27, 8, 9, K.line); R(g, 93, 28, 6, 7, K.faceL);           // urn

  // lower storey: pediment, entablature, six columns, doorway
  pediment(96, 128, 50, 20);
  R(g, 24, 128, 144, 12, K.line); R(g, 25, 129, 142, 4, K.faceL); R(g, 25, 133, 142, 6, K.face);
  for (let x = 28; x < 166; x += 6) R(g, x, 134, 3, 4, K.faceD);
  for (const x of [30, 54, 78, 106, 130, 154]) column(x, 140, 8, Ht - 146);
  R(g, 84, 158, 24, Ht - 164, K.line); R(g, 86, 160, 20, Ht - 166, K.dark); R(g, 86, 160, 20, 8, K.dark2);
  R(g, 22, Ht - 6, 148, 6, K.line); R(g, 23, Ht - 5, 146, 2, K.faceL); R(g, 23, Ht - 3, 146, 3, K.face);
  return c;
}

/* ---------- gate (Wadi Rum): the family's bayt al-sha'ar tent, 192×128 px ---------- */
function tent() {
  const Wd = 192, Ht = 128;
  const [c, g] = cv(Wd, Ht);
  const K = { hair: '#33272e', hairL: '#4f3f47', hairD: '#1d1519', white: '#efe6d8', red: '#b02a30', pole: '#9a7a50', in1: '#4a2420', in2: '#7a3a26', rug: '#9c2630', gold: '#f2b632' };
  const pts = [[0, 62], [16, 42], [56, 49], [96, 36], [136, 49], [176, 42], [191, 62]];   // low and wide, sagging between the poles
  const roofY = x => {
    for (let i = 0; i < pts.length - 1; i++) {
      const [x0, y0] = pts[i], [x1, y1] = pts[i + 1];
      if (x <= x1) return y0 + ((y1 - y0) * (x - x0)) / (x1 - x0);
    }
    return 62;
  };
  // open front: warm firelight inside
  R(g, 8, 58, 176, Ht - 58, K.in1);
  for (let y = 58; y < Ht; y++) for (let x = 56; x < 136; x++) {
    const d = Math.hypot((x - 96) / 42, (y - 120) / 64);
    if (d < 1) P(g, x, y, d < 0.3 ? '#f9cf6a' : d < 0.55 ? '#f2a03c' : d < 0.78 ? '#c26a2c' : K.in2);
  }
  // side panels with the woven stripes
  for (const [x0, x1] of [[8, 58], [134, 184]]) {
    const w = x1 - x0;
    R(g, x0, 60, w, Ht - 60, K.hair);
    for (let x = x0; x < x1; x += 3) R(g, x, 60, 1, Ht - 60, K.hairL);
    R(g, x0, 76, w, 3, K.white); R(g, x0, 81, w, 2, K.red); R(g, x0, 85, w, 3, K.white);
    R(g, x0, 104, w, 2, K.white); R(g, x0, 108, w, 1, K.red);
  }
  // roof
  for (let x = 0; x < Wd; x++) {
    const ry = Math.round(roofY(x));
    R(g, x, ry, 1, 64 - ry, K.hair);
    if (x % 3 === 0) R(g, x, ry + 2, 1, 60 - ry, K.hairL);
    R(g, x, ry, 1, 2, '#6a5760');                                     // moonlit edge
    P(g, x, ry - 1, K.hairD);
  }
  R(g, 0, 62, Wd, 2, K.hairD);
  for (let x = 2; x < Wd - 2; x++) P(g, x, 64, x % 4 < 2 ? K.white : K.red);
  // poles and guy ropes
  for (const x of [57, 133]) { R(g, x, 50, 3, Ht - 50, '#3a2a1c'); R(g, x + 1, 50, 1, Ht - 50, K.pole); }
  // rug
  R(g, 48, Ht - 6, 96, 6, '#5a141c'); R(g, 49, Ht - 5, 94, 4, K.rug);
  for (let x = 52; x < 142; x += 6) { P(g, x, Ht - 3, K.gold); P(g, x + 3, Ht - 4, '#f6f0e8'); }
  // hanging lantern
  R(g, 96, 38, 1, 10, '#3a2a1c'); R(g, 92, 48, 9, 11, '#3a2a1c'); R(g, 93, 49, 7, 9, '#ffe08a'); R(g, 95, 51, 3, 5, '#ffffff');
  // dallah (coffee pot) and the fire
  pmap(g, ['..kk....', '.kggk...', '..kgk.kk', '.kgggkgk', 'kghgggk.', 'kgggggk.', '.kgggk..', '.kkkkk..'], { k: '#3a2410', g: '#e0a020', h: '#fff3b8' }, 116, Ht - 15);
  pmap(g, ['..y..', '.yoy.', 'yoroy', 'orrro', 'kkkkk'], { y: '#ffe08a', o: '#f2a03c', r: '#d9482b', k: '#3a2410' }, 100, Ht - 12);
  return c;
}

/* ---------- debris chunk ---------- */
function chunk(pal) {
  const [c, g] = cv(8, 8);
  R(g, 0, 0, 8, 8, pal.mortar); R(g, 1, 1, 6, 6, pal.base); R(g, 1, 1, 6, 1, pal.light); R(g, 6, 1, 1, 6, pal.dark);
  return c;
}

/* ============================================================
   BACKDROPS for Petra and Wadi Rum (Amman uses the painted skyline).
   A backdrop is a still sky plus two wide silhouette layers that
   repeat sideways and scroll at different speeds.
   ============================================================ */
const BG_W = 1280, BG_H = 320;        // layer size in art px (640 × 160 world units)

function wave(seed, terms) {
  const r = rng(seed);
  const ks = terms.map(([k, a]) => [k, a, r() * 6.283]);
  return x => ks.reduce((s, [k, a, p]) => s + a * Math.sin((x / BG_W) * 6.283 * k + p), 0);
}
function silhouette(hFn, base, rim, deco) {
  const [c, g] = cv(BG_W, BG_H);
  for (let x = 0; x < BG_W; x++) {
    const h = Math.max(4, Math.round(hFn(x)));
    R(g, x, BG_H - h, 1, h, base);
    R(g, x, BG_H - h, 1, 3, rim);
  }
  g.globalCompositeOperation = 'source-atop';
  deco(g);
  g.globalCompositeOperation = 'source-over';
  return c;
}
function bandedSky(stops, w, h) {
  const [c, g] = cv(w, h);
  const n = stops.length;
  const bandH = Math.ceil(h / n);
  stops.forEach((col, i) => {
    R(g, 0, i * bandH, w, bandH, col);
    if (i < n - 1) for (let x = 0; x < w; x += 2) P(g, x + (i % 2), (i + 1) * bandH - 1, stops[i + 1]);   // dithered seam
  });
  return [c, g];
}

function petraBackdrop() {
  const [sky, g] = bandedSky(['#62b0e8', '#70b9ea', '#80c2ec', '#92cbee', '#a6d5f0', '#bcdff2', '#d0e8f3', '#e2f0f4'], 640, 416);
  const cloud = (x, y) => {
    R(g, x + 10, y, 30, 6, '#ffffff'); R(g, x, y + 6, 54, 8, '#ffffff'); R(g, x + 20, y - 5, 14, 5, '#ffffff');
    R(g, x + 4, y + 14, 46, 3, '#dcecf5');
  };
  cloud(60, 60); cloud(300, 36); cloud(470, 96); cloud(180, 128);

  const q = (v, s) => Math.round(v / s) * s;
  const farH = wave(11, [[2, 40], [5, 25], [11, 12], [23, 6]]);
  const far = silhouette(x => q(172 + farH(x), 6), '#e5ab94', '#f3c6b1', gg => {
    for (let y = 60; y < BG_H; y += 14) R(gg, 0, y, BG_W, 2, '#d99b84');
    const r = rng(5);
    for (let i = 0; i < 46; i++) R(gg, Math.floor(r() * BG_W), 0, 2, BG_H, '#d39780');
  });
  const nearH = wave(29, [[3, 45], [7, 22], [13, 10], [29, 5]]);
  const near = silhouette(x => q(118 + nearH(x), 8), '#c57a65', '#e09a82', gg => {
    for (let y = 96; y < BG_H; y += 18) R(gg, 0, y, BG_W, 3, '#b26a56');
    const r = rng(8);
    for (let i = 0; i < 30; i++) R(gg, Math.floor(r() * BG_W), 0, 3, BG_H, '#b06853');
    for (let i = 0; i < 9; i++) {                                        // rock-cut tomb doorways
      const x = 40 + i * 140 + Math.floor(r() * 40), y = BG_H - 44;
      R(gg, x - 4, y - 6, 28, 5, '#e09a82'); R(gg, x, y, 20, 34, '#e09a82'); R(gg, x + 3, y + 3, 14, 31, '#6d3530');
    }
  });
  return { sky, pit: '#5a2a2c', layers: [{ img: far, f: 0.07 }, { img: near, f: 0.2 }], haze: ['rgba(226,240,244,0.20)', 'rgba(240,214,198,0.38)'] };
}

function rumBackdrop() {
  const [sky, g] = bandedSky(['#0b0920', '#100d2a', '#161236', '#1e1744', '#2a1c52', '#3b235e', '#522b66', '#6d3668', '#8a4468'], 640, 416);
  const r = rng(99);
  for (let i = 0; i < 150; i++) {
    const x = Math.floor(r() * 640), y = Math.floor(r() * 300);
    const col = r() < 0.7 ? '#ffffff' : '#ffe9a8';
    P(g, x, y, col);
    if (r() < 0.12) { P(g, x - 1, y, col); P(g, x + 1, y, col); P(g, x, y - 1, col); P(g, x, y + 1, col); }
  }
  // crescent moon
  for (let y = 0; y < 60; y++) for (let x = 0; x < 60; x++) {
    const d1 = Math.hypot(x - 30, y - 30), d2 = Math.hypot(x - 41, y - 24);
    if (d1 <= 24 && d2 > 22) P(g, 470 + x, 40 + y, d1 > 21.5 ? '#d9c68e' : '#fbf1c9');
  }

  const q = (v, s) => Math.round(v / s) * s;
  const farS = wave(41, [[2, 1], [3, 0.8], [7, 0.45]]), farN = wave(43, [[17, 5], [31, 3]]);
  const far = silhouette(x => q(54 + 150 * Math.min(1, Math.max(0, (farS(x) - 0.25) * 2.4)) + farN(x), 4), '#2c1c4c', '#4d3577', gg => {
    for (let y = 80; y < BG_H; y += 16) R(gg, 0, y, BG_W, 2, '#261742');
  });
  const nearH = wave(47, [[2, 26], [5, 12], [9, 5]]);
  const near = silhouette(x => 66 + nearH(x), '#47233f', '#80496a', gg => {
    for (let i = -BG_H; i < BG_W; i += 26) {                              // wind ripples
      for (let k = 0; k < BG_H; k += 2) P(gg, i + k * 2, BG_H - 1 - k, '#3d1d38');
    }
  });
  return { sky, pit: '#150c22', layers: [{ img: far, f: 0.06 }, { img: near, f: 0.18 }], haze: null };
}

/* ============================================================ */
export function buildArt() {
  ART.q = [0, 1, 2, 3].map(qTile);
  ART.used = usedTile();
  ART.coin = [0, 1, 2, 3].map(coin);
  ART.lira = [0, 1, 2, 3].map(lira);
  ART.jameed = jameed();
  ART.mansaf = mansaf();
  ART.naughty = [naughty(0), naughty(1)];
  ART.naughtyFlat = naughtyFlat();
  ART.scorpion = [scorpion(0), scorpion(1)];
  ART.scorpionFlat = scorpionFlat();
  ART.pigeon = [flyer('pigeon', 0), flyer('pigeon', 1)];
  ART.bat = [flyer('bat', 0), flyer('bat', 1)];
  ART.thorn = thorn();
  ART.lift = { 2: lift(2), 3: lift(3), 4: lift(4) };
  ART.flag = [0, 1, 2].map(flag);

  const gates = { amman: gate(), petra: treasury(), rum: tent() };
  ART.themes = {};
  for (const name in THEMES) {
    const th = THEMES[name];
    ART.themes[name] = {
      groundTop: [groundTile(true, 11, th), groundTile(true, 23, th), groundTile(true, 37, th)],
      ground: [groundTile(false, 41, th), groundTile(false, 53, th), groundTile(false, 67, th)],
      brick: [brickTile(3, th.brick), brickTile(19, th.brick)],
      hard: hardTile(th.hard),
      colCap: columnCap(th.col),
      colShaft: columnShaft(false, th.col),
      colBase: columnShaft(true, th.col),
      chunk: chunk(th.brick),
      gate: gates[name],
    };
  }
  ART.bg = { petra: petraBackdrop(), rum: rumBackdrop(), crypt: cryptBackdrop() };
  ART.goldJameed = goldJameed();
  ART.key = keyArt();
  ART.keyTemple = keyArt(true);
  ART.bars = barsArt();
  ART.heart = [heartArt(true), heartArt(false)];
  ART.roar = [roarArt(0), roarArt(1)];
  ART.wave = waveArt();
  texturePass();
}

/* ============================================================
   The quest's extras: the vaults under the street, the golden
   jameed, the bronze key and gate, hearts, Hercules' attacks
   ============================================================ */
THEMES.crypt = {                                                // cold stone under the Roman street
  stone: { mortar: '#1c2030', base: '#56607a', light: '#7f8aa6', dark: '#3a4258', speck: '#49526a' },
  brick: { mortar: '#1a1c2a', base: '#6b6f86', light: '#9498ae', dark: '#474b60', speck: '#5a5e74' },
  col:   { out: '#1a1c2a', d: '#474b60', m: '#6b6f86', l: '#9498ae', w: '#c3c6d6', leaf: '#5a5e74', leafD: '#3d4054' },
  hard:  { out: '#151826', base: '#5a6480', hi: '#8a94b0', lo: '#343b50', in: '#4f5872', inLo: '#3e465c', inHi: '#737d98', dot: '#465068', w: '#aab2c8' },
  top: ['#8f9ab6', '#3a4258', '#6c7692'], tuft: null,
};
THEMES.sky = {                                                  // white marble of the temple precinct, up in the sky
  stone: { mortar: '#9a8a70', base: '#ece2cc', light: '#fffaf0', dark: '#c2b292', speck: '#ddd0b4' },
  brick: { mortar: '#8c7a5c', base: '#f0e4c8', light: '#fffbf0', dark: '#c8b48c', speck: '#e0d0ac' },
  col:   { out: '#6e5e46', d: '#bfae8e', m: '#e2d6bc', l: '#f6efe0', w: '#fffdf6', leaf: '#d8c08a', leafD: '#b39a64' },
  hard:  { out: '#6a5a42', base: '#e8dcc2', hi: '#fffaf0', lo: '#b4a282', in: '#ddd0b4', inLo: '#c4b494', inHi: '#f6eedc', dot: '#cbbb9a', w: '#fffdf6' },
  top: ['#fffaf0', '#c9b894', '#efe4cc'], tuft: null,
};

export function goldJameed() {
  const src = ART.jameed, [c, g] = cv(src.width, src.height);
  g.drawImage(src, 0, 0);
  g.globalCompositeOperation = 'source-atop';
  g.fillStyle = 'rgba(255,196,40,0.78)'; g.fillRect(0, 0, c.width, c.height);
  g.fillStyle = 'rgba(255,250,200,0.55)'; g.fillRect(0, 0, c.width, Math.round(c.height * 0.3));
  return c;
}

function keyArt(temple = false) {
  const [c, g] = cv(32, 32);
  const [O, B, H, D] = temple ? ['#3a2a12', '#efe0a6', '#fffbe8', '#b4954c'] : ['#3d2406', '#d9982b', '#ffd56a', '#9a6212'];   // bronze, or Hercules' pale gold
  R(g, 3, 9, 14, 14, O); R(g, 5, 11, 10, 10, B); R(g, 8, 14, 4, 4, O); R(g, 5, 11, 10, 2, H); R(g, 5, 19, 10, 2, D);
  R(g, 15, 13, 15, 6, O); R(g, 16, 15, 13, 2, B); R(g, 16, 15, 13, 1, H);
  R(g, 21, 17, 4, 8, O); R(g, 22, 18, 2, 6, B); R(g, 26, 17, 4, 6, O); R(g, 27, 18, 2, 4, B);
  if (temple) { R(g, 8, 14, 4, 4, '#b3202a'); R(g, 8, 14, 2, 2, '#ff6a6a'); }                     // a red stone in the bow
  return c;
}

function barsArt() {
  const [c, g] = cv(32, 32);
  for (const x of [2, 12, 22]) {
    R(g, x, 0, 8, 32, '#2e1c06'); R(g, x + 1, 0, 6, 32, '#b97f25'); R(g, x + 1, 0, 2, 32, '#f0c25c'); R(g, x + 5, 0, 2, 32, '#7d5214');
  }
  R(g, 0, 12, 32, 7, '#2e1c06'); R(g, 0, 13, 32, 5, '#c98e2c'); R(g, 0, 13, 32, 1, '#f5cf70'); R(g, 0, 17, 32, 1, '#7d5214');
  for (const x of [5, 15, 25]) R(g, x, 14, 2, 2, '#3d2406');
  return c;
}

function heartArt(full) {
  const rows = [
    '..oooo...oooo..',
    '.orrrro.orrrro.',
    'orwwrrrorrrrrro',
    'orwrrrrrrrrrrro',
    'orrrrrrrrrrrrro',
    'orrrrrrrrrrrrro',
    '.orrrrrrrrrrro.',
    '..orrrrrrrrro..',
    '...orrrrrrro...',
    '....orrrrro....',
    '.....orrro.....',
    '......oro......',
    '.......o.......',
  ];
  const [c, g] = cv(30, 26);
  const pal = full ? { o: '#3a0b14', r: '#e23a4c', w: '#ffc2c8' } : { o: '#1b1524', r: '#4b4458', w: '#5d566c' };
  rows.forEach((row, y) => { for (let x = 0; x < row.length; x++) { const col = pal[row[x]]; if (col) R(g, x * 2, y * 2, 2, 2, col); } });
  return c;
}

/* the lion's roar: rings of sound with a snarling face in front */
function roarArt(frame) {
  const [c, g] = cv(96, 84);
  g.lineWidth = 6;
  for (let i = 0; i < 3; i++) {
    const r = 14 + i * 12 + frame * 4;
    g.strokeStyle = ['#fff2b0', '#f5b83a', '#c9731c'][i];
    g.globalAlpha = 0.95 - i * 0.22;
    g.beginPath(); g.arc(30, 42, r, -1.05, 1.05); g.stroke();
  }
  g.globalAlpha = 1;
  g.fillStyle = '#3a1a06'; g.beginPath(); g.arc(70, 42, 24, 0, 7); g.fill();          // mane
  g.fillStyle = '#c9731c'; g.beginPath(); g.arc(70, 42, 21, 0, 7); g.fill();
  g.fillStyle = '#f0b040'; g.beginPath(); g.arc(73, 42, 14, 0, 7); g.fill();          // face
  g.fillStyle = '#3a1a06'; g.fillRect(74, 34, 5, 4); g.fillRect(74, 46 - 12, 5, 4);
  g.fillStyle = '#5a0f0f'; g.fillRect(78, 42, 12, 10 + frame * 2);                    // open jaws
  g.fillStyle = '#fff'; g.fillRect(79, 42, 3, 4); g.fillRect(86, 42, 3, 4);
  g.fillStyle = '#fff'; g.fillRect(76, 35, 2, 2);
  return c;
}

/* the shockwave from the club */
function waveArt() {
  const [c, g] = cv(56, 48);
  g.fillStyle = '#3a2a16';
  g.beginPath(); g.moveTo(2, 48); g.lineTo(14, 12); g.lineTo(26, 30); g.lineTo(34, 2); g.lineTo(44, 26); g.lineTo(54, 48); g.fill();
  g.fillStyle = '#e9d9a8';
  g.beginPath(); g.moveTo(8, 48); g.lineTo(15, 20); g.lineTo(26, 38); g.lineTo(34, 10); g.lineTo(42, 32); g.lineTo(48, 48); g.fill();
  g.fillStyle = '#fff8dc';
  g.beginPath(); g.moveTo(22, 48); g.lineTo(33, 20); g.lineTo(40, 48); g.fill();
  return c;
}

/* the vaults: a dark wall of dressed stone with a row of arches, and a second row further back */
function cryptBackdrop() {
  const [sky, sg] = cv(320, 208);
  const grad = sg.createLinearGradient(0, 0, 0, 208);
  grad.addColorStop(0, '#0c0d16'); grad.addColorStop(0.7, '#141827'); grad.addColorStop(1, '#10222e');
  sg.fillStyle = grad; sg.fillRect(0, 0, 320, 208);

  const arches = (w, h, span, rise, wall, dark, line) => {
    const [c, g] = cv(w, h);
    R(g, 0, 0, w, h, wall);
    const r = rng(span * 7 + rise);
    for (let y = 0; y < h; y += 16) {                                 // courses of stone
      R(g, 0, y, w, 2, line);
      for (let x = (y / 16) % 2 ? 0 : 20; x < w; x += 40) R(g, x, y, 2, 16, line);
      for (let i = 0; i < w / 30; i++) P(g, Math.floor(r() * w), y + 3 + Math.floor(r() * 10), line);
    }
    for (let x = 0; x < w; x += span) {                               // arches
      const cx = x + span / 2, rad = span * 0.36, base = h;
      g.fillStyle = line;
      g.beginPath(); g.moveTo(cx - rad - 8, base); g.lineTo(cx - rad - 8, base - rise); g.arc(cx, base - rise, rad + 8, Math.PI, 0); g.lineTo(cx + rad + 8, base); g.fill();
      g.fillStyle = dark;
      g.beginPath(); g.moveTo(cx - rad, base); g.lineTo(cx - rad, base - rise); g.arc(cx, base - rise, rad, Math.PI, 0); g.lineTo(cx + rad, base); g.fill();
      R(g, cx - 5, base - rise - rad - 10, 10, 12, line);             // keystone
    }
    return c;
  };
  const far = arches(480, 300, 120, 110, '#151a2a', '#090a12', '#20263a');
  const near = arches(640, 416, 320, 190, '#1b2134', '#0d0f1a', '#2a3148');
  // torches on the near wall
  const g = near.getContext('2d');
  for (const x of [0, 320]) {
    R(g, x + 4, 150, 6, 30, '#3a2a16'); R(g, x, 138, 14, 14, '#c9731c'); R(g, x + 3, 132, 8, 12, '#f5b83a'); R(g, x + 5, 128, 4, 8, '#fff2b0');
    const glow = g.createRadialGradient(x + 7, 142, 2, x + 7, 142, 70);
    glow.addColorStop(0, 'rgba(245,184,58,0.30)'); glow.addColorStop(1, 'rgba(245,184,58,0)');
    g.fillStyle = glow; g.fillRect(x - 70, 70, 150, 150);
  }
  return { sky, pit: '#0e3340', layers: [{ img: far, f: 0.25 }, { img: near, f: 0.55 }], haze: ['rgba(16,34,46,0)', 'rgba(16,40,56,0.35)'] };
}

/* ---------- texture pass ----------
   The tiles are painted at 32 px. Here they are doubled to 64 px and given stone grain,
   pits and hairline cracks, so they hold up at the game's higher resolution. */
function grain(src, seed, amp = 9) {
  const [c, g] = cv(src.width * 2, src.height * 2);
  g.drawImage(src, 0, 0, c.width, c.height);
  const id = g.getImageData(0, 0, c.width, c.height), d = id.data, r = rng(seed * 977 + 13);
  for (let i = 0; i < d.length; i += 4) {
    if (!d[i + 3]) continue;
    let n = (r() - 0.5) * 2 * amp;
    const roll = r();
    if (roll < 0.035) n -= amp * 2.4;            // a pit
    else if (roll < 0.055) n += amp * 1.9;       // a bright fleck
    d[i] += n; d[i + 1] += n; d[i + 2] += n * 0.85;
  }
  g.putImageData(id, 0, 0);
  g.globalCompositeOperation = 'source-atop';
  for (let k = 0; k < 3; k++) {                  // hairline cracks
    let x = 6 + r() * (c.width - 12), y = 6 + r() * (c.height - 12);
    g.strokeStyle = 'rgba(60,40,20,0.22)'; g.lineWidth = 1; g.beginPath(); g.moveTo(x, y);
    for (let s = 0; s < 4; s++) { x += (r() - 0.5) * 9; y += 2 + r() * 4; g.lineTo(x, y); }
    g.stroke();
  }
  return c;
}

/* the golden star boxes: hammered metal, a bevelled rim, studs in the corners and a moving glint */
function goldBox(src, frame) {
  const [c, g] = cv(64, 64);
  g.drawImage(src, 0, 0, 64, 64);
  const id = g.getImageData(0, 0, 64, 64), d = id.data, r = rng(4441);
  for (let i = 0; i < d.length; i += 4) {
    if (!d[i + 3]) continue;
    const n = (r() - 0.5) * 16 + (r() < 0.05 ? 26 : 0) - (r() < 0.05 ? 24 : 0);     // hammered surface
    d[i] += n; d[i + 1] += n * 0.9; d[i + 2] += n * 0.5;
  }
  g.putImageData(id, 0, 0);
  g.globalCompositeOperation = 'source-atop';
  // bevel: light from the top-left
  g.fillStyle = 'rgba(255,246,190,0.55)'; g.fillRect(4, 4, 56, 3); g.fillRect(4, 4, 3, 56);
  g.fillStyle = 'rgba(90,50,0,0.50)'; g.fillRect(4, 57, 56, 3); g.fillRect(57, 4, 3, 56);
  g.strokeStyle = 'rgba(110,64,6,0.65)'; g.lineWidth = 2; g.strokeRect(10, 10, 44, 44);       // engraved inner frame
  g.strokeStyle = 'rgba(255,240,170,0.5)'; g.lineWidth = 1; g.strokeRect(12.5, 12.5, 41, 41);
  for (const [x, y] of [[8, 8], [56, 8], [8, 56], [56, 56]]) {                                  // studs
    g.fillStyle = '#5a3604'; g.beginPath(); g.arc(x, y, 4, 0, 7); g.fill();
    g.fillStyle = '#f7d774'; g.beginPath(); g.arc(x, y, 2.8, 0, 7); g.fill();
    g.fillStyle = '#fffbe0'; g.fillRect(x - 2, y - 2, 2, 2);
  }
  // the glint slides across as the box animates
  const gx = -30 + frame * 32;
  const shine = g.createLinearGradient(gx, 0, gx + 26, 26);
  shine.addColorStop(0, 'rgba(255,255,255,0)'); shine.addColorStop(0.5, 'rgba(255,255,255,0.42)'); shine.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = shine; g.fillRect(0, 0, 64, 64);
  return c;
}

export function texturePass() {
  let s = 1;
  for (const name in ART.themes) {
    const th = ART.themes[name], amp = name === 'amman' ? 11 : 8;
    th.groundTop = th.groundTop.map(c => grain(c, s++, amp));
    th.ground = th.ground.map(c => grain(c, s++, amp));
    th.brick = th.brick.map(c => grain(c, s++, amp));
    th.hard = grain(th.hard, s++, amp);
    th.colShaft = grain(th.colShaft, s++, 6);
    th.colBase = grain(th.colBase, s++, 6);
    th.colCap = grain(th.colCap, s++, 6);
  }
  ART.q = ART.q.map((c, i) => goldBox(c, i));
  ART.used = grain(ART.used, 99, 8);
}
