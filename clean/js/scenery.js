/* ============================================================
   SCENERY — painted in code, inspired by the owner's reference pictures
   (art/new/bg (1)–(4)): Roman Philadelphia by day, and the sky above it
   where the Temple of Hercules stands.

   Everything here is painted in "pixels" of 2 canvas px (the same size
   as the tiles' pixels), with no smoothing, then doubled when drawn.
   Light comes from the top-left. No people in the backdrops.
   ============================================================ */

/* ---------- small tools ---------- */
function cv(w, h) {
  const c = document.createElement('canvas');
  c.width = Math.max(1, Math.round(w)); c.height = Math.max(1, Math.round(h));
  const g = c.getContext('2d'); g.imageSmoothingEnabled = false;
  return [c, g];
}
function rng(seed) {
  let s = seed >>> 0 || 1;
  return () => { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 4294967296; };
}
const R = (g, x, y, w, h, c) => { if (w <= 0 || h <= 0) return; g.fillStyle = c; g.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); };
/* a filled ellipse made of whole pixels */
function ell(g, cx, cy, rx, ry, c) {
  g.fillStyle = c;
  for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) {
    const dy = (y + 0.5 - cy) / ry;
    if (Math.abs(dy) > 1) continue;
    const hw = rx * Math.sqrt(1 - dy * dy);
    const x0 = Math.round(cx - hw), x1 = Math.round(cx + hw);
    if (x1 > x0) g.fillRect(x0, y, x1 - x0, 1);
  }
}
/* doubled up to canvas resolution, hard pixels */
export function doubled(src) {
  const [c, g] = cv(src.width * 2, src.height * 2);
  g.drawImage(src, 0, 0, c.width, c.height);
  return c;
}
/* pick from a colour ramp: v in 0..1 → one of the colours (no blending: pixel art) */
const ramp = (cols, v) => cols[Math.max(0, Math.min(cols.length - 1, Math.floor(v * cols.length)))];

/* ---------- colours ---------- */
const LIME = ['#5f4630', '#7d6043', '#9e7f58', '#bc9f72', '#d6bd8f', '#ead6ad', '#f8ecd0'];   // limestone, dark → light
const MARBLE = ['#7a6a55', '#a1907a', '#c4b49c', '#ddd0b8', '#ece3cf', '#f7f1e3', '#fffcf4'];  // the temple's marble
const LEAF = ['#5c6b33', '#77873f', '#93a24e', '#b3bd6a'];
const CYPRESS = ['#1f3a27', '#2c4f33', '#3d6640', '#55804f'];
const ROOF = ['#7e3a26', '#9f4c30', '#bd6440', '#d98157'];

/* ============================================================
   A Corinthian column (base, fluted shaft, acanthus capital).
   s = shaft width, h = total height, in 2-px pixels. Returns a canvas
   at those pixels (call doubled() for canvas resolution).
   ============================================================ */
