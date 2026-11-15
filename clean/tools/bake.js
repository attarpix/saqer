/* ============================================================
   BAKE — turns the big painted sheets in art-src/ into the small
   sprite sheets the game loads (assets/sprites/*.png + sprites.json).

   The game never cuts sheets itself any more: run this once whenever a
   sheet in art-src/ changes.
     python tools/bake_server.py      (then open http://localhost:8091/tools/bake.html)
   The page cuts every figure exactly the way the game used to, packs the
   results into one picture per group, and saves them through the server.
   ============================================================ */
import { buildSaqer, buildHercules, cutMagentaSheet, fitFigure, squashed, bodyX, cutTemple } from '../js/sheets.js';
import { streetBackdrop2, skyBackdrop } from '../js/scenery.js';

const SRC = {
  saqerSheet:    'saqer_sheet.png',      // Saqer, painted (no glasses, magenta background)
  saqerWalk:     'saqer_walk.png',       // Saqer's stride, from the owner's video
  herculesSheet: 'hercules_sheet.png',
  herculesTalk:  'hercules_talk.png',    // Hercules talking, from the owner's video
  thiefSheet:    'thief_sheet.png',
  thiefWalk:     'thief_walk.png',
  creatureSheet: 'creatures_sheet.png',  // scorpion, bat, pigeon
  jameedArt:     'jameed.png',
  skyTemple:     'sky_temple.png',       // the Temple of Hercules, freshly built
  cityFar:       'city_far.png',         // the city far below the sky level (magenta sky)
  cityStreet:    'city_street.png',      // the city behind the Philadelphia street (magenta sky)
};

const load = src => new Promise((res, rej) => { const im = new Image(); im.onload = () => res(im); im.onerror = () => rej(new Error(src)); im.src = '../art-src/' + src; });

/* exactly what js/assets.js used to do with the sheets when the game started */
function build(IMG) {
  const out = {};
  out.saqer = buildSaqer(IMG.saqerSheet);
  out.hercules = buildHercules(IMG.herculesSheet);
  out.temple = { front: cutTemple(IMG.skyTemple, 640) };
  out.city = { street: streetBackdrop2(IMG.cityStreet, IMG.cityFar), sky: skyBackdrop(IMG.cityFar) };
  const cr = {};
  const C = cutMagentaSheet(IMG.creatureSheet), T = cutMagentaSheet(IMG.thiefSheet)[0];
  const kS = 88 / C[0][0].width, kB = 88 / 174, kP = 84 / C[3][0].width, kT = 76 / T[0].height;
  cr.scorpion = C[0].slice(0, 6).map(c => fitFigure(c, { k: kS }));
  cr.scorpionFlat = fitFigure(C[1][0], { k: kS });
  cr.bat = [0, 1, 2, 3, 4, 6].map(i => fitFigure(C[2][i], { k: kB }));
  cr.pigeon = C[3].map(c => fitFigure(c, { k: kP }));
  cr.naughtyFlat = squashed(fitFigure(T[0], { k: kT }));
  const med = a => a.slice().sort((x, y) => x - y)[a.length >> 1];
  const WALK = cutMagentaSheet(IMG.saqerWalk)[0];                    // [standing, 8 frames of one stride]
  for (const size of ['big', 'small']) {
    const k = (size === 'big' ? 120 : 80) / WALK[0].height, kx = 120 / WALK[0].height;   // small: as wide as big, only shorter
    const walk = WALK.slice(1).map(c => { const im = fitFigure(c, { k, kx }); return { img: im, ax: bodyX(im) }; });
    out.saqer[size].walk = walk;
    out.saqer[size].run = walk;                                      // one walk for both speeds
  }
  const TW = cutMagentaSheet(IMG.thiefWalk)[0];
  const kTW = (76 * med(T.slice(1, 4).map(c => c.height)) / T[0].height) / med(TW.map(c => c.height));
  cr.naughty = TW.map(c => fitFigure(c, { k: kTW, flip: true }));  // the video walks right; the creatures face left
  const HT = cutMagentaSheet(IMG.herculesTalk)[0], idle = out.hercules.idle[0];
  const kH = idle.img.height / HT[0].height, refW = HT[0].width * kH, ax = idle.ax / idle.img.width * refW;
  const talk = HT.slice(1).map(c => ({ img: fitFigure(c, { k: kH }), ax }));
  out.hercules.talk = talk.concat(talk.slice(1, -1).reverse());
  cr.jameed = fitFigure(cutMagentaSheet(IMG.jameedArt)[0][0], { w: 56, grid: 1.5 });   // the jameed keeps its 1.5 pixel
  out.creatures = cr;
  return out;
}

/* pack every picture of a group into one sheet; the JSON keeps the shape of the data, with
   each picture replaced by { "@": [x, y, w, h], …its own values like div } on that sheet */
function pack(group) {
  const seen = new Map(), list = [];
  const json = JSON.parse(JSON.stringify(group, function (k, v) {
    const raw = this[k];
    if (raw instanceof HTMLCanvasElement || raw instanceof HTMLImageElement) {
      if (!seen.has(raw)) { seen.set(raw, list.length); list.push(raw); }
      const ref = { '@': seen.get(raw) };
      for (const p of Object.keys(raw)) if (typeof raw[p] !== 'object') ref[p] = raw[p];   // e.g. .div, read by render.js
      return ref;
    }
    return v;
  }));
  const MAXW = 2048, PAD = 2;                                        // shelves, tallest first
  const order = list.map((c, i) => i).sort((a, b) => list[b].height - list[a].height);
  const rect = [];
  let x = 0, y = 0, shelf = 0, W = 0;
  for (const i of order) {
    const c = list[i];
    if (x + c.width > MAXW) { x = 0; y += shelf + PAD; shelf = 0; }
    rect[i] = [x, y, c.width, c.height];
    x += c.width + PAD; shelf = Math.max(shelf, c.height); W = Math.max(W, x);
  }
  const sheet = document.createElement('canvas');
  sheet.width = W; sheet.height = y + shelf;
  const g = sheet.getContext('2d');
  list.forEach((c, i) => g.drawImage(c, rect[i][0], rect[i][1]));
  const fix = o => { if (Array.isArray(o)) return o.map(fix); if (o && typeof o === 'object') { if (typeof o['@'] === 'number') return Object.assign({}, o, { '@': rect[o['@']] }); const r = {}; for (const k in o) r[k] = fix(o[k]); return r; } return o; };
  return { sheet, json: fix(json), count: list.length };
}

const log = s => { document.getElementById('log').textContent += s + '\n'; };
async function save(name, body, type) {
  const r = await fetch('/save/' + name, { method: 'POST', headers: { 'Content-Type': type }, body });
  if (!r.ok) throw new Error('save ' + name + ' ' + r.status);
}

(async () => {
  const IMG = {};
  await Promise.all(Object.entries(SRC).map(([k, f]) => load(f).then(im => { IMG[k] = im; })));
  log('sheets loaded');
  const groups = build(IMG), layout = {};
  window.__groups = groups;                                         // for checking the result
  for (const [name, group] of Object.entries(groups)) {
    const p = pack(group);
    const blob = await new Promise(r => p.sheet.toBlob(r, 'image/png'));
    await save(name + '.png', blob, 'image/png');
    layout[name] = p.json;
    log(name + '.png  ' + p.sheet.width + 'x' + p.sheet.height + '  ' + p.count + ' pictures');
  }
  await save('sprites.json', JSON.stringify(layout), 'application/json');
  log('sprites.json\nDONE');
  window.__baked = true;
})().catch(e => { log('ERROR ' + e.message); window.__baked = e.message; });
