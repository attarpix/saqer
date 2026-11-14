/* ============================================================
   GAME — state machine, camera, the quest's flow

   amman (today) → pull the flag → phila (the past) ⇄ under → theater
   The areas are defined in quest.js. Each one remembers its state,
   so Saqer can go up and down between them freely.

   (Dana's scenes and the four mahr stages are hidden for now; their
   text and layouts are still in story.js and levels.js.)
   ============================================================ */
import { TILE, VW, VH, GROUND_TOP, MAHR_GOAL, MAX_HP, D, setMode } from './config.js';
import { G, W, player, clearWorld } from './state.js';
import { level, buildLevel, linkAt } from './level.js';
import { T } from './tiles.js';
import { AREAS, START_AREA, PAST_AREA, FLAG_COL, GATE_COL } from './quest.js';
import { STORY } from './story.js';
import { takeAction, pollGamepad } from './input.js';
import { sfx, music, crowd, setMuted, unlockAudio } from './audio.js';
import { updatePlayer, placePlayer, killPlayer, makeBig } from './player.js';
import { updateEntities, updateEffects, spawnLevelEntities, addScore, say, heal, applyGone, refillBoxes } from './world.js';
import { spawnBoss, updateBoss } from './boss.js';
import { loadSave, writeSave } from './storage.js';
import { clamp } from './physics.js';
import { tSound, tBest, tScore, t as tLine } from './lang.js';
import { fetchTop, submitScore, topCached, playerName } from './board.js';
const DEBUG_RUN = /[?&]debug/.test(location.search);   // test runs never go on the top 10
import { stat } from './stats.js';
import { showScreen, hideScreens, uiOpen, uiScreen, uiConfirm, uiMove, showStory, setText, setHidden } from './ui.js';

export const TOTALS = { liras: 0, dinars: 0, stages: [] };
const AREA_ORDER = ['amman', 'phila', 'under', 'temple', 'theater'];

/* what each area looked like when Saqer last left it */
let memory = new Map();
const boxesOf = new Map();                   // area → its boxes as built
const BOX_TILES = new Set([T.Q_COIN, T.Q_JAMEED, T.BRICK_MANSAF, T.BRICK_COINS, T.HIDDEN_COIN]);

/* ---------------- flow ---------------- */
export function boot() {
  const save = loadSave();
  G.hiScore = save.hi || 0;
  G.muted = !!save.muted;
  setMode(save.mode === 'easy' ? 'easy' : 'hard');   // (an old save may still say 'normal')
  setMuted(G.muted);
  for (const id of AREA_ORDER) {
    buildLevel(AREAS[id]);
    TOTALS.liras += level.liraTotal; TOTALS.dinars += level.dinarTotal;
  }
  toTitle();
}

export function toTitle() {
  music.stop();
  level.def = null;
  G.state = 'title'; G.boss = null; G.cut = null; G.banner = null;
  setText('#hi-score', tBest(String(G.hiScore).padStart(6, '0')));
  refreshSoundLabel();
  showScreen('title');
}

function resetRun() {
  G.score = 0; G.coins = 0; G.lives = D.lives;
  G.mahr = 0; G.mahrStart = 0; G.liras = 0; G.lirasStart = 0;
  G.golden = false; G.hp = MAX_HP; G.keys = {}; G.gone = new Map(); player.star = 0; G.hinted = false; G.hasMap = false;
  G.clockStop = false; G.saved = false; G.usedGod = false; G.hallSeen = false; G.savedAs = '';
  G.clock = 0; G.banner = null; G.cut = null; G.boss = null; G.cheer = 0; G.shake = 0;
  memory = new Map();
}

export function newGame(mode, sunset = false) {
  if (mode) { setMode(mode); writeSave({ mode }); }        // easy (shown as normal) / hard (config.js MODES)
  unlockAudio();
  resetRun();
  G.sunset = sunset;                      // Amman by day on a first game; at sunset when replayed from the hall
  G.era = 'now';
  hideScreens();
  enterArea(START_AREA, null, 'ground', true);
}

/* after GAME OVER: start again from the last big step (today's Amman, or the arrival in Philadelphia).
   The score starts again. */
export function continueGame() {
  unlockAudio();
  if (!level.def) { newGame(); return; }
  const past = G.era === 'past';
  resetRun();
  hideScreens();
  if (past) { enterArea(PAST_AREA, FLAG_COL + 1, 'ground', true); }
  else { G.era = 'now'; enterArea(START_AREA, null, 'ground', true); }
}

