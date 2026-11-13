# Saqer: plan and instructions for the next builder (Claude Opus 5.5)

Read this whole file before touching the code. Then read `README.md`, `ART_REQUESTS.md` and `js/quest.js`.

To start a session, the owner can paste this:

> Read PLAN_FOR_OPUS.md in this folder and follow it. Start with Phase 1. Before you change anything, start the
> game with the `saqer` preview, play-test it with tools/shot.sh, and tell me what you found.

---

## 1. What this game is

**Saqer · صقر** is a browser platformer (installable PWA) made to show Jordan well. The owner is the designer and
artist; he is not a programmer. He makes art with image generators and Photoshop and describes what he wants in
short, fast messages.

**The idea in one line:** it *starts* as a familiar run-and-jump platformer in today's downtown Amman, and then
*becomes its own game*: pulling the flag throws Saqer back 1,900 years to Roman **Philadelphia** (Φιλαδέλφεια), where
the stage opens up, he explores above and below the street, and fights **Hercules** in the Roman theatre. Each later
chapter should travel to another moment of Jordan's history and add a mechanic of its own.

**The hero** is a real person: black thobe, red-and-white shemagh with a black agal, glasses, short beard.

### Rules that do not change

1. **It must be its own game.** Familiar genre mechanics (run, jump, stomp, blocks, a flag) are fine. Never copy
   another game's characters, art, music, level layouts, names or look. The first hero sprite was a famous plumber's
   face in a shemagh and was thrown out for that reason. Power-ups are **jameed** (grow), **mansaf** (extra life),
   the **golden jameed** (stay grown, 3-hit bar). Do not introduce mushrooms, pipes, turtles or similar.
2. **Hidden, not deleted.** Dana (the princess), the mahr story and four finished stages (Citadel, Petra, Wadi Rum)
   are in `js/levels.js` and `js/story.js`. The owner said to hide them for now and never delete them. They will
   return when the story continues.
3. **Represent Jordan accurately and warmly.** Use real history. Philadelphia was a city of the Decapolis; the
   theatre (about 6,000 seats) was built under Antoninus Pius; the Temple of Hercules on the Citadel dates from
   about AD 162–166; the Romans vaulted over the stream (the Seil) that ran through the city. Check facts on the
   web before putting them on screen.
4. **The owner's story and words win.** All dialogue in the game is placeholder until he supplies his own lines and
   voice-over. He is also making a cinematic that plays before the Hercules fight.
5. **Never send his name or email to outside services.**

## 2. The machine and how to work on it

- Windows 11. **No Node, no Python.** PowerShell and Git Bash are available. Chrome is installed.
- Plain ES modules, no build step. `serve.ps1` is the static server. Preview config: `.claude/launch.json`,
  name `saqer`, port 8090. Open `http://localhost:8090/?debug` to get `window.__saqer`
  (`G`, `W`, `player`, `level`, `keys`, `ART`, `SPRITES`, `stage(nameOrIndex, column)`, `step(n)`, `hold`).
- **The in-app preview pane is too small to judge art.** Use `bash tools/shot.sh <name> '<js>'`: it runs your
  script against the held game in headless Chrome and saves `exports/shots/<name>.png` at 1280 × 960. Inside the
  script you get `S` (= `__saqer`), `press(key, frames)`, and `W` (the game window). Whatever you `return` is
  printed under the picture. Look at the picture with the Read tool. `exports/shots/*.js` has working examples
  (`fight.js` is a scripted player for the boss, `walk.js` checks the walk, the cheat and the double stomp).
- **Shell trap:** bash heredocs that contain apostrophes have failed on this machine. Write files with the Write
  tool; use `sed` only for one-line changes.
- Not a git repository. If you want history, ask the owner before running `git init`.
- After changing files that ship, bump `VERSION` in `sw.js` and keep its `CORE` list in step.
- Cheat for the owner's own testing: typing `attar10x` in play toggles unkillable (it reads physical keys, so it
  works on an Arabic keyboard layout). Keep it working.

## 3. How the code is laid out

