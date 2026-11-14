/* ============================================================
   ASSET LOADING
   Backdrops come from assets/bg (made from art/ by the scripts in
   tools/). Saqer, Hercules and the falling pillar are cut out of
   the painted sheets in assets/src when the game starts (sheets.js).
   Tiles, creatures and Dana are painted in code (art.js, saqer.js).
   ============================================================ */
import { buildArt, ART, goldJameed } from './art.js';
import { buildCharacters } from './saqer.js';
import { buildSaqer, buildHercules, cutMagentaSheet, fitFigure, squashed, bodyX, cutTemple } from './sheets.js';
import { paintColumn, doubled, streetBackdrop, skyBackdrop, templeFront, cloudPuffs, brazier, urn, streetBackdrop2 } from './scenery.js';
import { DANA_ART } from './story.js';

export const IMG = {};
export let SPRITES = null;

const CROWD_FRAMES = 9;                                   // frames pulled from the owner's crowd videos (assets/bg/crowd)
const IMAGES = {
  title:        'assets/bg/title_theater.png',
  amman:        'assets/bg/amman_sunset.jpg',     // today's Amman at sunset (after Hercules, and replays from the hall)
  ammanDay:     'assets/bg/amman_day.png',        // … and by day (a first game): art/new/try this new day gigger size.png, square pixels on the 2-px grid (1 art px = 2 canvas px)
  phila:        'assets/bg/philadelphia.jpg',
  theaterCalm:  'assets/bg/theater_calm.jpg',
  theaterCheer: 'assets/bg/theater_cheer.jpg',
  theaterCheer2:'assets/bg/theater_cheer2.jpg',
  saqerSheet:   'assets/src/saqer_sheet2.png',
  cityBelow:    'assets/bg/city_below.png',
  cityStreet:   'assets/bg/city_street.png',
  thiefSheet:   'assets/src/thief_sheet.png',
  creatureSheet:'assets/src/creatures_sheet.png',
  saqerRun:     'assets/src/saqer_run.png',
  saqerWalk:    'assets/src/saqer_walk.png',
  thiefWalk:    'assets/src/thief_walk.png',
  herculesTalk: 'assets/src/hercules_talk.png',
  skyTemple:    'assets/src/sky_temple.png',
  herculesSheet:'assets/src/hercules_sheet.png',
  jameedArt:    'assets/src/jameed.png',
};

for (let i = 1; i <= CROWD_FRAMES; i++) {
  const n = String(i).padStart(2, '0');
  IMAGES['crowdClap' + i] = 'assets/bg/crowd/clap_' + n + '.jpg';
  IMAGES['crowdCheer' + i] = 'assets/bg/crowd/cheer_' + n + '.jpg';
}

function loadImage(src) {
  return new Promise((res, rej) => {
    const im = new Image();
    im.onload = () => res(im);
    im.onerror = () => rej(new Error('Failed to load ' + src));
    im.src = src;
  });
}

