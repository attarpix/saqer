# Saqer · صقر

A Jordanian pixel-art platformer. Saqer wants to marry Dana; she tells him to bring her mahr
before he talks to her family, so he collects it dinar by dinar across Jordan.
Installable PWA, playable offline.

## Run it

```bash
powershell -ExecutionPolicy Bypass -File serve.ps1
```

Then open http://localhost:8080 (add `?debug` to expose `__saqer` in the console;
`__saqer.stage(2)` jumps straight to the third stage).
ES modules and the service worker need a server, so double-clicking `index.html` won't work.
To publish, upload the folder to any static host with HTTPS (GitHub Pages, Netlify, …).
Bump `VERSION` in `sw.js` each time you publish, so players get the new files.


## The game right now: back to Philadelphia

Dana's scenes and the four mahr stages are hidden for the moment (their text and layouts are still
in `js/story.js` and `js/levels.js`). What plays now is one long quest, defined in **`js/quest.js`**:

1. **Wasat al-Balad, today.** The first stage, as before, until the flag.
2. **The flag.** Pulling it sends Saqer back about 1,900 years to **Philadelphia** (Φιλαδέλφεια), Roman Amman.
   A great pillar falls on the gate, and a lift appears to carry him back over the great stair.
3. **The golden jameed** waits at the top of the stair. From then on Saqer stays grown, and has a
   bar of three hits. Any jameed or mansaf refills it.
4. **The street, both ways.** He can now walk left and right freely. The three gaps in the street are shafts
   down to **the vaults** under it (the Romans really did roof over the stream that ran through the city).
5. **The vaults** have three chambers. The middle one hides the **bronze key**; the east one has the bronze gate
   and, behind it, the lift up into the theatre. Small lifts in each chamber go back up to the street.
6. **The Roman theatre.** Hercules, with a health bar, in front of the crowd. Stomp him while he catches
   his breath (stars over his head). The words before and after the fight are `STORY.beforeBoss` and
   `STORY.afterBoss` at the bottom of `js/story.js`: that is where your cinematic goes.

The clock counts up (no time limit); finishing in under 15 minutes earns a bonus. Losing a life puts Saqer
back where he came into the area; what he already collected stays collected.

**Testing cheat:** type `attar10x` while playing to make Saqer unkillable (type it again to switch it off).

**New art.** `tools/build_new_art.ps1` turns the pictures in `art/new` into `assets/bg/*.jpg` and `assets/src/*.png`.
Saqer, Hercules and the pillar are cut out of their sheets when the game starts (`js/sheets.js`).
`tools/shot.sh` takes test screenshots with headless Chrome.

## The game

| Stage | Place | What's new |
|---|---|---|
| 1-1 | Wasat al-Balad (downtown Amman) | the basics |
| 1-2 | Jabal al-Qal'a (the Citadel) | pigeons, tall climbs, the first lifts |
| 1-3 | Petra | scorpions, bats, lifts over the canyon |
| 1-4 | Wadi Rum, by night | pillars over deep pits, long lift rides, thorns |

- **Mahr.** Every dinar counts towards the mahr shown at the top of the screen.
  Reach `MAHR_GOAL` by the end of 1-4 for the wedding ending; fall short and Dana sends Saqer round again.
- **Secrets.** Each stage hides three gold liras (invisible blocks, sealed vaults that only big
  Saqer can break into, daring jumps). Each is worth `LIRA_VALUE` dinars. The three slots next to
  the stage number show how many you have found.
- **Lives.** Losing a life restarts the stage, and the dinars picked up on that try don't count.
  After GAME OVER you continue from the same stage with fresh lives (the score starts again).
- After each stage Dana tells Saqer what her family wants next.

## Controls

| Action | Keyboard | Touch | Gamepad |
|---|---|---|---|
| Move | ← → / A D | ◀ ▶ | D-pad / stick |
| Jump (hold for higher) | Z / Space / ↑ | A | A / B |
| Run | X / Shift | B | X / Y |
| Pause | P / Esc | ❚❚ | Start |
| Sound | M | menu | – |
| Restart stage | R | menu | – |

## Changing the story and adding voice-over

Everything Saqer and Dana say is in **`js/story.js`**. The lines in there are drafts: replace them
with your own. One line of dialogue looks like this:

```js
{ speaker: 'DANA', text: 'GET MY MAHR FIRST.', ar: 'جيب مهري أول.', vo: 'assets/vo/dana-01.mp3' },
```

- `speaker` is `'SAQER'`, `'DANA'` or `''` for the narrator. `ar` and `vo` are optional.
- Put the recordings in `assets/vo/` and write the path in `vo`. One line plays at a time:
  moving to the next line stops the one before it, so the voices never overlap.
- `{mahr}`, `{goal}`, `{short}`, `{gold}`, `{goldAll}` inside a line are replaced with the numbers.
- The scene (Saqer and Dana facing each other) is drawn above the dialogue box, so the text never covers them.
- The full list of options is at the top of `js/story.js`.

**Your own Dana.** The built-in Dana is drawn in code. To use your own drawing, save one picture
(facing left, transparent background) and set `DANA_ART` at the top of `js/story.js` to its path.

**How hard the ending is.** `MAHR_GOAL` and `LIRA_VALUE` are in `js/config.js`.

## Where things live

| File | What to edit |
|---|---|
| `js/story.js` | **Your storyline**: intro, before/after each stage, the two endings, voice-over, your Dana art |
| `js/levels.js` | Stage layouts (small builder API, documented at the top) |
| `js/config.js` | The mahr, physics, viewport, hit-boxes |
| `js/saqer.js` | How Saqer and Dana look (colours at the top) and all their animation poses |
| `js/art.js` | Tiles, enemies, gates, and the Petra / Wadi Rum backdrops, per theme |
| `js/render.js` | Drawing, parallax, HUD, the story cutscene |
| `js/world.js` | Blocks, enemies, lifts, items, scoring |
| `js/player.js` | Saqer's movement, grow, shrink, death |
| `js/game.js` | State machine and stage flow |
| `js/audio.js` | Sound effects, the two tunes, voice-over playback |
| `css/style.css` | Pixel UI (menus, story box, touch pad) |
| `tools/characters.html` | Every frame of Saqer and Dana on one page: open `/tools/characters.html` on the local server |
| `art/` | Your source art (not shipped) |
| `assets/` | Game-ready backdrops, plus `assets/vo/` for voice-over |

## Art

Saqer (dark-grey thobe, red-and-white shemagh, goatee), Dana, the tiles, enemies, gates and the
Petra and Wadi Rum backdrops are painted in code at start-up, so there are no sprite sheets to rebuild.
The Amman backdrops and the icons still come from `art/`:

```bash
powershell -ExecutionPolicy Bypass -File tools/build_backgrounds.ps1
```

```bash
powershell -ExecutionPolicy Bypass -File tools/make_icons.ps1
```

`tools/build_sprites.ps1`, `tools/build_grow.ps1` and the files in `assets/sprites/` belong to the
earlier hero sprite and are no longer used by the game.

## Art layers (back to front)

1. Far sky. Amman: `sky_day.png` / `sky_sunset.png` (with `sky: 'cycle'` it fades from midday to
   sunset as the clock runs down). Petra and Wadi Rum: painted in `js/art.js`.
2. City skyline (Amman) or two layers of cliffs / mesas and dunes that scroll at different speeds.
3. Tiles, gates, enemies and characters, all drawn in code and ready to swap for your own art.
