/* ============================================================
   RENDERING
   The context is scaled ×2 so everything below is in world units;
   32-px art drawn into 16-unit boxes lands 1:1 on canvas pixels.
   ============================================================ */
import { TILE, SCALE, RES, VW, VH, GROUND_TOP, LH, MAHR_GOAL, MAX_HP, D } from './config.js';
import { clockSeconds, PILLAR_X, PILLAR_REST, hallThing } from './game.js';
import { topCached } from './board.js';
import { bossOpen } from './boss.js';
import { GATE_COL } from './quest.js';
import { T } from './tiles.js';
import { level, key } from './level.js';
import { G, W, player } from './state.js';
import { IMG, SPRITES } from './assets.js';
import { ART } from './art.js';
import { MORPH_FRAMES } from './player.js';
import { storyView } from './ui.js';
import { t, isAr, AR_FONT, AR_WEIGHT, tStage, tLiras, tVictory } from './lang.js';

let ctx;
/* touch screens (phones, the car): the play view is zoomed in 10%, so the art reads bigger.
   The HUD stays full size. Vertically the view follows Saqer when he climbs high. */
const ZOOM = 1.1;
let zoomY = VH - VH / ZOOM;
const view = { z: 1, ox: 0, oy: 0, cam: 0 };          // how the play view was drawn this frame (for screen effects)
export function initRender(canvas) {
  ctx = canvas.getContext('2d', { alpha: false });
  ctx.imageSmoothingEnabled = false;
}

const half = v => Math.round(v * RES) / RES;         // snap to canvas pixels
const GROUND_Y = GROUND_TOP * TILE;
const themeName = () => (level.def && level.def.theme) || 'amman';
const theme = () => ART.themes[themeName()];

export function render() {
  ctx.setTransform(RES, 0, 0, RES, 0, 0);
  ctx.imageSmoothingEnabled = false;

  if (G.state === 'story') {
    const v = storyView();
    if (v) { drawCutscene(v); return; }
  }
  if (G.state === 'boot' || G.state === 'title' || !level.def) { drawTitleBackdrop(); return; }
  if (G.state === 'intro') { drawIntroCard(); return; }
  if (G.state === 'gameover') { ctx.fillStyle = '#0b0710'; ctx.fillRect(0, 0, VW, VH); return; }

  const cam = half(G.camX);
  const z = !G.mapShot && document.body.classList.contains('touch') ? ZOOM : 1;
  view.z = z; view.ox = 0; view.oy = 0; view.cam = cam;
  if (z !== 1) {
    const span = VH - VH / z, want = Math.max(0, Math.min(span, player.y - 40));
    zoomY += (want - zoomY) * 0.1;
    // never past either end of the area: the zoom must not hide Saqer at an edge
    const seen = VW / z, aw = level.w * TILE;
    const maxCam = Math.max(0, aw - VW);         // the zoomed view slides slightly further than the camera, so it meets both ends exactly
    const left = maxCam > 0 ? (Math.min(cam, maxCam) / maxCam) * Math.max(0, aw - seen) : Math.max(0, (aw - seen) / 2);
    const ox = left - cam;
    ctx.save(); ctx.scale(z, z); ctx.translate(-ox, -zoomY);
    view.ox = ox; view.oy = zoomY;
  }
  const shook = G.shake > 0 && !G.mapShot;
  if (shook) { ctx.save(); ctx.translate(half((Math.random() - 0.5) * Math.min(4, G.shake * 0.4)), half((Math.random() - 0.5) * Math.min(4, G.shake * 0.4))); }
  drawBackdrop(cam);
  if (level.gateX >= 0) drawGate(cam);
  if (level.def.templeCol) drawTempleFront(cam);
  if (level.def.decor) drawDecor(cam);
  if (level.def.things) drawThings(cam);
  if (level.flagX >= 0) drawFlag(cam);
  for (const e of W.entities) if (e.type === 'item' && e.emerge) drawItem(e, cam);   // behind blocks
  drawTiles(cam);
  if (level.def.backdrop === 'sky') drawIslandClouds(cam);
  if (G.area === 'phila') drawWreck(cam);
  if (level.giants && level.giants.length) drawGiants(cam);
  drawSigns(cam);
  drawCoinFx(cam);
  for (const e of W.entities) {
    if (e.type === 'plat') { if (!e.hidden) drawLift(e, cam); }
    else if (e.type === 'naughty') drawNaughty(e, cam);
    else if (e.type === 'item' && !e.emerge) drawItem(e, cam);
  }
  if (level.danaX >= 0) drawDana(level.danaX * TILE + 8 - cam, GROUND_Y, 1, false);
  if (G.boss) drawBoss(G.boss, cam);
  drawParticles(cam);
  drawPlayer(cam);
  drawPopups(cam);
  if (G.dbg) drawDebug(cam);
  if (shook) ctx.restore();
  if (z !== 1) ctx.restore();
  if (G.era === 'past' && !G.mapShot) drawPast();
  if (G.mapShot) return;                 // tools/map.html: the stage only, no HUD
  drawOverlays();
  drawHUD();
  if (G.dbg) drawDebugPanel();
  if (G.state === 'dying' && G.stateTimer > 50 && player.deathKind === 'hit') centerText('AKH!', 96, '#ffffff', 16);
  if (G.state === 'victory') drawVictory();
  if (G.fade > 0) { ctx.fillStyle = 'rgba(11,7,16,' + (G.fade / 16).toFixed(2) + ')'; ctx.fillRect(0, 0, VW, VH); }
}

/* ---------------- backdrops ---------------- */
function drawBackdrop(cam) {
  const def = level.def, kind = def.backdrop || themeName();
  if (G.mapShot) {                       // tools/map.html: a plain backdrop, so the layout reads clearly
    ctx.fillStyle = { rum: '#1c1436', petra: '#f0c8a0', crypt: '#1a1e2e', theater: '#cdb891', phila: '#e9b98c' }[kind] || '#8cc8f4';
    ctx.fillRect(0, 0, VW, VH);
    return;
  }
  if (kind === 'amman') {                                // today's Amman: by day on a first game, at sunset after Hercules
    const img = G.sunset ? IMG.amman : IMG.ammanDay;
    if (def.photoEnd) {                                  // the short stretch by the flag: the east end of the picture
      const w = img.width * (GROUND_Y + 2) / img.height, maxC = Math.max(0, level.w * TILE - VW);
      paintPhoto(img, 4 * (w - VW) - (maxC - cam), 4 * VW, false, '#2b1a4a', G.sunset ? undefined : '40,70,110');
    } else paintPhoto(img, cam, level.w * TILE, false, '#2b1a4a', G.sunset ? undefined : '40,70,110');
  }
  else if (kind === 'room') paintRoom(cam);
  else if (kind === 'phila') paintScenery(ART.scenery.street, cam);
  else if (kind === 'sky') paintScenery(ART.scenery.sky, cam);
  else if (kind === 'theater') paintTheater(cam);
  else {
    paintThemed(ART.bg[kind] || ART.bg.petra, cam, 0);
    if (kind === 'crypt') {              // the stream at the bottom of the gaps
      for (let i = 0; i < 6; i++) {
        const x = ((i * 67 - cam * 1 + G.tick * 0.3) % (VW + 40) + VW + 40) % (VW + 40) - 20;
        ctx.fillStyle = 'rgba(150,220,235,0.35)';
        ctx.fillRect(half(x), GROUND_Y + 10 + (i % 3) * 7, 14, 1);
      }
    }
  }
}

/* A painted panorama behind the stage. Its height fills the sky; it slides slowly as Saqer walks.
   tile = repeat it (every other copy mirrored, so the joins don't show). */
function paintPhoto(img, cam, levelPx, tile, pit, veilRgb = '40,20,70') {
  const h = GROUND_Y + 2, w = img.width * (h / img.height);
  ctx.fillStyle = pit; ctx.fillRect(0, 0, VW, VH);
  const crisp = img === IMG.ammanDay;                 // the day picture is real pixels on the tiles' 2-px grid: no blur, kept on the grid
  ctx.imageSmoothingEnabled = !crisp;
  if (!tile) {
    const f = Math.min(0.25, (w - VW) / Math.max(1, levelPx - VW));
    ctx.drawImage(img, crisp ? -snapArt(cam * f) : -half(cam * f), 0, w, h);
  } else {
    const off = (cam * 0.3) % (w * 2);
    for (let i = 0, x = -off; x < VW; i++, x += w) {
      if (x + w < 0) continue;
      if (i % 2) { ctx.save(); ctx.translate(half(x) + w, 0); ctx.scale(-1, 1); ctx.drawImage(img, 0, 0, w, h); ctx.restore(); }
      else ctx.drawImage(img, half(x), 0, w, h);
    }
  }
  ctx.imageSmoothingEnabled = false;
  // a soft veil pushes the painting back so Saqer and the blocks read clearly in front of it
  const veil = ctx.createLinearGradient(0, GROUND_Y - 120, 0, GROUND_Y);
  veil.addColorStop(0, 'rgba(' + veilRgb + ',0.12)'); veil.addColorStop(1, 'rgba(' + veilRgb + ',0.36)');
  ctx.fillStyle = veil; ctx.fillRect(0, 0, VW, GROUND_Y);
}

/* the backdrops painted in code (scenery.js): a still sky, then layers that slide at different speeds.
   Their pixels are 2 canvas px, the same as the tiles. */