export async function loadAssets(onProgress = () => {}) {
  const entries = Object.entries(IMAGES);
  let done = 0;
  const total = entries.length + 2;
  const tick = () => onProgress(++done / total);

  const imgs = entries.map(([k, src]) => loadImage(src).then(im => { IMG[k] = im; tick(); }));
  const font = (document.fonts ? Promise.race([
    Promise.all([document.fonts.load('8px "Press Start 2P"'), document.fonts.load('700 16px "Changa"')]),
    new Promise(r => setTimeout(r, 2500)),           // offline first run: fall back to monospace
  ]) : Promise.resolve()).catch(() => {}).then(tick);

  // your own drawing of Dana (optional): one picture, facing left, on a transparent background
  const dana = DANA_ART
    ? loadImage(DANA_ART).then(im => { IMG.danaCustom = im; }).catch(() => console.warn('Dana art not found: ' + DANA_ART))
    : Promise.resolve();

  await Promise.all([...imgs, font, dana]);

  const ch = buildCharacters();                      // Dana (and the earlier code-drawn Saqer, kept for her scenes)
  Object.assign(IMG, ch.img);
  SPRITES = ch.sprites;
  const seq = name => { const a = []; for (let i = 1; i <= CROWD_FRAMES; i++) a.push(IMG[name + i]); return a.concat(a.slice(1, -1).reverse()); };   // there and back: no jump at the loop
  IMG.crowdClap = seq('crowdClap'); IMG.crowdCheer = seq('crowdCheer');
  SPRITES.saqer = buildSaqer(IMG.saqerSheet);                      // { big: {idle:[…], walk:[…], run:[…] …}, small: {…} }
  SPRITES.hercules = buildHercules(IMG.herculesSheet);
  // painted in code (scenery.js): the pillars, the backdrops of the past, the Temple of Hercules
  IMG.pillar = doubled(paintColumn(40, 294, undefined, 7));          // the one that falls on the gate
  IMG.pillarGiant = doubled(paintColumn(64, 470, undefined, 9));     // the giants that close the street: taller than the screen
  IMG.templeFront = cutTemple(IMG.skyTemple, 640);                  // the owner's temple (160 world units tall)
  buildArt();
  ART.scenery = { street: streetBackdrop2(IMG.cityStreet, IMG.cityBelow), sky: skyBackdrop(IMG.cityBelow) };
  ART.skyProps = { puffs: cloudPuffs(), brazier: [0, 1, 2].map(brazier), urn: urn() };

  // the owner's sheets on magenta: Saqer running, the thief (in place of the kid), scorpion, bat, pigeon
  {
    const C = cutMagentaSheet(IMG.creatureSheet), T = cutMagentaSheet(IMG.thiefSheet)[0], RUN = cutMagentaSheet(IMG.saqerRun)[0];
    const kS = 88 / C[0][0].width, kB = 88 / 174, kP = 84 / C[3][0].width, kT = 76 / T[0].height;
    ART.scorpion = C[0].slice(0, 6).map(c => fitFigure(c, { k: kS }));
    ART.scorpionFlat = fitFigure(C[1][0], { k: kS });
    ART.bat = [0, 1, 2, 3, 4, 6].map(i => fitFigure(C[2][i], { k: kB }));
    ART.pigeon = C[3].map(c => fitFigure(c, { k: kP }));
    const thief = T.map(c => fitFigure(c, { k: kT }));                      // the sheet faces left, like the other creatures
    ART.naughty = [thief[1], thief[2], thief[3], thief[2]];
    ART.naughtyFlat = squashed(thief[0]);
    for (const [size, H] of [['big', 112], ['small', 75]]) {
      SPRITES.saqer[size].run = RUN.map(c => { const im = fitFigure(c, { k: H / 395 }); return { img: im, ax: bodyX(im) }; });
    }
  }

  // from the owner's videos (frames picked by tools: see build_new_art.ps1): one walk for Saqer (walking and
  // running alike), the thief's walk, and Hercules talking (his legs put back from the still picture)
  {
    const med = a => a.slice().sort((x, y) => x - y)[a.length >> 1];
    const WALK = cutMagentaSheet(IMG.saqerWalk)[0];                  // [standing, 8 frames of one stride]
    for (const size of ['big', 'small']) {
      const k = (size === 'big' ? 120 : 80) / WALK[0].height, kx = 120 / WALK[0].height;   // small: as wide as big, only shorter
      const walk = WALK.slice(1).map(c => { const im = fitFigure(c, { k, kx }); return { img: im, ax: bodyX(im) }; });
      SPRITES.saqer[size].walk = walk;
      SPRITES.saqer[size].run = walk;
    }
    const T0 = cutMagentaSheet(IMG.thiefSheet)[0], TW = cutMagentaSheet(IMG.thiefWalk)[0];
    const kTW = (76 * med(T0.slice(1, 4).map(c => c.height)) / T0[0].height) / med(TW.map(c => c.height));
    ART.naughty = TW.map(c => fitFigure(c, { k: kTW, flip: true }));   // the video walks right; the creatures face left
    const HT = cutMagentaSheet(IMG.herculesTalk)[0], idle = SPRITES.hercules.idle[0];
    const kH = idle.img.height / HT[0].height, refW = HT[0].width * kH, ax = idle.ax / idle.img.width * refW;
    const talk = HT.slice(1).map(c => ({ img: fitFigure(c, { k: kH }), ax }));   // on the characters' pixel grid, like the rest of him
    SPRITES.hercules.talk = talk.concat(talk.slice(1, -1).reverse());
    // the owner's jameed (art/new/Make this jameed piece…nT3.png), 14 units wide; the golden one is the same piece in gold
    ART.jameed = fitFigure(cutMagentaSheet(IMG.jameedArt)[0][0], { w: 56 });
    ART.goldJameed = goldJameed();
  }
  await loadCustom();
  tick();
}

/* ---------------- your own art (optional) ----------------
   Drop a PNG with one of these names into assets/custom/ and the game uses it
   in place of the built-in drawing. Nothing breaks if a file is missing.
   Sizes, and what each one is for, are listed in ART_REQUESTS.md. */
const CUSTOM = {
  'vault_backdrop.png':  im => { ART.bg.crypt.layers = [{ img: im, f: 0.4 }]; ART.bg.crypt.haze = null; },
  'roar.png':            im => { ART.roar = [im, im]; },
  'shockwave.png':       im => { ART.wave = im; },
  'rubble.png':          im => { IMG.rubble = im; },
  'golden_jameed.png':   im => { ART.goldJameed = im; },
  'key.png':             im => { ART.key = im; },
  'heart_full.png':      im => { ART.heart[0] = im; },
  'heart_empty.png':     im => { ART.heart[1] = im; },
  'hercules_kneel.png':  im => { SPRITES.hercules.kneel = [{ img: im, ax: im.width / 2 }, { img: im, ax: im.width / 2 }]; },
};
async function loadCustom() {
  await Promise.all(Object.entries(CUSTOM).map(([file, use]) =>
    loadImage('assets/custom/' + file).then(use).catch(() => {})));
}
