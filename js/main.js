/* ============================================================
   BOOT — canvas sizing, asset loading, main loop, PWA hooks
   ============================================================ */
import { VW, VH, RES, STEP } from './config.js';
import { loadAssets } from './assets.js';
import { initRender, render } from './render.js';
import { initInput } from './input.js';
import { initUI, setHidden } from './ui.js';
import { boot, update, newGame, pause, resume, restartStage, toggleSound, toTitle, continueGame, debugStage } from './game.js';
import { G, W, player } from './state.js';
import { level } from './level.js';
import { keys } from './input.js';
import { IMG, SPRITES } from './assets.js';
import { ART } from './art.js';

// open the game with ?debug to inspect state from the console: __saqer.G, __saqer.player …
// __saqer.step(n) advances n frames by hand (handy when the tab is in the background)
// __saqer.stage(2) jumps straight to the third stage
window.__saqerUp = true;   // index.html shows a 'too old' message if this never runs
const DEBUG = new URLSearchParams(location.search).has('debug');
const INFO = new URLSearchParams(location.search).has('info');
const NOROT = new URLSearchParams(location.search).has('flat');   // ?flat never turns the game
if (DEBUG) {
  window.__saqer = {
    G, W, player, level, keys, IMG, ART, update, render,
    get SPRITES() { return SPRITES; },
    stage: debugStage,
    step: (n = 1) => { for (let i = 0; i < n; i++) update(); render(); },
    hold: false,          // true = the game only advances when you call step()
  };
}

const canvas = document.getElementById('game');
const frame = document.getElementById('frame');
canvas.width = VW * RES;
canvas.height = VH * RES;

/* Pixel-perfect fit: scale in whole device pixels when the loss is small,
   otherwise fill the screen with a fractional scale (phones). */
function fit() {
  const vv = window.visualViewport;
  let aw = vv ? vv.width : window.innerWidth;
  let ah = vv ? vv.height : window.innerHeight;
  // a phone held upright: turn the whole game on its side (css body.rot), so it is always landscape
  // only a screen that is itself upright (a phone held straight): car screens and tablets on a stand can
  // report a tall browser window although the screen is wide, and must never be turned
  const upright = !window.screen || !screen.width || screen.height > screen.width;
  const rot = !NOROT && document.body.classList.contains('touch') && ah > aw && upright;
  document.body.classList.toggle('rot', rot);
  if (rot) [aw, ah] = [ah, aw];
  const dpr = window.devicePixelRatio || 1;
  const cw = canvas.width, ch = canvas.height;
  let s = Math.min((aw * dpr) / cw, (ah * dpr) / ch);
  if (s >= 1 && Math.floor(s) / s >= 0.85) s = Math.floor(s);
  const cssW = (cw * s) / dpr, cssH = (ch * s) / dpr;
  frame.style.width = cssW + 'px';
  frame.style.height = cssH + 'px';
  document.documentElement.style.setProperty('--u', (cssW / VW) + 'px');
  if (INFO) showInfo(rot, cssW, cssH);
}

/* open the game with ?info to see what this screen reports (for car screens and odd browsers) */
function showInfo(rot, cssW, cssH) {
  let box = document.getElementById('info');
  if (!box) {
    box = document.createElement('pre'); box.id = 'info';
    box.style.cssText = 'position:fixed;top:0;left:0;z-index:99;margin:0;padding:8px;background:rgba(0,0,0,.8);color:#ffe08a;font:14px/1.5 monospace;white-space:pre-wrap;pointer-events:none;max-width:100%';
    document.body.appendChild(box);
  }
  const vv = window.visualViewport, r = n => Math.round(n);
  box.textContent = [
    'window ' + r(window.innerWidth) + ' x ' + r(window.innerHeight),
    'visual ' + (vv ? r(vv.width) + ' x ' + r(vv.height) + ' scale ' + vv.scale : 'none'),
    'screen ' + screen.width + ' x ' + screen.height + '  dpr ' + window.devicePixelRatio,
    'page   ' + document.documentElement.clientWidth + ' x ' + document.documentElement.clientHeight,
    'game   ' + r(cssW) + ' x ' + r(cssH) + '  turned ' + rot + '  touch ' + document.body.classList.contains('touch'),
    navigator.userAgent,
  ].join('\n');
}
window.addEventListener('resize', fit);
window.visualViewport && window.visualViewport.addEventListener('resize', fit);
fit();