const AP = 0.5;                                        // world units per painted pixel
const snapArt = v => Math.round(v / AP) * AP;
function artCanvas(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
function paintScenery(sc, cam) {
  ctx.fillStyle = sc.pit; ctx.fillRect(0, 0, VW, VH);
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(sc.sky, 0, 0, VW, sc.sky.height * AP);
  for (const L of sc.layers) {
    const w = L.img.width * AP, h = L.img.height * AP;
    const x0 = -(snapArt(cam * L.f) % w);
    for (let x = x0, i = Math.floor(snapArt(cam * L.f) / w); x < VW; x += w, i++) {
      if (L.mirror && i % 2) { ctx.save(); ctx.translate(x + w, 0); ctx.scale(-1, 1); ctx.drawImage(L.img, 0, L.y, w, h); ctx.restore(); }   // mirrored copies meet edge to edge
      else ctx.drawImage(L.img, x, L.y, w, h);
    }
  }
}

/* The Roman theatre: the crowd sits up in the seats, behind a stone podium wall;
   Saqer and Hercules fight on the stone stage in front of it. */
const PODIUM = 26;                                     // world units: the wall between the stage and the front row
let theatreArt = null;
function theatrePictures() {
  if (theatreArt) return theatreArt;
  const w = (28 * TILE) / AP, h = (VH + 1) / AP;
  theatreArt = { calm: IMG.theaterCalm, cheer: IMG.theaterCheer, cheer2: IMG.theaterCheer2, stage: paintStage(w) };   // the crowd at full detail
  return theatreArt;
}
/* the podium wall and the stage floor, painted in art pixels (light from the top-left) */
function paintStage(w) {
  const P = PODIUM / AP, H = (VH - GROUND_Y) / AP + P;
  const c = artCanvas(w, H), g = c.getContext('2d');
  let seed = 11;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const rect = (col, x, y, ww, hh) => { g.fillStyle = col; g.fillRect(x, y, ww, hh); };
  const speckle = (x0, y0, ww, hh, n, cols) => { for (let i = 0; i < n; i++) rect(cols[(rnd() * cols.length) | 0], x0 + ((rnd() * ww) | 0), y0 + ((rnd() * hh) | 0), 1, 1); };
  // podium wall: a cornice, then three courses of limestone blocks
  rect('#9c7b4f', 0, 0, w, P);
  rect('#f0dcae', 0, 0, w, 1); rect('#e2c793', 0, 1, w, 2); rect('#cdb07b', 0, 3, w, 2); rect('#8a6a40', 0, 5, w, 1); rect('#5e4529', 0, 6, w, 1);
  const course = [7, 22, 37], ch = 14;
  course.forEach((y0, i) => {
    for (let x = -(i % 2 ? 22 : 0); x < w; x += 44) {
      const base = ['#c4a26c', '#bd9a63', '#c9a874', '#b9965f'][(rnd() * 4) | 0];
      rect(base, x, y0, 43, ch);
      rect('#dcc08b', x, y0, 43, 1); rect('#d3b680', x, y0 + 1, 1, ch - 1);          // lit top and left
      rect('#8f6f45', x, y0 + ch - 1, 43, 1); rect('#8f6f45', x + 42, y0, 1, ch);     // shaded bottom and right
      speckle(x + 2, y0 + 2, 39, ch - 4, 10, ['#ad8a56', '#d4b783', '#a58350']);
      if (rnd() < 0.25) rect('#9a7849', x + 6 + ((rnd() * 28) | 0), y0 + 4 + ((rnd() * 6) | 0), 1 + ((rnd() * 4) | 0), 1);   // a chip
    }
    rect('#6e5232', 0, y0 + ch, w, 1);                                                  // mortar under the course
  });
  rect('#4a3620', 0, P - 2, w, 2);                                                      // shadow where the wall meets the stage
  // the stage floor: a pale lip, then flagstones getting bigger towards you
  rect('#f2dfb4', 0, P, w, 1); rect('#e3c996', 0, P + 1, w, 2); rect('#b8975f', 0, P + 3, w, 1);
  let y = P + 4, row = 0;
  for (const rh of [10, 13, 16, 22]) {
    const bw = 50 + row * 12;
    for (let x = -((row * 29) % bw); x < w; x += bw) {
      const base = ['#cfb07c', '#c6a571', '#d4b787', '#c9aa76'][(rnd() * 4) | 0];
      rect(base, x, y, bw - 1, rh - 1);
      rect('#e0c792', x, y, bw - 1, 1);
      rect('#9c7c4f', x + bw - 1, y, 1, rh);
      speckle(x + 1, y + 1, bw - 3, rh - 3, 12, ['#b99a66', '#dcc391', '#bfa06b']);
    }
    rect('#9c7c4f', 0, y + rh - 1, w, 1);
    y += rh; row++;
  }
  const dim = g.createLinearGradient(0, P, 0, H);
  dim.addColorStop(0, 'rgba(60,35,10,0)'); dim.addColorStop(1, 'rgba(60,35,10,0.35)');
  g.fillStyle = dim; g.fillRect(0, P, w, H - P);
  return c;
}
function paintTheater(cam) {
  const A = theatrePictures(), cheering = G.cheer > 0, alt = Math.floor(G.tick / 9) % 2;
  const img = crowdFrame(cheering);
  ctx.imageSmoothingEnabled = true;                     // the crowd picture at full detail, lifted so its front row sits just above the podium wall
  // the whole theatre, from the arched gate at the top to the front row on the podium wall, in its own proportions;
  // narrower than the arena, so it slides a little slower than the stage (depth)
  const h = 200, w = h * img.width / img.height, span = Math.max(1, level.w * TILE - VW);
  ctx.drawImage(img, -Math.min(cam, span) * (w - VW) / span, GROUND_Y - PODIUM - h * 0.93, w, h);
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(A.stage, -cam, GROUND_Y - PODIUM, A.stage.width * AP, A.stage.height * AP);
}

/* Petra / Wadi Rum: still sky + two repeating silhouette layers */
function paintThemed(bg, cam, skyY) {
  ctx.fillStyle = bg.pit; ctx.fillRect(0, GROUND_Y, VW, VH);        // the dark at the bottom of the pits
  ctx.drawImage(bg.sky, 0, skyY, VW, GROUND_Y);
  for (const L of bg.layers) {
    const w = L.img.width / SCALE, h = L.img.height / SCALE;
    const x0 = -half((cam * L.f) % w);
    ctx.drawImage(L.img, x0, GROUND_Y + 2 - h, w, h);
    ctx.drawImage(L.img, x0 + w, GROUND_Y + 2 - h, w, h);
  }
  if (bg.haze) {
    const top = GROUND_Y - 110;
    const haze = ctx.createLinearGradient(0, top, 0, GROUND_Y);
    haze.addColorStop(0, bg.haze[0]); haze.addColorStop(1, bg.haze[1]);
    ctx.fillStyle = haze; ctx.fillRect(0, top, VW, GROUND_Y - top);
  }
}

/* ---------------- tiles ---------------- */
function drawTiles(cam) {
  const th = theme();
  const x0 = Math.max(0, Math.floor(cam / TILE) - 1);
  const x1 = Math.min(level.w - 1, Math.floor((cam + VW) / TILE) + 1);
  const qf = [0, 1, 2, 1, 0, 3][Math.floor(G.tick / 9) % 6];
  const cf = Math.floor(G.tick / 8) % 4;

  for (let ty = 0; ty < LH; ty++) {
    for (let tx = x0; tx <= x1; tx++) {
      const t = level.tiles[ty][tx];
      if (t === T.EMPTY) continue;
      const px = tx * TILE - cam;
      let py = ty * TILE;
      const b = W.bumps.get(key(tx, ty));
      if (b !== undefined) py -= Math.round(Math.sin(((10 - b) / 10) * Math.PI) * 6 * SCALE) / SCALE;
      const v = (tx * 7 + ty * 13) % 3;

      switch (t) {
        case T.GROUND: {
          if (level.def.boss) break;                 // the theatre floor is part of the painting
          const above = ty > 0 ? level.tiles[ty - 1][tx] : T.EMPTY;
          ctx.drawImage(above === T.GROUND ? th.ground[v] : th.groundTop[v], px, py, TILE, TILE);
          break;
        }
        case T.BRICK: case T.BRICK_MANSAF: case T.BRICK_COINS:
          ctx.drawImage(th.brick[v % 2], px, py, TILE, TILE); break;
        case T.Q_COIN: case T.Q_JAMEED:
          ctx.drawImage(ART.q[qf], px, py, TILE, TILE); break;
        case T.Q_MAP: {                                     // the map box: a star box with a pulsing gold frame
          ctx.drawImage(ART.q[qf], px, py, TILE, TILE);
          ctx.globalAlpha = 0.45 + 0.35 * Math.sin(G.tick / 9);
          ctx.strokeStyle = '#ffe08a'; ctx.lineWidth = 1.5; ctx.strokeRect(px - 1, py - 1, TILE + 2, TILE + 2);
          ctx.globalAlpha = 1; break;
        }
        case T.USED: ctx.drawImage(ART.used, px, py, TILE, TILE); break;
        case T.HARD: ctx.drawImage(th.hard, px, py, TILE, TILE); break;
        case T.COL_TL: ctx.drawImage(th.colCap, px - 2, py, 36, TILE); break;
        case T.COL_BL: {
          const below = ty + 1 < LH ? level.tiles[ty + 1][tx] : T.EMPTY;
          ctx.drawImage(below === T.COL_BL ? th.colShaft : th.colBase, px, py, 32, TILE);
          break;
        }
        case T.COIN:
          ctx.drawImage(ART.coin[(cf + tx) % 4], px + 4, py + 4, 8, 8); break;
        case T.LIRA:
          ctx.drawImage(ART.lira[(cf + tx) % 4], px + 2, half(py + 2 + Math.sin(G.tick / 18 + tx) * 1.5), 12, 12); break;
        case T.THORN: ctx.drawImage(ART.thorn, px, py, TILE, TILE); break;
        case T.BARS: ctx.drawImage(ART.bars, px, py, TILE, TILE); break;
        case T.KEY: ctx.drawImage(level.def.keyName === 'temple' ? ART.keyTemple : ART.key, px, half(py + Math.sin(G.tick / 14) * 2), TILE, TILE); break;
        case T.GOLD: drawGolden(px, py); break;
        default: break;   // COL_TR / COL_BR are covered by their left half; hidden tiles stay hidden
      }
    }
  }
}

/* ---------------- flag + gate ---------------- */
function drawFlag(cam) {
  const px = level.flagX * TILE - cam;
  if (px < -40 || px > VW + 40) return;
  const topY = 3 * TILE, botY = GROUND_Y;
  // pole
  ctx.fillStyle = '#3a3a44'; ctx.fillRect(px + 6.5, topY, 3, botY - TILE - topY);
  ctx.fillStyle = '#d8d8e0'; ctx.fillRect(px + 7, topY, 1, botY - TILE - topY);
  ctx.fillStyle = '#9a9aa8'; ctx.fillRect(px + 8, topY, 1, botY - TILE - topY);
  // finial
  ctx.fillStyle = '#7a4a0c'; ctx.fillRect(px + 5.5, topY - 5, 5, 5);
  ctx.fillStyle = '#f2b632'; ctx.fillRect(px + 6, topY - 4.5, 4, 4);
  ctx.fillStyle = '#ffe08a'; ctx.fillRect(px + 6.5, topY - 4, 1.5, 1.5);
  // the flag hangs low and is raised when Saqer reaches the pole
  const fy = level.def.flagUp ? topY + 1 : (G.state === 'goal') ? G.flagY : botY - TILE - 14;   // after Hercules it stays raised
  const fr = ART.flag[Math.floor(G.tick / 8) % 3];
  ctx.drawImage(fr, px + 8, half(fy), fr.width / SCALE, fr.height / SCALE);
}

function drawGate(cam) {
  const im = theme().gate;
  const px = level.gateX * TILE - cam;
  if (px < -im.width / SCALE - 10 || px > VW + 10) return;
  ctx.drawImage(im, px, GROUND_Y - im.height / SCALE, im.width / SCALE, im.height / SCALE);
}
export const gateDoorX = () => level.gateX * TILE + theme().gate.width / SCALE / 2;

/* ---------------- entities ---------------- */
function drawNaughty(c, cam) {
  let fr, W_, H_;
  if (c.kind === 'scorpion') {
    fr = c.squash > 0 ? ART.scorpionFlat : ART.scorpion[Math.floor(c.anim / 6) % ART.scorpion.length];
  } else if (c.kind === 'flyer') {
    { const fl = level.def.flyer === 'pigeon' ? ART.pigeon : ART.bat; fr = fl[Math.floor(c.anim / 5) % fl.length]; }
  } else {
    fr = c.squash > 0 ? ART.naughtyFlat : ART.naughty[Math.floor(c.anim / 5) % ART.naughty.length];
  }
  const dv = fr.div || SCALE;                          // the creatures are drawn finer (see art.js zbuf)
  W_ = fr.width / dv; H_ = fr.height / dv;
  const px = half(c.x + c.w / 2 - W_ / 2 - cam), py = half(c.y + c.h - H_ + 1);
  if (px < -24 || px > VW + 24) return;
  if (c.squash > 0) { ctx.drawImage(fr, px, py, W_, H_); return; }
  const faceRight = c.vx > 0;
  ctx.save();
  ctx.translate(faceRight ? px + W_ : px, c.flipped ? py + H_ : py);
  ctx.scale(faceRight ? -1 : 1, c.flipped ? -1 : 1);
  ctx.drawImage(fr, 0, 0, W_, H_);
  ctx.restore();
}

function drawLift(p, cam) {
  const im = ART.lift[p.tiles] || ART.lift[3];
  const px = half(p.x - cam);
  if (px < -p.w - 8 || px > VW + 8) return;
  ctx.drawImage(im, px, half(p.y), p.w, im.height / SCALE);
  if (p.locked) drawChains(p, cam);
}

function drawItem(m, cam) {
  const im = m.kind === 'mansaf' ? ART.mansaf : ART.jameed;
  const d = im.div || SCALE, w = im.width / d, h = im.height / d;   // the owner's art is drawn at 4 px per unit
  const px = half(m.x + m.w / 2 - w / 2 - cam), py = half(m.y + m.h - h);
  if (px < -20 || px > VW + 20) return;
  if (m.emerge) {
    // clip to the area above the block it rises from
    ctx.save(); ctx.beginPath(); ctx.rect(px - 2, 0, w + 4, m.targetY + m.h); ctx.clip();
    ctx.drawImage(im, px, py, w, h); ctx.restore();
  } else ctx.drawImage(im, px, py, w, h);
}

function drawCoinFx(cam) {
  for (const c of W.coinFx) {
    if (c.lira) ctx.drawImage(ART.lira[Math.floor(c.t / 3) % 4], half(c.x - cam), half(c.y), 12, 12);
    else ctx.drawImage(ART.coin[Math.floor(c.t / 3) % 4], half(c.x - cam), half(c.y), 8, 8);
  }
}
function drawParticles(cam) {
  const ch = theme().chunk;
  for (const p of W.particles) {
    if (p.spark) {
      ctx.fillStyle = p.t % 6 < 3 ? '#fff3b8' : '#f2b632';
      ctx.fillRect(half(p.x - cam), half(p.y), 1.5, 1.5);
      continue;
    }
    ctx.save();
    ctx.translate(half(p.x - cam), half(p.y));
    ctx.rotate(Math.round((p.t * 0.25 + p.spin) / (Math.PI / 2)) * (Math.PI / 2));
    ctx.drawImage(ch, -2, -2, 4, 4);
    ctx.restore();
  }
}

/* ---------------- Saqer ---------------- */
function pickFrame() {
  let big = player.big;
  if (player.morph > 0) big = Math.floor(player.morph / 4) % 2 === (player.morphDir > 0 ? 0 : 1);   // flickers between the two sizes
  const f = SPRITES.saqer[big ? 'big' : 'small'];
  const cyc = (arr, t) => arr[Math.floor(t) % arr.length];

  if (G.state === 'dying') {
    if (player.deathKind === 'pit') return f.hurt[1];
    return f.die[Math.min(f.die.length - 1, Math.floor(G.stateTimer / 12))];
  }
  if (G.state === 'goal') return G.goalPhase === 0 ? f.jump[1] : f.idle[0];
  if (G.state === 'victory') return f.jump[0];
  if (player.hurtT > 0) return f.hurt[Math.floor(player.hurtT / 6) % 2];
  if (!player.onGround) {
    if (player.vy < -2.5) return f.jump[0];
    if (player.vy < 0.8) return f.jump[1];
    return f.jump[2];
  }
  if (player.landT > 0) return f.land[player.landT > 4 ? 1 : 0];
  if (Math.abs(player.vx) > 2.1) return cyc(f.walk, player.walkT);                 // one walk for both speeds: faster steps when running
  if (Math.abs(player.vx) > 0.1) return cyc(f.walk, player.walkT);
  return f.idle[0];
}

/* The figures come from the painted sheet; the movement is added here:
   he breathes when standing, bobs as he walks, leans into a run and squashes when he lands. */
function drawPlayer(cam) {
  if (!player.visible) return;
  if (player.invuln > 0 && player.morph === 0 && Math.floor(G.tick / 3) % 2 === 0) return;
  const fr = pickFrame();
  const playing = G.state === 'play';
  const moving = playing && player.onGround && Math.abs(player.vx) > 0.1;
  const running = moving && Math.abs(player.vx) > 2.1;
  const bob = moving ? (running ? (Math.floor(player.walkT * 0.9) % 2 ? 0.75 : 0) : Math.round(Math.abs(Math.sin(player.walkT * Math.PI)) * 2) * 0.375)
    : (playing && player.onGround ? (Math.sin(G.tick / 22) > 0.4 ? 0.5 : 0) : 0);
  const lean = 0;                                   // the poses already lean; turning the picture would break its pixels
  const sq = playing && player.landT > 0 ? 1 - player.landT * 0.012 : 1;
  const cx = half(player.x + player.w / 2 - cam), gy = half(player.y + player.h + 1.2 - bob);
  if (player.star > 0 && (player.star > 120 || Math.floor(G.tick / 4) % 2)) {   // the mansaf's power: a golden glow (it flickers in the last 2 seconds)
    const g = ctx.createRadialGradient(cx, gy - player.h / 2, 2, cx, gy - player.h / 2, 26);
    const a = 0.45 + 0.2 * Math.sin(G.tick / 4);
    g.addColorStop(0, 'rgba(255,214,90,' + a.toFixed(2) + ')'); g.addColorStop(1, 'rgba(255,214,90,0)');
    ctx.fillStyle = g; ctx.fillRect(cx - 28, gy - player.h / 2 - 28, 56, 56);
    for (let i = 0; i < 4; i++) {                       // sparks circling him
      const an = G.tick / 7 + i * Math.PI / 2;
      ctx.fillStyle = i % 2 ? '#fff3b8' : '#ffd166';
      ctx.fillRect(half(cx + Math.cos(an) * 12 - 1), half(gy - player.h / 2 + Math.sin(an) * 14 - 1), 2, 2);
    }
  }
  ctx.save();
  ctx.translate(cx, gy);
  ctx.rotate(lean);
  ctx.scale(player.facing < 0 ? -1 : 1, sq);
  const w = fr.img.width / RES, h = fr.img.height / RES;
  ctx.drawImage(fr.img, -fr.ax / RES, -h, w, h);
  ctx.restore();
}

/* one cut-out figure ({ img, ax }), feet on (cx, groundY), k times its normal size, optionally mirrored */
function drawSprite(fr, cx, groundY, k = 1, flip = false) {
  const w = (fr.img.width / RES) * k, h = (fr.img.height / RES) * k, ax = (fr.ax / RES) * k;
  ctx.save();
  ctx.translate(half(cx), half(groundY + 1.2 * k));
  if (flip) ctx.scale(-1, 1);
  ctx.imageSmoothingEnabled = k !== 1;
  ctx.drawImage(fr.img, -ax, -h, w, h);
  ctx.restore();
  ctx.imageSmoothingEnabled = false;
}

/* Hercules' boulder: a round grey stone, lit from the top left (built once) */
let boulderArt = null;
function boulder() {
  if (boulderArt) return boulderArt;
  const N = 28, c = document.createElement('canvas'); c.width = c.height = N;
  const g = c.getContext('2d'), R = N / 2 - 0.5;
  const hash = (x, y) => { const s = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453; return s - Math.floor(s); };
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const dx = x + 0.5 - N / 2, dy = y + 0.5 - N / 2, d = Math.hypot(dx, dy);
    if (d > R) continue;
    if (d > R - 1.6) { g.fillStyle = '#1e1812'; g.fillRect(x, y, 1, 1); continue; }                 // outline
    const lit = (-dx * 0.55 - dy * 0.7) / R + hash(x, y) * 0.35 - 0.1;
    g.fillStyle = lit > 0.55 ? '#d6d0c6' : lit > 0.15 ? '#aaa298' : lit > -0.3 ? '#827a70' : '#5a534b';   // grey stone: it stands out on the pale floor
    g.fillRect(x, y, 1, 1);
  }
  g.fillStyle = '#3e3832';                                                                         // a few cracks
  for (const [x, y, w, h] of [[9, 8, 5, 1], [13, 9, 1, 3], [16, 17, 4, 1], [15, 15, 1, 2], [7, 18, 3, 1]]) g.fillRect(x, y, w, h);
  boulderArt = c;
  return c;
}