export function paintColumn(s, h, pal = LIME, seed = 5) {
  const r = rng(seed);
  const W = Math.round(s * 1.9), cx = W / 2;
  const [c, g] = cv(W, h);
  const plinthH = Math.round(s * 0.42), plinthW = Math.round(s * 1.7);
  const t1 = Math.round(s * 0.17), sc = Math.max(2, Math.round(s * 0.07)), t2 = Math.round(s * 0.14);
  const capH = Math.round(s * 1.15), abH = Math.max(4, Math.round(s * 0.2));
  const baseTop = h - plinthH - t1 - sc - t2;
  const shaftTop = abH + capH;

  // one row of a round thing: shaded as a cylinder lit from the left
  const roundRow = (y, w, lift = 0, cols = pal) => {
    const x0 = Math.round(cx - w / 2);
    for (let x = 0; x < w; x++) {
      const t = (x + 0.5) / w * 2 - 1;                              // -1 left … 1 right
      const v = 0.62 - 0.42 * t + 0.16 * (1 - t * t) + lift;
      g.fillStyle = ramp(cols, v); g.fillRect(x0 + x, y, 1, 1);
    }
  };
  // a box (plinth / abacus): lit top and left, dark right
  const box = (y, w, hh) => {
    const x0 = Math.round(cx - w / 2);
    R(g, x0, y, w, hh, pal[4]);
    R(g, x0, y, w, 1, pal[6]); R(g, x0, y + 1, w, 1, pal[5]); R(g, x0, y, 1, hh, pal[5]);
    R(g, x0 + w - 2, y, 2, hh, pal[2]); R(g, x0, y + hh - 1, w, 1, pal[1]);
  };

  // plinth
  box(h - plinthH, plinthW, plinthH);
  // base mouldings: torus, scotia, torus (each row a slice of a ring)
  let y = h - plinthH;
  for (let i = 0; i < t1; i++) { const k = Math.sin(((i + 0.5) / t1) * Math.PI); roundRow(--y, s * 1.42 + k * s * 0.08, 0.18 * (i / t1 - 0.5)); }
  for (let i = 0; i < sc; i++) roundRow(--y, s * 1.2, -0.28);
  for (let i = 0; i < t2; i++) { const k = Math.sin(((i + 0.5) / t2) * Math.PI); roundRow(--y, s * 1.28 + k * s * 0.07, 0.18 * (i / t2 - 0.5)); }

  // the shaft: gently tapering, with flutes
  const N = 7;
  for (let yy = shaftTop + 4; yy < baseTop; yy++) {
    const k = (baseTop - yy) / (baseTop - shaftTop);
    const w = Math.round(s * (1 - 0.1 * k));
    roundRow(yy, w);
    const x0 = cx - w / 2;
    for (let i = 0; i < N; i++) {
      const a = -Math.PI / 2 + ((i + 0.5) / N) * Math.PI;
      const fx = x0 + (Math.sin(a) * 0.5 + 0.5) * w;
      const gw = Math.max(1, Math.round((w / N) * 0.45 * Math.cos(a)));
      const t = (fx - cx) / (w / 2);
      const v = 0.62 - 0.42 * t + 0.16 * (1 - t * t);
      R(g, fx - gw / 2, yy, gw, 1, ramp(pal, v - 0.3));                 // the groove
      R(g, fx + gw / 2, yy, 1, 1, ramp(pal, v + 0.12));                  // its lit far wall
    }
  }
  // the astragal ring under the capital
  for (let i = 0; i < 4; i++) roundRow(shaftTop + i, s * 0.98 + 3, 0.1 - i * 0.08);

  // capital: the bell, two rows of acanthus, volutes, abacus
  for (let i = 0; i < capH; i++) {
    const yy = shaftTop - 1 - i, k = i / capH;
    roundRow(yy, s * (0.92 + 0.5 * k * k), -0.05);
  }
  const leaf = (lx, base, lh, lw, light, curl) => {
    for (let i = 0; i < lh; i++) {
      const k = i / lh, hw = lw * Math.pow(Math.sin(Math.PI * Math.min(1, k * 1.05)), 0.75) * (1 - 0.35 * k);
      const off = k > 0.65 ? (k - 0.65) * lw * 1.6 * curl : 0;
      const yy = base - i, x0 = lx + off;
      R(g, x0 - hw, yy, hw * 2, 1, pal[light]);
      R(g, x0 - hw, yy, 1, 1, pal[light - 2]);
      R(g, x0 + hw - 1, yy, 1, 1, pal[light - 2]);
      if (k < 0.8) R(g, x0 - 0.5, yy, 1, 1, pal[light - 2]);             // the midrib
    }
    // the curled tip
    R(g, lx + lw * 0.55 * curl - 1, base - lh - 1, 3, 2, pal[light - 1]);
  };
  const capBase = shaftTop - 1;
  for (const t of [-0.62, -0.2, 0.2, 0.62]) leaf(cx + t * s * 0.62, capBase - Math.round(capH * 0.32), Math.round(capH * 0.58), Math.max(3, s * 0.15), 4, t < 0 ? -1 : 1);
  for (const t of [-0.82, -0.42, 0, 0.42, 0.82]) leaf(cx + t * s * 0.56, capBase, Math.round(capH * 0.5), Math.max(3, s * 0.15), t < -0.3 ? 6 : t > 0.3 ? 4 : 5, t < 0 ? -1 : t > 0 ? 1 : 0);
  // volutes at the corners
  const vr = Math.max(3, Math.round(s * 0.13));
  for (const side of [-1, 1]) {
    const vx = cx + side * s * 0.7, vy = abH + vr + 1;
    ell(g, vx, vy, vr, vr, pal[1]);
    ell(g, vx, vy, vr - 1, vr - 1, side < 0 ? pal[5] : pal[3]);
    ell(g, vx + side * 0.5, vy, Math.max(1, vr - 2.5), Math.max(1, vr - 2.5), pal[2]);
    R(g, vx - 0.5, vy - 0.5, 1, 1, pal[6]);
  }
  // the abacus, with a small flower in the middle
  box(0, Math.round(s * 1.75), abH);
  R(g, cx - 2, 1, 4, abH - 2, pal[2]); R(g, cx - 1, 2, 2, abH - 4, pal[6]);

  // weathering: chips and a hairline crack or two
  const id = g.getImageData(0, 0, W, h), d = id.data;
  for (let i = 0; i < d.length; i += 4) {
    if (!d[i + 3]) continue;
    const n = r();
    if (n < 0.03) { d[i] -= 26; d[i + 1] -= 24; d[i + 2] -= 20; }
    else if (n < 0.045) { d[i] += 18; d[i + 1] += 16; d[i + 2] += 12; }
  }
  g.putImageData(id, 0, 0);
  g.globalCompositeOperation = 'source-atop';
  for (let k = 0; k < 2; k++) {
    let x = cx - s * 0.3 + r() * s * 0.6, yy = shaftTop + r() * (baseTop - shaftTop) * 0.7;
    for (let st = 0; st < 14; st++) { R(g, x, yy, 1, 2, pal[1]); x += (r() - 0.5) * 2; yy += 2; }
  }
  g.globalCompositeOperation = 'source-over';
  return c;
}

/* ============================================================
   Backdrop building blocks (2-px pixels). Every piece stands on y = ground.
   ============================================================ */
