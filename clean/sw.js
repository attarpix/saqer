/* ============================================================
   SERVICE WORKER — offline play
   Bump VERSION whenever you ship changed files so players get them.
   ============================================================ */
const VERSION = 'saqer-v67';
const CORE = [
  './',
  'index.html',
  'manifest.webmanifest',
  /*CODE*/'css/style.css',
  'js/main.js', 'js/config.js', 'js/state.js', 'js/tiles.js', 'js/level.js', 'js/levels.js',
  'js/story.js', 'js/physics.js', 'js/world.js', 'js/player.js', 'js/render.js', 'js/art.js',
  'js/assets.js', 'js/audio.js', 'js/input.js', 'js/ui.js', 'js/game.js', 'js/storage.js', 'js/board.js',
  'js/pix.js', 'js/lang.js', 'js/stats.js', 'js/saqer.js', 'js/quest.js', 'js/boss.js', 'js/scenery.js',/*END*/   // npm run build puts the bundled game.js + style.css here
  'assets/backgrounds/title.jpg', 'assets/backgrounds/amman_day.png', 'assets/backgrounds/amman_sunset.jpg',
  ...Array.from({ length: 12 }, (_, i) => 'assets/backgrounds/crowd/crowd_' + String(i + 1).padStart(2, '0') + '.jpg'),
  'assets/sprites/sprites.json', 'assets/sprites/saqer.png', 'assets/sprites/hercules.png', 'assets/sprites/creatures.png',
  'assets/sprites/temple.png', 'assets/sprites/city.png',
  'assets/sounds/crowd_roar.mp3', 'assets/sounds/crowd_clap.mp3',
  'icons/icon-192.png', 'icons/icon-512.png', 'icons/icon-maskable-512.png', 'icons/apple-touch-icon.png',
];
/* Voice-over recordings (assets/vo/…) and your own Dana picture are not listed here:
   they are saved for offline play the first time the game uses them. */

// only whole, successful responses can be stored (audio is often sent in pieces)
const keep = (req, r) => { if (r.status === 200) { const copy = r.clone(); caches.open(VERSION).then(c => c.put(req, copy)).catch(() => {}); } return r; };

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // Google Fonts: cache-first, refresh in the background
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    e.respondWith(caches.open(VERSION + '-fonts').then(async c => {
      const hit = await c.match(req);
      const net = fetch(req).then(r => { if (r.ok || r.type === 'opaque') c.put(req, r.clone()); return r; }).catch(() => hit);
      return hit || net;
    }));
    return;
  }
  if (url.origin !== location.origin) return;
  if (['localhost', '127.0.0.1'].includes(location.hostname)) return;   // testing on this PC: always straight from the files, never a saved copy

  // Code + pages: network first (fresh while developing), cache when offline.
  // Images/data: cache first (they're large and rarely change).
  const isAsset = /\.(png|json|webp|jpg|mp3|ogg|wav)$/.test(url.pathname);
  if (isAsset) {
    e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(r => keep(req, r))));
  } else {
    // ask the server every time (no-cache): the browser may otherwise reuse a copy up to 10 minutes old
    e.respondWith(fetch(req.url, { cache: 'no-cache', credentials: 'same-origin' }).then(r => keep(req, r))
      .catch(() => caches.match(req).then(hit => hit || (req.mode === 'navigate' ? caches.match('index.html') : undefined))));
  }
});