/* ---------------- Hercules ---------------- */
function drawBoss(b, cam) {
  const f = SPRITES.hercules, t = b.t;
  let fr;
  switch (b.state) {
    case 'walk':    fr = f.walk[Math.floor(b.anim / 9) % 4]; break;
    case 'windup':  fr = f.windup[Math.min(2, Math.floor(t / 11))]; break;
    case 'smash':   fr = f.smash[t < 6 ? 0 : 1]; break;
    case 'roarUp':  fr = f.windup[Math.min(2, Math.floor(t / 10))]; break;     // he raises the club …
    case 'roar':    fr = f.smash[(t % 32) < 6 ? 0 : 1]; break;                 // … and swings: a boulder flies
    case 'charge':  fr = f.run[Math.floor(b.anim / 5) % 4]; break;
    case 'recover': fr = t < 10 ? f.smash[1] : f.kneel[Math.floor(t / 18) % 2]; break;
    case 'hurt':    fr = f.hurt[Math.floor(t / 7) % 2]; break;
    case 'down':    fr = t < 45 ? f.down[Math.min(2, Math.floor(t / 15))] : f.out[Math.min(2, 1 + Math.floor((t - 45) / 20))]; break;
    default:        fr = f.idle[Math.floor(b.anim / 22) % 2];
  }
  const cx = b.x + b.w / 2 - cam, gy = b.y + b.h;
  if (b.flash > 0 && Math.floor(G.tick / 3) % 2) ctx.globalAlpha = 0.45;
  drawSprite(fr, cx, gy, 1, b.facing < 0);
  ctx.globalAlpha = 1;

  if (bossOpen(b)) {                                   // stars: now is the time to stomp him
    for (let i = 0; i < 3; i++) {
      const a = G.tick / 9 + (i * Math.PI * 2) / 3;
      const sx = cx + Math.cos(a) * 13, sy = b.y - 4 + Math.sin(a) * 3.5;
      ctx.fillStyle = '#140d1c'; ctx.fillRect(half(sx - 2.5), half(sy - 2.5), 5, 5);
      ctx.fillStyle = i % 2 ? '#fff3b8' : '#ffd166'; ctx.fillRect(half(sx - 1.5), half(sy - 1.5), 3, 3);
    }
    if (b.t > 14 && Math.floor(G.tick / 20) % 2) text('STOMP!', half(cx - 18), half(b.y - 20), '#7dff8a', 6);
  }
  for (const s of b.shots) {
    if (s.kind === 'wave') {
      const im = ART.wave, k = 0.7 + 0.3 * Math.abs(Math.sin(s.t / 3));
      ctx.drawImage(im, half(s.x + s.w / 2 - 14 - cam), half(GROUND_Y - 24 * k), 28, 24 * k);
    } else {
      const im = boulder(), r = 9;                         // the boulder spins as it rolls or flies
      if (!s.high) { ctx.fillStyle = 'rgba(20,13,28,0.35)'; ctx.fillRect(half(s.x - 1 - cam), GROUND_Y - 1.5, 18, 1.5); }
      ctx.save();
      ctx.translate(half(s.x + s.w / 2 - cam), half(s.y + s.h / 2));
      ctx.rotate(s.t * 0.19 * Math.sign(s.vx));
      ctx.drawImage(im, -r, -r, r * 2, r * 2);
      ctx.restore();
    }
  }
}

