/* ============================================================
   SHEETS — cuts game sprites out of the painted sheets in assets/src
   (made from the pictures in art/new by tools/build_new_art.ps1).

   Hercules: the sheet has no transparency and the frames are not on a
   grid, so each figure is found by flood-filling the dark background
   away and collecting what is left. FRAMES below names the figures by
   a point inside each one, plus where his body stands (the x of his
   feet in the sheet), so every frame lines up on the same spot.
   ============================================================ */
const OUT = '#17121d';

function pixels(img) {
  const c = document.createElement('canvas');
  c.width = img.width; c.height = img.height;
  const g = c.getContext('2d', { willReadFrequently: true });
  g.drawImage(img, 0, 0);
  return g.getImageData(0, 0, c.width, c.height);
}

/* flood the background away from the picture's edges. isBg(r,g,b) says what may be background. */
function floodBg(id, isBg) {
  const { width: W, height: H, data: d } = id;
  const bg = new Uint8Array(W * H), st = [];
  for (let x = 0; x < W; x++) st.push(x, x + (H - 1) * W);
  for (let y = 0; y < H; y++) st.push(y * W, y * W + W - 1);
  while (st.length) {
    const p = st.pop();
    if (bg[p]) continue;
    const i = p * 4;
    if (!isBg(d[i], d[i + 1], d[i + 2])) continue;
    bg[p] = 1;
    const x = p % W, y = (p / W) | 0;
    if (x > 0) st.push(p - 1); if (x < W - 1) st.push(p + 1);
    if (y > 0) st.push(p - W); if (y < H - 1) st.push(p + W);
  }
  return bg;
}

/* groups of pixels that belong together (gaps up to `gap` px are bridged: dust, stars, a loose club) */
function components(bg, W, H, gap = 3, minArea = 600) {
  const lab = new Int32Array(W * H), out = [];
  let n = 0;
  for (let p0 = 0; p0 < W * H; p0++) {
    if (bg[p0] || lab[p0]) continue;
    n++;
    let x0 = W, y0 = H, x1 = 0, y1 = 0, area = 0;
    const s = [p0]; lab[p0] = n;
    while (s.length) {
      const p = s.pop(), x = p % W, y = (p / W) | 0;
      area++;
      if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
      for (let dy = -gap; dy <= gap; dy++) for (let dx = -gap; dx <= gap; dx++) {
        const xx = x + dx, yy = y + dy;
        if (xx < 0 || yy < 0 || xx >= W || yy >= H) continue;
        const q = yy * W + xx;
        if (!bg[q] && !lab[q]) { lab[q] = n; s.push(q); }
      }
    }
    if (area >= minArea) out.push({ id: n, x: x0, y: y0, w: x1 - x0 + 1, h: y1 - y0 + 1 });
  }
  return { lab, list: out };
}