function playStory(pages, done) {
  if (!pages || !pages.length) { done(); return; }
  G.state = 'story';
  music.stop();
  const vars = { goal: MAHR_GOAL, mahr: G.mahr, short: Math.max(0, MAHR_GOAL - G.mahr), gold: G.liras, goldAll: TOTALS.liras };
  showStory(pages, done, vars, { allGold: false, someGold: G.liras > 0 });
}

/* ---------------- moving between areas ---------------- */
function remember() {
  if (G.area && level.def) memory.set(G.area, { tiles: level.tiles, multi: level.multi, entities: W.entities });
}

/* mode: 'ground' = standing at column tx, 'fall' = dropping in from above at column tx */
function enterArea(id, tx, mode = 'ground', card = false, fresh = false) {   // fresh: after a death, he comes in small
  remember();
  const def = AREAS[id];
  const wasBig = !fresh && player.big && level.def;
  buildLevel(def);
  clearWorld();
  const boxes = [];                              // every box as built (coins, jameed, mansaf), refilled after a death
  for (let y = 0; y < level.tiles.length; y++) for (let x = 0; x < level.w; x++) {
    const t = level.tiles[y][x];
    if (BOX_TILES.has(t)) boxes.push([x, y, t, level.multi.get(x + ',' + y)]);
  }
  boxesOf.set(id, boxes);
  const old = memory.get(id);
  if (old) { level.tiles = old.tiles; level.multi = old.multi; W.entities = old.entities; }
  else { spawnLevelEntities(); applyGone(id); }
  G.area = id;
  if (tx === null || tx === undefined) tx = level.startX;
  G.entry = { area: id, tx, mode };
  const star = fresh ? 0 : player.star;       // the mansaf's power carries into the next area (not past a death)
  placeAtEntry(wasBig);
  player.star = star;
  G.boss = null;
  hideScreens();
  if (card) { G.state = 'intro'; G.stateTimer = 0; music.stop(); return; }
  if (def.boss) { beginBoss(); return; }
  G.state = 'play';
  G.fade = 16;
  music.start(false, def.tune);
}

function placeAtEntry(big) {
  const e = G.entry;
  placePlayer(e.tx, GROUND_TOP);
  if (big || G.golden) makeBig();
  if (e.mode === 'fall') { player.y = -player.h - 2; player.vy = 1.5; }
  player.invuln = 50;
  snapCamera();
}

function beginBoss() {
  G.golden = true;                       // the fight always uses the hit bar
  makeBig(); heal();
  spawnBoss();
  G.boss.state = 'wait';
  G.state = 'play';
  const start = () => {
    G.state = 'play'; G.boss.state = 'intro'; G.boss.t = 0; G.cheer = 150;
    crowd.roar();
    music.start(true, 'south');
    say(['HERCULES!', 'STOMP HIM WHILE HE CATCHES HIS BREATH.'], 240);
  };
  playStory(STORY.beforeBoss, start);
}

/* a life is lost: back to where he came into this area */
function respawn(loseLife) {
  if (loseLife && G.golden) {            // lives only count once he has the golden jameed: that is where the real game starts
    G.lives--;
    if (G.lives <= 0) { gameOver(); return; }
  }
  W.particles = []; W.coinFx = []; W.popups = [];
  heal();
  // every jameed and mansaf box is full again, here and in the areas left behind (coins stay taken)
  refillBoxes(boxesOf.get(G.area) || []);
  for (const [id, mem] of memory) {
    for (const [x, y, t, n] of boxesOf.get(id) || []) { mem.tiles[y][x] = t; if (n) mem.multi.set(x + ',' + y, n); }
    mem.entities = mem.entities.filter(e => !(e.type === 'item' && (e.kind === 'jameed' || e.kind === 'mansaf')));
  }
  if (!level.def.roam) {                  // today's Amman is a one-way stage: it starts over
    memory.delete(G.area);
    const id = G.area; G.area = '';
    enterArea(id, null, 'ground', true, true);
    return;
  }
  placeAtEntry(false);                    // after a death he is small again (only the golden jameed keeps him big)
  G.state = 'play';
  G.fade = 16;
  if (level.def.boss) { spawnBoss(); G.cheer = 0; music.start(true, 'south'); }
  else music.start(false, level.def.tune);
}