/* ---------------- the wrecked gate, the golden jameed, way-in arrows ---------------- */
function drawWreck(cam) {
  const c = G.cut;
  const angle = c ? c.angle : PILLAR_REST;
  if (c && !c.crashed) {                               // the gate still stands, until the pillar reaches it
    const im = ART.themes.amman.gate;
    ctx.drawImage(im, GATE_COL * TILE - cam, GROUND_Y - im.height / SCALE, im.width / SCALE, im.height / SCALE);
  }
  if (IMG.rubble && !(c && !c.crashed)) {            // your own wreck (assets/custom/rubble.png), drawn over the plain blocks
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(IMG.rubble, (GATE_COL - 2) * TILE - cam, GROUND_Y - 40, 128, 40);
    ctx.imageSmoothingEnabled = false;
  }
  const im = IMG.pillar, w = im.width / RES, h = im.height / RES;
  const k = Math.max(0, angle) / PILLAR_REST;
  ctx.save();
  ctx.translate(half(PILLAR_X - cam), half(GROUND_Y - 13 * k));
  ctx.rotate((-angle * Math.PI) / 180);
  ctx.imageSmoothingEnabled = true;
  ctx.drawImage(im, -w / 2, -h + 2, w, h);
  ctx.imageSmoothingEnabled = false;
  ctx.restore();
}

function drawGolden(px, py) {
  const im = ART.goldJameed, w = 15, h = 15 * (im.height / im.width);
  const y = py + 2 + Math.sin(G.tick / 16) * 2;
  const glow = ctx.createRadialGradient(px + 8, y + 6, 1, px + 8, y + 6, 22);
  glow.addColorStop(0, 'rgba(255,220,90,0.55)'); glow.addColorStop(1, 'rgba(255,220,90,0)');
  ctx.fillStyle = glow; ctx.fillRect(px - 16, y - 18, 48, 48);
  ctx.drawImage(im, half(px + 8 - w / 2), half(y), w, h);
  for (let i = 0; i < 4; i++) {
    const a = G.tick / 14 + (i * Math.PI) / 2;
    ctx.fillStyle = '#fff3b8'; ctx.fillRect(half(px + 8 + Math.cos(a) * 13), half(y + 6 + Math.sin(a) * 10), 1.5, 1.5);
  }
  text('GOLDEN JAMEED', px - 92, py, '#ffd166', 6);          // beside it, not above: the top is the HUD's
  text('GROWN FOR GOOD', px - 96, py + 9, '#ffffff', 6);
}

/* arrows over the shafts that lead down, and at the lifts that lead up */
function drawSigns(cam) {
  const bob = Math.floor(G.tick / 16) % 2;
  for (const l of level.links) {
    const cx = ((l.a + l.b + 1) / 2) * TILE - cam;
    if (cx < -20 || cx > VW + 20) continue;
    const down = l.kind === 'down';
    const y = down ? GROUND_Y - 30 + bob * 2 : 38 - bob * 2;
    for (let i = 0; i < 5; i++) {
      const ww = down ? 10 - i * 2 : 2 + i * 2;
      ctx.fillStyle = '#140d1c'; ctx.fillRect(half(cx - ww / 2 - 1), y + i * 1.5 - 0.5, ww + 2, 2.5);
    }
    for (let i = 0; i < 5; i++) {
      const ww = down ? 10 - i * 2 : 2 + i * 2;
      ctx.fillStyle = '#ffd166'; ctx.fillRect(half(cx - ww / 2), y + i * 1.5, ww, 1.5);
    }
    if (l.to === 'theater') text('THEATRE', half(cx - 21), y + 12, '#ffd166', 6);
    if (l.to === 'temple') text('TEMPLE', half(cx - 18), y + 12, '#ffd166', 6);
  }
}

/* one frame of a sprite sheet, feet on (cx, groundY), k times normal size, optionally mirrored */
function drawFrame(img, fr, cx, groundY, k, flip) {
  const [sx, sy, sw, sh] = fr;
  const w = (sw / SCALE) * k, h = (sh / SCALE) * k;
  const x = half(cx - w / 2), y = half(groundY - h);
  if (flip) {
    ctx.save(); ctx.translate(x + w, y); ctx.scale(-1, 1);
    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, w, h); ctx.restore();
  } else ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
}

/* Dana faces left (towards Saqer). Uses your own picture when DANA_ART is set in story.js. */
function drawDana(cx, groundY, k, talking) {
  if (IMG.danaCustom) {
    const im = IMG.danaCustom;
    const h = 29 * k, w = (im.width / im.height) * h;
    const bob = talking && Math.floor(G.tick / 8) % 2 ? 1 : 0;
    ctx.drawImage(im, half(cx - w / 2), half(groundY - h - bob), w, h);
    return;
  }
  const f = SPRITES.dana.frames;
  const fr = talking ? f.talk[Math.floor(G.tick / 8) % 2] : f.idle[Math.floor(G.tick / 20) % 4];
  drawFrame(IMG.dana, fr, cx, groundY, k, true);
}

