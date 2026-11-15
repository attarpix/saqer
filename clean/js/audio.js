/* ============================================================
   AUDIO — tiny WebAudio synth: sound effects + a looping
   chiptune in maqam Hijaz. The context is created/resumed on the
   first user gesture (mobile browsers start it suspended).
   ============================================================ */
let ctx = null, master = null, musicBus = null, muted = false;

export function unlockAudio() {
  if (!ctx) {
    try {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      master = ctx.createGain(); master.gain.value = muted ? 0 : 1; master.connect(ctx.destination);
      musicBus = ctx.createGain(); musicBus.gain.value = 0.55; musicBus.connect(master);
    } catch (_e) { ctx = null; }
  }
  if (ctx && ctx.state === 'suspended') ctx.resume().catch(() => {});
}

export function setMuted(m) {
  muted = m;
  if (master) master.gain.setValueAtTime(m ? 0 : 1, ctx.currentTime);
  if (voice) voice.muted = m;
}
export const isMuted = () => muted;
export const audioOut = () => master;      // for the music test page (music/listen.html)

/* ---------- voice-over: one line at a time ----------
   Starting a line (or leaving the story) always stops the line before it,
   so two voices can never talk over each other. */
let voice = null;
export function playVO(src) {
  stopVO();
  if (!src) return;
  voice = new Audio(src);
  voice.muted = muted;
  voice.play().catch(() => { /* file missing or autoplay blocked: the text still shows */ });
}
export function stopVO() {
  if (!voice) return;
  voice.pause();
  voice.src = '';
  voice = null;
}
export const voPlaying = () => !!voice && !voice.paused && !voice.ended;

function tone(f1, f2, dur, type = 'square', vol = 0.05, delay = 0, bus = master) {
  if (!ctx) return;
  const t = ctx.currentTime + delay;
  const o = ctx.createOscillator(), g = ctx.createGain();
  o.type = type;
  o.frequency.setValueAtTime(f1, t);
  if (f2 !== f1) o.frequency.exponentialRampToValueAtTime(f2, t + dur);
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g); g.connect(bus);
  o.start(t); o.stop(t + dur + 0.02);
}

function noise(dur, vol = 0.06, delay = 0) {
  if (!ctx) return;
  const t = ctx.currentTime + delay;
  const len = Math.floor(ctx.sampleRate * dur);
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const s = ctx.createBufferSource(), g = ctx.createGain(), f = ctx.createBiquadFilter();
  f.type = 'lowpass'; f.frequency.value = 1800;
  s.buffer = buf; g.gain.value = vol;
  s.connect(f); f.connect(g); g.connect(master); s.start(t);
}

export const sfx = {
  jump:   () => tone(330, 640, 0.13, 'square', 0.04),
  bigJump:() => tone(240, 520, 0.16, 'square', 0.045),
  coin:   () => { tone(988, 988, 0.06, 'square', 0.04); tone(1319, 1319, 0.22, 'square', 0.04, 0.06); },
  stomp:  () => { tone(420, 140, 0.1, 'square', 0.05); noise(0.05, 0.03); },
  bump:   () => tone(140, 90, 0.08, 'square', 0.05),
  brick:  () => { noise(0.18, 0.08); tone(200, 60, 0.15, 'triangle', 0.06); },
  item:   () => tone(300, 900, 0.3, 'triangle', 0.06),
  grow:   () => [0, 1, 2, 3, 4, 5].forEach(i => tone(392 * Math.pow(1.19, i), 392 * Math.pow(1.19, i), 0.07, 'square', 0.04, i * 0.06)),
  shrink: () => [0, 1, 2, 3, 4].forEach(i => tone(700 / Math.pow(1.2, i), 700 / Math.pow(1.2, i), 0.07, 'square', 0.04, i * 0.06)),
  oneUp:  () => [659, 784, 1319, 1047, 1175, 1568].forEach((f, i) => tone(f, f, 0.09, 'square', 0.04, i * 0.08)),
  lira:   () => [1175, 1480, 1760, 2349, 1760, 2349].forEach((f, i) => tone(f, f, 0.11, 'triangle', 0.06, i * 0.07)),
  die:    () => { tone(600, 80, 0.9, 'square', 0.05); },
  kick:   () => tone(500, 200, 0.12, 'square', 0.05),
  goal:   () => [587, 740, 784, 880, 1175].forEach((f, i) => tone(f, f, 0.18, 'square', 0.045, i * 0.12)),
  tick:   () => tone(1500, 1500, 0.03, 'square', 0.02),
  hurry:  () => [880, 932, 880, 932].forEach((f, i) => tone(f, f, 0.09, 'square', 0.045, i * 0.1)),
  pause:  () => { tone(660, 660, 0.06, 'square', 0.04); tone(990, 990, 0.08, 'square', 0.04, 0.07); },
  select: () => tone(880, 1200, 0.06, 'square', 0.035),
  roar:   () => { tone(170, 60, 0.55, 'sawtooth', 0.07); noise(0.4, 0.05); },
  thud:   () => { tone(110, 40, 0.3, 'triangle', 0.09); noise(0.22, 0.09); },
  cheer:  () => { noise(0.9, 0.035); [523, 659, 784].forEach((f, i) => tone(f, f, 0.12, 'triangle', 0.03, i * 0.09)); },
  warp:   () => [0, 1, 2, 3, 4, 5, 6, 7].forEach(i => tone(220 * Math.pow(1.26, i), 440 * Math.pow(1.26, i), 0.16, 'triangle', 0.05, i * 0.09)),
  block:  () => tone(900, 700, 0.07, 'square', 0.04),
};

