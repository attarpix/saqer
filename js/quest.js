/* ============================================================
   THE QUEST — the areas of the game as it is played now.

   (The four mahr stages and Dana's scenes are still in levels.js
   and story.js, untouched. They are only hidden for the moment.)

     amman    Wasat al-Balad today. Plays as before until the flag.
     phila    The same street 1,900 years earlier: Philadelphia.
              Pulling the flag sends Saqer here. A pillar falls on
              the gate, a lift carries him back over the great stair,
              the golden jameed waits at the top, and from then on he
              can walk both ways.
     under    The vaulted stream under the Roman street. Three
              chambers, each reached by its own shaft from above.
     theater  The Roman theatre: Hercules, in front of the crowd.

   Areas remember what happened in them (dinars taken, blocks
   broken, enemies beaten), so Saqer can go up and down freely.

   Extra builder calls for areas (see level.js for the rest):
     L.shaftDown(a, b, 'area', col)   fall off the bottom between columns a..b: drop into `area` at col
     L.wayUp(a, b, 'area', col)       ride a lift off the top between a..b: come out in `area` at col
     L.key(x, y)  L.bars(x, y, h)     the bronze key, and the gate it opens
     L.clear(x, y, w, h)              cut an opening
     'Y' in a row                     the golden jameed
   ============================================================ */
import { LEVELS } from './levels.js';

export const START_AREA = 'amman';
export const PAST_AREA  = 'phila';      // where the flag sends him
export const FLAG_COL   = 202;          // the flag pole (same column in both times)
export const GATE_COL   = 208;          // the gate the pillar falls on