/* ---------------- text / HUD ---------------- */
const FONT = '"Press Start 2P", ui-monospace, monospace';
const ARABIC = /[؀-ۿ]/;
function text(s, x, y, col = '#fff', size = 8, align = 'left') {
  s = t(String(s));
  if (ARABIC.test(s)) {                    // the pixel font has no Arabic: the Arabic font, a size up
    ctx.font = `${AR_WEIGHT} ${Math.round(size * 1.45)}px ${AR_FONT}`;
    ctx.direction = 'rtl'; y -= size * 0.45;
  } else ctx.font = `${size}px ${FONT}`;
  ctx.textAlign = align; ctx.textBaseline = 'top';
  ctx.fillStyle = '#140d1c'; ctx.fillText(s, x + 1, y + 1);
  ctx.fillStyle = col; ctx.fillText(s, x, y);
  ctx.direction = 'ltr';
}
function centerText(s, y, col, size) { text(s, VW / 2, y, col, size, 'center'); }
const pad = (n, l) => String(Math.max(0, Math.floor(n))).padStart(l, '0');

function drawPopups(cam) {
  for (const p of W.popups) {
    const col = p.gold ? '#ffd166' : p.text === '1UP' ? '#7dff8a' : '#fff';
    const s = isAr() && /^GOLD +/.test(p.text) ? p.text.replace('GOLD', 'ذهب') : p.text;
    text(s, half(p.x - cam), half(p.y - Math.max(0, p.t) * 0.6), col, 6);
  }
}