function gameOver() {
  saveHi();
  G.state = 'gameover';
  music.stop();
  setText('#over-score', tScore(String(G.score).padStart(6, '0')));
  setText('#over-hi', tBest(String(G.hiScore).padStart(6, '0')));
  setText('#over-saved', '');
  showScreen('over');
  // the score goes on the top 10 here too (or when he reaches the hall, whichever comes first)
  autoSave().then(() => { if (G.savedAs) setText('#over-saved', tLine('SAVED AS') + ' ' + G.savedAs); });
}

function saveHi() {
  if (G.score > G.hiScore) { G.hiScore = G.score; writeSave({ hi: G.hiScore }); }
}

/* ?debug only: jump straight to an area (0 amman, 1 phila, 2 under, 3 theater, or its name) */
export function debugStage(i, tx) {
  const id = typeof i === 'string' ? i : AREA_ORDER[clamp(i, 0, AREA_ORDER.length - 1)];
  if (!G.lives) G.lives = D.lives;
  G.era = id === 'amman' ? 'now' : 'past';
  if (id !== 'amman') { G.golden = true; heal(); }
  music.stop();
  hideScreens();
  memory.delete(id); G.area = '';
  enterArea(id, tx, 'ground', false);
}

/* ---------------- pause / settings ---------------- */
export function pause() {
  if (G.state !== 'play' && G.state !== 'goal' && G.state !== 'intro') return;
  G.prevState = G.state;
  G.state = 'paused';
  music.stop();
  sfx.pause();
  refreshSoundLabel();
  setHidden('[data-act="map"]', !G.hasMap);       // the map, once he has found it
  showScreen('pause');
}
export function resume() {
  if (G.state !== 'paused') return;
  hideScreens();
  G.state = G.prevState || 'play';
  player.jumpHeld = true;                 // the key that closed the menu shouldn't also jump
  if (G.state === 'play') music.start(!!G.boss, level.def.tune);
}
export function restartStage() {
  hideScreens();
  music.stop();
  respawn(false);
}
export function toggleSound() {
  unlockAudio();
  G.muted = !G.muted;
  setMuted(G.muted);
  writeSave({ muted: G.muted });
  refreshSoundLabel();
}
function refreshSoundLabel() {
  document.querySelectorAll('[data-act="sound"]').forEach(b => { b.textContent = tSound(G.muted); });
}

/* ---------------- per-frame update ---------------- */
export function update() {
  pollGamepad();
  G.tick++;
  if (G.fade > 0) G.fade--;
  if (G.shake > 0) G.shake--;
  if (G.cheer > 0) G.cheer--;
  if (G.mapRequest) { G.mapRequest = false; openMap('box'); return; }
  if (G.banner) {                         // a note goes when its time is up, or at the next press of anything
    if (G.banner.at === undefined) { G.banner.at = G.presses; G.banner.age = 0; }
    G.banner.age++;
    if (--G.banner.t <= 0 || (G.presses > G.banner.at && G.banner.age > 12)) G.banner = null;
  }

  if (takeAction('mute')) toggleSound();
  if (takeAction('blur') && (G.state === 'play' || G.state === 'goal')) pause();

  if (uiOpen()) {
    if (takeAction('pause') && uiScreen() === 'pause') { resume(); return; }
    if (takeAction('confirm')) uiConfirm();
    if (takeAction('up')) uiMove(-1);
    if (takeAction('down')) uiMove(1);
    takeAction('restart');
    return;
  }
  const confirm = takeAction('confirm'); takeAction('up');
  G.downPress = takeAction('down');       // (the hall uses it: ▼ by a thing)
  if (takeAction('pause')) { pause(); return; }
  if (takeAction('restart') && (G.state === 'play' || G.state === 'dying')) { restartStage(); return; }

  switch (G.state) {
    case 'intro':
      if (++G.stateTimer > 130) { G.state = 'play'; music.start(false, level.def.tune); }
      break;
    case 'play': updatePlay(); break;
    case 'dying': updateDying(); break;
    case 'goal': updateGoal(); break;
    case 'victory':
      G.stateTimer++;
      G.cheer = 30;
      updateEffects();
      if (G.stateTimer > 600 || (confirm && G.stateTimer > 120)) {
        G.state = 'cleared';
        playStory(STORY.afterBoss, toFinale);
      }
      break;
    default: break;
  }
}

