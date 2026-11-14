/* ============================================================
   SHARED GAME STATE
   ============================================================ */
import { START_LIVES } from './config.js';

export const G = {
  state: 'boot',      // boot | title | story | intro | play | paused | dying | goal | gameover
  tick: 0,
  stateTimer: 0,
  score: 0,
  coins: 0,           // dinars since the last 1-UP (every 100)
  mahr: 0,            // dinars collected towards Dana's mahr (gold liras count extra)
  mahrStart: 0,       // … as it stood when this stage began (losing a life puts it back)
  liras: 0,           // gold liras found
  lirasStart: 0,
  lives: START_LIVES,
  time: 400,
  timeTick: 0,
  hurry: false,
  levelIndex: 0,
  camX: 0,
  goalPhase: 0,
  flagY: 0,
  hiScore: 0,
  muted: false,
  area: '',           // which area of the quest he is in (quest.js)
  era: 'now',         // 'now' = Amman today, 'past' = Philadelphia
  entry: null,        // where he last came into this area (he restarts there)
  golden: false,      // has the golden jameed: grown for good, with a 3-hit bar
  hp: 3,
  keys: {},           // keys carried: vault (bronze, from the vaults) and temple (from the Temple of Hercules)
  dbg: false,         // the attar debug view: enemy numbers, killing spots, deaths
  deaths: [],         // every death this playthrough: { n, area, x, y, tx, cause }
  lastHurt: '',
  presses: 0,         // every press of a key or button (a note on screen goes at the next one)
  hinted: false,      // the hint at the theatre gate has been shown
  hasMap: false,      // normal mode: he found the map box (the pause menu then has THE MAP)
  mapRequest: false,
  mapFrom: '',
  gone: new Map(),    // per playthrough: area → ("x,y" → tile left behind) for coins, liras and the golden jameed taken
  clock: 0,           // frames played (the clock counts up now)
  banner: null,       // { lines: [...], t } a message across the screen
  cheer: 0,           // frames the theatre crowd keeps cheering
  shake: 0,
  cut: null,          // the flag cutscene: { phase, t, ... }
  boss: null,         // Hercules, while in the theatre
};

export const W = {
  entities: [],
  particles: [],
  coinFx: [],
  popups: [],
  bumps: new Map(),   // "x,y" → frames left in the bump animation
};

export const player = {
  x: 0, y: 0, w: 10, h: 16,
  vx: 0, vy: 0,
  onGround: false, facing: 1,
  big: false, wantBig: false,
  jumping: false, jumpHeld: false,
  invuln: 0,
  morph: 0, morphDir: 0,  // grow (+1) / shrink (-1) animation frames left
  walkT: 0, landT: 0, hurtT: 0,
  stompChain: 0,
  deathKind: '',
  visible: true,
  riding: null,           // the moving lift Saqer is standing on, if any
};

export function clearWorld() {
  W.entities = []; W.particles = []; W.coinFx = []; W.popups = [];
  W.bumps.clear();
}
