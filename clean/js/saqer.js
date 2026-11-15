/* ============================================================
   CHARACTERS — Saqer and Dana, painted in code.

   Saqer: dark-grey thobe, red-and-white shemagh with a black agal,
   goatee. Dana: black embroidered thobe, white scarf, gold coin
   headband. Both are drawn from a small "rig" (head, robe, arms,
   feet) so every animation frame comes from a pose, and the
   grow/shrink frames are just sizes in between small and big.
   A pale rim around each of them keeps a dark outfit readable
   against any backdrop, day or night.

   To change the look, edit the colours in SAQER / DANA below.
   To use your own drawing of Dana instead, see DANA_ART in story.js.
   ============================================================ */
import { Buf, pack } from './pix.js';

const RIM = 'rgba(255,244,222,0.78)';

const SAQER = {
  skin: '#dba173', skinSh: '#b9794c',
  robe: '#282830', robeHi: '#4c4d5a', robeSh: '#17171d', sleeve: '#363742', trim: '#70727f',   // black thobe
  white: '#fbf5ee', whiteSh: '#d8cbbf', red: '#dc3545', redSh: '#a32433',
  agal: '#1b1b20', agalHi: '#4a4a56',
  hair: '#241812', shoe: '#cfae84', shoeHi: '#efd7b2', glass: '#101014', lens: '#cfe6f2', eyeW: '#ffffff', mouth: '#7a2a2a',
};

/* sizes are in art pixels (2 per world unit); heights are measured up from the ground */
const SMALL = { W: 34, H: 40, cx: 16, footH: 2, footW: 5, hem: 3, sh: 19, hy: 26, hrx: 7.5, hry: 7, top: 5, bot: 7, armW: 3, armL: 7, hand: 1.6, tailW: 4, tailL: 9, big: 0 };
const BIG   = { W: 46, H: 58, cx: 22, footH: 3, footW: 7, hem: 4, sh: 33, hy: 42, hrx: 8.5, hry: 8, top: 7, bot: 10, armW: 4, armL: 12, hand: 2.2, tailW: 5, tailL: 14, big: 1 };

const lerpCfg = (t) => {
  const c = {};
  for (const k in SMALL) c[k] = SMALL[k] + (BIG[k] - SMALL[k]) * t;
  for (const k of ['W', 'H', 'cx', 'footH', 'footW', 'hem', 'sh', 'armW', 'tailW', 'tailL']) c[k] = Math.round(c[k]);
  c.big = t > 0.5 ? 1 : 0;
  return c;
};

const shemagh = (dark) => (x, y) => (((x + y) & 1)
  ? (dark ? SAQER.redSh : SAQER.red)
  : (dark ? SAQER.whiteSh : SAQER.white));