/* a small column for buildings far away */
function farColumn(g, x, ground, w, h, pal) {
  R(g, x - 1, ground - 3, w + 2, 3, pal[2]);                       // base
  for (let i = 0; i < w; i++) R(g, x + i, ground - h, 1, h - 3, ramp(pal, 0.85 - (i / w) * 0.6));
  R(g, x - 1, ground - h - 3, w + 2, 3, pal[4]);                   // capital
  R(g, x - 1, ground - h - 1, w + 2, 1, pal[2]);
}
function entablature(g, x, y, w, hh, pal, dentils = true) {
  R(g, x, y, w, hh, pal[3]);
  R(g, x, y, w, 1, pal[5]); R(g, x, y + hh - 1, w, 1, pal[1]);
  R(g, x, y + Math.round(hh * 0.45), w, 1, pal[2]);
  if (dentils) for (let i = x + 1; i < x + w - 1; i += 3) R(g, i, y + 2, 2, 2, pal[2]);
}
function pediment(g, x, y, w, hh, pal) {                            // y = its bottom
  for (let i = 0; i < hh; i++) {
    const half = (w / 2) * (1 - i / hh);
    R(g, x + w / 2 - half, y - i - 1, half * 2, 1, pal[4]);
    R(g, x + w / 2 - half, y - i - 1, 2, 1, pal[6]);                 // lit left rake
    R(g, x + w / 2 + half - 2, y - i - 1, 2, 1, pal[2]);
  }
  // the shaded tympanum inside
  for (let i = 3; i < hh - 3; i++) {
    const half = (w / 2) * (1 - i / hh) - 4;
    if (half > 1) R(g, x + w / 2 - half, y - i - 1, half * 2, 1, pal[3]);
  }
}
function temple(g, x, ground, w, colH, pal, r) {
  const n = Math.max(4, Math.round(w / 14)), cw = Math.max(3, Math.round(w / n * 0.42));
  const podium = Math.max(4, Math.round(colH * 0.12));
  R(g, x - 3, ground - podium, w + 6, podium, pal[3]);
  R(g, x - 3, ground - podium, w + 6, 1, pal[5]);
  for (let i = 0; i < podium; i += 3) R(g, x - 3, ground - podium + i + 2, w + 6, 1, pal[2]);     // steps
  const top = ground - podium - colH;
  R(g, x + 2, top, w - 4, colH, pal[1]);                           // the dark cella behind the columns
  R(g, x + w / 2 - cw, top + colH * 0.35, cw * 2, colH * 0.65, '#3a2c20');   // its door
  for (let i = 0; i < n; i++) farColumn(g, Math.round(x + (i + 0.5) * (w / n) - cw / 2), ground - podium, cw, colH, pal);
  const eh = Math.max(5, Math.round(colH * 0.16));
  entablature(g, x - 2, top - eh, w + 4, eh, pal);
  pediment(g, x - 3, top - eh, w + 6, Math.round(w * 0.22), pal);
}
function colonnade(g, x, ground, w, colH, pal, roof) {
  const sp = Math.max(9, Math.round(colH * 0.32)), cw = Math.max(3, Math.round(sp * 0.36));
  const top = ground - colH;
  R(g, x, top, w, colH, pal[1]);                                    // shade under the portico
  R(g, x, top + colH * 0.2, w, colH * 0.8, pal[2]);
  for (let i = 0; i < Math.floor(w / (sp * 2)); i++) R(g, x + sp + i * sp * 2, top + colH * 0.35, sp * 0.8, colH * 0.65, '#4a3a2c');   // doorways in the back wall
  for (let cxp = x + 2; cxp < x + w - cw; cxp += sp) farColumn(g, cxp, ground, cw, colH, pal);
  const eh = Math.max(5, Math.round(colH * 0.15));
  entablature(g, x - 2, top - eh, w + 4, eh, pal);
  if (roof) {                                                        // tiled roof
    for (let i = 0; i < 6; i++) R(g, x - 3 + i, top - eh - i - 1, w + 6 - i * 2, 1, ROOF[i % 2 ? 1 : 2]);
    for (let i = x; i < x + w; i += 4) R(g, i, top - eh - 6, 1, 6, ROOF[0]);
  }
}
function arch(g, x, ground, w, hh, pal) {
  R(g, x, ground - hh, w, hh, pal[3]);
  R(g, x, ground - hh, w, 1, pal[5]); R(g, x, ground - hh, 1, hh, pal[4]); R(g, x + w - 2, ground - hh, 2, hh, pal[1]);
  const ow = Math.round(w * 0.38), oh = Math.round(hh * 0.62), ox = x + (w - ow) / 2;
  R(g, ox, ground - oh + ow / 2, ow, oh - ow / 2, '#3f3226');        // the opening
  ell(g, ox + ow / 2, ground - oh + ow / 2, ow / 2, ow / 2, '#3f3226');
  R(g, ox, ground - oh + ow / 2, ow, 1, pal[1]);
  for (const sx of [x + 3, x + w - 7]) farColumn(g, sx, ground, 4, Math.round(hh * 0.6), pal);   // the engaged columns
  entablature(g, x - 2, ground - hh - 6, w + 4, 6, pal);
  R(g, x + 4, ground - hh - 16, w - 8, 10, pal[4]);                  // the attic, with its inscription band
  R(g, x + 8, ground - hh - 13, w - 16, 4, pal[2]);
  for (let i = x + 10; i < x + w - 10; i += 3) R(g, i, ground - hh - 12, 2, 2, pal[3]);
}
function house(g, x, ground, w, hh, pal, r) {
  R(g, x, ground - hh, w, hh, pal[4]);
  R(g, x, ground - hh, 1, hh, pal[5]); R(g, x + w - 2, ground - hh, 2, hh, pal[2]);
  for (let i = 0; i < 5; i++) R(g, x - 2 + i, ground - hh - i - 1, w + 4 - i * 2, 1, ROOF[(i % 2) + 1]);
  for (let wx = x + 4; wx < x + w - 5; wx += 9) if (r() < 0.7) R(g, wx, ground - hh + 6, 3, 4, '#4a3a2c');
  if (w > 18) R(g, x + w / 2 - 3, ground - 10, 6, 10, '#4a3a2c');
}
function cypress(g, x, ground, hh) {
  R(g, x - 1, ground - 4, 2, 4, '#4a3a2a');
  for (let i = 0; i < hh; i++) {
    const k = i / hh, hw = Math.max(1, (hh * 0.13) * Math.sin(Math.PI * Math.min(1, (1 - k) * 1.15 + 0.05)) * (k < 0.15 ? k / 0.15 : 1));
    R(g, x - hw, ground - 4 - i, hw, 1, CYPRESS[2]);
    R(g, x, ground - 4 - i, hw, 1, CYPRESS[1]);
    if (i % 5 === 2) R(g, x - hw, ground - 4 - i, 1, 1, CYPRESS[3]);
  }
}
function pine(g, x, ground, hh, r) {                                 // an umbrella pine
  R(g, x - 1, ground - hh, 2, hh, '#5a4430');
  R(g, x - 4, ground - hh * 0.7, 4, 1, '#5a4430'); R(g, x + 1, ground - hh * 0.8, 4, 1, '#5a4430');
  const cw = hh * 0.75;
  ell(g, x, ground - hh, cw, hh * 0.18, CYPRESS[1]);
  ell(g, x - cw * 0.2, ground - hh - hh * 0.06, cw * 0.75, hh * 0.13, CYPRESS[2]);
  for (let i = 0; i < 18; i++) R(g, x - cw * 0.7 + r() * cw * 1.2, ground - hh - hh * 0.12 + r() * hh * 0.1, 2, 1, CYPRESS[3]);
}
function bush(g, x, ground, w, r) {
  ell(g, x, ground - w * 0.35, w * 0.5, w * 0.38, LEAF[1]);
  ell(g, x - w * 0.12, ground - w * 0.45, w * 0.32, w * 0.25, LEAF[2]);
  for (let i = 0; i < 6; i++) R(g, x - w * 0.35 + r() * w * 0.6, ground - w * 0.6 + r() * w * 0.3, 1, 1, LEAF[3]);
}
function cloud(g, x, y, w, r, cols = ['#c7d5e6', '#e3ebf3', '#f7fafc', '#ffffff']) {
  const puffs = [];
  const n = 3 + Math.floor(w / 26);
  for (let i = 0; i < n; i++) {
    const px = x + (i / (n - 1) - 0.5) * w * 0.8, pr = w * (0.16 + r() * 0.12) * (1 - Math.abs(i / (n - 1) - 0.5));
    puffs.push([px, y - pr * 0.6, pr + 4]);
  }
  for (const [px, py, pr] of puffs) ell(g, px, py + 3, pr, pr * 0.7, cols[0]);           // shadow underneath
  for (const [px, py, pr] of puffs) ell(g, px, py, pr, pr * 0.7, cols[1]);
  for (const [px, py, pr] of puffs) ell(g, px - pr * 0.18, py - pr * 0.15, pr * 0.7, pr * 0.5, cols[2]);
  for (const [px, py, pr] of puffs) ell(g, px - pr * 0.3, py - pr * 0.3, pr * 0.35, pr * 0.25, cols[3]);
  R(g, x - w * 0.42, y - 1, w * 0.84, 4, cols[1]);                                          // flat bottom
  R(g, x - w * 0.42, y + 2, w * 0.84, 2, cols[0]);
}
/* sky: clean bands of colour, STEP pixels tall, blending from stop to stop */
function skyCanvas(w, h, bands) {
  const [c, g] = cv(w, h);
  const hex = s => [1, 3, 5].map(i => parseInt(s.slice(i, i + 2), 16));
  const cols = bands.map(hex), seg = h / (bands.length - 1), STEP = 6;
  for (let y = 0; y < h; y += STEP) {
    const f = (y + STEP / 2) / seg, i = Math.min(cols.length - 2, Math.floor(f)), k = f - i;
    const m = cols[i].map((v, j) => Math.round(v + (cols[i + 1][j] - v) * k));
    g.fillStyle = 'rgb(' + m.join(',') + ')'; g.fillRect(0, y, w, STEP);
  }
  return c;
}
/* distant hills that repeat seamlessly over width w */
function hills(g, w, ground, height, base, rim, seed) {
  const r = rng(seed), k = [1 + Math.floor(r() * 2), 3 + Math.floor(r() * 2), 7], ph = [r() * 6, r() * 6, r() * 6];
  const hy = x => ground - height * (0.55 + 0.25 * Math.sin((x / w) * Math.PI * 2 * k[0] + ph[0]) + 0.13 * Math.sin((x / w) * Math.PI * 2 * k[1] + ph[1]) + 0.05 * Math.sin((x / w) * Math.PI * 2 * k[2] + ph[2]));
  for (let x = 0; x < w; x++) {
    const top = Math.round(hy(x));
    R(g, x, top, 1, ground - top, base);
    R(g, x, top, 1, 2, rim);
  }
  return hy;
}