World units: a tile is 16 units, the view is 320 × 240 units, the canvas is 1280 × 960 (`RES` = 4 px per unit).
Tiles and small props are painted in code at 32 px and doubled with a texture pass; characters come from painted
sheets at full resolution.

| File | What it holds |
|---|---|
| `js/quest.js` | **The game as played now**: the areas `amman`, `phila`, `under`, `theater`, built with the level builder |
| `js/level.js` | Tile grid and the builder API (`ground`, `row`, `block`, `column`, `stairs`, `lift`, `shaftDown`, `wayUp`, `key`, `bars`, `clear`, enemies) |
| `js/tiles.js` | Tile ids and the characters used in `row()` strings |
| `js/game.js` | State machine, moving between areas (each area remembers its state), respawn, the flag cutscene, victory, camera |
| `js/player.js` | Saqer's physics, growing, the 3-hit bar, the unkillable cheat |
| `js/world.js` | Blocks, enemies, lifts, items, scoring, the golden jameed, the key and gate, on-screen messages (`say`) |
| `js/boss.js` | Hercules: his states, attacks, when he can be hurt |
| `js/render.js` | All drawing: backdrops, tiles, Saqer (including the coded walk), Hercules, HUD, cutscenes, the old-film effect |
| `js/sheets.js` | Cuts Saqer, Hercules and the pillar out of the painted sheets at start-up (flood-fill the background, find the figures) |
| `js/art.js` | Code-painted tiles, creatures, gates, themes, the texture pass |
| `js/assets.js` | Loading, and the **custom art slots** (`assets/custom/…`) |
| `js/story.js` | All dialogue. `STORY.beforeBoss` / `STORY.afterBoss` are the slots for the theatre scenes |
| `js/levels.js`, `js/saqer.js` | The hidden mahr stages, and the code-drawn Dana (and an older code-drawn Saqer, unused) |
| `js/audio.js` | Synthesised sound effects, two tunes, voice-over playback |
| `tools/build_new_art.ps1` | Turns pictures in `art/new` into `assets/bg/*.jpg` and `assets/src/*.png` |
| `tools/map.html` | Exports a whole area as one picture (`/tools/map.html?stage=1`), for the owner to draw on |

Flow: `amman` (one-way, plays like stage 1) → flag → `updateGoal()` in `game.js` (white-out, year counter, title,
pillar falls, lift appears) → `phila` (free roaming) ⇄ `under` (via `shaftDown` / `wayUp` links) → `theater`
(`beginBoss`, then `boss.js`) → `victory`.

## 4. Where it stands (be honest about this with the owner)

Working and checked by script and screenshot: all four areas load; the flag sequence; the golden jameed and hit
bar; falling into the vaults and riding a lift back up; the key and the bronze gate; the Hercules fight from first
blow to respawn; the old-film look; the cheat; landing on two enemies at once.

Not yet done or not yet verified:

- **Nobody has played it start to finish by hand.** Difficulty, pacing and feel are untested.
- The last lift (vaults → theatre) was not ridden in a test, only the identical lifts elsewhere.
- No search-bot proof that `phila` and `under` can be completed and that every gold lira is reachable. An earlier
  version of the game had such a bot (random input macros with state snapshot and restore); rebuild it.
- Touch controls and the offline install were not re-tested since the resolution change.
- `tools/characters.html` and `tools/map.html` were written for the earlier code; check them and fix or remove.
- The HUD still says MAHR although Dana is hidden. The owner said to leave scoring alone for now.
- The Philadelphia backdrop repeats by mirroring; the big pillar in it shows again and again.
- Assets total about 8 MB. Fine locally, heavy for a phone on mobile data.

## 5. The plan

Work in this order. Finish and show each phase before starting the next. For every phase: say what you are about to
do in two lines, do it, test it with `tools/shot.sh`, then show the owner a screenshot and the result.

### Phase 1: make what exists solid

1. Play every area with scripts and fix what breaks. Ride the theatre lift.
2. Rebuild the search bot and prove: `phila` → key → gate → theatre is completable without the cheat; all gold
   liras are reachable; no place traps the player (for example a pit with no way out, a lift that cannot be boarded).