function updatePlay() {
  updatePlayer();
  updateEntities();
  if (G.boss && G.boss.state !== 'wait') updateBoss();
  updateCamera();
  updateEffects();
  if (!G.clockStop) G.clock++;          // the clock stops once Hercules is down

  if (G.state !== 'play') return;
  if (G.boss && G.boss.done) { victory(); return; }
  if (level.def.doorTo && atDoor()) { enterHall(); return; }
  if (level.def.things) useThings();

  // ways into other areas
  if (player.y + player.h < 5) {
    const up = linkAt('up', player);
    if (up) { sfx.item(); enterArea(up.to, up.tx, 'ground'); return; }
  }
  if (player.y > VH + 16) {
    const dn = linkAt('down', player);
    if (dn) {
      enterArea(dn.to, dn.tx, 'fall');
      if (dn.hint && !G.keys.temple && !G.hinted) { G.hinted = true; say(dn.hint, 400); }
      return;
    }
  }

  if (level.flagX >= 0 && !level.def.flagUp && player.x + player.w >= level.flagX * TILE) startGoal();   // (after Hercules the flag is only to look at)
}

function snapCamera() {
  const max = Math.max(0, level.w * TILE - VW);
  G.camX = clamp(player.x + player.w / 2 - VW * (level.def.roam ? 0.5 : 0.42), 0, max);
}
function updateCamera() {
  const max = Math.max(0, level.w * TILE - VW);
  if (level.def.roam) {                   // he can walk both ways: the view follows, looking a little ahead
    const target = player.x + player.w / 2 - VW / 2 + player.facing * 26;
    G.camX += (target - G.camX) * 0.085;
  } else {
    const target = player.x + player.w / 2 - VW * 0.42;
    if (target > G.camX) G.camX = target;
  }
  G.camX = clamp(G.camX, 0, max);
}

function updateDying() {
  G.stateTimer++;
  if (player.deathKind === 'pit') { player.vy = Math.min(player.vy + 0.45, 9); player.y += player.vy; }
  updateEntities();
  if (G.boss && G.boss.state !== 'wait') { G.boss.shots = []; }
  updateEffects();
  if (G.stateTimer > 150) respawn(true);
}

/* ---------------- victory ---------------- */
export const clockSeconds = () => Math.floor(G.clock / 60);
export const timeBonus = () => Math.max(0, 900 - clockSeconds()) * 20;     // quicker than 15 minutes earns a bonus

function victory() {
  G.state = 'victory'; G.stateTimer = 0; stat('hercules'); G.clockStop = true;
  music.stop();
  sfx.goal(); sfx.cheer();
  G.bonus = timeBonus();
  G.score += G.bonus;
  saveHi();
}

/* ---------------- the flag: back in time ----------------
   0  Saqer slides down the pole, the flag goes up
   1  the world whites out …
   2  … and comes back as Philadelphia
   3  the great pillar beside the gate topples onto it
   4  the lift appears; he is free to go                      */
const POLE_TOP = 3 * TILE;
export const PILLAR_X = (GATE_COL + 8) * TILE;          // where the pillar stands (its base)
export const PILLAR_REST = 78;                          // degrees from upright when it lies on the wreck

function startGoal() {
  G.state = 'goal'; G.goalPhase = 0; G.stateTimer = 0;
  const poleX = level.flagX * TILE + 8;
  const baseTop = (GROUND_TOP - 1) * TILE;
  const rel = clamp((player.y + player.h - POLE_TOP) / (baseTop - POLE_TOP), 0, 1);
  const bonus = rel < 0.1 ? 5000 : rel < 0.35 ? 2000 : rel < 0.6 ? 800 : rel < 0.85 ? 400 : 100;
  player.x = poleX - player.w + 1;
  player.vx = 0; player.vy = 0; player.facing = 1; player.invuln = 0; player.hurtT = 0; player.riding = null;
  addScore(bonus, poleX + 6, player.y);
  G.flagY = baseTop - 14;
  // the flag climbs only as high as Saqer caught the pole: a jump at the top raises it all the way
  G.flagTop = Math.max(POLE_TOP + 1, Math.min(baseTop - 30, POLE_TOP + 1 + rel * (baseTop - 14 - POLE_TOP - 1)));
  G.cut = { white: 0, angle: 0, crashed: false, title: 0 };
  music.travel();                         // the tune bends from today into the past while he slides down
}