/* ---------- music: one original tune, in two times ----------
   Today's Amman: the tune in C major on chip voices (two pulse waves, a bouncing triangle bass, a ticking hat).
   The past: the same tune in maqam Hijaz on C (D, A and B each fall a semitone: C Db E F G Ab Bb),
   played on a plucked oud with tremolo on the long notes, a low drone and the maqsum on the darbuka.
   music.travel() plays the change itself when the flag is pulled: one pass of the tune in which the notes bend
   into Hijaz, the chip voices fade into the oud and the drone and darbuka come in, then a short taqsim.
   (The melody is written for Saqer; it is not taken from any other game.) */
const mtof = m => 440 * Math.pow(2, (m - 69) / 12);
/* major → Hijaz: D, A and B lowered a semitone, by `k` (0 = major, 1 = Hijaz) */
const bend = (m, k) => { const pc = ((m % 12) + 12) % 12; return mtof(m - ((pc === 2 || pc === 9 || pc === 11) ? k : 0)); };

/* the tune: [midi, eighths], 0 = rest. 8 bars of 8 eighths. Chords: C  Am  F  G | C  Am  F-G  C */
const TUNE = [
  [72, 1], [76, 1], [79, 2], [76, 1], [79, 1], [84, 2],
  [81, 2], [79, 1], [76, 1], [74, 2], [72, 2],
  [77, 1], [77, 1], [76, 1], [77, 1], [81, 2], [79, 2],
  [79, 1], [77, 1], [76, 1], [74, 1], [71, 2], [0, 2],
  [72, 1], [76, 1], [79, 2], [84, 1], [83, 1], [81, 2],
  [79, 1], [81, 1], [79, 1], [76, 1], [74, 2], [76, 2],
  [77, 2], [76, 1], [74, 1], [71, 2], [74, 2],
  [72, 4], [0, 4],
];
const STEPS = 64;
const MEL = new Array(STEPS).fill(null);
{ let s = 0; for (const [m, l] of TUNE) { if (m) MEL[s] = [m, l]; s += l; } }
const ROOTS = [48, 45, 41, 43, 48, 45, 41, 48];                   // one per bar (bar 7 moves to G halfway)
const BASS_STEP = [0, null, 7, null, 12, null, 7, 0];             // the bounce, in semitones above the root
const MAQSUM = ['D', 'T', '-', 'T', 'D', '-', 'T', '-'];

