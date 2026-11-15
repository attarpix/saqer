/* ============================================================
   BUILD — makes dist/, the version that ships to players.
     npm run build
   • js/ (25 files) → game.js: one minified file
   • css/style.css → style.css, minified
   • index.html and sw.js point at those, comments and spare spaces removed
   • assets/, icons/ and the manifest are copied as they are
   Edit the readable files (js/, css/, index.html, sw.js); never edit dist/.
   ============================================================ */
import { build } from 'esbuild';
import { rmSync, mkdirSync, cpSync, readFileSync, writeFileSync, statSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DIST = join(ROOT, 'dist');
const at = p => join(ROOT, p), to = p => join(DIST, p);

rmSync(DIST, { recursive: true, force: true });
mkdirSync(DIST);

// the code: one file, minified (the syntax is left as written, so it runs wherever it runs today)
await build({ entryPoints: [at('js/main.js')], bundle: true, minify: true, format: 'esm', target: 'esnext', outfile: to('game.js'), legalComments: 'none', logLevel: 'warning' });
await build({ entryPoints: [at('css/style.css')], minify: true, outfile: to('style.css'), logLevel: 'warning' });

// the page
const version = /const VERSION = 'saqer-(v\d+)'/.exec(readFileSync(at('sw.js'), 'utf8'))[1];
let html = readFileSync(at('index.html'), 'utf8');
html = html
  .replace(/css\/style\.css\?v=\d+/, 'style.css?' + version)
  .replace(/js\/main\.js\?v=\d+/, 'game.js?' + version)
  .replace(/<!--[\s\S]*?-->/g, '')
  .replace(/^\s+/gm, '')
  .replace(/\n{2,}/g, '\n');
if (!html.includes('game.js?') || !html.includes('style.css?')) throw new Error('index.html: script or stylesheet link not found');
writeFileSync(to('index.html'), html);

// the service worker: the bundled files in place of the source list
let sw = readFileSync(at('sw.js'), 'utf8').replace(/\/\*CODE\*\/[\s\S]*?\/\*END\*\//, "'style.css', 'game.js',");
if (sw.includes('js/main.js')) throw new Error('sw.js: the /*CODE*/ … /*END*/ list was not replaced');
writeFileSync(to('sw.js'), sw);
await build({ entryPoints: [to('sw.js')], minify: true, outfile: to('sw.js'), allowOverwrite: true, logLevel: 'warning' });

for (const p of ['assets', 'icons', 'manifest.webmanifest']) cpSync(at(p), to(p), { recursive: true });
writeFileSync(to('.nojekyll'), '');                                   // GitHub Pages: serve the files as they are

// what it weighs
const size = p => { const s = statSync(p); return s.isDirectory() ? readdirSync(p).reduce((t, f) => t + size(join(p, f)), 0) : s.size; };
const kb = n => (n / 1024).toFixed(0) + ' KB';
console.log('dist/ ' + version);
for (const f of readdirSync(DIST)) console.log('  ' + f.padEnd(22) + kb(size(to(f))));
console.log('  total'.padEnd(24) + kb(size(DIST)));