function drawHUD() {
  text('SAQER', 10, 8);
  if (G.god) text('ATTAR10X', 10, 46, '#7dff8a', 6);
  text(pad(G.score, 6), 10, 19);
  text('DINARS', 68, 8, '#ffd166');          // no mahr yet: Dana and her mahr come in level 2
  ctx.drawImage(ART.coin[Math.floor(G.tick / 10) % 4], 67, 18.5, 8, 8);
  text(String(G.mahr), 77, 19);
  text('STAGE', 128, 8);
  const id = level.def ? (level.def.id || '') : '';
  text(id, 128, 19, '#fff', id.length > 8 ? 6 : 8);
  if (G.golden) {                                       // lives only count once he has the golden jameed
    text('LIVES', 214, 8);
    text('x' + G.lives, 222, 19);
  }
  text('TIME', 270, 8);
  const s = clockSeconds();
  text(Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'), 270, 19);

  // the hit bar (once he has the golden jameed) and the key
  if (G.golden) {
    for (let i = 0; i < MAX_HP; i++) ctx.drawImage(ART.heart[i < G.hp ? 0 : 1], 10 + i * 13, 31, 11.25, 9.75);
  }
  { let kx = G.golden ? 52 : 10;                                             // the keys he carries
    if (G.keys.vault) { ctx.drawImage(ART.key, kx, 28, 16, 16); kx += 18; }
    if (G.keys.temple) ctx.drawImage(ART.keyTemple, kx, 28, 16, 16); }

  // the health of Hercules
  const b = G.boss;
  if (b && b.state !== 'wait') {
    const w = 132, x = (VW - w) / 2, y = 222;
    text('HERCULES', x, y - 10, '#ffd166', 6);
    ctx.fillStyle = '#140d1c'; ctx.fillRect(x - 2, y - 2, w + 4, 10);
    ctx.fillStyle = '#4b1820'; ctx.fillRect(x, y, w, 6);
    const seg = w / D.boss;
    for (let i = 0; i < b.hp; i++) {
      ctx.fillStyle = b.flash > 0 && Math.floor(G.tick / 3) % 2 ? '#ffffff' : '#e23a4c';
      ctx.fillRect(x + i * seg + 0.5, y, seg - 1, 6);
      ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fillRect(x + i * seg + 0.5, y, seg - 1, 1.5);
    }
  }
}

/* messages, the time-travel title, the white-out */
function drawOverlays() {
  const c = G.cut;
  if (c && G.state === 'goal') drawWarp(c);
  else if (c && c.white > 0) { ctx.fillStyle = 'rgba(255,250,235,' + c.white.toFixed(2) + ')'; ctx.fillRect(0, 0, VW, VH); }
  drawYear();
  if (c && G.goalPhase === 2 && c.title > 20) {
    const a = Math.min(1, (c.title - 20) / 30) * Math.min(1, (190 - c.title) / 25);
    ctx.globalAlpha = Math.max(0, a);
    ctx.fillStyle = 'rgba(20,13,28,0.72)'; ctx.fillRect(0, 62, VW, 76);
    centerText('PHILADELPHIA', 72, '#ffd166', 16);
    ctx.font = 'bold 13px Georgia, "Times New Roman", serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    ctx.fillStyle = '#efe0bf'; ctx.fillText('ΦΙΛΑΔΕΛΦΕΙΑ', VW / 2, 95);
    centerText('AMMAN, ALMOST 1,900 YEARS EARLIER', 118, '#ffffff', 6);
    ctx.globalAlpha = 1;
  }
  const bn = G.banner;
  if (bn && (G.state !== 'goal' || G.goalPhase === 4)) {
    const a = Math.min(1, bn.t / 20);
    const lh = isAr() ? 14 : 11, h = 12 + bn.lines.length * lh + (isAr() ? 4 : 0);   // Arabic letters are taller
    ctx.globalAlpha = a;
    ctx.fillStyle = 'rgba(20,13,28,0.78)'; ctx.fillRect(0, 50, VW, h);
    ctx.fillStyle = '#ffd166'; ctx.fillRect(0, 50, VW, 1); ctx.fillRect(0, 50 + h - 1, VW, 1);
    bn.lines.forEach((s, i) => centerText(s, 57 + (isAr() ? 4 : 0) + i * lh, i === 0 ? '#ffd166' : '#ffffff', i === 0 ? 8 : 6));
    ctx.globalAlpha = 1;
  }
}

function drawVictory() {
  if (G.stateTimer < 40) return;
  ctx.fillStyle = 'rgba(20,13,28,0.72)';
  ctx.fillRect(40, 56, 240, 96);
  centerText('HERCULES YIELDS!', 66, '#ffd166', 12);
  const s = clockSeconds();
  const v = tVictory(Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'), G.bonus || 0, G.mahr, G.liras, pad(G.score, 6));
  centerText(v[0], 90, '#ffffff', 6);
  centerText(v[1], 104, '#efe0bf', 6);
  centerText(v[2], 120, '#7dff8a', 8);
  if (G.stateTimer > 120 && Math.floor(G.tick / 30) % 2) centerText('PRESS JUMP', 138, '#ffffff', 6);
}

/* ---------------- full-screen cards ---------------- */
function drawTitleBackdrop() {
  ctx.fillStyle = '#140d1c'; ctx.fillRect(0, 0, VW, VH);
  if (IMG.title) {
    const drift = Math.sin(G.tick / 400) * 6;
    ctx.drawImage(IMG.title, -8 + drift, 0, IMG.title.width / SCALE + 16, VH);
    ctx.fillStyle = 'rgba(20,13,28,0.35)'; ctx.fillRect(0, 0, VW, VH);
  }
}

function drawIntroCard() {
  ctx.fillStyle = '#140d1c'; ctx.fillRect(0, 0, VW, VH);
  drawHUD();
  if (G.dbg) drawDebugPanel();
  const def = level.def;
  centerText(tStage(def.id), 62, '#ffd166', 8);
  if (isAr()) centerText(def.nameAr || def.name, 82, '#ffffff', 11);
  else centerText(def.name, 80, '#ffffff', 8);
  ctx.font = AR_WEIGHT + ' 14px ' + AR_FONT;
  ctx.textAlign = 'center'; ctx.textBaseline = 'top'; ctx.direction = 'rtl';
  if (!isAr()) { ctx.fillStyle = '#efe0bf'; ctx.fillText(def.nameAr || '', VW / 2, 94); }
  ctx.direction = 'ltr';
  drawSprite(SPRITES.saqer.small.idle[0], VW / 2 - 18, 158, 1, false);
  if (G.golden)
  text('x  ' + G.lives, VW / 2 - 4, 143, '#ffffff', 8);
  if (level.liraTotal) {
    ctx.drawImage(ART.lira[0], VW / 2 - 82, 176, 12, 12);
    text(tLiras(level.liraTotal), VW / 2 - 66, 179, '#cbb7e8', 6);
  }
}

/* ---------------- story cutscene ----------------
   The scene is drawn in the top part of the screen so the dialogue
   box (bottom) never covers Saqer or Dana. Whoever is speaking gets
   an arrow over their head and moves their mouth. */
const CUT_GROUND = 122;       // where the ground sits on screen during a cutscene
const CUT_K = 1;              // Saqer and Hercules at their real size: crisp, and their pixels match the game

function drawCutscene(v) {
  const shift = GROUND_Y - CUT_GROUND;
  ctx.fillStyle = '#140d1c'; ctx.fillRect(0, 0, VW, VH);
  ctx.save();
  ctx.translate(0, -shift);

  const theatre = v.bg === 'theater';
  const name = ART.themes[v.bg] ? v.bg : v.bg === 'phila' ? 'sky' : 'amman';   // Philadelphia stands on white marble
  const th = ART.themes[name];
  if (theatre) {
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(crowdFrame(false), -64, GROUND_Y - VH - PODIUM + 4, 448, VH + 1);   // as in the fight: the crowd behind the podium wall …
    ctx.imageSmoothingEnabled = false;
    const st = theatrePictures().stage; ctx.drawImage(st, -64, GROUND_Y - PODIUM, st.width * AP, st.height * AP);   // … and the stone stage
    ctx.imageSmoothingEnabled = false;
  } else if (v.bg === 'phila') paintScenery(ART.scenery.street, 1800);
  else if (name === 'amman') paintPhoto(IMG.amman, 900, 3584, false, '#2b1a4a');
  else paintThemed(ART.bg[name], 200, shift);

  const hasTent = v.tent;
  if (hasTent) {
    const im = ART.themes.rum.gate, k = 1.5;
    ctx.drawImage(im, 176, GROUND_Y - (im.height / SCALE) * k, (im.width / SCALE) * k, (im.height / SCALE) * k);
  }
  if (!theatre) {
    for (let x = 0; x < VW; x += TILE) {
      const i = (x / TILE) % 3;
      ctx.drawImage(th.groundTop[i], x, GROUND_Y, TILE, TILE);
      for (let y = GROUND_Y + TILE; y < VH + shift; y += TILE) ctx.drawImage(th.ground[(i + y / TILE) % 3], x, y, TILE, TILE);
    }
  }

  const who = (v.page.speaker || '').toUpperCase();
  const saqerTalks = who.startsWith('SAQER'), danaTalks = who.startsWith('DANA'), hercTalks = who.startsWith('HERC');
  const other = v.cast.includes('dana') || v.cast.includes('hercules');
  const both = v.cast.includes('saqer') && other;
  const sx = hasTent ? 84 : both ? 104 : 160, dx = hasTent ? 150 : both ? 214 : 160;
  if (v.cast.includes('saqer')) {
    const f = SPRITES.saqer.big;
    const bob = saqerTalks && v.talking && Math.floor(G.tick / 8) % 2 ? 1 : 0;
    drawSprite(f.idle[0], sx, GROUND_Y - bob, CUT_K, false);
    if (saqerTalks) speakerArrow(sx + 2, GROUND_Y - 30 * CUT_K - 8);
  }
  if (v.cast.includes('dana')) {
    drawDana(dx, GROUND_Y, 2, danaTalks && v.talking);
    if (danaTalks) speakerArrow(dx - 2, GROUND_Y - 64);
  }
  if (v.cast.includes('hercules')) {
    const f = SPRITES.hercules;
    const fr = hercTalks && v.talking ? f.talk[Math.floor(G.tick / 7) % f.talk.length] : f.idle[Math.floor(G.tick / 24) % 2];
    drawSprite(fr, dx, GROUND_Y, CUT_K, true);
    if (hercTalks) speakerArrow(dx, GROUND_Y - 54 * CUT_K - 8);
  }
  ctx.restore();
}

function speakerArrow(cx, y) {
  const bob = Math.floor(G.tick / 14) % 2;
  for (let i = 0; i < 4; i++) {
    ctx.fillStyle = '#140d1c'; ctx.fillRect(cx - 4 + i, y + bob + i, 9 - i * 2, 2);
  }
  for (let i = 0; i < 3; i++) {
    ctx.fillStyle = '#ffd166'; ctx.fillRect(cx - 3 + i, y + bob + i, 7 - i * 2, 1);
  }
}

/* ---------------- back in time ----------------
   Once the flag is pulled the whole game is seen as an old film:
   a warm sepia wash, dark corners, a faint flicker, and scratches
   and specks that run down the picture. */
let vignette = null;
function drawPast() {
  ctx.fillStyle = 'rgba(126,78,26,0.15)'; ctx.fillRect(0, 0, VW, VH);                 // sepia
  if (!vignette) {
    vignette = ctx.createRadialGradient(VW / 2, VH / 2, VH * 0.42, VW / 2, VH / 2, VW * 0.72);
    vignette.addColorStop(0, 'rgba(40,18,4,0)'); vignette.addColorStop(1, 'rgba(40,18,4,0.55)');
  }
  ctx.fillStyle = vignette; ctx.fillRect(0, 0, VW, VH);
  const t = G.tick;
  if (t % 11 === 0 || t % 37 === 3) { ctx.fillStyle = 'rgba(255,240,210,0.045)'; ctx.fillRect(0, 0, VW, VH); }   // flicker
  const h = n => { const s = Math.sin(n * 127.1) * 43758.5453; return s - Math.floor(s); };
  for (let i = 0; i < 2; i++) {                                                         // scratches
    const life = Math.floor(t / 26) + i * 17;
    if (h(life) > 0.55) continue;
    const x = Math.floor(h(life + 0.5) * VW) + Math.sin(t / 5 + i) * 0.6;
    ctx.fillStyle = 'rgba(255,244,220,0.16)'; ctx.fillRect(x, 0, 0.5, VH);
  }
  for (let i = 0; i < 5; i++) {                                                         // dust specks
    const k = Math.floor(t / 4) * 7 + i;
    if (h(k) > 0.4) continue;
    ctx.fillStyle = 'rgba(30,14,4,0.5)';
    ctx.fillRect(Math.floor(h(k + 0.3) * VW), Math.floor(h(k + 0.7) * VH), 1 + Math.floor(h(k + 0.9) * 2), 1);
  }
}

/* ---------------- the time warp (the flag in Amman) ----------------
   Phase 1: the present wobbles like a rewinding tape, a vortex of gold and violet spins around
   Saqer while streaks of light rush into him, and the year counts back; a flash of white.
   Phase 2: Philadelphia opens up as a widening circle from Saqer, with a shock ring. */
let snap = null;
const hash = n => { const s = Math.sin(n * 127.1) * 43758.5453; return s - Math.floor(s); };
const WARP_COLS = ['#ffd166', '#f2b632', '#7ad0ff', '#c08cff', '#fff3b8'];
function drawWarp(c) {
  const ph = G.goalPhase, t = G.stateTimer;
  const sx = (player.x + player.w / 2 - view.cam - view.ox) * view.z;      // Saqer on screen
  const sy = (player.y + player.h / 2 - view.oy) * view.z;
  const k = ph === 1 ? Math.min(1, Math.max(0, (t - 12) / 78)) : ph === 2 ? Math.max(0, 1 - t / 50) : 0;
  if (k > 0) {
    // 1. the picture wobbles in bands, harder and harder
    const cv = ctx.canvas;
    if (!snap) snap = document.createElement('canvas');
    if (snap.width !== cv.width || snap.height !== cv.height) { snap.width = cv.width; snap.height = cv.height; }
    snap.getContext('2d').drawImage(cv, 0, 0);
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.imageSmoothingEnabled = false;
    const band = 4 * RES, amp = k * k * 16 * RES;
    for (let y = 0; y < cv.height; y += band) {
      const n = Math.floor(y / band);
      const dx = Math.round(Math.sin(n * 0.45 + G.tick * 0.32) * amp + (hash(n + Math.floor(G.tick / 3)) - 0.5) * amp * 0.7);
      ctx.drawImage(snap, 0, y, cv.width, band, dx, y, cv.width, band);
    }
    ctx.restore();
    ctx.fillStyle = 'rgba(52,18,84,' + (0.42 * k).toFixed(3) + ')'; ctx.fillRect(0, 0, VW, VH);
    // 2. a tunnel of rings closing in on him, and five spiral arms spinning around him
    ctx.lineWidth = 2;
    for (let j = 0; j < 6; j++) {
      const rr = 240 - ((G.tick * 2.2 + j * 40) % 240);
      ctx.globalAlpha = k * 0.55 * (rr / 240);
      ctx.strokeStyle = j % 2 ? '#c08cff' : '#7ad0ff';
      ctx.beginPath(); ctx.ellipse(sx, sy, rr, rr * 0.78, 0, 0, Math.PI * 2); ctx.stroke();
    }
    const spin = G.tick * 0.11 * (ph === 1 ? 1 : -1);
    for (const [lw, white] of [[3.5, false], [1.2, true]]) {
      ctx.lineWidth = lw;
      for (let a = 0; a < 5; a++) {
        ctx.globalAlpha = k * (white ? 0.7 : 0.85);
        ctx.strokeStyle = white ? '#fffbe8' : WARP_COLS[a];
        ctx.beginPath();
        for (let i = 0; i <= 44; i++) {
          const r = 3 + i * 4.2 * (0.5 + k * 0.8), ang = spin + a * (Math.PI * 2 / 5) + i * 0.2;
          const x = sx + Math.cos(ang) * r, y = sy + Math.sin(ang) * r * 0.78;
          if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y);
        }
        ctx.stroke();
      }
    }
    // 3. streaks of light rushing in
    ctx.lineWidth = 1;
    for (let i = 0; i < 40; i++) {
      const ang = hash(i) * Math.PI * 2, life = (G.tick * 0.022 * (0.6 + hash(i + 9)) + hash(i + 3)) % 1;
      const d = (1 - life) * 240, len = 5 + 20 * k;
      ctx.globalAlpha = k * life;
      ctx.strokeStyle = i % 3 ? '#fff3b8' : '#7ad0ff';
      ctx.beginPath(); ctx.moveTo(sx + Math.cos(ang) * d, sy + Math.sin(ang) * d);
      ctx.lineTo(sx + Math.cos(ang) * (d + len), sy + Math.sin(ang) * (d + len)); ctx.stroke();
    }
    // a glow on Saqer
    const g = ctx.createRadialGradient(sx, sy, 0, sx, sy, 24 + 46 * k);
    g.addColorStop(0, 'rgba(255,243,184,' + (0.85 * k).toFixed(3) + ')'); g.addColorStop(1, 'rgba(255,243,184,0)');
    ctx.globalAlpha = 1; ctx.fillStyle = g; ctx.fillRect(0, 0, VW, VH);
  }
  // 4. the white light
  if (c.white > 0) {
    ctx.fillStyle = 'rgb(255,250,235)';
    if (ph === 2) {                                   // the new world opens from Saqer outwards
      const R = (1 - c.white) * 280;
      ctx.beginPath(); ctx.rect(0, 0, VW, VH); ctx.arc(sx, sy, R, 0, Math.PI * 2, true); ctx.fill('evenodd');
      ctx.globalAlpha = c.white; ctx.strokeStyle = '#ffd166'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(sx, sy, R, 0, Math.PI * 2); ctx.stroke();
      ctx.globalAlpha = 1;
    } else { ctx.globalAlpha = c.white; ctx.fillRect(0, 0, VW, VH); ctx.globalAlpha = 1; }
  }
}

/* ---------------- the attar debug view (type attar) ----------------
   Every enemy shows its number, every killing spot is marked (P = pit, T = thorns), and every death
   this playthrough shows where it happened (D = death, with what did it). A panel sums it up. */
function drawDebug(cam) {
  for (const h of level.hazards) {
    if (h.kind === 'pit') {
      const x = h.a * TILE - cam, w = (h.b - h.a + 1) * TILE;
      if (x > VW || x + w < 0) continue;
      ctx.fillStyle = 'rgba(255,40,60,0.28)'; ctx.fillRect(x, GROUND_Y, w, VH - GROUND_Y);
      ctx.fillStyle = '#ff2840'; ctx.fillRect(x, GROUND_Y, w, 1);
      text('P' + h.n, x + w / 2, GROUND_Y + 4, '#ff6a7a', 6, 'center');
    } else {
      const x = h.x * TILE - cam;
      if (x > VW || x + TILE < 0) continue;
      ctx.strokeStyle = '#ff9a3c'; ctx.lineWidth = 1; ctx.strokeRect(x + 0.5, h.y * TILE + 0.5, TILE - 1, TILE - 1);
      text('T' + h.n, x + 8, h.y * TILE - 8, '#ffb070', 6, 'center');
    }
  }
  for (const e of W.entities) {
    if (e.type !== 'naughty' || !e.active || !e.num) continue;
    const x = e.x - cam;
    if (x > VW || x + e.w < 0) continue;
    ctx.strokeStyle = '#7dff8a'; ctx.lineWidth = 1; ctx.strokeRect(x + 0.5, e.y + 0.5, e.w - 1, e.h - 1);
    text('#' + e.num, x + e.w / 2, e.y - 9, '#7dff8a', 6, 'center');
  }
  const seen = new Map();                               // deaths at the same spot stack upwards
  for (const d of G.deaths) {
    if (d.area !== G.area) continue;
    const k = Math.round(d.x / 24), up = (seen.get(k) || 0) * 9; seen.set(k, (seen.get(k) || 0) + 1);
    const y = Math.min(d.y, GROUND_Y);
    const x = d.x - cam;
    if (x < -20 || x > VW + 20) continue;
    ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1.5;
    if (!up) { ctx.beginPath(); ctx.moveTo(x - 4, y - 12); ctx.lineTo(x + 4, y - 4); ctx.moveTo(x + 4, y - 12); ctx.lineTo(x - 4, y - 4); ctx.stroke(); }
    text('D' + d.n + ' ' + d.cause, x, y - 22 - up, '#ffffff', 6, 'center');
  }
}
function drawDebugPanel() {
  const here = G.deaths.filter(d => d.area === G.area);
  const foes = W.entities.filter(e => e.type === 'naughty' && e.active && !e.squash && !e.flipped).length;
  const lines = [
    'DEBUG  ' + (G.area || '').toUpperCase() + '  COLUMN ' + Math.floor((player.x + player.w / 2) / TILE),
    'ENEMIES LEFT ' + foes + '   DEATHS HERE ' + here.length + ' / ALL ' + G.deaths.length,
  ].concat(G.deaths.slice(-3).map(d => 'D' + d.n + ' ' + d.area.toUpperCase() + ' COL ' + d.tx + ' ' + d.cause));
  const top = 48;                                      // under the score bar, above the play
  ctx.fillStyle = 'rgba(11,7,16,0.72)'; ctx.fillRect(4, top - 2, 236, lines.length * 9 + 3);
  ctx.font = '6px ' + FONT; ctx.direction = 'ltr';
  lines.forEach((s, i) => { ctx.textAlign = 'left'; ctx.textBaseline = 'top'; ctx.fillStyle = i ? '#ffffff' : '#7dff8a'; ctx.fillText(s, 7, top + i * 9); });
}

/* ---------------- the hall at the end of stage one (quest.js: room) ----------------
   Drawn in code: a stone hall with pilasters and torches. On the floor and the walls,
   the things to use; the one Saqer stands by gets a bouncing ▼. */
function paintRoom(cam) {
  const g = ctx.createLinearGradient(0, 0, 0, GROUND_Y);
  g.addColorStop(0, '#1d1226'); g.addColorStop(1, '#4a2c22');
  ctx.fillStyle = g; ctx.fillRect(0, 0, VW, GROUND_Y + 2);
  // stone courses, moving with the room
  ctx.fillStyle = 'rgba(0,0,0,0.22)';
  for (let row = 0, y = 18; y < GROUND_Y; row++, y += 14) {
    ctx.fillRect(0, y, VW, 1);
    for (let x = -((cam + (row % 2) * 16) % 32); x < VW; x += 32) ctx.fillRect(half(x), y, 1, 14);
  }
  // the ceiling beam
  ctx.fillStyle = '#2a1810'; ctx.fillRect(0, 0, VW, 16);
  ctx.fillStyle = '#5a3a20'; ctx.fillRect(0, 13, VW, 3);
  // pilasters and torches (no flags: the banners that hung here are gone)
  for (let i = 0; i < 6; i++) {
    const x = i * 96 + 40 - cam;
    if (x < -50 || x > VW + 50) continue;
    ctx.fillStyle = '#6b4a34'; ctx.fillRect(half(x - 5), 16, 10, GROUND_Y - 16);
    ctx.fillStyle = '#8a6448'; ctx.fillRect(half(x - 5), 16, 2, GROUND_Y - 16);
    const fr = ART.skyProps.brazier[Math.floor(G.tick / 6 + i) % 3];
    const glow = ctx.createRadialGradient(x, 70, 2, x, 70, 46);
    glow.addColorStop(0, 'rgba(255,190,90,0.35)'); glow.addColorStop(1, 'rgba(255,190,90,0)');
    ctx.fillStyle = glow; ctx.fillRect(x - 46, 24, 92, 92);
    ctx.drawImage(fr, half(x - 8), 58, 16, fr.height * 16 / fr.width);
  }
}

const HALL_LABEL = { portal: 'PLAY AGAIN', book: 'SAVE SCORE', plaque: 'THANK YOU', door2: 'STAGE 2' };
function drawThings(cam) {
  const near = hallThing();
  for (const t of level.def.things) {
    const w = (t.w || 1) * TILE, x = t.x * TILE - cam, cx = x + w / 2;
    if (x > VW + 40 || x + w < -40) continue;
    const pulse = 0.5 + 0.5 * Math.sin(G.tick / 14 + t.x);
    if (t.kind === 'portal') {                       // a ring of time, spinning: play stage one again
      const cy = GROUND_Y - 26;
      ctx.fillStyle = 'rgba(52,18,84,0.85)'; ctx.beginPath(); ctx.ellipse(cx, cy, 15, 24, 0, 0, Math.PI * 2); ctx.fill();
      for (let a = 0; a < 5; a++) {
        ctx.strokeStyle = WARP_COLS[a]; ctx.lineWidth = 2; ctx.beginPath();
        for (let i = 0; i <= 18; i++) {
          const r = 2 + i * 0.75, an = G.tick * 0.08 + a * 1.256 + i * 0.32;
          const px = cx + Math.cos(an) * r, py = cy + Math.sin(an) * r * 1.6;
          if (i) ctx.lineTo(px, py); else ctx.moveTo(px, py);
        }
        ctx.stroke();
      }
      ctx.strokeStyle = '#ffd166'; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(cx, cy, 15, 24, 0, 0, Math.PI * 2); ctx.stroke();
    } else if (t.kind === 'book') {                  // a lectern with the book of names
      ctx.fillStyle = '#4a2a14'; ctx.fillRect(half(cx - 2), GROUND_Y - 22, 4, 22);
      ctx.fillRect(half(cx - 7), GROUND_Y - 2, 14, 2);
      ctx.fillStyle = '#6b3d1c'; ctx.beginPath(); ctx.moveTo(cx - 10, GROUND_Y - 22); ctx.lineTo(cx + 10, GROUND_Y - 22); ctx.lineTo(cx + 8, GROUND_Y - 28); ctx.lineTo(cx - 8, GROUND_Y - 28); ctx.fill();
      ctx.fillStyle = '#f6eedc'; ctx.fillRect(half(cx - 8), GROUND_Y - 31, 7.5, 4); ctx.fillRect(half(cx + 0.5), GROUND_Y - 31, 7.5, 4);
      ctx.fillStyle = '#b8a07a'; ctx.fillRect(half(cx - 6), GROUND_Y - 30, 4, 0.75); ctx.fillRect(half(cx + 2), GROUND_Y - 30, 4, 0.75);
      ctx.fillStyle = 'rgba(255,224,138,' + (0.25 + 0.3 * pulse).toFixed(2) + ')'; ctx.fillRect(half(cx - 10), GROUND_Y - 36, 20, 4);
    } else if (t.kind === 'board') {                 // the top 10, on the wall
      const y = 52, h = 112;                         // below the score bar
      ctx.fillStyle = '#c99a3a'; ctx.fillRect(half(x - 3), y - 3, w + 6, h + 6);
      ctx.fillStyle = '#1e2a22'; ctx.fillRect(half(x), y, w, h);
      text('TOP 10', cx, y + 4, '#ffd166', 8, 'center');
      const list = topCached().slice(0, 10);
      if (!list.length) text('BE THE FIRST!', cx, y + 56, '#ffffff', 6, 'center');
      list.forEach((r, i) => {
        const ly = y + 19 + i * 9;
        text(String(i + 1), x + 6, ly, '#cbb7e8', 6);
        text(String(r.name).slice(0, 12), x + 18, ly, '#ffffff', 6);
        text(String(r.score).padStart(6, '0'), x + w - 6, ly, '#ffd166', 6, 'right');
      });
    } else if (t.kind === 'plaque') {                // thanks for playing, and what is coming
      const y = 92;
      ctx.fillStyle = '#7a4a1e'; ctx.fillRect(half(cx - 16), y, 32, 40);
      ctx.fillStyle = '#c98a3a'; ctx.fillRect(half(cx - 14), y + 2, 28, 36);
      ctx.fillStyle = '#ce1126';                       // a heart
      ctx.fillRect(half(cx - 6), y + 10, 5, 5); ctx.fillRect(half(cx + 1), y + 10, 5, 5); ctx.fillRect(half(cx - 6), y + 13, 12, 5);
      ctx.fillRect(half(cx - 4), y + 18, 8, 3); ctx.fillRect(half(cx - 2), y + 21, 4, 2);
      ctx.fillStyle = '#7a4a1e'; for (let i = 0; i < 3; i++) ctx.fillRect(half(cx - 9), y + 27 + i * 3, 18, 1);
    } else {                                         // the doors to the next stages
      const n = +t.kind.slice(4), open = n === 2, dw = 26, dh = 46, dx = cx - dw / 2, dy = GROUND_Y - dh;
      ctx.fillStyle = open ? '#c99a3a' : '#5a5048'; ctx.beginPath();
      ctx.moveTo(dx - 3, GROUND_Y); ctx.lineTo(dx - 3, dy + 10); ctx.arc(cx, dy + 10, dw / 2 + 3, Math.PI, 0); ctx.lineTo(dx + dw + 3, GROUND_Y); ctx.fill();
      ctx.fillStyle = open ? '#6b3d1c' : '#3a2a20'; ctx.beginPath();
      ctx.moveTo(dx, GROUND_Y); ctx.lineTo(dx, dy + 10); ctx.arc(cx, dy + 10, dw / 2, Math.PI, 0); ctx.lineTo(dx + dw, GROUND_Y); ctx.fill();
      ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fillRect(half(cx - 0.5), dy + 2, 1, dh - 2);
      if (open) {                                    // stage 2: a gold door with its opening date
        ctx.fillStyle = '#ffd166'; ctx.fillRect(half(cx + 4), dy + 26, 2, 2);
        ctx.fillStyle = '#140d1c'; ctx.fillRect(half(cx - 16), dy - 16, 32, 12);
        text('21.11', cx, dy - 14, '#ffd166', 6, 'center');
      } else {                                       // stages 3 to 5: boarded up
        ctx.fillStyle = '#8a6448';
        ctx.save(); ctx.translate(cx, dy + 26); ctx.rotate(0.5); ctx.fillRect(-16, -2, 32, 4); ctx.rotate(-1); ctx.fillRect(-16, -2, 32, 4); ctx.restore();
        text('SOON', cx, dy - 14, '#cbb7e8', 6, 'center');
      }
      text(String(n), cx, dy + 4, open ? '#ffd166' : '#a89a8a', 8, 'center');
    }
    if (HALL_LABEL[t.kind]) {
      const ly = t.kind === 'plaque' ? 80 : t.kind === 'door2' ? GROUND_Y - 76 : GROUND_Y - 62;
      text(HALL_LABEL[t.kind], cx, ly, '#ffffff', 6, 'center');
    }
    if (near === t) {                                // press ▼ here
      const by = (t.kind === 'board' ? 172 : t.kind === 'plaque' ? 136 : GROUND_Y - 54) + Math.sin(G.tick / 6) * 2;
      ctx.fillStyle = '#ffd166'; ctx.beginPath(); ctx.moveTo(cx - 5, by); ctx.lineTo(cx + 5, by); ctx.lineTo(cx, by + 6); ctx.fill();
    }
  }
}

/* the year rolling back while the world whites out */
function drawYear() {
  const c = G.cut;
  if (!c || G.state !== 'goal') return;
  const now = new Date().getFullYear(), then = 150;
  let year = 0, a = 0;
  if (G.goalPhase === 1 && G.stateTimer > 30) { const k = Math.min(1, (G.stateTimer - 30) / 70); year = Math.round(now - (now - then) * k * k); a = Math.min(1, (G.stateTimer - 30) / 15); }
  else if (G.goalPhase === 2 && G.stateTimer < 50) { year = then; a = 1 - G.stateTimer / 50; }
  if (a <= 0) return;
  ctx.globalAlpha = a;
  if (isAr()) text(year + ' م', VW / 2, 100, '#ffe08a', 22, 'center');          // the year in the Arabic font, with its م
  else {
    ctx.font = '24px ' + FONT; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    ctx.fillStyle = '#140d1c'; ctx.fillText('AD ' + year, VW / 2 + 1.5, 101.5);
    ctx.fillStyle = '#ffe08a'; ctx.fillText('AD ' + year, VW / 2, 100);
  }
  // rewinding clock hands
  const cx = VW / 2, cy = 76, ang = -G.stateTimer * 0.35;
  ctx.strokeStyle = '#ffe08a'; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.arc(cx, cy, 12, 0, 7); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(ang) * 9, cy + Math.sin(ang) * 9); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(ang / 12) * 6, cy + Math.sin(ang / 12) * 6); ctx.stroke();
  ctx.globalAlpha = 1;
}