/* ---- voices ---- */
let pulseWave = null;
function chip(t, dur, f, vol, duty = 0.5) {
  if (!pulseWave) {                                                // a real pulse wave, like an old console
    const N = 32, re = new Float32Array(N), im = new Float32Array(N);
    for (let k = 1; k < N; k++) im[k] = (2 / (k * Math.PI)) * Math.sin(k * Math.PI * duty);
    pulseWave = ctx.createPeriodicWave(re, im);
  }
  const o = ctx.createOscillator(), g = ctx.createGain();
  o.setPeriodicWave(pulseWave); o.frequency.setValueAtTime(f, t);
  g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + 0.005);
  g.gain.setValueAtTime(vol * 0.8, t + dur * 0.7); g.gain.linearRampToValueAtTime(0.0001, t + dur);
  o.connect(g); g.connect(musicBus); o.start(t); o.stop(t + dur + 0.02);
}
function tri(t, dur, f, vol) {
  const o = ctx.createOscillator(), g = ctx.createGain();
  o.type = 'triangle'; o.frequency.setValueAtTime(f, t);
  g.gain.setValueAtTime(vol, t); g.gain.setValueAtTime(vol, t + dur * 0.85); g.gain.linearRampToValueAtTime(0.0001, t + dur);
  o.connect(g); g.connect(musicBus); o.start(t); o.stop(t + dur + 0.02);
}
let noiseBuf = null;
function noiseSrc() {
  if (!noiseBuf) {
    noiseBuf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.5), ctx.sampleRate);
    const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  const s = ctx.createBufferSource(); s.buffer = noiseBuf; return s;
}
function hat(t, vol) {
  const s = noiseSrc(), f = ctx.createBiquadFilter(), g = ctx.createGain();
  f.type = 'highpass'; f.frequency.value = 7000;
  g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.04);
  s.connect(f); f.connect(g); g.connect(musicBus); s.start(t); s.stop(t + 0.05);
}
/* the oud: a short pluck. A pick click, two bright strings that darken quickly, a wooden body, no sustain. */
function oud(t, f, vol, scoop = 0) {
  const len = 0.55, out = ctx.createGain(), body = ctx.createBiquadFilter(), lp = ctx.createBiquadFilter();
  body.type = 'peaking'; body.frequency.value = 240; body.Q.value = 1.4; body.gain.value = 6;
  lp.type = 'lowpass'; lp.Q.value = 2.5;
  lp.frequency.setValueAtTime(Math.min(7000, f * 8), t); lp.frequency.exponentialRampToValueAtTime(Math.max(500, f * 1.6), t + 0.22);
  out.gain.setValueAtTime(0.0001, t); out.gain.linearRampToValueAtTime(vol, t + 0.004);
  out.gain.exponentialRampToValueAtTime(vol * 0.35, t + 0.12); out.gain.exponentialRampToValueAtTime(0.0001, t + len);
  for (const [type, det, v] of [['sawtooth', -4, 0.6], ['square', 5, 0.35]]) {     // the double course of strings
    const o = ctx.createOscillator(), og = ctx.createGain();
    o.type = type; o.detune.value = det; og.gain.value = v;
    o.frequency.setValueAtTime(scoop ? f * Math.pow(2, -scoop / 1200) : f, t);
    if (scoop) o.frequency.exponentialRampToValueAtTime(f, t + 0.06);
    o.connect(og); og.connect(lp); o.start(t); o.stop(t + len + 0.02);
  }
  const click = noiseSrc(), cf = ctx.createBiquadFilter(), cg = ctx.createGain();   // the pick
  cf.type = 'bandpass'; cf.frequency.value = 2500; cf.Q.value = 1;
  cg.gain.setValueAtTime(vol * 0.5, t); cg.gain.exponentialRampToValueAtTime(0.0001, t + 0.012);
  click.connect(cf); cf.connect(cg); cg.connect(out); click.start(t); click.stop(t + 0.02);
  lp.connect(body); body.connect(out); out.connect(musicBus);
}
/* darbuka: the dum is deep with a pitch drop, the tek is a dry crack on the rim */
function dum(t, vol) {
  const o = ctx.createOscillator(), g = ctx.createGain();
  o.type = 'sine'; o.frequency.setValueAtTime(150, t); o.frequency.exponentialRampToValueAtTime(58, t + 0.12);
  g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + 0.005); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.32);
  o.connect(g); g.connect(musicBus); o.start(t); o.stop(t + 0.35);
}
function tek(t, vol) {
  const s = noiseSrc(), f = ctx.createBiquadFilter(), g = ctx.createGain();
  f.type = 'bandpass'; f.frequency.value = 3800; f.Q.value = 2.2;
  g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.05);
  s.connect(f); f.connect(g); g.connect(musicBus); s.start(t); s.stop(t + 0.06);
  const o = ctx.createOscillator(), og = ctx.createGain();       // a little ring in the skin
  o.type = 'triangle'; o.frequency.value = 820;
  og.gain.setValueAtTime(vol * 0.3, t); og.gain.exponentialRampToValueAtTime(0.0001, t + 0.04);
  o.connect(og); og.connect(musicBus); o.start(t); o.stop(t + 0.05);
}
/* the drone: C and G under the past, filtered dark; its level follows the music */
let drone = null;
function droneOn() {
  if (drone) return drone;
  const g = ctx.createGain(), lp = ctx.createBiquadFilter();
  g.gain.value = 0; lp.type = 'lowpass'; lp.frequency.value = 480; lp.connect(g); g.connect(musicBus);
  const os = [36, 43, 48].map((m, i) => { const o = ctx.createOscillator(); o.type = i ? 'sawtooth' : 'triangle'; o.frequency.value = mtof(m); o.detune.value = i * 3 - 3;
    const og = ctx.createGain(); og.gain.value = i ? 0.25 : 0.6; o.connect(og); og.connect(lp); o.start(); return o; });
  return (drone = { g, os });
}
function droneOff() {
  if (!drone) return;
  const d = drone; drone = null;
  d.g.gain.setTargetAtTime(0, ctx.currentTime, 0.15);
  setTimeout(() => d.os.forEach(o => { try { o.stop(); } catch (_e) {} }), 900);
}

