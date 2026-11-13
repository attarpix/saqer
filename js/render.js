/* ============================================================
   RENDERING
   The context is scaled ×2 so everything below is in world units;
   32-px art drawn into 16-unit boxes lands 1:1 on canvas pixels.
   ============================================================ */
import { TILE, SCALE, RES, VW, VH, GROUND_TOP, LH, MAHR_GOAL, MAX_HP, BOSS_HP } from './config.js';
import { clockSeconds, PILLAR_X, PILLAR_REST } from './game.js';
import { bossOpen } from './boss.js';
import { GATE_COL } from './quest.js';
import { T } from './tiles.js';
import { level, key } from './level.js';
import { G, W, player } from './state.js';
import { IMG, SPRITES } from './assets.js';
import { ART } from './art.js';
import { MORPH_FRAMES } from './player.js';
import { storyView } from './ui.js';

let ctx;
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
  const shook = G.shake > 0 && !G.mapShot;
  if (shook) { ctx.save(); ctx.translate(half((Math.random() - 0.5) * Math.min(4, G.shake * 0.4)), half((Math.random() - 0.5) * Math.min(4, G.shake * 0.4))); }
  drawBackdrop(cam);
  if (level.gateX >= 0) drawGate(cam);
  if (level.def.templeCol) drawTempleFront(cam);
  if (level.def.decor) drawDecor(cam);
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
  if (shook) ctx.restore();
  if (G.era === 'past' && !G.mapShot) drawPast();
  if (G.mapShot) return;                 // tools/map.html: the stage only, no HUD
  drawOverlays();
  drawHUD();
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
  if (kind === 'amman') paintPhoto(IMG.amman, cam, level.w * TILE, false, '#2b1a4a');
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
  ctx.imageSmoothingEnabled = true;
  if (!tile) {
    const f = Math.min(0.25, (w - VW) / Math.max(1, levelPx - VW));
    ctx.drawImage(img, -half(cam * f), 0, w, h);
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
  ctx.drawImage(img, -cam, -PODIUM - 4, 28 * TILE, VH + 1);
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
  const fy = (G.state === 'goal') ? G.flagY : botY - TILE - 14;
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
  const w = im.width / SCALE, h = im.height / SCALE;
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

/* ---------------- Hercules ---------------- */
function drawBoss(b, cam) {
  const f = SPRITES.hercules, t = b.t;
  let fr;
  switch (b.state) {
    case 'walk':    fr = f.walk[Math.floor(b.anim / 9) % 4]; break;
    case 'windup':  fr = f.windup[Math.min(2, Math.floor(t / 11))]; break;
    case 'smash':   fr = f.smash[t < 6 ? 0 : 1]; break;
    case 'roarUp':  fr = f.roarUp[Math.floor(t / 9) % 2]; break;
    case 'roar':    fr = f.roar[Math.floor(t / 6) % 4]; break;
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
      const im = ART.roar[Math.floor(s.t / 5) % 2];
      ctx.save();
      ctx.translate(half(s.x + s.w / 2 - cam), half(s.y + s.h / 2));
      if (s.vx < 0) ctx.scale(-1, 1);
      ctx.drawImage(im, -30, -21, 48, 42);
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
  text('GOLDEN JAMEED', px - 30, py - 26, '#ffd166', 6);
  text('GROWN FOR GOOD', px - 34, py - 17, '#ffffff', 6);
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
function text(s, x, y, col = '#fff', size = 8, align = 'left') {
  ctx.font = `${size}px ${FONT}`;
  ctx.textAlign = align; ctx.textBaseline = 'top';
  ctx.fillStyle = '#140d1c'; ctx.fillText(s, x + 1, y + 1);
  ctx.fillStyle = col; ctx.fillText(s, x, y);
}
function centerText(s, y, col, size) { text(s, VW / 2, y, col, size, 'center'); }
const pad = (n, l) => String(Math.max(0, Math.floor(n))).padStart(l, '0');

function drawPopups(cam) {
  for (const p of W.popups) {
    const col = p.gold ? '#ffd166' : p.text === '1UP' ? '#7dff8a' : '#fff';
    text(p.text, half(p.x - cam), half(p.y - Math.max(0, p.t) * 0.6), col, 6);
  }
}

function drawHUD() {
  text('SAQER', 10, 8);
  if (G.god) text('ATTAR10X', 10, 46, '#7dff8a', 6);
  text(pad(G.score, 6), 10, 19);
  text('MAHR', 68, 8, '#ffd166');
  ctx.drawImage(ART.coin[Math.floor(G.tick / 10) % 4], 67, 18.5, 8, 8);
  text(String(G.mahr), 77, 19);
  text('STAGE', 128, 8);
  const id = level.def ? (level.def.id || '') : '';
  text(id, 128, 19, '#fff', id.length > 8 ? 6 : 8);
  text('LIVES', 214, 8);
  text('x' + G.lives, 222, 19);
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
    const seg = w / BOSS_HP;
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
  if (c && c.white > 0) { ctx.fillStyle = 'rgba(255,250,235,' + c.white.toFixed(2) + ')'; ctx.fillRect(0, 0, VW, VH); }
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
    const h = 12 + bn.lines.length * 11;
    ctx.globalAlpha = a;
    ctx.fillStyle = 'rgba(20,13,28,0.78)'; ctx.fillRect(0, 50, VW, h);
    ctx.fillStyle = '#ffd166'; ctx.fillRect(0, 50, VW, 1); ctx.fillRect(0, 50 + h - 1, VW, 1);
    bn.lines.forEach((s, i) => centerText(s, 57 + i * 11, i === 0 ? '#ffd166' : '#ffffff', i === 0 ? 8 : 6));
    ctx.globalAlpha = 1;
  }
}

function drawVictory() {
  if (G.stateTimer < 40) return;
  ctx.fillStyle = 'rgba(20,13,28,0.72)';
  ctx.fillRect(40, 56, 240, 96);
  centerText('HERCULES YIELDS!', 66, '#ffd166', 12);
  const s = clockSeconds();
  centerText('TIME  ' + Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0') + '   BONUS ' + (G.bonus || 0), 90, '#ffffff', 6);
  centerText('DINARS  ' + G.mahr + '    GOLD LIRAS  ' + G.liras, 104, '#efe0bf', 6);
  centerText('SCORE  ' + pad(G.score, 6), 120, '#7dff8a', 8);
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
  const def = level.def;
  centerText('STAGE ' + def.id, 62, '#ffd166', 8);
  centerText(def.name, 80, '#ffffff', 8);
  ctx.font = '16px "Reem Kufi Fun", "Noto Kufi Arabic", sans-serif';
  ctx.textAlign = 'center'; ctx.textBaseline = 'top'; ctx.direction = 'rtl';
  ctx.fillStyle = '#efe0bf'; ctx.fillText(def.nameAr || '', VW / 2, 94);
  ctx.direction = 'ltr';
  drawSprite(SPRITES.saqer.small.idle[0], VW / 2 - 18, 158, 1, false);
  text('x  ' + G.lives, VW / 2 - 4, 143, '#ffffff', 8);
  if (level.liraTotal) {
    ctx.drawImage(ART.lira[0], VW / 2 - 82, 176, 12, 12);
    text(level.liraTotal + ' GOLD LIRAS HIDDEN HERE', VW / 2 - 66, 179, '#cbb7e8', 6);
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
  const name = ART.themes[v.bg] ? v.bg : 'amman';
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
  ctx.font = '24px ' + FONT; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
  ctx.fillStyle = 'rgba(255,250,235,0.9)'; ctx.fillText('AD ' + year, VW / 2 + 1, 101);
  ctx.fillStyle = '#3a1a06'; ctx.fillText('AD ' + year, VW / 2, 100);
  // rewinding clock hands
  const cx = VW / 2, cy = 76, ang = -G.stateTimer * 0.35;
  ctx.strokeStyle = '#3a1a06'; ctx.lineWidth = 1.5;
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