/* one figure → its own canvas, with a dark outline put back round it (and a pale rim, if asked), shrunk by `k` */
function cutOne(id, lab, comp, k, rim = null) {
  const { width: W, data: d } = id;
  const m = rim ? 5 : 3, w = comp.w + m * 2, h = comp.h + m * 2;
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const g = c.getContext('2d');
  const o = g.createImageData(w, h);
  let mask = new Uint8Array(w * h);
  for (let y = 0; y < comp.h; y++) for (let x = 0; x < comp.w; x++) {
    const p = (comp.y + y) * W + comp.x + x;
    if (lab[p] !== comp.id) continue;
    const q = (y + m) * w + x + m;
    mask[q] = 1;
    o.data[q * 4] = d[p * 4]; o.data[q * 4 + 1] = d[p * 4 + 1]; o.data[q * 4 + 2] = d[p * 4 + 2]; o.data[q * 4 + 3] = 255;
  }
  const ring = (rgba) => {                                           // 2 px round whatever is there so far
    const next = mask.slice();
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const q = y * w + x;
      if (mask[q]) continue;
      let near = false;
      for (let dy = -2; dy <= 2 && !near; dy++) for (let dx = -2; dx <= 2; dx++) {
        const xx = x + dx, yy = y + dy;
        if (xx >= 0 && yy >= 0 && xx < w && yy < h && mask[yy * w + xx] && dx * dx + dy * dy <= 5) { near = true; break; }
      }
      if (near) { next[q] = 1; o.data[q * 4] = rgba[0]; o.data[q * 4 + 1] = rgba[1]; o.data[q * 4 + 2] = rgba[2]; o.data[q * 4 + 3] = rgba[3]; }
    }
    mask = next;
  };
  ring([0x17, 0x12, 0x1d, 255]);
  if (rim) ring(rim);
  g.putImageData(o, 0, 0);
  const s = document.createElement('canvas');
  s.width = Math.max(1, Math.round(w * k)); s.height = Math.max(1, Math.round(h * k));
  const sg = s.getContext('2d');
  sg.imageSmoothingEnabled = true; sg.imageSmoothingQuality = 'high';
  sg.drawImage(c, 0, 0, s.width, s.height);
  return s;
}

/* ---------------- Hercules ----------------
   [x, y] = a point inside the figure on the sheet, foot = the x his body stands on. */
const HERC = {
  idle:   [[72, 90, 75], [211, 90, 213]],
  walk:   [[472, 90, 470], [581, 90, 580], [683, 90, 683], [581, 90, 580]],
  run:    [[809, 90, 806], [929, 90, 925], [1057, 95, 1062], [1191, 95, 1192]],
  windup: [[70, 270, 86], [219, 275, 236], [381, 265, 394]],
  smash:  [[546, 268, 548], [716, 275, 716]],
  recover:[[866, 270, 874], [1028, 272, 1022], [1176, 272, 1180]],
  roarUp: [[1040, 440, 1034], [1186, 440, 1178]],
  roar:   [[392, 447, 372], [552, 447, 534], [716, 445, 698], [880, 447, 860]],
  guard:  [[643, 607, 643], [760, 607, 760]],
  hurt:   [[73, 770, 73], [210, 770, 210]],
  down:   [[381, 785, 392], [530, 775, 538], [682, 778, 690]],
  kneel:  [[910, 640, 910], [1062, 640, 1062]],
  out:    [[853, 772, 846], [1011, 808, 1011], [1177, 818, 1178]],
};
export const HERC_SCALE = 0.99;       // sheet px → canvas px: he stands about 39 world units tall, 1.3× Saqer (30) — the owner's size

export function buildHercules(img) {
  const id = pixels(img);
  const bg = floodBg(id, (r, g, b) => { const mx = Math.max(r, g, b), mn = Math.min(r, g, b); return mx < 100 && mx - mn < 22; });
  const { lab, list } = components(bg, id.width, id.height);
  const frames = {};
  for (const name in HERC) {
    frames[name] = HERC[name].map(([px, py, foot]) => {
      const hits = list.filter(c => px >= c.x && px < c.x + c.w && py >= c.y && py < c.y + c.h)
        .sort((a, b) => Math.abs(a.x + a.w / 2 - px) - Math.abs(b.x + b.w / 2 - px));
      if (!hits.length) throw new Error('Hercules frame not found: ' + name);
      const comp = hits[0];
      // on the same pixel grid as Saqer and the creatures (2026-11-15: he was smooth, which read as painted next to them)
      return { img: coarser(cutOne(id, lab, comp, HERC_SCALE), SAQER_PX), ax: (foot - comp.x + 3) * HERC_SCALE };   // ax = his feet, in canvas px from the left
    });
  }
  return frames;
}

/* ---------------- the Roman pillar ----------------
   The picture has a painted grey checkerboard instead of real transparency. */