export const AREAS = {
  /* ───────────── Amman, today ───────────── */
  amman: {
    id: '1-1', name: 'WASAT AL-BALAD', nameAr: 'وسط البلد',
    theme: 'amman', backdrop: 'amman', flyer: 'pigeon', tune: 'amman',
    width: 224,
    build(L) {
      LEVELS[0].build(L);                 // the first stage, exactly as it was (the new creatures only appear in the past)
    },
  },

  /* ───────────── Philadelphia, upper street ─────────────
     Saqer arrives at the flag (far right) and works his way back west.
     The three gaps in the street are now shafts down to the vaults. */
  phila: {
    id: 'PHILADELPHIA', name: 'PHILADELPHIA', nameAr: 'فيلادلفيا',
    theme: 'sky', backdrop: 'phila', flyer: 'bat', tune: 'south',
    width: 224, noFlag: true, roam: true,
    decor: [['urn', 14], ['brazier', 30], ['urn', 52], ['brazier', 64], ['urn', 86], ['brazier', 106], ['urn', 120],
            ['brazier', 140], ['urn', 160], ['brazier', 179], ['urn', 191]],   // the same props as the sky level, not solid
    build(L) {
      L.start(FLAG_COL + 1);
      L.ground(0, 57); L.ground(61, 112); L.ground(116, 149); L.ground(153, 223);
      L.giant(0, 3);                                // a giant pillar closes the west end …
      L.giant(220, 3);                              // … and another stands beside the one that fell, closing the east end
      L.shaftDown(58, 60, 'under', 59);
      L.shaftDown(113, 115, 'under', 114);
      // the first drop from the new city lands at the theatre gate in the east vault: the end is shown early, with a hint
      L.shaftDown(150, 152, 'under', 198, ['THE GATE TO THE THEATRE.', 'IT IS LOCKED: GET ITS KEY', 'FROM THE TEMPLE IN THE SKY.']);

      // the ruined gate (the fallen pillar is drawn over it)
      L.block(206, 12, 4, 1); L.block(210, 11, 3, 2); L.block(213, 12, 1, 1);
      L.lira(211, 6);                               // SECRET: on top of the wreck
      L.coins(216, 9, 3);

      // the lift over the great stair, and the golden jameed at the top
      L.lift(194, 12, 3, { dy: -8, period: 360 });
      L.stairs(186, 8, 'up');
      L.row(193, 4, 'Y');
      L.coins(188, 3, 3);

      // forum: a temple front (two columns and a lintel)
      L.column(170, 3); L.column(176, 3);
      L.row(170, 9, 'SSSSSSSS');
      L.coins(171, 8, 6);
      L.row(173, 5, 'g');                           // SECRET: bump the air above the lintel
      L.scorpions(182, 166, 162);
      L.flyer(180, 6, 3);
      L.row(157, 9, 'BMB');                         // a mansaf, not a jameed: he already has the golden jameed by here
      L.row(158, 5, '?');

      // between the second and third shaft
      L.column(144, 2);
      L.thorns(141, 2);
      L.row(133, 9, 'B$B');
      L.row(123, 9, 'BBBBBB');
      L.row(124, 5, 'o?oo?o');
      L.scorpions(129, 137);
      L.scorpion(125, 8);                           // one patrols the rooftop
      L.flyer(131, 6, 4);
      L.flyer(120, 4, 2);

      // the steps either side of the second shaft
      L.stairs(109, 4, 'up');
      L.stairs(116, 4, 'down');
      L.coins(113, 7, 3);

      // colonnaded street
      L.column(103, 3); L.column(97, 5);
      L.row(99, 7, 'BMB');
      L.thorns(100, 2);
      L.scorpion(106); L.flyer(94, 6, 3);
      L.row(88, 9, '?B?');
      L.stairs(80, 3, 'up'); L.stairs(84, 3, 'down');
      L.flyer(82, 5, 2);
      L.scorpions(76, 91);

      // the market roofs
      L.row(64, 9, 'B?B?B');
      L.row(65, 5, 'BB$BB');
      L.scorpion(67, 8);
      L.scorpions(70, 73);
      L.coins(57, 8, 5);

      // west of the first shaft
      L.column(48, 4); L.column(42, 3); L.column(36, 2);
      L.row(48, 3, 'L');                            // SECRET: a leap from the tallest column
      L.scorpions(45, 39, 33);
      L.flyer(40, 6, 4);
      L.row(22, 9, 'B?BJB');
      L.row(24, 5, '?');
      L.thorns(27, 2);
      L.scorpion(31);                               // one only, well away from the temple lift: Saqer comes up from the vaults at column 10
      L.column(4, 3);
      L.coins(6, 9, 3);

      // the chained lift up to the Temple of Hercules: the bronze key from the vaults frees it
      L.lift(8, 12, 3, { dy: -13, period: 430, lock: 'vault' });
      L.wayUp(7, 11, 'temple', 5);
    },
  },

  /* ───────────── the Temple of Hercules, in the sky above the city ─────────────
     Islands of white marble over a sea of cloud. Falling through a gap drops Saqer
     back onto the street (no life lost). His key lies at the temple door: it opens
     the bars in the east vault, on the way to the theatre. */
  temple: {
    id: 'THE TEMPLE', name: 'TEMPLE OF HERCULES', nameAr: 'معبد هرقل',
    theme: 'sky', backdrop: 'sky', flyer: 'pigeon', tune: 'south',
    width: 128, noFlag: true, roam: true,
    keyName: 'temple',
    templeCol: 101.5,                              // where the temple front stands (drawn by render.js)
    decor: [['urn', 4], ['urn', 18], ['brazier', 26], ['brazier', 36], ['urn', 44], ['brazier', 72], ['urn', 87],
            ['urn', 95], ['brazier', 101], ['brazier', 114], ['urn', 122]],   // props, not solid
    build(L) {
      L.start(5);
      L.giant(0, 3);
      L.ground(0, 20); L.ground(24, 37); L.ground(42, 57); L.ground(61, 66); L.ground(71, 88); L.ground(93, 127);
      for (const [a, b] of [[21, 23], [38, 41], [58, 60], [67, 70], [89, 92]]) L.shaftDown(a, b, 'phila', 12);

      // the landing
      L.coins(8, 9, 4);
      L.row(13, 9, 'B?B');
      L.flyer(15, 6, 3);

      // the first island
      L.coins(26, 9, 3);
      L.block(32, 11, 2, 2);
      L.scorpions(29, 35);
      L.lift(38, 11, 2, { dx: 2, period: 200 });     // over the second gap
      L.coins(38, 8, 4);

      // columns of the precinct
      L.column(46, 3); L.column(52, 4);
      L.row(49, 5, 'L');                             // SECRET: a leap from the taller column
      L.scorpion(49);
      L.coins(55, 10, 2);
      L.flyer(54, 5, 3);

      // stepping stones
      L.block(63, 9, 3, 1);
      L.coins(63, 7, 3);
      L.block(68, 10, 2, 1);

      // the long island before the temple
      L.row(77, 9, 'BMB');
      L.scorpions(76, 83);
      L.flyer(80, 6, 4);
      L.coins(84, 9, 3);
      L.lift(89, 11, 2, { dx: 2, period: 210 });
      L.coins(90, 8, 3);

      // the temple, and his key at its door
      L.coins(96, 9, 4);
      L.scorpion(99);
      L.flyer(100, 5, 3);
      L.key(108, 12);
      L.coins(117, 9, 3);
      L.row(121, 6, 'L');                            // SECRET: high behind the temple
      L.block(119, 10, 2, 1);
      L.giant(125, 3);
    },
  },

  /* ───────────── the vaults under the street ─────────────
     Chamber A (west): treasure.   Chamber B (middle): the bronze key.
     Chamber C (east): the bronze gate, and the lift up into the theatre.
     Gaps in the floor are the stream: fall in and a life is gone. */
  under: {
    id: 'THE VAULTS', name: 'UNDER THE STREET', nameAr: 'تحت الشارع',
    theme: 'crypt', backdrop: 'crypt', flyer: 'bat', tune: 'south',
    width: 224, noFlag: true, roam: true,
    keyName: 'vault',                              // the bronze key lies here (it frees the lift to the temple) …
    barsNeed: 'temple',                            // … but the bars in the east vault want the key of Hercules
    build(L) {
      L.block(0, 0, 224, 2);                        // the vault overhead …
      L.clear(58, 0, 3, 2); L.clear(113, 0, 3, 2); L.clear(150, 0, 3, 2);   // … and the three shafts
      L.block(66, 2, 4, 11); L.block(128, 2, 4, 11);                         // walls between the chambers

      /* ── Chamber A: 0–65 ── */
      L.ground(0, 29); L.ground(34, 65);
      L.pillar(31, 11, 2);
      L.clear(6, 0, 2, 2);
      L.lift(6, 12, 2, { dy: -13, period: 430 });
      L.wayUp(5, 8, 'phila', 10);
      L.row(52, 9, 'B?B');  L.row(53, 5, 'M');
      L.coins(44, 10, 5);   L.thorns(46, 3);
      L.scorpions(50, 40);  L.flyer(42, 6, 4);
      L.block(36, 10, 3, 3); L.block(39, 11, 2, 2);
      L.coins(36, 8, 3);
      L.coins(30, 7, 4);
      L.block(22, 9, 6, 1); L.block(14, 6, 5, 1);
      L.coins(22, 8, 6);
      L.row(15, 5, 'oLoo');                         // SECRET: the high shelf
      L.row(18, 9, '$'); L.row(11, 9, 'J');
      L.scorpion(24, 8); L.scorpions(20, 12);
      L.flyer(26, 5, 3); L.flyer(16, 10, 3);

      /* ── Chamber B: 70–127 ── */
      L.ground(70, 85); L.ground(88, 88); L.ground(91, 99); L.ground(105, 127);   // 88: the middle of the three little gaps is closed (P5)
      L.clear(122, 0, 2, 2);
      L.lift(122, 12, 2, { dy: -13, period: 430 });
      L.wayUp(121, 124, 'phila', 126);
      L.row(109, 9, 'BJB');
      L.thorns(107, 2);
      L.scorpions(111, 118);
      L.flyer(108, 5, 3);
      L.lift(100, 12, 2, { dx: 3, period: 190 });   // over the stream
      L.coins(101, 9, 3);
      L.block(93, 10, 5, 3);
      L.thorns(95, 2, 9);
      L.flyer(96, 5, 3);
      L.pillar(87, 11, 1); L.pillar(89, 10, 1);
      L.coins(86, 7, 4);
      L.block(80, 10, 3, 3); L.block(76, 7, 3, 1);
      L.scorpions(84, 78);
      L.flyer(82, 6, 3);
      L.block(71, 11, 4, 2);
      L.key(72, 10);                                // the bronze key, at the far end
      L.row(71, 4, 'L');                            // SECRET: from the hanging ledge
      L.coins(76, 6, 3);

      /* ── Chamber C: 132–223 ── */
      L.ground(132, 160); L.ground(167, 176); L.ground(187, 223);
      L.clear(135, 0, 2, 2);
      L.lift(135, 12, 2, { dy: -13, period: 430 });
      L.wayUp(134, 137, 'phila', 139);
      L.row(142, 9, '?B?');
      L.scorpions(146, 156);
      L.thorns(158, 2);
      L.lift(161, 12, 3, { dx: 3, period: 210 });   // the stream
      L.coins(162, 8, 4);
      L.flyer(164, 6, 3);
      L.scorpion(171); L.thorns(173, 2);
      L.flyer(172, 5, 3);
      L.pillar(179, 11, 2); L.pillar(183, 10, 2);
      L.coins(179, 9, 2);
      L.row(183, 5, 'g');                           // SECRET: above the second pillar
      L.flyer(181, 5, 2);
      L.scorpions(190, 195);
      L.hardOnly('scorpion', 195); L.hardOnly('flyer', 181);   // normal mode: no scorpion at the gate, no bat right after it (too hard to pass unhurt)
      // (the jameed box that stood here is behind the gate now, for health before the fight)
      L.block(200, 2, 1, 8);                        // the bronze gate
      L.bars(200, 12, 3);
      L.coins(203, 10, 5);
      L.row(203, 7, 'BJB');                         // behind the gate: a jameed before the fight (outside, it would be taken before the key)
      L.clear(197, 0, 3, 2);                        // the opening the first drop from the street comes through
      L.clear(209, 0, 3, 2);
      L.lift(209, 12, 3, { dy: -13, period: 500 }); // the lift into the theatre
      L.wayUp(208, 212, 'theater', 3);
    },
  },

  /* ───────────── the Roman theatre ───────────── */
  theater: {
    id: 'THE THEATRE', name: 'THE ROMAN THEATRE', nameAr: 'المدرج الروماني',
    theme: 'amman', backdrop: 'theater', flyer: 'bat', tune: 'south',
    width: 28, noFlag: true, roam: true, boss: true,
    build(L) {
      L.start(3);
      L.ground(0, 27);
    },
  },
};