3. Tune the Hercules fight with the scripted player in `exports/shots/fight.js` until a careful player wins with
   one or two hearts left. Each attack must be readable before it lands (wind-up at least 30 frames).
4. Fix the two tool pages. Re-test touch controls at a phone size and the offline install.
   **Done when:** the bot finishes the game three times with different seeds, and the owner has played it once.

### Phase 2: make the first chapter feel finished

1. **Saqer's animation.** Walking is animated in code (`drawWalk` in `render.js`) because the sheet's walk frames
   are almost identical. If the owner supplies real walk and run frames (see `ART_REQUESTS.md`), use them; until
   then improve the coded version (a swinging arm, the shemagh tail lagging behind, a skid when he turns).
2. **The lower level.** It is a first draft. Give each of the three vaults one idea of its own: for example rising
   and falling water in one, darkness with torches Saqer lights in another, a crumbling floor in the third.
   Keep the rule that the key is in one vault and the gate in another, so the player has to come up and go down again.
3. **Philadelphia street.** Replace the modern "naughty guy" with period creatures when the art arrives. Add two or
   three places that reward looking around (a rooftop route, a walled garden, a column to topple).
4. **The fight.** Add a second half when Hercules is at half health (the crowd throws things onto the arena that
   Saqer can stand on, or the floor cracks). Use the owner's cinematic before the fight when he delivers it: he will
   say whether it is a video file or a sequence of pictures; build the player for whichever it is, with a skip button.
5. **Sound.** A third tune for the past, a crowd roar that rises with each hit, footsteps on stone.
   **Done when:** the owner says the first chapter is good.

### Phase 3: bring the story back

Ask the owner how Dana and the mahr fit the time-travel story before building anything. Then un-hide her scenes
(`STORY.intro`, `STORY.levels`, `STORY.ending` are intact), drop in his real lines and his voice-over files
(`assets/vo/`, one line plays at a time, see the top of `js/story.js`), and decide with him what the dinars buy.

### Phase 4: more of Jordan

The three hidden stages (Citadel, Petra, Wadi Rum) are finished one-way stages. Turn each into a chapter with the
same shape as the first: arrive in the present, something sends Saqer back, the place opens up, a guardian from that
age at the end. Suggestions to check against real history and to agree with the owner first: Petra and a Nabataean
guardian at the Treasury; the desert castles; Ajloun castle; Umm Qais; Wadi Rum and the Arab Revolt railway.
Each chapter adds exactly one new mechanic.

### Phase 5: ship it

Shrink the assets (WebP or smaller JPGs, a pre-cut sprite atlas instead of cutting sheets at start-up), a loading
screen that shows progress honestly, save the furthest chapter reached, a settings screen, then publish to a static
host over HTTPS and test the install on a real phone.

## 6. Asking the owner for art

He wants to be asked. When something needs a picture:

1. Add a slot to `CUSTOM` in `js/assets.js` (file name → what it replaces), so the game uses the file the moment it
   exists and still works without it.
2. Add a row to `ART_REQUESTS.md`: file name, exact pixel size, which way it faces, what must be on the bottom edge,
   and "real transparent background".
3. Tell him in the chat in one or two plain sentences. Never block on it: paint a simple stand-in in code first.

When he drops new pictures in `art/new`, look at every one with the Read tool before using it. Generated sheets are
not on a grid and often have a fake checkerboard instead of transparency; `js/sheets.js` shows how to cut them.
Do not use frames that contain another game's items (his first Saqer sheet has two such frames; they are unused).

## 7. Working with the owner

- He sends several short messages while you are working. Read each one, say in a line what you understood, fold it
  into the work, and keep going. Do not stop to ask unless the answer changes what you build; when you must ask,
  offer two or three choices with one recommended.
- He reads screenshots, not code. Show a picture for every visual change.
- Write to him in plain words. No file paths or function names unless he asks.
- Say clearly what you tested and what you did not. Never tell him something works because the code looks right.
- He hits usage limits mid-task. Leave the game in a runnable state after every step, and keep this file's
  section 4 up to date so the next session knows where things stand.
- When he says "open it in my browser": run `Start-Process "http://localhost:8090/"` with the preview server running.