export function buildPillar(img, k = 0.8) {
  const id = pixels(img);
  const bg = floodBg(id, (r, g, b) => Math.abs(r - g) < 9 && Math.abs(g - b) < 9 && r > 70 && r < 185);
  const { lab, list } = components(bg, id.width, id.height, 2, 5000);
  const comp = list.sort((a, b) => b.w * b.h - a.w * a.h)[0];
  return cutOne(id, lab, comp, k);
}

export { OUT };

/* ---------------- Saqer ----------------
   From the owner's sheet (art/new/saqer new.png): no glasses, flat magenta background,
   frames not on a grid. [x, y] = a point inside the figure (his chest). No outline is added. */
const SAQ = {
  idle: [[70, 200]],
  walk: [[235, 200], [395, 200], [550, 200], [715, 200], [865, 200], [1025, 200]],
  run:  [[240, 720], [395, 720], [555, 720]],
  jump: [[715, 690]],
  hurt: [[1160, 720]],
  lie:  [[950, 790]],
};
/* how tall he stands, in canvas px (4 per world unit): 30 units grown, 20 small */
export const SAQER_H = { big: 120, small: 80 };
/* his pixel size, in canvas px: the sheet is a little finer than the rest of the game, so he is
   rebuilt on a slightly coarser grid (1 = as the sheet gives it, 2 = the tiles' pixel) */
export const SAQER_PX = 2;     // the same pixel as the tiles (2026-11-15: was 1.5; the owner wants one pixel size for everything)

/* snap a figure to a grid of px canvas pixels: averaged down, edges made hard, then blown back up with no smoothing */
function coarser(src, px) {
  const w = Math.max(1, Math.round(src.width / px)), h = Math.max(1, Math.round(src.height / px));
  const s = document.createElement('canvas'); s.width = w; s.height = h;
  const g = s.getContext('2d', { willReadFrequently: true });
  g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high';
  g.drawImage(src, 0, 0, w, h);
  const id = g.getImageData(0, 0, w, h);
  for (let i = 3; i < id.data.length; i += 4) id.data[i] = id.data[i] >= 110 ? 255 : 0;
  g.putImageData(id, 0, 0);
  const o = document.createElement('canvas'); o.width = src.width; o.height = src.height;
  const og = o.getContext('2d'); og.imageSmoothingEnabled = false;
  og.drawImage(s, 0, 0, o.width, o.height);
  return o;
}
/* where his body stands: the middle of the solid pixels across his chest (so frames with a leg or an arm
   thrown out do not jump sideways) */
export function bodyX(c) {
  const g = c.getContext('2d'), y0 = Math.round(c.height * 0.3), y1 = Math.round(c.height * 0.55);
  const d = g.getImageData(0, y0, c.width, y1 - y0).data, xs = [];
  for (let y = 0; y < y1 - y0; y++) for (let x = 0; x < c.width; x++) if (d[(y * c.width + x) * 4 + 3] > 0) xs.push(x);
  xs.sort((a, b) => a - b);
  return xs.length ? xs[xs.length >> 1] : c.width / 2;
}

const isMagenta = (r, g, b) => r > 120 && b > 120 && g < 120 && r - g > 70 && b - g > 70;