/* ---- the player ---- */
const MODES = {
  now:  { k: 0, step: 0.150 },        // Amman today: brisk
  past: { k: 1, step: 0.200 },        // Philadelphia: broader
};
let timer = null, step = 0, nextT = 0, mode = MODES.now, fastK = 1;
let travel = null, queued = null;

/* everything one eighth-note does. k = how far into Hijaz (0…1) */
function playStep(s, t, k, dur) {
  const chipV = 1 - k, oudV = k, bar = Math.floor(s / 8) % 8, inBar = s % 8;
  const ev = MEL[s % STEPS];
  if (ev) {
    const [m, l] = ev, f = bend(m, k), d = l * dur;
    if (chipV > 0.03) {
      chip(t, d * 0.92, f, 0.034 * chipV);
      chip(t, d * 0.92, f / 2, 0.012 * chipV, 0.25);                 // a thin echo an octave down
    }
    if (oudV > 0.03) {
      if (l >= 2) for (let i = 0; i < l * 2; i++) oud(t + i * dur / 2, f, (i ? 0.055 : 0.085) * oudV, i ? 0 : 35);   // tremolo on long notes
      else oud(t, f, 0.085 * oudV, 25);
    }
  }
  // the bass: the chip bounce today; in the past the oud strikes the root on the dum
  let root = ROOTS[bar]; if (bar === 6 && inBar >= 4) root = 43;
  const bs = BASS_STEP[inBar];
  if (chipV > 0.05 && bs !== null) tri(t, dur * 0.8, bend(root + bs, k), 0.075 * chipV);
  if (oudV > 0.05 && (inBar === 0 || inBar === 4)) oud(t, bend(root, k), 0.06 * oudV);
  // rhythm: the maqsum in the past (the hi-hat that ticked behind the modern tune is gone)
  if (oudV > 0.05) {
    const p = MAQSUM[inBar];
    if (p === 'D') dum(t, 0.16 * oudV);
    else if (p === 'T') tek(t, 0.07 * oudV);
  }
  if (drone) drone.g.gain.setTargetAtTime(0.022 * oudV, t, 0.4);
}

