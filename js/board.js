/* ============================================================
   THE TOP 10 — scores saved in the hall at the end of stage one.

   Shared by everyone through Supabase (supabase.com, free): put the project's
   URL and its public "anon" key below to switch it on. The score goes on the board by itself when
   the player walks into the hall, under the name typed on the difficulty screen (or a default one).
   Until then the board keeps
   a local top 10 on this device only.

   The Supabase table (SQL editor):
     create table scores (
       id bigint generated always as identity primary key,
       name text not null check (char_length(name) between 1 and 12),
       score int not null check (score between 0 and 2000000),
       mode text not null check (mode in ('easy','hard')),
       created_at timestamptz default now()
     );
     alter table scores enable row level security;
     create policy "anyone reads"  on scores for select using (true);
     create policy "anyone adds"   on scores for insert with check (true);
   ============================================================ */
export const SUPABASE_URL = 'https://cawsosvhfeufpzbxmknl.supabase.co';   // the saqer project (organization Saqer, free plan)
export const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNhd3Nvc3ZoZmV1ZnB6Ynhta25sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTQ2NjA4NTYsImV4cCI6MjExMDIzNjg1Nn0.T7ncvLYocBuY5Z_5KVOArL9AUV69tOA920zLLKPu1Yc';   // the public anon key (safe to ship: the table only allows read and add)

const LOCAL = 'saqer.board.v1';
export const online = () => !!(SUPABASE_URL && SUPABASE_KEY);

const clean = s => String(s || '').replace(/[<>]/g, '').replace(/\s+/g, ' ').trim().slice(0, 12);

function localList() {
  try { return JSON.parse(localStorage.getItem(LOCAL)) || []; } catch (_e) { return []; }
}
function localSave(list) {
  try { localStorage.setItem(LOCAL, JSON.stringify(list.slice(0, 10))); } catch (_e) { /* private window */ }
}

let cache = null;                         // the last list fetched (the board on the wall draws this)
export const topCached = () => cache || localList();

/** the top 10, best first: [{ name, score, mode }] */
export async function fetchTop() {
  if (!online()) { cache = localList(); return cache; }
  try {
    const r = await fetch(SUPABASE_URL + '/rest/v1/scores?select=name,score,mode&order=score.desc&limit=10', {
      headers: { apikey: SUPABASE_KEY, Authorization: 'Bearer ' + SUPABASE_KEY },
    });
    if (!r.ok) throw new Error('board ' + r.status);
    cache = await r.json();
  } catch (_e) { cache = cache || localList(); }
  return cache;
}

/** save one score; resolves to true when it is stored (online, or on this device) */
export async function submitScore(name, score, mode) {
  name = clean(name);
  if (!name) return false;
  const row = { name, score: Math.max(0, Math.floor(score)), mode: mode === 'easy' ? 'easy' : 'hard' };
  const list = localList().concat(row).sort((a, b) => b.score - a.score);
  localSave(list);                                          // kept on this device either way
  if (!online()) { cache = list.slice(0, 10); return true; }
  try {
    const r = await fetch(SUPABASE_URL + '/rest/v1/scores', {
      method: 'POST',
      headers: { apikey: SUPABASE_KEY, Authorization: 'Bearer ' + SUPABASE_KEY, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
      body: JSON.stringify(row),
    });
    await fetchTop();
    return r.ok;
  } catch (_e) { return false; }
}

/* the player's name on the board: the one typed on the difficulty screen, or a default
   (SAQER-1234, made once and kept on this device) */
export function playerName() {
  let s = {};
  try { s = JSON.parse(localStorage.getItem('saqer.save.v1')) || {}; } catch (_e) { /* private window */ }
  if (clean(s.name)) return clean(s.name);
  if (!s.defaultName) {
    s.defaultName = 'SAQER-' + String(1000 + Math.floor(Math.random() * 9000));
    try { localStorage.setItem('saqer.save.v1', JSON.stringify(s)); } catch (_e) { /* private window */ }
  }
  return s.defaultName;
}
export function setPlayerName(name) {
  let s = {};
  try { s = JSON.parse(localStorage.getItem('saqer.save.v1')) || {}; } catch (_e) { /* private window */ }
  s.name = clean(name);
  try { localStorage.setItem('saqer.save.v1', JSON.stringify(s)); } catch (_e) { /* private window */ }
}
export const typedName = () => {
  try { return clean((JSON.parse(localStorage.getItem('saqer.save.v1')) || {}).name); } catch (_e) { return ''; }
};
