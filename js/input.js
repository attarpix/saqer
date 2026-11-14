/* ============================================================
   INPUT — keyboard, on-screen touch pad, gamepad
   `keys` holds held buttons; `takeAction(name)` consumes one-shot
   presses (start, pause, mute, restart, confirm, up, down).
   ============================================================ */
import { unlockAudio } from './audio.js';
import { G } from './state.js';

export const keys = { left: false, right: false, down: false, jump: false, run: false };
const src = { kb: {}, touch: {}, pad: {} };
const actions = new Set();

export const takeAction = a => actions.delete(a);
export const pushAction = a => actions.add(a);

const KEYMAP = {
  ArrowLeft: 'left', KeyA: 'left',
  ArrowRight: 'right', KeyD: 'right',
  ArrowDown: 'down', KeyS: 'down',
  Space: 'jump', ArrowUp: 'jump', KeyW: 'jump', KeyZ: 'jump', KeyK: 'jump',
  ShiftLeft: 'run', ShiftRight: 'run', KeyX: 'run', KeyJ: 'run',
};
const ACTIONMAP = {
  Enter: 'confirm', Space: 'confirm', KeyZ: 'confirm',
  Escape: 'pause', KeyP: 'pause',
  KeyM: 'mute', KeyR: 'restart',
  ArrowUp: 'up', KeyW: 'up', ArrowDown: 'down', KeyS: 'down',
};

function merge() {
  for (const k in keys) keys[k] = !!(src.kb[k] || src.touch[k] || src.pad[k]);
}

export function initInput() {
  window.addEventListener('keydown', e => {
    unlockAudio();
    if (!e.repeat) G.presses++;                         // (a note on screen goes at the next press)
    const k = KEYMAP[e.code];
    if (k) { src.kb[k] = true; e.preventDefault(); }
    if (!e.repeat && ACTIONMAP[e.code]) { actions.add(ACTIONMAP[e.code]); e.preventDefault(); }
    merge();
  });
  window.addEventListener('keyup', e => {
    const k = KEYMAP[e.code];
    if (k) { src.kb[k] = false; e.preventDefault(); }
    merge();
  });
  window.addEventListener('blur', () => { src.kb = {}; src.touch = {}; merge(); actions.add('blur'); });

  /* ---- on-screen buttons (phones) ----
     left side: ▲ jump (like Space) and ▼ down. right side: ◀ back and ▶ forward.
     Each button works while it is pressed; several can be pressed at once (walk and jump). */
  const pad = document.getElementById('touch');
  if (pad) {
    const held = new Map();                                       // pointer → the button it pressed
    const update = () => {
      const t = {};
      for (const b of held.values()) t[b.dataset.key] = true;
      if (t.jump && !src.touch.jump) actions.add('up');
      if (t.down && !src.touch.down) actions.add('down');
      src.touch = t; merge();
      pad.querySelectorAll('[data-key]').forEach(b => b.classList.toggle('down', !!t[b.dataset.key]));
    };
    for (const b of pad.querySelectorAll('.pad [data-key]')) {
      b.addEventListener('pointerdown', e => {
        unlockAudio();
        held.set(e.pointerId, b); G.presses++;
        try { b.setPointerCapture(e.pointerId); } catch (_e) { /* pointer already gone */ }
        update(); e.preventDefault();
      });
      const end = e => { if (held.get(e.pointerId) === b) { held.delete(e.pointerId); update(); } };
      b.addEventListener('pointerup', end);
      b.addEventListener('pointercancel', end);
      b.addEventListener('lostpointercapture', end);
      b.addEventListener('contextmenu', e => e.preventDefault());
    }
    const ps = pad.querySelector('[data-action]');
    if (ps) ps.addEventListener('pointerdown', e => { unlockAudio(); actions.add(ps.dataset.action); e.preventDefault(); });
  }
  window.addEventListener('pointerdown', unlockAudio, { passive: true });
}

/* ---- gamepad (standard mapping) ---- */
const prevPad = {};
export function pollGamepad() {
  const pads = navigator.getGamepads ? navigator.getGamepads() : [];
  const gp = pads && [...pads].find(p => p && p.connected);
  if (!gp) { if (Object.keys(src.pad).length) { src.pad = {}; merge(); } return; }
  const b = i => !!(gp.buttons[i] && gp.buttons[i].pressed);
  const ax = gp.axes[0] || 0, ay = gp.axes[1] || 0;
  src.pad = {
    left: b(14) || ax < -0.4, right: b(15) || ax > 0.4, down: b(13) || ay > 0.5,
    jump: b(0) || b(1), run: b(2) || b(3),
  };
  const edge = (name, now) => { if (now && !prevPad[name]) { actions.add(name); unlockAudio(); G.presses++; } prevPad[name] = now; };
  edge('confirm', b(0) || b(9));
  edge('pause', b(9));
  edge('up', b(12) || ay < -0.5);
  edge('down', b(13) || ay > 0.5);
  merge();
}