export function buildSaqer(img) {
  const id = pixels(img);
  const bg = floodBg(id, isMagenta);
  const { width: W, height: H, data: d } = id;
  // the pink fringe left where the figure was smoothed into the magenta: one more pixel round the figure
  for (let pass = 0; pass < 2; pass++) {
    const next = bg.slice();
    for (let p = 0; p < W * H; p++) {
      if (bg[p]) continue;
      const x = p % W, y = (p / W) | 0, i = p * 4;
      const touches = (x > 0 && bg[p - 1]) || (x < W - 1 && bg[p + 1]) || (y > 0 && bg[p - W]) || (y < H - 1 && bg[p + W]);
      if (touches && d[i] - d[i + 1] > 45 && d[i + 2] - d[i + 1] > 45) next[p] = 1;
    }
    bg.set(next);
  }
  const { lab, list } = components(bg, W, H, 1, 1500);
  const find = ([px, py]) => {
    const hit = list.filter(c => px >= c.x && px < c.x + c.w && py >= c.y && py < c.y + c.h).sort((a, b) => a.w * a.h - b.w * b.h)[0];
    if (!hit) throw new Error('Saqer frame not found at ' + px + ',' + py);
    return hit;
  };
  const comps = {};
  for (const name in SAQ) comps[name] = SAQ[name].map(find);
  const standH = comps.idle[0].h;                              // every frame is scaled alike, so the poses keep their sizes
  const raw = {};
  for (const name in comps) raw[name] = comps[name].map(comp => {
    const c = document.createElement('canvas'); c.width = comp.w; c.height = comp.h;
    const g = c.getContext('2d'), o = g.createImageData(comp.w, comp.h);
    for (let y = 0; y < comp.h; y++) for (let x = 0; x < comp.w; x++) {
      const p = (comp.y + y) * W + comp.x + x;
      if (lab[p] !== comp.id || bg[p]) continue;
      const q = (y * comp.w + x) * 4;
      o.data[q] = d[p * 4]; o.data[q + 1] = d[p * 4 + 1]; o.data[q + 2] = d[p * 4 + 2]; o.data[q + 3] = 255;
    }
    g.putImageData(o, 0, 0);
    return c;
  });
  const out = {};
  for (const size of ['big', 'small']) {
    // small Saqer is as wide as big Saqer, only shorter: growing and shrinking change his height, never his width
    const k = SAQER_H[size] / standH, kx = SAQER_H.big / standH, f = {};
    for (const name in raw) f[name] = raw[name].map(c => {
      const s = document.createElement('canvas');
      s.width = Math.max(1, Math.round(c.width * kx)); s.height = Math.max(1, Math.round(c.height * k));
      const sg = s.getContext('2d'); sg.imageSmoothingEnabled = true; sg.imageSmoothingQuality = 'high';
      sg.drawImage(c, 0, 0, s.width, s.height);
      const im = coarser(s, SAQER_PX);
      return { img: im, ax: bodyX(im) };
    });
    // the names the rest of the game asks for
    f.land = [f.idle[0], f.idle[0]];
    f.hurt = [f.hurt[0], f.hurt[0]];
    f.die = [f.hurt[0], f.lie[0], f.lie[0]];
    f.jump = [f.jump[0], f.jump[0], f.jump[0]];
    out[size] = f;
  }
  return out;
}

/* ---------------- any sheet on flat magenta ----------------
   Returns the figures row by row, left to right: [[canvas, …], …], each cropped, background clear.
   Magenta anywhere counts as background (also the holes between legs), plus the pink fringe round the figures. */
export function cutMagentaSheet(img, minArea = 400) {
  const id = pixels(img), { width: W, height: H, data: d } = id;
  const bg = new Uint8Array(W * H);
  for (let p = 0; p < W * H; p++) if (isMagenta(d[p * 4], d[p * 4 + 1], d[p * 4 + 2])) bg[p] = 1;
  for (let pass = 0; pass < 2; pass++) {
    const next = bg.slice();
    for (let p = 0; p < W * H; p++) {
      if (bg[p]) continue;
      const x = p % W, y = (p / W) | 0, i = p * 4;
      const touches = (x > 0 && bg[p - 1]) || (x < W - 1 && bg[p + 1]) || (y > 0 && bg[p - W]) || (y < H - 1 && bg[p + W]);
      if (touches && d[i] - d[i + 1] > 45 && d[i + 2] - d[i + 1] > 45) next[p] = 1;
    }
    bg.set(next);
  }
  const { lab, list } = components(bg, W, H, 3, minArea);
  const figs = list.map(comp => {
    const c = document.createElement('canvas'); c.width = comp.w; c.height = comp.h;
    const g = c.getContext('2d'), o = g.createImageData(comp.w, comp.h);
    for (let y = 0; y < comp.h; y++) for (let x = 0; x < comp.w; x++) {
      const p = (comp.y + y) * W + comp.x + x;
      if (lab[p] !== comp.id || bg[p]) continue;
      const q = (y * comp.w + x) * 4;
      o.data[q] = d[p * 4]; o.data[q + 1] = d[p * 4 + 1]; o.data[q + 2] = d[p * 4 + 2]; o.data[q + 3] = 255;
    }
    g.putImageData(o, 0, 0);
    return { c, cx: comp.x + comp.w / 2, cy: comp.y + comp.h / 2, bottom: comp.y + comp.h };
  }).sort((a, b) => a.cy - b.cy);
  const rows = [];
  for (const f of figs) {
    const row = rows[rows.length - 1];
    if (row && Math.abs(f.cy - row.cy) < 45) { row.items.push(f); row.cy = (row.cy * (row.items.length - 1) + f.cy) / row.items.length; }
    else rows.push({ cy: f.cy, items: [f] });
  }
  return rows.map(r => r.items.sort((a, b) => a.cx - b.cx).map(f => f.c));
}

