/* ============================================================
   LEVELS
   Add new stages to the LEVELS array. Each stage is built with a
   small API (see level.js):

     L.ground(a, b)          ground from tile a to b
     L.row(x, y, 'B?J$Mo')   tiles from a string:
                             B brick   ? dinar tile   J jameed tile
                             $ multi-dinar brick   M hidden mansaf (1-UP)
                             S stone   U used tile   o floating dinar
                             L gold lira   x thorn bush
                             h SECRET invisible dinar block
                             g SECRET invisible gold-lira block
     L.block(x, y, w, h)     solid stone rectangle (ledges, plateaus)
     L.pillar(x, top, w)     rock pillar rising out of a pit
     L.column(x, h)          Roman column (2 wide, h tall)
     L.stairs(x, h, 'up'|'down')
     L.coins(x, y, n)        n floating dinars
     L.lira(x, y)            a gold lira
     L.thorns(x, n)          n thorn bushes on the ground

     L.naughty(x) / L.naughties(x1, x2, ...)     naughty guys
     L.scorpion(x, row) / L.scorpions(...)       quick, never walk off a ledge
     L.flyer(x, row, range)  pigeon (Amman) / bat: range 0 flies across,
                             otherwise patrols `range` tiles each way
     L.lift(x, y, w, { dx, dy, period, phase })  moving lift

     L.start(x)  L.flag(x)  L.gate(x)  L.dana(x)

   Rows: 0 = top of screen, 13 = ground surface, 14 = bottom.
   A standing hero can bump blocks on row 9; row 5 is reachable
   from a row-9 platform. He climbs 4 tiles comfortably (5 at a
   stretch) and clears a 3-tile gap walking, 5 running.

   Per stage: theme 'amman' | 'petra' | 'rum' (stone, backdrop, gate),
   sky 'day' | 'sunset' | 'cycle' (Amman only), time on the clock.

   SECRETS: every stage hides three gold liras. Each is worth
   LIRA_VALUE dinars of mahr (config.js).
   ============================================================ */

import { D } from './config.js';