/* ============================================================
   The street of Philadelphia by day: sky, the hills of Amman with the
   Citadel and its temple, then the city: temples, colonnades, an arch,
   houses with red-tiled roofs, cypresses and umbrella pines.
   ============================================================ */
export function streetBackdrop() {
  const H = 420, GROUND = 420;
  const sky = skyCanvas(320, H, ['#3a66b8', '#5584cf', '#7aa5de', '#a9c6e8', '#d6e3ea', '#ecebdc']);

  // clouds (repeat every 1400 px)
  const [cl, cg] = cv(1400, 260); const rc = rng(31);
  for (let i = 0; i < 9; i++) cloudWrap(cg, 1400, 60 + i * 155 + rc() * 50, 50 + rc() * 150, 60 + rc() * 90, rc);

  // the hills of Amman, far away and hazy, the Citadel on one of them
  const [hl, hg] = cv(1800, H); const rh = rng(77);
  const hy = hills(hg, 1800, GROUND, 190, '#b7b2a3', '#cfcabb', 11);
  hills(hg, 1800, GROUND, 120, '#a8a08c', '#bdb6a2', 23);
  for (let i = 0; i < 260; i++) { const x = rh() * 1800, y = hy(x) + 6 + rh() * 60; R(hg, x, y, 2, 2, '#98987a'); }      // olive trees
  {                                                                                     // the Citadel and its temple
    let best = 0; for (let x = 300; x < 900; x++) if (hy(x) < hy(best) || !best) best = x;
    const top = Math.round(hy(best));
    R(hg, best - 70, top - 8, 140, 10, '#c4b9a0');                                      // the walls
    for (let i = best - 70; i < best + 70; i += 6) R(hg, i, top - 11, 3, 3, '#c4b9a0');
    const pal = ['#8e8573', '#a59b86', '#b9ae97', '#ccc1a8', '#dcd2ba', '#e8dfc9', '#f2ebd9'];
    temple(hg, best - 28, top - 8, 56, 30, pal, rh);
  }

  // the city: a row of buildings, trees between them (repeats every 2600 px)
  const [ct, tg] = cv(2600, H); const r = rng(5);
  const CITY = LIME.map(c => c);                                                        // a touch hazier than the street
  const hazy = ['#7a6a55', '#957f62', '#b29b77', '#cbb58c', '#dccaa3', '#ece0c2', '#f7eedb'];
  let x = 10;
  const kinds = ['temple', 'colonnade', 'house', 'arch', 'colonnade', 'house', 'temple', 'house', 'colonnade', 'arch', 'house', 'colonnade'];
  let ki = 0;
  while (x < 2480) {
    const kind = kinds[ki++ % kinds.length];
    if (r() < 0.55) { cypress(tg, x + 6, GROUND - 40, 50 + r() * 40); x += 14; }
    else if (r() < 0.4) { pine(tg, x + 16, GROUND - 40, 46 + r() * 20, r); x += 34; }
    const g0 = GROUND - 40 - Math.round(r() * 14);
    if (kind === 'temple') { const w = 110 + r() * 60; temple(tg, x, g0, w, 70 + r() * 30, hazy, r); x += w + 26; }
    else if (kind === 'colonnade') { const w = 140 + r() * 120; colonnade(tg, x, g0, w, 50 + r() * 26, hazy, r() < 0.7); x += w + 20; }
    else if (kind === 'arch') { const w = 64 + r() * 20; arch(tg, x, g0, w, 90 + r() * 20, hazy); x += w + 24; }
    else { const w = 34 + r() * 40; house(tg, x, g0, w, 30 + r() * 30, hazy, r); x += w + 8; if (r() < 0.6) { house(tg, x, g0 + 4, w * 0.8, 24 + r() * 20, hazy, r); x += w * 0.8 + 10; } }
  }
  R(tg, 0, GROUND - 40, 2600, 40, '#c3ad84');                                           // the street level far off
  R(tg, 0, GROUND - 40, 2600, 2, '#dcc8a0');
  for (let i = 0; i < 2600; i += 7) R(tg, i, GROUND - 40 + 6 + (i * 13) % 20, 4, 1, '#ad9670');

  // near: low garden walls, column stumps, bushes (repeats every 1700 px)
  const [nr, ng] = cv(1700, H); const rn = rng(91);
  for (let x2 = 0; x2 < 1700;) {
    const pick = rn();
    if (pick < 0.35) { const w = 60 + rn() * 90, hh = 14 + rn() * 8;
      R(ng, x2, GROUND - hh, w, hh, LIME[4]); R(ng, x2, GROUND - hh, w, 2, LIME[6]); R(ng, x2 + w - 2, GROUND - hh, 2, hh, LIME[2]);
      for (let bx = x2; bx < x2 + w; bx += 12) R(ng, bx, GROUND - hh + 7, 1, hh - 7, LIME[2]);
      x2 += w; }
    else if (pick < 0.55) { bush(ng, x2 + 14, GROUND, 26 + rn() * 14, rn); x2 += 30; }
    else if (pick < 0.7) { const hh = 18 + rn() * 26; const col = paintColumn(10, Math.round(hh + 40), LIME, 3 + x2);
      ng.drawImage(col, 0, col.height - hh, col.width, hh, x2, GROUND - hh, col.width, hh); R(ng, x2 + 2, GROUND - hh, col.width - 4, 2, LIME[6]); x2 += 26; }
    else x2 += 30 + rn() * 70;
  }
  return { sky, layers: [{ img: cl, f: 0.04, y: 0 }, { img: hl, f: 0.1, y: 0 }, { img: ct, f: 0.22, y: 0 }, { img: nr, f: 0.45, y: 0 }], pit: '#16101c' };
}