/* touch devices get the on-screen pad */
const coarse = window.matchMedia('(pointer: coarse)');
const setTouch = on => { document.body.classList.toggle('touch', on); fit(); };
setTouch(coarse.matches);
window.addEventListener('touchstart', () => setTouch(true), { once: true, passive: true });

document.addEventListener('visibilitychange', () => { if (document.hidden && (G.state === 'play' || G.state === 'goal')) pause(); });

/* ---------------- PWA ---------------- */
let installEvt = null;
window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); installEvt = e; setHidden('#btn-install', false); });
window.addEventListener('appinstalled', () => setHidden('#btn-install', true));
if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(err => console.warn('SW failed', err)));
}

async function tryFullscreen() {
  const el = document.documentElement;
  if (document.fullscreenElement || !el.requestFullscreen || !document.body.classList.contains('touch')) return;
  try { await el.requestFullscreen({ navigationUI: 'hide' }); if (screen.orientation && screen.orientation.lock) await screen.orientation.lock('landscape'); } catch (_e) { /* optional */ }
}

/* ---------------- start ---------------- */
initRender(canvas);
initInput();
initUI({
  start: () => { tryFullscreen(); newGame(); },
  sound: toggleSound,
  install: async () => { if (!installEvt) return; installEvt.prompt(); await installEvt.userChoice; installEvt = null; setHidden('#btn-install', true); },
  resume,
  restart: restartStage,
  quit: toTitle,
  retry: continueGame,
});

const bar = document.getElementById('load-bar');
loadAssets(p => { bar.style.width = Math.round(p * 100) + '%'; })
  .then(() => {
    document.getElementById('loading').remove();
    boot();
    requestAnimationFrame(loop);
  })
  .catch(err => {
    console.error(err);
    document.getElementById('load-msg').textContent = 'LOAD ERROR: ' + err.message;
  });

let last = 0, acc = 0;
function loop(t) {
  requestAnimationFrame(loop);
  if (DEBUG && window.__saqer.hold) { last = t; return; }
  if (!last) last = t;
  let dt = t - last; last = t;
  if (dt > 250) dt = 250;
  acc += dt;
  let n = 0;
  while (acc >= STEP && n < 5) { update(); acc -= STEP; n++; }
  if (n === 5) acc = 0;
  render();
}

/* ---------------- test cheat ----------------
   Type  attar10x  while playing: Saqer cannot be hurt, and a fall puts him back
   on the last ground he stood on. Type it again to switch it off. */
let typed = '';
window.addEventListener('keydown', e => {
  // read the physical keys (e.code), so it works whatever language the keyboard is set to (Arabic too)
  const m = /^Key([A-Z])$/.exec(e.code) || /^(?:Digit|Numpad)(\d)$/.exec(e.code);
  if (!m || e.repeat) return;
  const ch = m[1].toLowerCase();
  if (ch === 'r' && typed.endsWith('atta')) e.stopImmediatePropagation();   // the R in the word must not restart the stage
  typed = (typed + ch).slice(-8);
  if (typed !== 'attar10x') return;
  typed = '';
  G.god = !G.god;
  G.banner = { lines: [G.god ? 'ATTAR10X: UNKILLABLE' : 'ATTAR10X: OFF', G.god ? 'NOTHING CAN HURT SAQER NOW.' : 'BACK TO NORMAL.'], t: 200 };
}, true);