/* a cut figure sized for the game: h canvas px tall (or w wide), on the same pixel grid as Saqer.
   .div = canvas px per world unit, which render.js reads for the creatures. */
export function fitFigure(c, { h = 0, w = 0, k = 0, kx = 0, flip = false, grid = true } = {}) {   // kx: a different width scale (small Saqer)
  const s = k || (h ? h / c.height : w / c.width);
  const o = document.createElement('canvas');
  o.width = Math.max(1, Math.round(c.width * (kx || s))); o.height = Math.max(1, Math.round(c.height * s));
  const g = o.getContext('2d'); g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high';
  if (flip) { g.translate(o.width, 0); g.scale(-1, 1); }
  g.drawImage(c, 0, 0, o.width, o.height);
  const out = grid ? coarser(o, grid === true ? SAQER_PX : grid) : o;   // grid: true = the characters' pixel, or a number of canvas px
  out.div = 4;
  return out;
}
/* a squashed copy (stomped) */
export function squashed(c, k = 0.35) {
  const o = document.createElement('canvas'); o.width = c.width; o.height = Math.max(2, Math.round(c.height * k));
  const g = o.getContext('2d'); g.imageSmoothingEnabled = false; g.drawImage(c, 0, 0, o.width, o.height);
  o.div = c.div;
  return o;
}

/* ---------------- the owner's Temple of Hercules, freshly built (art/new/Firefly_…freshly build….png) ----------------
   A whole scene (frame, ground, trees, hills): only the temple and its steps are kept.
   Box = the temple in the picture; the hills and trees beside the columns are cleared too. */
export function cutTemple(img, heightPx) {
  const X0 = 204, Y0 = 30, X1 = 1172, Y1 = 694;                 // the temple, top of the roof to the foot of the steps
  const w = X1 - X0, h = Y1 - Y0;
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const g = c.getContext('2d', { willReadFrequently: true });
  g.drawImage(img, X0, Y0, w, h, 0, 0, w, h);
  // the builders' tool basket on the steps: covered with the plain steps just to its right
  g.drawImage(img, 520, 640, 100, 54, 410 - X0, 640 - Y0, 100, 54);
  const id = g.getImageData(0, 0, w, h), d = id.data;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = (y * w + x) * 4, sx = x + X0, sy = y + Y0;
    const beside = (sx < 266 || sx > 1114) && sy > 296 && sy < 620;   // hills and trees either side of the portico
    const corner = sy >= 620 && (sx < 208 || sx > 1168);           // the ground either side
    if (beside || corner || isMagenta(d[i], d[i + 1], d[i + 2]) || (d[i] - d[i + 1] > 60 && d[i + 2] - d[i + 1] > 60)) d[i + 3] = 0;
  }
  g.putImageData(id, 0, 0);
  return fitFigure(c, { h: heightPx });
}