export const LEVELS = [
  /* ───────────────────────── 1-1 ───────────────────────── */
  {
    id: '1-1',
    name: 'WASAT AL-BALAD',
    nameAr: 'وسط البلد',
    theme: 'amman',
    width: 224,
    time: 400,
    sky: 'cycle',          // midday → sunset as the clock runs down
    build(L) {
      L.start(3);

      // ground with three gaps
      L.ground(0, 57);
      L.ground(61, 112);
      L.ground(116, 150);
      L.ground(153, 223);

      // opening
      L.row(14, 9, '?');
      L.row(19, 9, 'B?BJB');
      L.row(21, 5, '?');
      L.coins(25, 8, 3);

      // the colonnade
      L.column(29, 2);
      L.naughty(33);
      L.column(38, 3);
      L.naughties(42, 44);
      L.column(48, 4);
      L.coins(48, 7, 1);                 // SECRET 1: jump for this dinar from the tall column …
      L.row(48, 5, 'g');                 // … and find the gold above it

      L.row(52, 9, 'B$B');
      L.coins(57, 8, 4);                 // arc over the first gap

      // souq rooftops
      L.row(64, 9, 'B?B?B');
      L.row(65, 5, D.fewer ? 'BBBBB' : 'BBMBB');   // normal mode: no mansaf here (lives only start at the golden jameed)
      L.naughties(70, 72);
      L.coins(76, 10, 3);

      L.stairs(80, 3, 'up');
      L.stairs(84, 3, 'down');
      L.naughties(90, 92);

      L.row(96, 9, '?BB?');
      L.row(97, 6, 'oo');
      L.column(103, 3);
      L.naughty(107);

      // steps over the second gap
      L.stairs(109, 4, 'up');
      L.lira(114, 4);                    // SECRET 2: high over the gap, a brave jump from the top step
      L.stairs(116, 4, 'down');

      L.row(124, 9, 'BBBBB');
      L.row(124, 5, 'oo?oo');
      L.naughties(128, 130, 140);
      L.row(134, 9, '$');
      L.column(144, 2);

      L.coins(150, 8, 4);                // third gap
      L.row(158, 9, 'B?B');
      L.row(159, 5, '?');
      L.naughties(162, 164);
      L.column(168, 3);
      L.naughties(172, 174);
      L.column(178, 2);
      L.coins(182, 8, 3);

      // the great stair, flag and gate
      L.stairs(186, 8, 'up');
      L.lira(197, 2);                    // SECRET 3: a running leap off the top of the great stair
      L.flag(202);
      L.gate(208);
    },
  },

  /* ───────────────────────── 1-2 ─────────────────────────
     The Citadel: taller climbs, pigeons, the first lifts. */
  {
    id: '1-2',
    name: "JABAL AL-QAL'A",
    nameAr: 'جبل القلعة',
    theme: 'amman',
    width: 220,
    time: 360,
    sky: 'sunset',
    build(L) {
      L.start(3);
      L.ground(0, 38);
      L.ground(42, 74);
      L.ground(81, 118);
      L.ground(122, 158);
      L.ground(163, 219);

      // the climb: columns as stepping stones, a naughty guy waiting in each gap
      L.row(8, 9, 'B?B');
      L.coins(8, 5, 3);
      L.naughty(14);
      L.column(18, 2);
      L.column(22, 3);
      L.naughty(24);
      L.column(26, 4);
      L.row(30, 9, 'B?JB');
      L.flyer(36, 7);
      L.coins(34, 8, 3);
      L.naughty(36);
      L.coins(39, 8, 3);                 // first gap

      // the Umayyad wall
      L.stairs(44, 3, 'up');
      L.block(47, 10, 5, 3);
      L.stairs(52, 3, 'down');
      L.naughty(49, 9);
      L.coins(47, 8, 5);
      L.row(57, 9, '?B?');
      L.naughties(59, 61);
      L.column(63, 3);

      // SECRET 1: the vault. Only big Saqer can break the brick in its floor and jump inside.
      L.row(67, 5, 'SSS');
      L.row(67, 6, 'SLS');
      L.row(67, 7, 'S S');
      L.row(67, 8, 'SBS');
      L.naughty(72);

      // the first lift, with a pigeon circling over it
      L.lift(75, 13, 3, { dx: 3, period: 260 });
      L.coins(76, 9, 4);
      L.flyer(78, 8, 3);

      // Temple of Hercules: walk over the lintel, or drop through the hole
      // SECRET 2: the gold is in the chamber underneath, with company
      L.row(84, 9, '?');
      L.column(88, 4);
      L.column(98, 4);
      L.row(90, 9, 'B?B..B?B');
      L.lira(90, 12);
      L.coins(92, 11, 2);
      L.coins(95, 11, 2);
      L.naughties(92, 96);
      L.naughties(102, 104);
      L.row(106, 9, 'B$B');
      L.flyer(112, 7);
      L.column(114, 3);
      L.coins(119, 8, 3);                // second gap

      // the palace
      L.block(125, 10, 4, 1);
      L.row(126, 6, '?J?');
      L.naughties(131, 133);
      // SECRET 3: ride the lift to the high terrace, then jump for the lone dinar
      L.lift(136, 12, 2, { dy: -6, period: 300 });
      L.block(139, 6, 5, 1);
      L.coins(139, 5, 5);
      L.coins(141, 3, 1);
      L.row(141, 2, 'g');
      L.row(141, 9, 'B?B');
      L.naughties(143, 146);
      L.column(150, 3);
      L.flyer(154, 8);
      L.coins(154, 9, 3);
      L.coins(159, 8, 4);                // a wide gap: take a run at it

      // last stretch
      L.naughties(166, 168, 170);
      L.row(173, 9, '?B?B?');
      L.flyer(181, 6);
      L.stairs(182, 7, 'up');
      L.flag(197);
      L.gate(203);
    },
  },

  /* ───────────────────────── 1-3 ─────────────────────────
     Petra: the Siq, rock shelves, scorpions, bats, lifts over the canyon. */
  {
    id: '1-3',
    name: 'PETRA',
    nameAr: 'البترا',
    theme: 'petra',
    width: 234,
    time: 380,
    build(L) {
      L.start(3);
      L.ground(0, 26);
      L.ground(30, 58);
      L.ground(71, 104);
      L.ground(108, 150);
      L.ground(167, 233);

      // into the Siq
      L.block(5, 0, 19, 2);
      L.row(9, 9, '?J?');
      L.scorpion(14);
      L.stairs(18, 2, 'up');
      L.block(20, 11, 4, 2);
      L.coins(20, 9, 4);
      L.scorpion(21, 10);
      L.coins(27, 8, 3);                 // first gap

      // rock shelves, each one higher
      L.block(33, 10, 3, 1);
      L.block(38, 8, 3, 1);
      L.block(43, 6, 3, 1);
      L.coins(33, 9, 3);
      L.coins(38, 7, 3);
      L.coins(43, 5, 3);
      L.lira(49, 3);                     // SECRET 1: a running leap off the top shelf
      L.scorpions(36, 41);
      L.row(47, 9, 'B$B');
      L.flyer(53, 8);
      L.column(54, 3);

      // the canyon: two lifts that meet in the middle
      L.lift(59, 13, 3, { dx: 3, period: 240 });
      L.lift(65, 13, 3, { dx: 3, period: 240, phase: 0.5 });
      L.coins(61, 10, 2);
      L.coins(66, 10, 2);
      L.flyer(64, 8, 2);

      // the colonnaded street
      L.column(74, 2);
      L.scorpion(77);
      L.column(79, 3);
      L.scorpion(82);
      L.row(85, 9, 'J');

      // SECRET 2: the sealed tomb. Big Saqer breaks a brick in its floor and jumps in.
      L.row(88, 5, 'SSSSSSS');
      L.row(88, 6, 'S..L..S');
      L.row(88, 7, 'S.ooo.S');
      L.row(88, 8, 'SSBBBSS');
      L.scorpions(90, 93);

      L.stairs(98, 4, 'up');
      L.block(102, 9, 3, 4);
      L.coins(105, 7, 3);                // second gap, from the cliff edge

      // the High Place: giant steps, then narrow ledges with scorpions below
      L.row(111, 9, '?B?');
      L.scorpions(114, 117);
      L.flyer(121, 7);
      L.block(122, 11, 2, 2);
      L.block(124, 9, 2, 4);
      L.block(126, 7, 2, 6);
      L.block(130, 7, 2, 1);
      L.block(134, 7, 2, 1);
      L.block(138, 7, 2, 1);
      L.coins(128, 5, 2);
      L.coins(132, 5, 2);
      L.coins(136, 5, 2);
      L.coins(139, 5, 1);                // SECRET 3: jump for the last dinar on the last ledge
      L.row(139, 3, 'g');
      L.flyer(135, 4, 3);
      L.scorpions(131, 135, 139);
      L.block(142, 9, 3, 4);
      L.stairs(145, 4, 'down');

      // the chasm: pillars, then a lift
      L.pillar(153, 11);
      L.pillar(158, 9);
      L.coins(155, 7, 3);
      L.lift(161, 9, 3, { dx: 3, period: 220 });
      L.coins(162, 7, 3);
      L.flyer(166, 6);

      // down to the Treasury
      L.scorpions(171, 174);
      L.row(177, 9, '?B$B?');
      L.flyer(185, 8);
      L.column(188, 2);
      L.column(192, 3);
      L.stairs(196, 6, 'up');
      L.flag(210);
      L.gate(216);
    },
  },

  /* ───────────────────────── 1-4 ─────────────────────────
     Wadi Rum by night: pillars over deep pits, long lift rides, thorns. */
  {
    id: '1-4',
    name: 'WADI RUM',
    nameAr: 'وادي رم',
    theme: 'rum',
    width: 252,
    time: 400,
    build(L) {
      L.start(3);
      L.ground(0, 22);
      L.ground(41, 78);
      L.ground(97, 126);
      L.ground(151, 186);
      L.ground(199, 251);

      // out of the camp
      L.row(7, 9, '?J?');
      L.thorns(12);
      L.scorpion(15);
      L.stairs(19, 2, 'up');
      L.block(21, 11, 2, 2);

      // first pit: three pillars, each a step higher
      L.pillar(25, 11);
      L.pillar(30, 10);
      L.pillar(35, 9);
      L.coins(27, 8, 3);
      L.coins(32, 7, 3);
      L.coins(37, 7, 4);
      L.flyer(40, 7);

      // dunes
      L.thorns(44, 2);
      L.scorpion(48);
      L.row(51, 9, 'B?B');
      L.thorns(55);
      L.stairs(58, 3, 'up');
      L.block(61, 10, 5, 3);
      L.stairs(66, 3, 'down');
      L.scorpion(63, 9);
      L.coins(61, 8, 5);
      L.coins(63, 6, 1);                 // SECRET 1: jump for the dinar above the dune
      L.row(63, 5, 'g');

      // the rock bridge
      L.stairs(70, 3, 'up');
      L.block(73, 10, 3, 1);
      L.stairs(76, 3, 'down');
      L.coins(73, 8, 3);

      // second pit: a lift, a pillar to rest on, then a lift that climbs
      L.lift(80, 12, 3, { dx: 4, period: 260 });
      L.pillar(88, 11);
      L.lift(91, 11, 3, { dy: -4, period: 240 });
      L.coins(81, 10, 3);
      L.coins(85, 9, 2);
      L.flyer(86, 8, 3);
      L.block(96, 5, 3, 1);              // SECRET 2: ride the second lift to the top and jump to this ledge
      L.lira(97, 4);

      // the plain
      L.scorpions(100, 103);
      L.thorns(106, 2);
      L.row(109, 9, '?B$B?');
      L.flyer(114, 7);
      L.stairs(117, 4, 'up');
      L.block(121, 9, 4, 4);
      L.scorpion(122, 8);

      // third pit: climb the pillars, cross on the high lift
      L.pillar(129, 11);
      L.pillar(133, 9);
      L.pillar(137, 7);
      L.coins(131, 8, 2);
      L.coins(135, 6, 2);
      L.lift(140, 7, 3, { dx: 4, period: 260 });
      L.lira(143, 3);                    // SECRET 3: high over the lift's path
      L.flyer(136, 4);
      L.flyer(146, 5, 3);
      L.pillar(148, 9);

      // thorn fields
      L.scorpions(154, 157);
      L.thorns(160, 2);
      L.row(163, 9, 'B?JB');
      L.flyer(170, 8);
      L.thorns(172);
      L.scorpion(175);
      L.stairs(178, 4, 'up');
      L.block(182, 9, 5, 4);

      // the long ride
      L.lift(188, 9, 3, { dx: 7, period: 300 });
      L.coins(190, 7, 6);
      L.flyer(193, 7, 3);

      // the family tent
      L.scorpions(203, 206);
      L.thorns(209);
      L.row(212, 9, '?B?');
      L.stairs(217, 8, 'up');
      L.flag(232);
      L.dana(236);
      L.gate(238);
    },
  },
];
