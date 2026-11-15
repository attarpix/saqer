# Saqer · صقر — the clean version

Edit here, test locally, then ship `dist/`.

| Folder / file | What it is |
|---|---|
| `index.html`, `css/`, `js/`, `sw.js` | the game, readable: **edit these** |
| `assets/backgrounds/` | Amman by day (PNG, crisp pixels), Amman at sunset, the title picture, the theatre crowd (12 frames of video 3) |
| `assets/sprites/` | Saqer, Hercules, the creatures, the temple and the city layers, ready-cut: one sheet per group + `sprites.json` |
| `assets/sounds/` | the crowd |
| `art-src/` | the big original sheets the sprites are cut from (not shipped) |
| `tools/` | `build.mjs` (makes `dist/`), `bake.html` (re-cuts the sprites from `art-src/`) |
| `dist/` | **what ships**: made by the build, never edit it |

## Test locally
- Readable version: launch **saqer-clean** → http://localhost:8092
- Shipped (minified) version: `npm run build`, then launch **saqer-dist** → http://localhost:8093
- Add `?debug` to the address so test runs never go on the real top 10.

## Ship
`npm run build`, play `dist/` locally, then publish `dist/`. Bump `VERSION` in `sw.js` (and the V number on the title in `index.html`) every time, so players' phones fetch the new files.

## Changed a sheet in art-src/?
Launch **saqer-bake**, open http://localhost:8091/tools/bake.html: it rewrites `assets/sprites/`. New art drawn in Aseprite can skip this: export PNG at 1×, on the 2-px grid, and load it directly.