function updateGoal() {
  G.stateTimer++;
  const c = G.cut, t = G.stateTimer;
  const baseTop = (GROUND_TOP - 1) * TILE;

  if (G.goalPhase === 0) {
    player.y = Math.min(player.y + 2.2, baseTop - player.h);
    G.flagY = Math.max(G.flagTop, G.flagY - 2.4);
    if (player.y >= baseTop - player.h && G.flagY <= G.flagTop) { G.goalPhase = 1; G.stateTimer = 0; }
  } else if (G.goalPhase === 1) {
    if (t === 30) sfx.warp();
    if (t > 30) G.shake = Math.min(4, (t - 30) / 15);
    c.white = Math.min(1, Math.max(0, (t - 82) / 18));                // a short flash at the very end
    if (t > 100) {                                   // full white: swap the world
      const big = player.big, x = player.x;
      G.era = 'past'; stat('philadelphia');
      enterArea(PAST_AREA, FLAG_COL + 1, 'ground');
      music.stop();                                  // (the change keeps playing: only the area's own tune is held back)
      G.state = 'goal';
      if (big) makeBig();
      player.x = x; player.y = GROUND_TOP * TILE - player.h; player.facing = 1; player.invuln = 0;
      for (const e of W.entities) if (e.type === 'plat') e.hidden = true;
      G.camX = clamp(player.x - VW * 0.3, 0, level.w * TILE - VW);
      G.cut = { white: 1, angle: 0, crashed: false, title: 1 };
      G.fade = 0;
      G.goalPhase = 2; G.stateTimer = 0;
    }
  } else if (G.goalPhase === 2) {
    c.white = Math.max(0, 1 - t / 42);
    c.title = t;
    if (t > 190) { G.goalPhase = 3; G.stateTimer = 0; sfx.thud(); }
  } else if (G.goalPhase === 3) {
    if (t < 40) { G.shake = 2; c.angle = Math.sin(t * 0.8) * 1.5; }           // it rocks …
    else {
      const k = Math.min(1, (t - 40) / 46);
      c.angle = PILLAR_REST * k * k;                                          // … and comes down
      if (!c.crashed && c.angle > 46) {
        c.crashed = true; G.shake = 22; sfx.thud(); sfx.brick();
        for (let i = 0; i < 26; i++) {
          W.particles.push({ x: (GATE_COL + Math.random() * 6) * TILE, y: (6 + Math.random() * 6) * TILE,
            vx: (Math.random() - 0.6) * 4, vy: -2 - Math.random() * 5, t: 0, spin: Math.random() * 6 });
        }
      }
      if (k >= 1 && t > 150) { G.goalPhase = 4; G.stateTimer = 0; }
    }
  } else {
    if (t === 20) {
      for (const e of W.entities) if (e.type === 'plat' && e.hidden) {
        e.hidden = false;
        for (let i = 0; i < 16; i++) {
          const a = (i / 16) * Math.PI * 2;
          W.particles.push({ x: e.x + e.w / 2, y: e.y, vx: Math.cos(a) * 2.2, vy: Math.sin(a) * 2.2, t: 30, spin: 0, spark: true });
        }
      }
      sfx.item();
    }
    if (t > 70) {
      // the old city is introduced first (NEXT moves on, so there is time to read), then he is free to go
      G.cut = null;
      playStory(STORY.philadelphia, () => {
        G.state = 'play';
        player.jumpHeld = true;
        music.start(false, level.def.tune);
        say(['THE GATE IS BURIED.', 'RIDE THE LIFT BACK OVER THE GREAT STAIR.'], 300);
      });
      return;
    }
  }
  updateEntities();
  updateEffects();
}

export { W };

/* the title / pause / game-over labels built from numbers, after a language switch */
export function refreshMenus() {
  setText('#hi-score', tBest(String(G.hiScore).padStart(6, '0')));
  refreshSoundLabel();
}

/* the map of the game (normal mode): opened by the bonus box, or from the pause menu once found */
export function openMap(from) {
  G.mapFrom = from;
  if (from === 'box') {
    if (G.state !== 'play') return;
    G.prevState = G.state; G.state = 'paused';
  }
  showScreen('map');
}
export function closeMap() {
  if (G.mapFrom === 'pause') showScreen('pause');
  else resume();
}