function drawSaqer(c, pose = {}) {
  const P = { bob: 0, lean: 0, squash: 0, feet: [[-3, 0], [2, 0]], armF: 12, armB: -12, flare: 0, tail: 0, eye: 'open', mouth: 'none', ...pose };
  const C = SAQER;
  const b = new Buf(c.W, c.H);
  const Y = up => c.H - up;
  const lift = P.bob - P.squash;
  const shY = Math.round(Y(c.sh + lift)), hemY = Y(c.hem);
  const hcx = c.cx + 1 + P.lean, hcy = Math.round(Y(c.hy + lift));
  const rx = c.hrx, ry = c.hry;

  const arm = (deg, sx, front) => {
    const L = new Buf(c.W, c.H), a = (deg * Math.PI) / 180;
    const sy = shY + 2, ex = sx + Math.sin(a) * c.armL, ey = sy + Math.cos(a) * c.armL;
    L.line(sx, sy, ex, ey, c.armW, front ? C.sleeve : C.robeSh);
    L.ell(ex + Math.sin(a) * 1.5, ey + Math.cos(a) * 1.5, c.hand, c.hand, front ? C.skin : C.skinSh);
    return L.outline();
  };

  // back arm
  b.over(arm(P.armB, c.cx - 2 + P.lean, false));

  // shemagh tail down the back (flies out behind him at speed)
  const T = new Buf(c.W, c.H);
  for (let i = 0; i < c.tailL; i++) {
    const tx = hcx - rx - 1 - P.tail * i * 0.85;
    const ty = hcy + 1 + i * (1 - 0.6 * P.tail);
    T.rect(tx - c.tailW + 2, ty, c.tailW, 2, shemagh(true));
  }
  b.over(T.outline());

  // feet
  const F = new Buf(c.W, c.H);
  for (const [dx, up] of P.feet) {
    const fx = c.cx + dx - (c.footW >> 1), fy = Y(c.footH + up);
    F.rect(fx, fy, c.footW, c.footH, C.shoe);
    F.rect(fx + 1, fy, c.footW - 2, 1, C.shoeHi);
  }
  b.over(F.outline());

  // thobe
  const R = new Buf(c.W, c.H);
  R.rect(c.cx + P.lean - 1, shY - 3, 4, 3, C.skinSh);                    // neck
  const rows = Math.max(1, hemY - shY - 1);
  for (let y = shY; y < hemY; y++) {
    const t = (y - shY) / rows;
    const hw = c.top + (c.bot - c.top) * Math.pow(t, 0.8) - (y === shY ? 1 : 0);
    const mid = c.cx + P.lean * (1 - t);
    const xl = Math.round(mid - hw - P.flare * t * t * 3), xr = Math.round(mid + hw + P.flare * t * t);
    for (let x = xl; x <= xr; x++) {
      const u = (x - xl) / Math.max(1, xr - xl);
      let col = C.robe;
      if (u < 0.24) col = C.robeSh;
      if (x === xr) col = C.robeHi;
      if (y === hemY - 1) col = C.robeSh;
      R.set(x, y, col);
    }
    const px = Math.round(mid + 2);                                       // button placket
    if (t < 0.42 && (y - shY) % 2 === 1) R.set(px, y, C.trim);
  }
  R.rect(c.cx + P.lean, shY, 4, 1, C.trim);                               // collar
  b.over(R.outline());

  // head: face, shemagh, agal, goatee
  const H = new Buf(c.W, c.H);
  H.ell(hcx, hcy, rx, ry, C.skin);
  const eh = c.big ? 3 : 2, ew = c.big ? 3 : 2;
  const eyeY = hcy - 1, browY = eyeY - 2, eyeX = Math.round(hcx + rx * 0.35);
  const isCloth = (x, y) => { const v = H.get(x, y); return v && v !== C.skin; };

  for (let y = Math.floor(hcy - ry - 4); y <= Math.ceil(hcy + ry + 6); y++) {
    for (let x = Math.floor(hcx - rx - 4); x <= Math.ceil(hcx + rx + 3); x++) {
      const dx = (x + 0.5 - (hcx - 0.5)) / (rx + 1.5), dy = (y + 0.5 - (hcy - 0.5)) / (ry + 1.8);
      if (dx * dx + dy * dy > 1) continue;
      const edge = hcx - 2 + Math.max(0, y - browY) * 0.15;               // cloth edge beside the cheek
      if (y < browY || x < edge) H.set(x, y, shemagh(x < hcx - rx * 0.45 || y > hcy + 2));
    }
  }
  for (let y = browY; y <= hcy + ry + (c.big ? 5 : 3); y++) H.rect(hcx - 4, y, 3, 1, shemagh(true));   // side flap
  const ay = Math.round(hcy - ry * 0.62) - 1;
  for (let j = 0; j < (c.big ? 3 : 2); j++) {
    for (let x = 0; x < c.W; x++) if (isCloth(x, ay + j)) H.set(x, ay + j, j === 0 && x % 4 === 1 ? C.agalHi : C.agal);
  }

  // eye + brow
  if (P.eye === 'shut') {
    H.rect(eyeX - 1, eyeY + 1, ew + 1, 1, C.hair);
  } else {
    H.rect(eyeX, eyeY, ew, eh, C.eyeW);
    H.rect(eyeX + ew - (c.big ? 2 : 1), eyeY, c.big ? 2 : 1, eh, C.hair);
    if (c.big) H.set(eyeX + 1, eyeY, C.eyeW);
  }
  if (P.eye !== 'wide') H.rect(eyeX - 1, browY, ew + 2, 1, C.hair);
  // glasses: a dark square frame round the eye, with the arm running back under the shemagh
  {
    const gx = eyeX - 1, gy = eyeY - 1, gw = ew + 2, gh = eh + 2;
    H.rect(gx, gy, gw, 1, C.glass); H.rect(gx, gy + gh - 1, gw, 1, C.glass);
    H.rect(gx, gy, 1, gh, C.glass); H.rect(gx + gw - 1, gy, 1, gh, C.glass);
    for (let x = gx - 1; x >= hcx - 3 && H.get(x, eyeY) === C.skin; x--) H.set(x, eyeY, C.glass);
    if (P.eye === 'shut') H.rect(eyeX, eyeY, ew, eh, C.lens);
  }
  // nose
  H.rect(Math.floor(hcx + rx), eyeY + eh, 1, 2, C.skin);
  // goatee: thin moustache, mouth, chin beard that comes to a point
  const my = eyeY + eh + 2;
  const skinRow = (y, x0, x1, col) => { for (let x = x0; x <= x1; x++) if (H.get(x, y) === C.skin) H.set(x, y, col); };
  skinRow(my, hcx + 1, hcx + rx + 1, C.hair);
  if (P.mouth === 'open') skinRow(my + 1, hcx + 2, hcx + (c.big ? 5 : 4), C.mouth);
  H.set(hcx + 1, my + 1, C.hair);
  for (let y = my - 1; y <= my + 1; y++) skinRow(y, hcx - 3, hcx - 1, C.hair);          // beard up the jaw
  for (let y = my + 2; y <= my + 6; y++) skinRow(y, hcx - 3, hcx + rx + 1, C.hair);    // full short beard
  const chin = my + (c.big ? 4 : 3);
  H.rect(hcx + 1, chin, c.big ? 4 : 3, 1, C.hair);
  H.rect(hcx + 2, chin + 1, c.big ? 2 : 1, 1, C.hair);
  b.over(H.outline());

  // front arm
  b.over(arm(P.armF, c.cx + 2 + P.lean, true));
  return b.outline(RIM);
}

