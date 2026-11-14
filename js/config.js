/* ============================================================
   CONFIG — world units, physics, tuning
   The world is simulated in 16-unit tiles but every tile/sprite is
   drawn from 32×32 art at SCALE 2, so one world unit = 2 canvas px.
   ============================================================ */
export const TILE  = 16;          // world units per tile
export const SCALE = 2;           // art pixels per world unit for the tiles (32-px art)
export const RES   = 4;           // canvas pixels per world unit: 1280 × 960, so the painted sprites keep their detail
export const VW = 320;            // viewport width  (world units) → 640 px canvas (4:3)
export const VH = 240;            // viewport height (world units) → 480 px canvas
export const LH = 15;             // level height in tiles
export const GROUND_TOP = 13;     // first ground row
export const STEP = 1000 / 60;    // fixed simulation step (ms)

/* ---- difficulty: chosen after START (easy / hard), remembered with the save ----
   hard is the game as it was designed. easy has the same lives and the same Hercules,
   but every second enemy stays home and there are no thorn bushes. */
export const MODES = {
  easy: { lives: 3, boss: 6, speed: 1, fewer: true,  thorns: false },
  hard: { lives: 3, boss: 6, speed: 1, fewer: false, thorns: true },
};
export const D = Object.assign({ name: 'hard' }, MODES.hard);   // the mode in play
export function setMode(name) { if (MODES[name]) Object.assign(D, MODES[name], { name }); }
export const START_LIVES = 3;     // (the mode in play is D.lives)
export const MAX_HP      = 3;     // hits Saqer can take once he has the golden jameed
export const BOSS_HP     = 6;     // (the mode in play is D.boss)
export const TIME_TICKS  = 24;    // frames per in-game second

/* ---- the story's numbers ---- */
/* The four stages hold 220 dinars and 12 gold liras (worth 10 each): 340 in all.
   200 means: collect most of the dinars AND find a few of the secrets. */
export const MAHR_GOAL  = 200;    // dinars Dana asks for. Lower = easier ending, higher = harder.
export const LIRA_VALUE = 10;     // dinars each hidden gold lira adds to the mahr
export const GOLD_LIRAS = false;  // level 1 is the introduction: no hidden gold liras (they come with Dana in level 2)

export const PHYS = {
  walkMax: 1.9,  runMax: 1.9,            // one speed: there is no running any more (the owner's choice)
  walkAcc: 0.11, runAcc: 0.11,
  friction: 0.09,
  jumpVel: -7.5,                  // apex ≈ 84 units, clears 4-tall columns
  stompVel: -5.5, stompVelHeld: -7.5,
  gravity: 0.62, gravityHeld: 0.32,
  maxFall: 9,
};

/* Hit-boxes (world units). Sprites are drawn bottom-centred on these. */
export const PLAYER_SIZE = {
  small: { w: 10, h: 16 },
  big:   { w: 13, h: 26 },
};
