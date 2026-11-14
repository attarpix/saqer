/* ============================================================
   TILE TYPES
   ============================================================ */
export const T = {
  EMPTY: 0,
  GROUND: 1,        // ground (limestone in Amman, sandstone in Petra, sand in Wadi Rum)
  BRICK: 2,         // breakable brick (only when Saqer is big)
  Q_COIN: 3,        // star tile → dinar
  Q_JAMEED: 4,      // star tile → jameed (power-up, makes Saqer big)
  USED: 5,          // emptied star tile
  HARD: 6,          // carved stone / rock (stairs, ledges, pillars)
  COL_TL: 7, COL_TR: 8,   // Roman column capital (2 wide)
  COL_BL: 9, COL_BR: 10,  // Roman column shaft
  BRICK_MANSAF: 11, // looks like a brick, hides a mansaf (1-UP)
  BRICK_COINS: 12,  // looks like a brick, gives several dinars
  COIN: 13,         // floating dinar (not solid)
  HIDDEN_COIN: 14,  // SECRET: invisible until bumped from below → dinar
  HIDDEN_LIRA: 15,  // SECRET: invisible until bumped from below → gold lira
  LIRA: 16,         // gold lira, picked up by touch (not solid)
  THORN: 17,        // thorn bush: hurts to touch (not solid)
  KEY: 18,          // the bronze key (picked up by touch)
  BARS: 19,         // bronze gate bars: solid until Saqer brings the key
  GOLD: 20,         // the golden jameed: Saqer stays grown for good
  WALL: 21,         // invisible solid: where a giant pillar closes the street (the pillar is drawn on its own)
  Q_MAP: 22,        // a bonus box (normal mode) with the map of the game in it
};

export const SOLID = new Set([
  T.GROUND, T.BRICK, T.Q_COIN, T.Q_JAMEED, T.USED, T.HARD,
  T.COL_TL, T.COL_TR, T.COL_BL, T.COL_BR, T.BRICK_MANSAF, T.BRICK_COINS, T.BARS, T.WALL, T.Q_MAP,
]);

/* invisible tiles that only become solid when Saqer hits them from underneath */
export const HIDDEN = new Set([T.HIDDEN_COIN, T.HIDDEN_LIRA]);

/* Characters usable in level `row()` strings (see levels.js). */
export const CHAR_TILES = {
  '#': T.GROUND,
  'B': T.BRICK,
  '?': T.Q_COIN,
  'J': T.Q_JAMEED,
  'M': T.BRICK_MANSAF,
  '$': T.BRICK_COINS,
  'S': T.HARD,
  'U': T.USED,
  'o': T.COIN,
  'h': T.HIDDEN_COIN,
  'g': T.HIDDEN_LIRA,
  'L': T.LIRA,
  'x': T.THORN,
  'K': T.KEY,
  '=': T.BARS,
  'Y': T.GOLD,
  'm': T.Q_MAP,
};