/* ---------------- Saqer's poses ---------------- */
const POSES = {
  idle: [{}, {}, { bob: -1 }, { bob: -1 }],
  walk: [
    { feet: [[-5, 0], [4, 0]], armF: -28, armB: 28 },
    { feet: [[-2, 0], [1, 2]], bob: 1, armF: 0, armB: 0 },
    { feet: [[-5, 0], [4, 0]], armF: 28, armB: -28 },
    { feet: [[-2, 2], [1, 0]], bob: 1, armF: 0, armB: 0 },
  ],
  run: [
    { feet: [[-7, 1], [6, 0]], armF: -60, armB: 60, lean: 1, tail: 0.7, flare: 1 },
    { feet: [[-2, 0], [2, 3]], armF: -10, armB: 10, lean: 1, tail: 0.8, flare: 0.6, bob: 1 },
    { feet: [[-7, 0], [6, 1]], armF: 60, armB: -60, lean: 1, tail: 0.7, flare: 1 },
    { feet: [[-2, 3], [2, 0]], armF: 10, armB: -10, lean: 1, tail: 0.8, flare: 0.6, bob: 1 },
  ],
  jump: [{ squash: 2, armF: -25, armB: 25 }, { feet: [[-4, 1], [3, 0]], armF: 130, armB: -40 }],
  jumpUp: [{ feet: [[-5, 2], [3, 0]], armF: 132, armB: -45, tail: 0.25, flare: 0.5, mouth: 'open' }],   // fist up and forward, clear of his face
  jumpTop: [{ feet: [[-4, 2], [3, 1]], armF: 125, armB: -65, tail: 0.5, flare: 0.8 }],
  fall: [
    { feet: [[-5, 1], [4, 1]], armF: 105, armB: -105, tail: 1, flare: 1, eye: 'wide' },
    { feet: [[-5, 2], [4, 0]], armF: 115, armB: -95, tail: 1, flare: 1, eye: 'wide' },
    { feet: [[-5, 1], [4, 1]], armF: 100, armB: -110, tail: 1, flare: 1, eye: 'wide' },
    { feet: [[-5, 0], [4, 2]], armF: 110, armB: -100, tail: 1, flare: 1, eye: 'wide' },
  ],
  land: [
    { squash: 4, armF: 65, armB: -65, feet: [[-5, 0], [4, 0]] },
    { squash: 3, armF: 50, armB: -50, feet: [[-5, 0], [4, 0]] },
    { squash: 2, armF: 30, armB: -30, feet: [[-4, 0], [3, 0]] },
    { squash: 1 },
  ],
  hurt: [
    { eye: 'shut', mouth: 'open', armF: 120, armB: -120, lean: -1 },
    { eye: 'shut', mouth: 'open', armF: 140, armB: -140, lean: -2, bob: 1 },
  ],
  win: [{ armF: 134, armB: -20, eye: 'shut', mouth: 'open', bob: 1 }],
  talk: [{ mouth: 'open', armF: 55 }, { armF: 40 }],
};
const DIE = [
  { eye: 'wide', mouth: 'open', armF: 150, armB: -150, bob: 1 },
  { eye: 'shut', mouth: 'open', armF: 150, armB: -150, lean: -2 },
  { eye: 'shut', mouth: 'open', armF: 110, armB: -110, lean: -2, squash: 6 },
];

