/* ============================================================
   UI — DOM overlay screens (title, story, pause, game over)
   Menus live in the DOM so they are touch friendly, support Arabic
   (RTL) text and scale with the pixel frame via the --u variable.
   ============================================================ */
import { sfx, playVO, stopVO, voPlaying } from './audio.js';

const $ = s => document.querySelector(s);
let openName = null;
let handlers = {};
let story = null;   // { pages, i, shown, done, timer }

export function initUI(h) {
  handlers = h;
  document.querySelectorAll('[data-act]').forEach(btn => {
    btn.addEventListener('click', e => {
      e.preventDefault();
      sfx.select();
      const act = btn.dataset.act;
      if (act === 'story-next') return storyAdvance();
      if (act === 'story-skip') return storyFinish();
      handlers[act] && handlers[act]();
    });
  });
  $('#screen-story').addEventListener('pointerdown', e => {
    if (e.target.closest('button')) return;
    storyAdvance();
  });
}

export function showScreen(name) {
  document.querySelectorAll('.screen').forEach(s => s.classList.toggle('open', s.id === 'screen-' + name));
  openName = name;
  document.body.classList.add('menu-open');
  const first = $(`#screen-${name} button:not([hidden])`);
  if (first) first.focus({ preventScroll: true });
}
export function hideScreens() {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('open'));
  openName = null;
  document.body.classList.remove('menu-open');
  if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
}
export const uiOpen = () => openName !== null;
export const uiScreen = () => openName;

export function setText(sel, txt) { const el = $(sel); if (el) el.textContent = txt; }
export function setHidden(sel, hidden) { const el = $(sel); if (el) el.hidden = hidden; }

/* keyboard / gamepad navigation inside menus */
export function uiConfirm() {
  if (openName === 'story') return storyAdvance();
  const el = document.activeElement;
  if (el && el.tagName === 'BUTTON' && el.closest('.screen.open')) el.click();
  else { const b = document.querySelector('.screen.open button:not([hidden])'); if (b) b.click(); }
}
export function uiMove(dir) {
  const btns = [...document.querySelectorAll('.screen.open button:not([hidden])')];
  if (!btns.length) return;
  const i = btns.indexOf(document.activeElement);
  btns[(i + dir + btns.length) % btns.length].focus({ preventScroll: true });
  sfx.tick();
}

/* ---------------- story pages with a typewriter effect ----------------
   `vars` fills the {goal} {mahr} … placeholders, `flags` decides which
   pages with a `when:` condition are shown (see story.js). */
const fill = (s, vars) => (s || '').replace(/\{(\w+)\}/g, (m, k) => (k in vars ? vars[k] : m));

export function showStory(pages, done, vars = {}, flags = {}) {
  const list = (pages || [])
    .filter(p => !p.when || flags[p.when])
    .map(p => ({ ...p, text: fill(p.text, vars), ar: fill(p.ar, vars) }));
  if (!list.length) { done(); return; }
  // bg / cast / tent carry forward from the page that set them
  let bg = 'amman', cast = [], tent = false;
  for (const p of list) {
    if (p.bg) bg = p.bg; if (p.cast) cast = p.cast; if (p.tent !== undefined) tent = !!p.tent;
    p.bg = bg; p.cast = cast; p.tent = tent;
  }
  story = { pages: list, i: 0, shown: 0, done, timer: null };
  showScreen('story');
  renderPage();
}

/** what the cutscene should draw right now (null when no story is showing) */
export function storyView() {
  if (!story) return null;
  const p = story.pages[story.i];
  return { page: p, bg: p.bg, cast: p.cast, tent: p.tent, talking: story.shown < p.text.length || voPlaying() };
}

function renderPage() {
  const p = story.pages[story.i];
  setText('#story-speaker', p.speaker || '');
  setHidden('#story-speaker', !p.speaker);
  const ar = $('#story-ar');
  ar.textContent = p.ar || ''; ar.hidden = !p.ar;
  story.shown = 0;
  const txt = $('#story-text');
  txt.textContent = '';
  clearInterval(story.timer);
  playVO(p.vo);                                     // stops the previous line first
  story.timer = setInterval(() => {
    story.shown += 1;
    txt.textContent = p.text.slice(0, story.shown);
    if (story.shown % 3 === 0 && !p.vo) sfx.tick();   // no typing blips over a voice
    if (story.shown >= p.text.length) clearInterval(story.timer);
  }, 28);
  setText('#story-page', `${story.i + 1}/${story.pages.length}`);
}
function storyAdvance() {
  if (!story) return;
  const p = story.pages[story.i];
  if (story.shown < p.text.length) {               // first press completes the line
    clearInterval(story.timer); story.shown = p.text.length; $('#story-text').textContent = p.text;
    return;
  }
  story.i++;
  if (story.i >= story.pages.length) storyFinish();
  else renderPage();
}
function storyFinish() {
  if (!story) return;
  clearInterval(story.timer);
  stopVO();
  const done = story.done; story = null;
  hideScreens();
  done();
}