/* ============================================================
   The sky above the city: bright air, a sea of clouds below, the
   Citadel hill far down through a gap, floating cloud banks.
   ============================================================ */
export function skyBackdrop(city = null) {
  const H = 420;
  const sky = skyCanvas(320, H, ['#2f5fb8', '#4878cc', '#6b97dc', '#95b8e6', '#c3d7ee', '#eaf0f2']);
  const [sun, sg] = cv(1600, H);
  ell(sg, 1240, 90, 40, 40, '#fff3c8'); ell(sg, 1240, 90, 30, 30, '#fffbe8');
  const rs = rng(12);
  for (let i = 0; i < 6; i++) cloudWrap(sg, 1600, 100 + i * 260 + rs() * 80, 60 + rs() * 120, 70 + rs() * 70, rs);
  // far cloud banks
  const [far, fg] = cv(1800, H); const rf = rng(44);
  for (let i = 0; i < 16; i++) cloudWrap(fg, 1800, i * 115 + rf() * 40, 300 + rf() * 40, 120 + rf() * 80, rf, ['#b9c9de', '#d3dfec', '#e8eff6', '#f6f9fb']);
  for (let i = 0; i < 22; i++) cloudWrap(fg, 1800, i * 82 + rf() * 30, 372 + rf() * 30, 110 + rf() * 70, rf, ['#b9c9de', '#d3dfec', '#e8eff6', '#f6f9fb']);   // a second, lower row instead of a flat band
  // near cloud sea
  const [near, ng] = cv(1500, H); const rn = rng(57);
  for (let i = 0; i < 14; i++) cloudWrap(ng, 1500, i * 110 + rn() * 40, 380 + rn() * 30, 140 + rn() * 90, rn);
  R(ng, 0, 392, 1500, 28, '#e3ebf3');
  const layers = [{ img: sun, f: 0.03, y: 0 }];
  if (city) layers.push({ img: cityFar(city), f: 0.07, y: 60, mirror: true });     // the city, far off beyond the clouds
  layers.push({ img: far, f: 0.12, y: 0 }, { img: near, f: 0.3, y: 0 });
  return { sky, layers, pit: '#cfdcea' };
}