function saqerSet(cfg) {
  const names = Object.keys(POSES);
  const bufs = [];
  const index = {};
  for (const n of names) { index[n] = POSES[n].map(p => bufs.push(drawSaqer(cfg, p)) - 1); }
  index.die = DIE.map(p => bufs.push(drawSaqer(cfg, p)) - 1);
  const flat = drawSaqer(cfg, { eye: 'shut', mouth: 'open', armF: 160, armB: -160 }).rot90().trim();   // on his back
  index.die.push(bufs.push(flat) - 1, bufs.push(flat) - 1);
  const { img, rects } = pack(bufs);
  const frames = {};
  for (const n in index) frames[n] = index[n].map(i => rects[i]);
  return { img, frames };
}

/* ---------------- Dana ---------------- */
const DANA = {
  skin: '#e8b58c', skinSh: '#c98f66',
  dress: '#231e2b', dressSh: '#17131d', dressHi: '#3c3449',
  red: '#c9303b', redSh: '#98222f', gold: '#f2b632', goldSh: '#b87414', green: '#2f8a56',
  scarf: '#f7f2ea', scarfSh: '#d6ccc0',
  eye: '#3a2418', lip: '#b0453f', blush: '#e89b8f', shoe: '#7a1f2b',
};

function drawDana(pose = {}) {
  const P = { bob: 0, eye: 'open', mouth: 'smile', arm: 22, ...pose };
  const C = DANA, W = 46, Ht = 58, cx = 22;
  const b = new Buf(W, Ht);
  const Y = up => Ht - up;
  const shY = Y(32 + P.bob), hemY = Y(2), hcx = cx + 1, hcy = Y(41 + P.bob), rx = 6.5, ry = 7;

  // scarf falling down her back
  const D = new Buf(W, Ht);
  for (let i = 0; i < 22; i++) {
    const x = hcx - rx - 3 - i * 0.1;
    D.rect(x, hcy + i, 6, 1, C.scarf);
    D.rect(x, hcy + i, 2, 1, C.scarfSh);
  }
  b.over(D.outline());

  // shoes
  const F = new Buf(W, Ht);
  F.rect(cx - 5, Y(2), 5, 2, C.shoe); F.rect(cx + 1, Y(2), 5, 2, C.shoe);
  b.over(F.outline());

  // thobe with tatreez (embroidery)
  const R = new Buf(W, Ht);
  R.rect(cx, shY - 3, 3, 3, C.skinSh);
  const rows = hemY - shY - 1;
  const stitch = (x, y) => (((x + y) & 1) ? C.red : ((x + 2 * y) % 3 === 0 ? C.gold : C.redSh));
  for (let y = shY; y < hemY; y++) {
    const t = (y - shY) / rows;
    const hw = (t < 0.3 ? 6 - t * 3 : 5.1 + ((t - 0.3) / 0.7) * 6.2) - (y === shY ? 1 : 0);
    const xl = Math.round(cx - hw), xr = Math.round(cx + hw);
    for (let x = xl; x <= xr; x++) {
      let col = C.dress;
      if (x - xl < 2) col = C.dressSh;
      if (x === xr) col = C.dressHi;
      if (t > 0.36 && (x === xr - 2 || x === xr - 3)) col = (y % 3 === 0 ? C.gold : C.red);     // side band
      if (t > 0.36 && x === xl + 3) col = (y % 3 === 0 ? C.goldSh : C.redSh);
      if (y >= hemY - 5 && y <= hemY - 2) col = (y === hemY - 5 || y === hemY - 2) ? C.red : (((x + y) % 4 < 2) ? C.gold : C.green);
      R.set(x, y, col);
    }
    if (t >= 0.28 && t < 0.34) for (let x = xl; x <= xr; x++) R.set(x, y, x % 3 === 0 ? C.gold : C.red);   // sash
  }
  for (let y = shY + 2; y < shY + 9; y++) for (let x = cx - 3; x <= cx + 2; x++) R.set(x, y, stitch);       // chest panel
  b.over(R.outline());

  // head
  const H = new Buf(W, Ht);
  H.ell(hcx, hcy, rx, ry, C.skin);
  const eyeY = hcy - 1, browY = eyeY - 3, eyeX = Math.round(hcx + 2);
  for (let y = Math.floor(hcy - ry - 4); y <= Math.ceil(hcy + ry + 3); y++) {
    for (let x = Math.floor(hcx - rx - 4); x <= Math.ceil(hcx + rx + 3); x++) {
      const dx = (x + 0.5 - (hcx - 0.5)) / (rx + 1.6), dy = (y + 0.5 - (hcy - 0.3)) / (ry + 2);
      if (dx * dx + dy * dy > 1) continue;
      const edge = hcx - 2 + Math.max(0, y - browY) * 0.1;
      if (y < browY || x < edge || y > hcy + ry - 1) H.set(x, y, (x < hcx - rx * 0.5 || y > hcy + ry - 1) ? C.scarfSh : C.scarf);
    }
  }
  // gold coin headband
  for (let x = 0; x < W; x++) {
    const v = H.get(x, browY - 1);
    if (v && v !== C.skin && x >= hcx - 3) H.set(x, browY - 1, x % 2 ? C.gold : C.goldSh);
  }
  H.set(hcx - 1, browY, C.gold); H.set(hcx - 1, browY + 1, C.goldSh);
  // eye, lashes, blush, lips, nose
  if (P.eye === 'shut') H.rect(eyeX - 1, eyeY + 1, 4, 1, C.eye);
  else {
    H.rect(eyeX, eyeY, 3, 3, '#ffffff');
    H.rect(eyeX + 1, eyeY, 2, 3, C.eye);
    H.set(eyeX + 1, eyeY, '#ffffff');
    H.rect(eyeX - 1, eyeY - 1, 4, 1, C.eye);
  }
  H.rect(hcx + 1, eyeY + 4, 2, 1, C.blush);
  H.rect(Math.floor(hcx + rx), eyeY + 3, 1, 2, C.skin);
  if (P.mouth === 'open') H.rect(hcx + 3, eyeY + 5, 2, 2, C.lip);
  else H.rect(hcx + 3, eyeY + 5, 2, 1, C.lip);
  b.over(H.outline());

  // arm, held in front
  const A = new Buf(W, Ht), a = (P.arm * Math.PI) / 180;
  const sx = cx + 2, sy = shY + 3, ex = sx + Math.sin(a) * 12, ey = sy + Math.cos(a) * 12;
  A.line(sx, sy, ex, ey, 4, C.dressHi);
  A.line(sx + Math.sin(a) * 10, sy + Math.cos(a) * 10, ex, ey, 4, C.red);
  A.ell(ex + Math.sin(a) * 1.5, ey + Math.cos(a) * 1.5, 2.2, 2.2, C.skin);
  b.over(A.outline());
  return b.outline(RIM);
}

/* ---------------- build everything ---------------- */
export function buildCharacters() {
  const small = saqerSet(SMALL), big = saqerSet(BIG);
  const grow = pack([0, 0.2, 0.4, 0.6, 0.8, 1].map(t => drawSaqer(lerpCfg(t))));
  const am = pack([
    drawDana(), drawDana(), drawDana({ bob: -1 }), drawDana({ bob: -1, eye: 'shut' }),
    drawDana({ mouth: 'open', arm: 40 }), drawDana({ arm: 32 }),
  ]);
  return {
    img: { saqerSmall: small.img, saqerBig: big.img, saqerGrow: grow.img, dana: am.img },
    sprites: {
      small: { frames: small.frames },
      big: { frames: big.frames },
      transform: { frames: { grow: grow.rects, shrink: [...grow.rects].reverse() } },
      dana: { frames: { idle: am.rects.slice(0, 4), talk: am.rects.slice(4, 6) } },
    },
  };
}