/* The giant standing pillars that close each end of the street: taller than the screen, so there is no way over. */
function drawGiants(cam) {
  const im = IMG.pillarGiant;
  if (!im) return;
  const w = im.width / RES, h = im.height / RES;
  ctx.imageSmoothingEnabled = false;
  for (const gx of level.giants) {
    const x = snapArt(gx - w / 2 - cam);
    if (x > VW || x + w < 0) continue;
    ctx.drawImage(im, x, GROUND_Y + 2 - h, w, h);
  }
}

/* The Temple of Hercules, standing on its island in the sky (painted in scenery.js) */
function drawTempleFront(cam) {
  const im = IMG.templeFront, w = im.width / RES, h = im.height / RES;
  const x = snapArt(level.def.templeCol * TILE - cam);
  if (x > VW || x + w < 0) return;
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(im, x, GROUND_Y - h, w, h);
}

/* a chained lift: two chains pinned to the ground and a padlock, until the bronze key frees it */
function drawChains(p, cam) {
  const px = p.x - cam, y = p.y + 4;
  for (const [x0, x1] of [[px + 3, px - 6], [px + p.w - 3, px + p.w + 6]]) {
    const n = 8;
    for (let i = 0; i <= n; i++) {
      const x = x0 + (x1 - x0) * (i / n), yy = y + (GROUND_Y - y) * (i / n) + Math.sin((i / n) * Math.PI) * 2;
      ctx.fillStyle = '#2b2018'; ctx.fillRect(half(x - 1.25), half(yy - 1), 2.5, 2);
      ctx.fillStyle = i % 2 ? '#8d7a60' : '#b7a27f'; ctx.fillRect(half(x - 0.75), half(yy - 0.5), 1.5, 1);
    }
    ctx.fillStyle = '#4a3a2a'; ctx.fillRect(half(x1 - 2), GROUND_Y - 2, 4, 2);          // the peg in the ground
  }
  const lx = half(px + p.w / 2 - 4), ly = half(p.y + 6 + Math.sin(G.tick / 20) * 0.5);   // the padlock
  ctx.fillStyle = '#2b2018'; ctx.fillRect(lx + 1, ly - 4, 6, 5); ctx.fillStyle = '#c4c0b6'; ctx.fillRect(lx + 2, ly - 3, 4, 3);
  ctx.fillStyle = '#2b2018'; ctx.fillRect(lx + 3, ly - 2, 2, 2);
  ctx.fillStyle = '#2b2018'; ctx.fillRect(lx, ly, 8, 7);
  ctx.fillStyle = '#d9982b'; ctx.fillRect(lx + 1, ly + 1, 6, 5);
  ctx.fillStyle = '#ffd56a'; ctx.fillRect(lx + 1, ly + 1, 6, 1);
  ctx.fillStyle = '#3d2406'; ctx.fillRect(lx + 3.5, ly + 2.5, 1, 2);
}