/* ============================================================
   The Temple of Hercules (front), standing in the sky.
   w, h in 2-px pixels; the bottom edge stands on the ground.
   Its pediment shows a lion skin and a club: his signs.
   ============================================================ */
export function templeFront(w = 330, h = 310) {
  const [c, g] = cv(w, h); const r = rng(8), pal = MARBLE;
  const steps = 4, stepH = 7, colN = 6;
  const base = h - steps * stepH;
  for (let i = 0; i < steps; i++) {
    const inset = i * 6, y = h - (i + 1) * stepH;
    R(g, inset, y, w - inset * 2, stepH, pal[4]);
    R(g, inset, y, w - inset * 2, 1, pal[6]); R(g, inset, y + stepH - 1, w - inset * 2, 1, pal[2]);
  }
  const colW = 22, colH = Math.round(h * 0.55), inner = 26;
  const top = base - colH;
  // the cella wall and its great door, with warm light inside
  R(g, inner, top, w - inner * 2, colH, pal[2]);
  for (let y = top + 6; y < base; y += 9) for (let x = inner + ((y / 9) % 2 ? 0 : 10); x < w - inner; x += 20) R(g, x, y, 1, 8, pal[1]);
  for (let y = top; y < base; y += 9) R(g, inner, y, w - inner * 2, 1, pal[1]);
  const dw = 62, dh = Math.round(colH * 0.72), dx = (w - dw) / 2;
  R(g, dx - 5, base - dh - 6, dw + 10, dh + 6, pal[4]);                              // door frame
  R(g, dx - 5, base - dh - 6, dw + 10, 2, pal[6]);
  R(g, dx, base - dh, dw, dh, '#2a1d14');
  for (let i = 0; i < 18; i++) ell(g, w / 2, base - 8, 26 - i, 26 - i, ['#3a2716', '#4d331a', '#64431f', '#7d5525', '#97672b'][Math.min(4, i >> 2)]);   // the glow inside
  R(g, dx, base - 3, dw, 3, '#2a1d14');
  // columns
  for (let i = 0; i < colN; i++) {
    const x = Math.round(8 + i * ((w - 16 - colW) / (colN - 1)));
    const col = paintColumn(colW, colH + 6, pal, 40 + i);
    g.drawImage(col, x + colW / 2 - col.width / 2, base - colH - 6);
  }
  // entablature: architrave, frieze with triglyph-like blocks, cornice with dentils
  const eTop = top - 34;
  R(g, 2, top - 6, w - 4, 8, pal[4]); R(g, 2, top - 6, w - 4, 1, pal[6]); R(g, 2, top + 1, w - 4, 1, pal[1]);
  R(g, 2, top - 20, w - 4, 14, pal[3]);
  for (let x = 8; x < w - 12; x += 18) { R(g, x, top - 18, 8, 10, pal[5]); R(g, x + 7, top - 18, 1, 10, pal[2]); }
  R(g, 0, eTop, w, 14, pal[4]); R(g, 0, eTop, w, 2, pal[6]); R(g, 0, eTop + 13, w, 1, pal[1]);
  for (let x = 2; x < w - 2; x += 4) R(g, x, eTop + 9, 2, 3, pal[2]);
  // the pediment
  const ph = 70;
  for (let i = 0; i < ph; i++) {
    const half = (w / 2) * (1 - i / ph);
    R(g, w / 2 - half, eTop - i - 1, half * 2, 1, pal[5]);
    R(g, w / 2 - half, eTop - i - 1, 3, 1, pal[6]);
    R(g, w / 2 + half - 3, eTop - i - 1, 3, 1, pal[2]);
    const inner2 = half - 9;
    if (i > 5 && inner2 > 1) R(g, w / 2 - inner2, eTop - i - 1, inner2 * 2, 1, pal[3]);
  }
  // in the tympanum: the lion skin and the club, in gilded relief
  const cx = w / 2, cy = eTop - 22;
  ell(g, cx, cy, 20, 11, '#b8862c'); ell(g, cx, cy - 1, 18, 9, '#d9a73e');                // the pelt
  ell(g, cx, cy - 8, 8, 7, '#b8862c'); ell(g, cx, cy - 9, 6, 5, '#e8bf55');               // the lion's head
  R(g, cx - 3, cy - 10, 2, 2, '#5a3a10'); R(g, cx + 1, cy - 10, 2, 2, '#5a3a10');
  for (let i = 0; i < 40; i++) R(g, cx - 36 + i * 1.8, cy + 6 - i * 0.35, 3, 3, i < 30 ? '#9c6f2a' : '#c4924a');     // the club
  // gilded acroteria on the roof
  for (const ax of [6, w / 2 - 5, w - 16]) { R(g, ax, ax === w / 2 - 5 ? eTop - ph - 10 : eTop - 10, 10, 10, '#d9a73e'); R(g, ax + 2, (ax === w / 2 - 5 ? eTop - ph - 10 : eTop - 10) + 2, 4, 3, '#f6d777'); }
  // a little weathering
  const id = g.getImageData(0, 0, w, h), d = id.data;
  for (let i = 0; i < d.length; i += 4) { if (!d[i + 3]) continue; const n = r(); if (n < 0.02) { d[i] -= 18; d[i + 1] -= 18; d[i + 2] -= 16; } }
  g.putImageData(id, 0, 0);
  return c;
}

