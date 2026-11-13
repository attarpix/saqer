/* ============================================================
   INPUT — keyboard, on-screen touch pad, gamepad
   `keys` holds held buttons; `takeAction(name)` consumes one-shot
   presses (start, pause, mute, restart, confirm, up, down).
   ============================================================ */
import { unlockAudio } from './audio.js';

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

  /* ---- two joysticks (phones) ----
     left stick, up and down: up = jump (like Space), down = down.
     right stick, back and forward: walk (one speed).
     A thumb that lands anywhere in a stick's half of the screen grabs that stick. */
  const pad = document.getElementById('touch');
  if (pad) {
    const sticks = [...pad.querySelectorAll('.stick')].map(el => ({ el, base: el.querySelector('.stick-base'), knob: el.querySelector('.stick-knob'), axis: el.dataset.stick, ptr: null, gx: 0, gy: 0 }));
    const DEAD = 0.32, RUN = 0.85;
    const update = () => {
      const t = {};
      for (const s of sticks) {
        if (s.axis === 'h') {
          if (s.gx < -DEAD) t.left = true;
          if (s.gx > DEAD) t.right = true;

        } else {
          if (s.gy < -0.45) t.jump = true;                         // up = jump
          const dn = s.gy > 0.45;
          if (dn && !s.dnHeld) actions.add('down');
          s.dnHeld = dn;
          if (t.jump && !s.upHeld) actions.add('up');
          s.upHeld = !!t.jump;
        }
        s.el.classList.toggle('active', s.ptr !== null);
      }
      src.touch = t; merge();
    };
    const move = (s, e) => {
      const r = s.base.getBoundingClientRect();
      const rad = Math.max(r.width, r.height) / 2;
      let dx = (e.clientX - (r.left + r.width / 2)) / rad, dy = (e.clientY - (r.top + r.height / 2)) / rad;
      if (document.body.classList.contains('rot')) [dx, dy] = [dy, -dx];     // the game is turned on its side
      const m = Math.hypot(dx, dy); if (m > 1) { dx /= m; dy /= m; }
      if (s.axis === 'h') dy = 0; else dx = 0;                              // each stick moves on one line only
      s.gx = dx; s.gy = dy;
      s.knob.style.transform = `translate(${dx * 40}px, ${dy * 40}px)`;
      update();
    };
    const release = s => { s.ptr = null; s.gx = s.gy = 0; s.knob.style.transform = ''; update(); };
    for (const s of sticks) {
      s.el.addEventListener('pointerdown', e => {
        unlockAudio();
        s.ptr = e.pointerId;
        try { s.el.setPointerCapture(e.pointerId); } catch { /* pointer already gone */ }
        move(s, e); e.preventDefault();
      });
      s.el.addEventListener('pointermove', e => { if (s.ptr === e.pointerId) move(s, e); });
      const end = e => { if (s.ptr === e.pointerId) release(s); };
      s.el.addEventListener('pointerup', end);
      s.el.addEventListener('pointercancel', end);
      s.el.addEventListener('lostpointercapture', end);
      s.el.addEventListener('contextmenu', e => e.preventDefault());
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
  const edge = (name, now) => { if (now && !prevPad[name]) { actions.add(name); unlockAudio(); } prevPad[name] = now; };
  edge('confirm', b(0) || b(9));
  edge('pause', b(9));
  edge('up', b(12) || ay < -0.5);
  edge('down', b(13) || ay > 0.5);
  merge();
}
