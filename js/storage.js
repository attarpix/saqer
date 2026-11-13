/* ============================================================
   SAVE DATA (high score + settings). localStorage can throw in
   private windows, so every access is guarded.
   ============================================================ */
const KEY = 'saqer.save.v1';

export function loadSave() {
  try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch { return {}; }
}
export function writeSave(patch) {
  try { localStorage.setItem(KEY, JSON.stringify({ ...loadSave(), ...patch })); } catch { /* ignore */ }
}
