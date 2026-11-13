/* ============================================================
   PIX — a tiny pixel buffer for hand-built sprites.
   Parts are painted into buffers, given a dark outline, and
   stacked, which is what gives the characters their pixel-art edge.
   ============================================================ */
export const OUT = '#17121d';

export class Buf {
  constructor(w, h) { this.w = w; this.h = h; this.d = new Array(w * h).fill(null); }

  get(x, y) { return x < 0 || y < 0 || x >= this.w || y >= this.h ? null : this.d[y * this.w + x]; }

  /** c is a colour or a function (x, y) → colour */
  set(x, y, c) {
    x = Math.round(x); y = Math.round(y);
    if (typeof c === 'function') c = c(x, y);
    if (c && x >= 0 && y >= 0 && x < this.w && y < this.h) this.d[y * this.w + x] = c;
  }
  rect(x, y, w, h, c) {
    x = Math.round(x); y = Math.round(y);
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) this.set(x + i, y + j, c);
    return this;
  }
  ell(cx, cy, rx, ry, c) {
    for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) {
      for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
        const dx = (x + 0.5 - cx) / rx, dy = (y + 0.5 - cy) / ry;
        if (dx * dx + dy * dy <= 1) this.set(x, y, c);
      }
    }
    return this;
  }
  /** thick line (square brush t px wide) */
  line(x0, y0, x1, y1, t, c) {
    const n = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0) * 2));
    for (let i = 0; i <= n; i++) {
      this.rect(x0 + ((x1 - x0) * i) / n - t / 2, y0 + ((y1 - y0) * i) / n - t / 2, t, t, c);
    }
    return this;
  }
  /** filled triangle */
  tri(x0, y0, x1, y1, x2, y2, c) {
    const minX = Math.floor(Math.min(x0, x1, x2)), maxX = Math.ceil(Math.max(x0, x1, x2));
    const minY = Math.floor(Math.min(y0, y1, y2)), maxY = Math.ceil(Math.max(y0, y1, y2));
    const side = (ax, ay, bx, by, px, py) => (bx - ax) * (py - ay) - (by - ay) * (px - ax);
    for (let y = minY; y <= maxY; y++) for (let x = minX; x <= maxX; x++) {
      const px = x + 0.5, py = y + 0.5;
      const a = side(x0, y0, x1, y1, px, py), b = side(x1, y1, x2, y2, px, py), d = side(x2, y2, x0, y0, px, py);
      if ((a >= 0 && b >= 0 && d >= 0) || (a <= 0 && b <= 0 && d <= 0)) this.set(x, y, c);
    }
    return this;
  }
  outline(col = OUT) {
    const add = [];
    for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) {
      if (this.get(x, y)) continue;
      if (this.get(x - 1, y) || this.get(x + 1, y) || this.get(x, y - 1) || this.get(x, y + 1)) add.push(y * this.w + x);
    }
    for (const i of add) this.d[i] = col;
    return this;
  }
  /** stack another buffer on top of this one */
  over(b, dx = 0, dy = 0) {
    for (let y = 0; y < b.h; y++) for (let x = 0; x < b.w; x++) {
      const c = b.d[y * b.w + x];
      if (c) this.set(x + dx, y + dy, c);
    }
    return this;
  }
  /** quarter turn counter-clockwise (the top ends up on the left) */
  rot90() {
    const r = new Buf(this.h, this.w);
    for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) r.d[(this.w - 1 - x) * r.w + y] = this.d[y * this.w + x];
    return r;
  }
  /** crop to the painted area */
  trim() {
    let x0 = this.w, y0 = this.h, x1 = -1, y1 = -1;
    for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) {
      if (!this.d[y * this.w + x]) continue;
      if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
    }
    if (x1 < 0) return this;
    const r = new Buf(x1 - x0 + 1, y1 - y0 + 1);
    for (let y = 0; y < r.h; y++) for (let x = 0; x < r.w; x++) r.d[y * r.w + x] = this.d[(y + y0) * this.w + x + x0];
    return r;
  }
  paint(g, ox = 0, oy = 0) {
    for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) {
      const c = this.d[y * this.w + x];
      if (c) { g.fillStyle = c; g.fillRect(ox + x, oy + y, 1, 1); }
    }
  }
  canvas() {
    const c = document.createElement('canvas');
    c.width = this.w; c.height = this.h;
    this.paint(c.getContext('2d'));
    return c;
  }
}

/** pack buffers side by side into one sheet → { img, rects: [[x, y, w, h], …] } */
export function pack(bufs) {
  const gap = 2;
  const w = bufs.reduce((s, b) => s + b.w + gap, 0);
  const h = Math.max(...bufs.map(b => b.h));
  const img = document.createElement('canvas');
  img.width = w; img.height = h;
  const g = img.getContext('2d');
  const rects = [];
  let x = 0;
  for (const b of bufs) {
    b.paint(g, x, h - b.h);
    rects.push([x, h - b.h, b.w, b.h]);
    x += b.w + gap;
  }
  return { img, rects };
}