/* sky level: braziers and urns standing on the islands (level.def.decor: [kind, column]) */
function drawDecor(cam) {
  const P = ART.skyProps;
  for (const [kind, col] of level.def.decor) {
    const im = kind === 'brazier' ? P.brazier[Math.floor(G.tick / 6 + col) % 3] : P.urn;
    const w = im.width * AP, h = im.height * AP, x = snapArt(col * TILE + 8 - w / 2 - cam);
    if (x > VW || x + w < 0) continue;
    ctx.drawImage(im, x, GROUND_Y - h, w, h);
  }
}
/* sky level: cloud hanging under each island and wrapped round its ends, so the islands float */
function drawIslandClouds(cam) {
  const P = ART.skyProps.puffs, isG = tx => tx >= 0 && tx < level.w && level.tiles[GROUND_TOP][tx] === T.GROUND;
  const x0 = Math.max(0, Math.floor(cam / TILE) - 2), x1 = Math.min(level.w - 1, Math.floor((cam + VW) / TILE) + 2);
  for (let tx = x0; tx <= x1; tx++) {
    if (!isG(tx)) continue;
    const bob = Math.sin(G.tick / 40 + tx) * 0.5;
    const im = P[tx % P.length], w = im.width * AP, h = im.height * AP;
    if (tx % 2 === 0) ctx.drawImage(im, snapArt(tx * TILE + 8 - w / 2 - cam), snapArt(GROUND_Y + 4 + bob), w, h);
    if (!isG(tx - 1)) { const e = P[3]; ctx.drawImage(e, snapArt(tx * TILE - e.width * AP * 0.55 - cam), snapArt(GROUND_Y - 4 + bob), e.width * AP, e.height * AP); }
    if (!isG(tx + 1)) { const e = P[2]; ctx.drawImage(e, snapArt((tx + 1) * TILE - e.width * AP * 0.45 - cam), snapArt(GROUND_Y - 4 + bob), e.width * AP, e.height * AP); }
  }
}

/* the theatre crowd, from the owner's videos: clapping, or on its feet cheering */
function crowdFrame(cheering) {
  const a = cheering ? IMG.crowdCheer : IMG.crowdClap;
  return a[Math.floor(G.tick / (cheering ? 4 : 5)) % a.length];
}