/* a cloud on a layer that repeats every W pixels: drawn again across the join, the same shape */
function cloudWrap(g, W, x, y, w, r, cols) {
  const seed = Math.floor(r() * 1e9);
  for (const dx of [-W, 0, W]) cloud(g, x + dx, y, w, rng(seed), cols);
}

/* ============================================================
   The owner's city picture (art/new/bc 2 (6).png), seen far off from the sky:
   its magenta sky cut away, hazed toward the sky colour, sized to h pixels (2-px).
   ============================================================ */
export function cityFar(img, h = 400, haze = [195, 215, 238], amount = 0.38) {
  const [c, g] = cv(img.width, img.height);
  g.drawImage(img, 0, 0);
  const id = g.getImageData(0, 0, c.width, c.height), d = id.data;
  for (let i = 0; i < d.length; i += 4) {
    const r = d[i], gg = d[i + 1], b = d[i + 2];
    if (r - gg > 55 && b - gg > 55) { d[i + 3] = 0; continue; }               // magenta, and the pink fringe next to it
    d[i] = r + (haze[0] - r) * amount; d[i + 1] = gg + (haze[1] - gg) * amount; d[i + 2] = b + (haze[2] - b) * amount;
  }
  g.putImageData(id, 0, 0);
  const w = Math.round(img.width * h / img.height);
  const [o, og] = cv(w, h);
  og.imageSmoothingEnabled = true; og.imageSmoothingQuality = 'high';
  og.drawImage(c, 0, 0, w, h);
  const od = og.getImageData(0, 0, w, h);
  for (let i = 3; i < od.data.length; i += 4) od.data[i] = od.data[i] > 120 ? 255 : 0;  // hard edges
  og.putImageData(od, 0, 0);
  return o;
}

/* ============================================================
   Props for the sky level (2-px pixels)
   ============================================================ */