/* ---------------- the end of stage one: back in Amman, and the hall ----------------
   After Hercules: today's Amman at sunset, by the flag (raised for good); the gate is the way into the
   hall, where the score goes on the top 10 and the next stages wait (quest.js: finale, room). */
function toFinale() {
  G.era = 'now'; G.sunset = true; G.boss = null; G.cheer = 0;
  enterArea('finale', 4, 'ground');
  G.fade = 40;
  say(['BACK IN AMMAN, TODAY.', 'THE GATE BY THE FLAG LEADS ON.'], 400);
}
function atDoor() {
  const cx = player.x + player.w / 2, x0 = level.gateX * TILE;
  return cx > x0 + 8 && cx < x0 + 40 && player.onGround;
}
function enterHall() {
  enterArea('room', 4, 'ground');
  G.downPress = false;                                        // a ▼ from before must not use anything at once
  if (!G.hallSeen) {
    G.hallSeen = true; sfx.goal();
    const saves = !G.saved && !G.usedGod && !DEBUG_RUN;
    say(['STAGE ONE COMPLETE!', saves ? 'YOUR SCORE IS ON THE BOARD.' : 'NO SCORE WITH THE CHEAT ON.', 'PRESS ▼ BY ANYTHING THAT GLOWS.'], 460);
    autoSave();
  }
}
/* the thing in the hall Saqer is standing by (the room draws a ▼ over it), or null */
export function hallThing() {
  if (!level.def || !level.def.things) return null;
  const cx = player.x + player.w / 2;
  let best = null, bd = 18;
  for (const t of level.def.things) {
    const tx = (t.x + (t.w || 1) / 2) * TILE, d = Math.abs(cx - tx) - ((t.w || 1) - 1) * TILE / 2;
    if (d < bd) { bd = d; best = t; }
  }
  return best;
}
function useThings() {
  if (!G.downPress) return;
  G.downPress = false;
  const t = hallThing();
  if (!t) return;
  sfx.select();
  switch (t.kind) {
    case 'portal': openHall('replay'); break;
    case 'book':   openHall('save'); break;
    case 'board':  openHall('save'); break;
    case 'plaque': openHall('future'); break;
    case 'door2':  say(['STAGE 2', 'OPENS ON 21.11.'], 260); break;
    default:       say(['COMING SOON.', 'THE GAME IS STILL BEING MADE.'], 260); break;
  }
}
function openHall(name) {
  G.prevState = 'play'; G.state = 'paused';
  music.stop();
  if (name === 'save') fillTop();
  showScreen(name);
}
export function hallBack() { resume(); }

/* the score goes on the top 10 by itself at GAME OVER or when Saqer walks into the hall (whichever comes first): once a run, never with the
   cheat on (attar10x) or in a ?debug test run; under the name typed on the difficulty screen, or a default */
async function autoSave() {
  if (G.saved || G.usedGod || DEBUG_RUN) return;
  G.saved = true;
  const name = playerName();
  const ok = await submitScore(name, G.score, D.name);
  if (ok) stat('saved-score');
  G.savedAs = ok ? name : '';
}
/* the top 10 screen (the book and the board) */
async function fillTop() {
  setText('#save-msg', G.savedAs ? tLine('SAVED AS') + ' ' + G.savedAs + ' · ' + String(G.score).padStart(6, '0')
    : G.usedGod ? tLine('NOT WITH THE CHEAT ON.') : '');
  showTop(topCached());
  showTop(await fetchTop());
}
function showTop(list) {
  const ol = document.getElementById('top-list');
  if (!ol) return;
  ol.textContent = '';
  if (!list.length) { const li = document.createElement('li'); li.textContent = tLine('NO SCORES YET: BE THE FIRST!'); ol.appendChild(li); return; }
  for (const r of list.slice(0, 10)) {
    const li = document.createElement('li');
    li.textContent = r.name + (r.mode === 'hard' ? ' ★' : '') + ' ';
    if (G.savedAs && r.name === G.savedAs) li.className = 'me';
    const s = document.createElement('span'); s.textContent = String(r.score).padStart(6, '0');
    li.appendChild(s); ol.appendChild(li);
  }
}
export function replayHard() { newGame('hard', true); }
