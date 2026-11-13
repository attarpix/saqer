/* ============================================================
   PLAY COUNTER — GoatCounter (goatcounter.com): free, no cookies, no ad tracking.
   Put your GoatCounter code here (the "saqer" in saqer.goatcounter.com) to switch it on.
   It counts visits to the page, and these moments as events:
     start         someone pressed START
     philadelphia  someone travelled back in time
     hercules      someone beat Hercules
   Nothing is counted on localhost or with ?debug, so testing does not add to the numbers.
   ============================================================ */
export const GOATCOUNTER = 'attarpix';

const on = () => GOATCOUNTER && !['localhost', '127.0.0.1'].includes(location.hostname) && !/[?&]debug/.test(location.search);

export function initStats() {
  if (!on()) return;
  const s = document.createElement('script');
  s.async = true;
  s.src = 'https://gc.zgo.at/count.js';
  s.dataset.goatcounter = 'https://' + GOATCOUNTER + '.goatcounter.com/count';
  document.head.appendChild(s);
}

const done = new Set();
export function stat(name) {
  if (!on() || done.has(name)) return;             // once per visit
  done.add(name);
  const send = () => window.goatcounter && window.goatcounter.count({ path: name, title: name, event: true });
  if (window.goatcounter && window.goatcounter.count) send(); else setTimeout(send, 3000);
}
