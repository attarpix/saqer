# Art requests

This is the list of pictures the game would like from you. It works both ways:

- **You** make a picture, save it with the file name below into `assets/custom/`, and reload the game.
  The game picks it up by itself and uses it instead of the built-in drawing. A missing file is fine.
- **Whoever is coding** (Claude) adds a row here whenever a new picture is needed, with the size and what it is for,
  and tells you in the chat. Rows marked **wanted** are waiting for you.

Rules for every picture: PNG, **real transparent background** (not a painted grey checkerboard), pixel-art style
matching Saqer and Hercules, light coming from the top-left, a dark outline round characters and objects.
Sizes are in pixels. Bigger is fine as long as the shape (width : height) stays the same.

## Slots the game already reads from `assets/custom/`

| File name | Size (px) | What it is | Notes | Status |
|---|---|---|---|---|
| `vault_backdrop.png` | 1280 × 832 | The wall behind the lower level (the vaults under the Roman street) | Must repeat left-to-right without a visible join. Dark, so Saqer and the gold stand out. No floor: the game draws the floor. | **wanted** |
| `roar.png` | 192 × 168 | Hercules' lion-roar that flies across the arena | Facing **right** (the game mirrors it). A roaring lion head with sound rings behind it. | **wanted** |
| `shockwave.png` | 112 × 96 | The wave that runs along the floor when the club lands | Dust and cracked stone, wider at the bottom, bottom edge flat on the ground. | **wanted** |
| `rubble.png` | 512 × 160 | The wrecked gate under the fallen pillar | Broken limestone blocks and pieces of arch, bottom edge flat on the ground, tallest in the middle. | **wanted** |
| `hercules_kneel.png` | about 190 × 150 | Hercules on one knee, out of breath (the moment Saqer can stomp him) | Side view, facing **right**, same scale as the sheet you made (he stands about 216 px tall in the game), feet on the bottom edge. | **wanted** |
| `golden_jameed.png` | 128 × 128 | The golden jameed | Only if you want your own. | optional |
| `key.png` | 128 × 128 | The bronze key | optional | optional |
| `heart_full.png`, `heart_empty.png` | 120 × 104 | The hit bar | optional | optional |

## Wanted, but needs code first (tell Claude when you have them)

| What | Size (px) | Notes |
|---|---|---|
| **Saqer walking, side view**: 6 frames | each 150 × 150, all the same size, feet on the same line | The walk on the current sheet barely moves, so the game animates his shoes itself. Real frames would look better: one full stride, arms swinging, shemagh tail moving. |
| **Saqer running, side view**: 6 frames | each 150 × 150 | Same rules. The run frames on the sheet are stuck together. |
| **Creatures of Philadelphia** | each about 64 × 64, 2 frames | To replace the modern "naughty guy" in the past: for example a Roman guard, a goat, a street dog. Side view, facing left. |
| **Lower-level floor and wall tiles** | 64 × 64 each, repeat on all sides | Floor top, floor fill, wall block. Only if you want to replace the built-in grey stone. |
| **The Roman pillar, real transparency** | about 300 × 900 | The current one has a painted checkerboard that the game cuts away in code. |
| **Philadelphia backdrop without the big pillar in the middle** | 2800 × 600, repeats left-to-right | The current backdrop is mirrored to make it repeat, which shows the same pillar again and again. |

## How to ask for more

Say what you want changed in the chat. If it needs a picture, Claude adds a row to the first table (with the file name
already wired into `js/assets.js`) and tells you the size. You make it, drop it in `assets/custom/`, reload.