/* puffs of cloud that hang under and around the islands, so they float */
export function cloudPuffs() {
  const out = [];
  for (let i = 0; i < 4; i++) {
    const r = rng(300 + i * 17), w = 44 + i * 10;
    const [c, g] = cv(w + 20, 46);
    cloud(g, (w + 20) / 2, 30, w, r, ['#c9d6e6', '#e6edf5', '#f7fafc', '#ffffff']);
    out.push(c);
  }
  return out;
}
/* a bronze brazier on three legs, with fire (frame 0–2) */
export function brazier(frame) {
  const [c, g] = cv(24, 46); const r = rng(70 + frame * 13);
  const B = ['#4a2e12', '#7a4a1c', '#a8692a', '#d29a48', '#f0c574'];
  R(g, 5, 30, 2, 16, B[1]); R(g, 17, 30, 2, 16, B[1]); R(g, 11, 30, 2, 16, B[2]);           // legs
  R(g, 4, 44, 4, 2, B[0]); R(g, 16, 44, 4, 2, B[0]); R(g, 10, 44, 4, 2, B[0]);              // feet
  for (let y = 0; y < 8; y++) { const hw = 11 - y * 0.6; R(g, 12 - hw, 22 + y, hw * 2, 1, y < 2 ? B[4] : y < 5 ? B[3] : B[2]); }   // the bowl
  R(g, 1, 22, 22, 1, B[4]); R(g, 21, 23, 2, 5, B[1]);
  const F = ['#b8321c', '#e85a1e', '#ff9a2a', '#ffd25a', '#fff2b0'];                         // the fire
  for (let i = 0; i < 5; i++) {
    const fx = 12 + (r() - 0.5) * 8, fh = 10 + r() * 10 - i * 1.5, fw = 6 - i;
    for (let y = 0; y < fh; y++) { const hw = fw * (1 - y / fh); R(g, fx - hw, 22 - y, hw * 2, 1, F[Math.min(4, i + Math.floor(y / fh * 2))]); }
  }
  for (let i = 0; i < 4; i++) R(g, 6 + r() * 12, 2 + r() * 8, 1, 1, F[3]);                    // sparks
  return c;
}
/* a marble plinth with a tall amphora on it */
export function urn() {
  const [c, g] = cv(28, 58); const pal = MARBLE;
  R(g, 2, 40, 24, 18, pal[4]); R(g, 2, 40, 24, 2, pal[6]); R(g, 2, 40, 2, 18, pal[5]); R(g, 24, 40, 2, 18, pal[2]); R(g, 0, 38, 28, 3, pal[5]); R(g, 0, 56, 28, 2, pal[2]);
  const T = ['#6e3a20', '#8f4e2a', '#b0683a', '#cf8a52', '#e6ad74'];
  for (let y = 0; y < 30; y++) {
    const k = y / 30, hw = y < 6 ? 3 : 3 + Math.sin(((y - 6) / 24) * Math.PI) * 7;
    for (let x = -hw; x < hw; x++) R(g, 14 + x, 8 + y, 1, 1, ramp(T, 0.75 - (x / hw) * 0.4 - k * 0.15));
  }
  R(g, 9, 6, 10, 2, T[3]); R(g, 6, 12, 2, 8, T[1]); R(g, 20, 12, 2, 8, T[1]);                // lip and handles
  R(g, 8, 24, 12, 2, '#3a2010'); for (let x = 9; x < 19; x += 3) R(g, x, 25, 1, 1, T[4]);     // a painted band
  return c;
}

/* ============================================================
   The Philadelphia street, in the same style as the sky level:
   the same sky and clouds, the city of bc 2 (6) far off in the haze,
   the city of bc 2 (1) behind the street, and low walls, column stumps
   and bushes in front of it.
   ============================================================ */
export function streetBackdrop2(cityNear, cityBack) {
  const H = 420;
  const sky = skyCanvas(320, H, ['#2f5fb8', '#4878cc', '#6b97dc', '#95b8e6', '#c3d7ee', '#eaf0f2']);
  const [sun, sg] = cv(1600, H);
  ell(sg, 1240, 70, 40, 40, '#fff3c8'); ell(sg, 1240, 70, 30, 30, '#fffbe8');
  const rs = rng(19);
  for (let i = 0; i < 6; i++) cloudWrap(sg, 1600, 100 + i * 260 + rs() * 80, 40 + rs() * 100, 70 + rs() * 70, rs);
  const layers = [{ img: sun, f: 0.03, y: 0 }];
  if (cityBack) layers.push({ img: cityFar(cityBack, 300, [195, 215, 238], 0.5), f: 0.06, y: 110, mirror: true });   // far off, in the haze
  if (cityNear) {
    const near = cityFar(cityNear, 330, [210, 222, 236], 0.14);                                                  // the city behind the street
    layers.push({ img: near, f: 0.16, y: H - near.height + 16, mirror: true });
  }
  // in front: low garden walls, column stumps, bushes, cypresses (repeats every 1700 px)
  const [nr, ng] = cv(1700, H); const rn = rng(91);
  for (let x2 = 0; x2 < 1700;) {
    const pick = rn();
    if (pick < 0.3) { const w = 60 + rn() * 90, hh = 14 + rn() * 8;
      R(ng, x2, H - hh, w, hh, LIME[4]); R(ng, x2, H - hh, w, 2, LIME[6]); R(ng, x2 + w - 2, H - hh, 2, hh, LIME[2]);
      for (let bx = x2; bx < x2 + w; bx += 12) R(ng, bx, H - hh + 7, 1, hh - 7, LIME[2]);
      x2 += w; }
    else if (pick < 0.5) { bush(ng, x2 + 14, H, 26 + rn() * 14, rn); x2 += 30; }
    else if (pick < 0.62) { cypress(ng, x2 + 8, H, 70 + rn() * 50); x2 += 22; }
    else if (pick < 0.74) { const hh = 18 + rn() * 26; const col = paintColumn(10, Math.round(hh + 40), LIME, 3 + x2);
      ng.drawImage(col, 0, col.height - hh, col.width, hh, x2, H - hh, col.width, hh); R(ng, x2 + 2, H - hh, col.width - 4, 2, LIME[6]); x2 += 26; }
    else x2 += 30 + rn() * 70;
  }
  layers.push({ img: nr, f: 0.45, y: 0 });
  return { sky, layers, pit: '#16101c' };
}
