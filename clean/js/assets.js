/* ============================================================
   ASSET LOADING
   assets/backgrounds  the big pictures behind the levels, and the theatre crowd (12 frames of video 3)
   assets/sprites      Saqer, Hercules, the creatures, the temple and the city layers, ready-cut:
                       one sheet per group + sprites.json (made by tools/bake.html from art-src/)
   assets/sounds       the crowd
   Tiles, props and Dana are painted in code (art.js, saqer.js, scenery.js).
   ============================================================ */
import { buildArt, ART, goldJameed } from './art.js';
import { buildCharacters } from './saqer.js';
import { paintColumn, doubled, cloudPuffs, brazier, urn } from './scenery.js';
import { DANA_ART } from './story.js';

export const IMG = {};
export let SPRITES = null;

const CROWD_FRAMES = 12;
const IMAGES = {
  title:    'assets/backgrounds/title.jpg',
  amman:    'assets/backgrounds/amman_sunset.jpg',   // today's Amman at sunset (after Hercules, and replays from the hall)
  ammanDay: 'assets/backgrounds/amman_day.png',      // … and by day (a first game): real pixels on the 2-px grid, keep it PNG
};
for (let i = 1; i <= CROWD_FRAMES; i++) IMAGES['crowd' + i] = 'assets/backgrounds/crowd/crowd_' + String(i).padStart(2, '0') + '.jpg';
const SHEETS = ['saqer', 'hercules', 'creatures', 'temple', 'city'];

function loadImage(src) {
  return new Promise((res, rej) => {
    const im = new Image();
    im.onload = () => res(im);
    im.onerror = () => rej(new Error('Failed to load ' + src));
    im.src = src;
  });
}

/* sprites.json keeps each group's data as it was built, with every picture written as
   { "@": [x, y, w, h], …values kept on it } on that group's sheet: turn those back into pictures */
function unpack(node, sheet, cut) {
  if (Array.isArray(node)) return node.map(n => unpack(n, sheet, cut));
  if (!node || typeof node !== 'object') return node;
  if (node['@']) {
    const key = node['@'].join();
    if (!cut.has(key)) {
      const [x, y, w, h] = node['@'], c = document.createElement('canvas');
      c.width = w; c.height = h;
      c.getContext('2d').drawImage(sheet, x, y, w, h, 0, 0, w, h);
      for (const k in node) if (k !== '@') c[k] = node[k];        // values kept on the picture, e.g. .div (render.js)
      cut.set(key, c);
    }
    return cut.get(key);
  }
  const out = {};
  for (const k in node) out[k] = unpack(node[k], sheet, cut);
  return out;
}

export async function loadAssets(onProgress = () => {}) {
  const entries = Object.entries(IMAGES);
  let done = 0;
  const total = entries.length + SHEETS.length + 2;
  const tick = () => onProgress(++done / total);

  const imgs = entries.map(([k, src]) => loadImage(src).then(im => { IMG[k] = im; tick(); }));
  const layout = fetch('assets/sprites/sprites.json').then(r => { if (!r.ok) throw new Error('Failed to load sprites.json'); return r.json(); });
  const baked = {};
  const sheets = SHEETS.map(name => Promise.all([layout, loadImage('assets/sprites/' + name + '.png')])
    .then(([L, sheet]) => { baked[name] = unpack(L[name], sheet, new Map()); tick(); }));
  const font = (document.fonts ? Promise.race([
    Promise.all([document.fonts.load('8px "Press Start 2P"'), document.fonts.load('700 16px "Changa"')]),
    new Promise(r => setTimeout(r, 2500)),           // offline first run: fall back to monospace
  ]) : Promise.resolve()).catch(() => {}).then(tick);

  // your own drawing of Dana (optional): one picture, facing left, on a transparent background
  const dana = DANA_ART
    ? loadImage(DANA_ART).then(im => { IMG.danaCustom = im; }).catch(() => console.warn('Dana art not found: ' + DANA_ART))
    : Promise.resolve();

  await Promise.all([...imgs, ...sheets, font, dana]);

  const ch = buildCharacters();                      // Dana (and the earlier code-drawn Saqer, kept for her scenes)
  Object.assign(IMG, ch.img);
  SPRITES = ch.sprites;
  const seq = name => { const a = []; for (let i = 1; i <= CROWD_FRAMES; i++) a.push(IMG[name + i]); return a.concat(a.slice(1, -1).reverse()); };   // there and back: no jump at the loop
  IMG.crowdClap = seq('crowd'); IMG.crowdCheer = IMG.crowdClap;   // one steady video for both: cheering just plays it faster
  SPRITES.saqer = baked.saqer;                                     // { big: {idle:[…], walk:[…] …}, small: {…} }
  SPRITES.hercules = baked.hercules;
  // painted in code (scenery.js): the pillars
  IMG.pillar = doubled(paintColumn(40, 294, undefined, 7));          // the one that falls on the gate
  IMG.pillarGiant = doubled(paintColumn(64, 470, undefined, 9));     // the giants that close the street: taller than the screen
  IMG.templeFront = baked.temple.front;                              // the owner's Temple of Hercules (160 world units tall)
  buildArt();
  ART.scenery = baked.city;                                          // the street and sky backdrops, with the owner's city pictures
  ART.skyProps = { puffs: cloudPuffs(), brazier: [0, 1, 2].map(brazier), urn: urn() };
  Object.assign(ART, baked.creatures);                               // scorpion, bat, pigeon, the thief (naughty), the owner's jameed
  ART.goldJameed = goldJameed();                                     // the same jameed in gold
  tick();
}
