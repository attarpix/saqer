/* ============================================================
   COLLISION (axis-separated, tile based)
   ============================================================ */
import { TILE } from './config.js';
import { isSolid, tileAt } from './level.js';
import { HIDDEN } from './tiles.js';

export const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
export const sign = v => (v < 0 ? -1 : v > 0 ? 1 : 0);

export function overlap(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

export function rectHitsSolid(x, y, w, h) {
  const x0 = Math.floor(x / TILE), x1 = Math.floor((x + w - 0.01) / TILE);
  const y0 = Math.floor(y / TILE), y1 = Math.floor((y + h - 0.01) / TILE);
  for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) if (isSolid(tx, ty)) return true;
  return false;
}

export function moveX(e, dx) {
  if (dx === 0) return false;
  e.x += dx;
  const y0 = Math.floor(e.y / TILE);
  const y1 = Math.floor((e.y + e.h - 0.01) / TILE);
  if (dx > 0) {
    const tx = Math.floor((e.x + e.w - 0.01) / TILE);
    for (let ty = y0; ty <= y1; ty++) if (isSolid(tx, ty)) { e.x = tx * TILE - e.w; e.vx = 0; return true; }
  } else {
    const tx = Math.floor(e.x / TILE);
    for (let ty = y0; ty <= y1; ty++) if (isSolid(tx, ty)) { e.x = (tx + 1) * TILE; e.vx = 0; return true; }
  }
  return false;
}

/**
 * Vertical move. When moving up into tiles, `onCeil(tx, ty)` is called once with the
 * tile closest to the entity's centre (fixes the old bug where only the left-most
 * of two touched blocks was ever hit). `cornerSlip` nudges the entity past a block
 * corner it only clipped by a few units instead of stopping the jump dead.
 * Hidden (secret) tiles only count for a mover with an `onCeil` handler, i.e. Saqer,
 * and only when he comes up from underneath them.
 */
export function moveY(e, dy, onCeil, cornerSlip = 0) {
  if (dy === 0) return false;
  e.y += dy;
  const x0 = Math.floor(e.x / TILE);
  const x1 = Math.floor((e.x + e.w - 0.01) / TILE);

  if (dy > 0) {
    const ty = Math.floor((e.y + e.h - 0.01) / TILE);
    for (let tx = x0; tx <= x1; tx++) {
      if (isSolid(tx, ty)) { e.y = ty * TILE - e.h; e.vy = 0; e.onGround = true; return true; }
    }
    return false;
  }

  const ty = Math.floor(e.y / TILE);
  const wasBelow = e.y - dy >= (ty + 1) * TILE - 0.01;
  const hits = [];
  for (let tx = x0; tx <= x1; tx++) {
    if (isSolid(tx, ty) || (onCeil && wasBelow && HIDDEN.has(tileAt(tx, ty)))) hits.push(tx);
  }
  if (!hits.length) return false;

  if (cornerSlip > 0 && hits.length === 1) {
    const tx = hits[0];
    const overL = e.x + e.w - tx * TILE;        // how far we poke into the block from its left
    const overR = (tx + 1) * TILE - e.x;        // ... from its right
    if (overL <= cornerSlip && !isSolid(tx - 1, ty)) { e.x = tx * TILE - e.w; return false; }
    if (overR <= cornerSlip && !isSolid(tx + 1, ty)) { e.x = (tx + 1) * TILE; return false; }
  }

  const cx = e.x + e.w / 2;
  let best = hits[0], bd = Infinity;
  for (const tx of hits) { const d = Math.abs(tx * TILE + TILE / 2 - cx); if (d < bd) { bd = d; best = tx; } }
  e.y = (ty + 1) * TILE;
  e.vy = 0;
  if (onCeil) onCeil(best, ty);
  return true;
}