function schedule() {
  while (nextT < ctx.currentTime + 0.15) {
    let k = mode.k, dur = mode.step / fastK;
    if (travel) {                                                   // the change: one pass, bending as it goes
      const p = Math.min(1, travel.n / STEPS);
      k = p * p * (3 - 2 * p);
      dur = MODES.now.step + (MODES.past.step - MODES.now.step) * k;
      if (travel.n >= STEPS) { taqsim(nextT); return; }
      travel.n++;
    }
    playStep(step, nextT, k, dur);
    nextT += dur; step = (step + 1) % STEPS;
  }
}
/* the taqsim: a free little run down the maqam on the oud, then the music waits for the past */
function taqsim(t0) {
  clearInterval(timer); timer = null;
  const run = [[79, 0.3], [80, 0.18], [79, 0.18], [77, 0.4], [76, 0.25], [73, 0.25], [72, 0.9]];
  let t = t0 + 0.1;
  for (const [m, d] of run) {
    const reps = d > 0.35 ? Math.round(d / 0.07) : 1;                 // long notes trembled
    for (let i = 0; i < reps; i++) oud(t + i * 0.07, mtof(m), i ? 0.05 : 0.09, i ? 0 : 50);
    t += d;
  }
  dum(t - 0.2, 0.2);
  if (drone) drone.g.gain.setTargetAtTime(0, t, 0.5);
  travel = null;
  const q = queued; queued = null;
  setTimeout(() => { droneOff(); if (q && !timer) music.start(q[0], q[1]); }, Math.max(0, (t - ctx.currentTime) * 1000 + 600));
}

export const music = {
  /* fast = the boss fight. name: 'amman' = today; anything else ('south') = the past */
  start(fast = false, name = 'amman') {
    if (!ctx) return;
    if (travel) { queued = [fast, name]; return; }                  // the change is still playing: wait for it
    this.stop();
    mode = name === 'amman' ? MODES.now : MODES.past;
    fastK = fast ? 1.3 : 1;
    if (mode.k > 0) droneOn();
    step = 0; nextT = ctx.currentTime + 0.05;
    timer = setInterval(schedule, 25);
    if (fast) crowd.startClap();                                     // the fight: the crowd claps along
  },
  /* the time travel: call when the flag is pulled */
  travel() {
    if (!ctx) return;
    this.stop(true);
    travel = { n: 0 }; queued = null;
    droneOn();
    step = 0; nextT = ctx.currentTime + 0.05;
    timer = setInterval(schedule, 25);
  },
  stop(force = false) {
    if (travel && !force) return;                                    // leaving the world mid-change keeps the change going
    if (timer) clearInterval(timer);
    timer = null; travel = null;
    droneOff();
    crowd.stopClap();
  },
  get playing() { return !!timer; },
};

/* ---------- the theatre crowd: recorded sound from the owner's videos ----------
   A clapping loop under the fight, and a roar when Saqer lands a blow.
   Until the files are loaded (or if they fail) the synth cheer plays instead. */
const CROWD_FILES = { roar: 'assets/sounds/crowd_roar.mp3', clap: 'assets/sounds/crowd_clap.mp3' };
const crowdBuf = {};
let crowdLoading = false, clapSrc = null, clapGain = null, lastRoar = -9;
function loadCrowd() {
  if (crowdLoading || !ctx) return;
  crowdLoading = true;
  for (const [k, url] of Object.entries(CROWD_FILES)) {
    fetch(url).then(r => r.arrayBuffer()).then(b => ctx.decodeAudioData(b)).then(buf => { crowdBuf[k] = buf; }).catch(() => {});
  }
}
export const crowd = {
  roar() {
    loadCrowd();
    if (!crowdBuf.roar) { sfx.cheer(); return; }
    if (ctx.currentTime - lastRoar < 1.2) return;            // one roar at a time
    lastRoar = ctx.currentTime;
    const s = ctx.createBufferSource(), g = ctx.createGain();
    s.buffer = crowdBuf.roar; g.gain.value = 0.7;
    s.connect(g); g.connect(master);
    s.start(); s.stop(ctx.currentTime + 3.2);
    g.gain.setValueAtTime(0.7, ctx.currentTime + 2.4); g.gain.linearRampToValueAtTime(0.0001, ctx.currentTime + 3.2);
  },
  startClap() {
    loadCrowd();
    if (!ctx || clapSrc) return;
    if (!crowdBuf.clap) { setTimeout(() => { if (wantClap) crowd.startClap(); }, 400); wantClap = true; return; }
    wantClap = true;
    clapSrc = ctx.createBufferSource(); clapGain = ctx.createGain();
    clapSrc.buffer = crowdBuf.clap; clapSrc.loop = true; clapGain.gain.value = 0.22;
    clapSrc.connect(clapGain); clapGain.connect(master); clapSrc.start();
  },
  stopClap() {
    wantClap = false;
    if (!clapSrc) return;
    try { clapSrc.stop(); } catch (_e) {}
    clapSrc = null; clapGain = null;
  },
};
let wantClap = false;
