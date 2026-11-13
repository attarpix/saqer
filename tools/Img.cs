using System;
using System.Collections.Generic;
using System.Drawing;
using System.Drawing.Imaging;
using System.Runtime.InteropServices;

public static class Img {
    public static int W, H;
    public static int[] Px;       // ARGB
    public static bool[] Bg;      // flooded background

    public static void Load(string path) {
        using (var b = new Bitmap(path)) {
            W = b.Width; H = b.Height; Px = new int[W * H];
            var d = b.LockBits(new Rectangle(0, 0, W, H), ImageLockMode.ReadOnly, PixelFormat.Format32bppArgb);
            Marshal.Copy(d.Scan0, Px, 0, Px.Length); b.UnlockBits(d);
        }
    }
    static int Mx(int c) { int r = (c >> 16) & 255, g = (c >> 8) & 255, b = c & 255; return Math.Max(r, Math.Max(g, b)); }

    // Flood from image border through any pixel whose max channel >= darkT.
    // Also treat "glow" pixels: background is smooth & desaturated-dark.
    public static void Flood(int darkT) {
        Bg = new bool[W * H];
        var st = new Stack<int>();
        for (int x = 0; x < W; x++) { st.Push(x); st.Push((H - 1) * W + x); }
        for (int y = 0; y < H; y++) { st.Push(y * W); st.Push(y * W + W - 1); }
        while (st.Count > 0) {
            int i = st.Pop();
            if (Bg[i]) continue;
            if (Mx(Px[i]) < darkT) continue;
            Bg[i] = true;
            int x = i % W, y = i / W;
            if (x > 0) st.Push(i - 1); if (x < W - 1) st.Push(i + 1);
            if (y > 0) st.Push(i - W); if (y < H - 1) st.Push(i + W);
        }
    }

    static int Diff(int a, int b) {
        return Math.Abs(((a >> 16) & 255) - ((b >> 16) & 255)) + Math.Abs(((a >> 8) & 255) - ((b >> 8) & 255)) + Math.Abs((a & 255) - (b & 255));
    }
    // Flood from the border, stepping only across small colour changes (smooth backgrounds).
    public static void FloodGrad(int maxDiff, int darkT) {
        Bg = new bool[W * H];
        var st = new Stack<int>();
        for (int x = 0; x < W; x++) { st.Push(x); st.Push((H - 1) * W + x); }
        for (int y = 0; y < H; y++) { st.Push(y * W); st.Push(y * W + W - 1); }
        foreach (var s in st) Bg[s] = true;
        while (st.Count > 0) {
            int i = st.Pop();
            int x = i % W, y = i / W;
            int[] nb = { x > 0 ? i - 1 : -1, x < W - 1 ? i + 1 : -1, y > 0 ? i - W : -1, y < H - 1 ? i + W : -1 };
            foreach (int n in nb) {
                if (n < 0 || Bg[n]) continue;
                if (Mx(Px[n]) < darkT) continue;
                if (Diff(Px[i], Px[n]) > maxDiff) continue;
                Bg[n] = true; st.Push(n);
            }
        }
    }
    // Flood only from the top edge (for skies), then drop every foreground island that does not
    // reach the bottom rows (clouds, sun) so only the city silhouette survives.
    public static void FloodSky(int maxDiff, int bottomRows) {
        Bg = new bool[W * H];
        var st = new Stack<int>();
        for (int x = 0; x < W; x++) { Bg[x] = true; st.Push(x); }
        while (st.Count > 0) {
            int i = st.Pop(); int x = i % W, y = i / W;
            int[] nb = { x > 0 ? i - 1 : -1, x < W - 1 ? i + 1 : -1, y > 0 ? i - W : -1, y < H - 1 ? i + W : -1 };
            foreach (int n in nb) {
                if (n < 0 || Bg[n]) continue;
                if (Diff(Px[i], Px[n]) > maxDiff) continue;
                Bg[n] = true; st.Push(n);
            }
        }
        var keep = new bool[W * H];
        for (int x = 0; x < W; x++) for (int y = H - bottomRows; y < H; y++) { int i = y * W + x; if (!Bg[i] && !keep[i]) { keep[i] = true; st.Push(i); } }
        while (st.Count > 0) {
            int i = st.Pop(); int x = i % W, y = i / W;
            int[] nb = { x > 0 ? i - 1 : -1, x < W - 1 ? i + 1 : -1, y > 0 ? i - W : -1, y < H - 1 ? i + W : -1 };
            foreach (int n in nb) if (n >= 0 && !Bg[n] && !keep[n]) { keep[n] = true; st.Push(n); }
        }
        for (int i = 0; i < W * H; i++) if (!keep[i]) Bg[i] = true;
        for (int i = 0; i < W * H; i++) if (Bg[i]) Px[i] = Px[i] & 0x00FFFFFF; // alpha 0
    }
    public static void Binarize(int[] d) {
        for (int i = 0; i < d.Length; i++) { int a = (d[i] >> 24) & 255; d[i] = a >= 140 ? (d[i] | unchecked((int)0xFF000000)) : 0; }
    }

    // Grow background into thin anti-alias fringe: fg pixels touching bg that are not dark and are
    // "between" bg colour and outline (low brightness) get eaten.
    public static void Erode(int maxBright) {
        var kill = new List<int>();
        for (int i = 0; i < W * H; i++) {
            if (Bg[i]) continue; int x = i % W, y = i / W;
            bool touch = (x > 0 && Bg[i - 1]) || (x < W - 1 && Bg[i + 1]) || (y > 0 && Bg[i - W]) || (y < H - 1 && Bg[i + W]);
            if (touch && Mx(Px[i]) > 40 && Mx(Px[i]) < maxBright) kill.Add(i);
        }
        foreach (var k in kill) Bg[k] = true;
    }

    // connected components of foreground; returns "x0,y0,x1,y1,area"
    public static List<string> Components(int minArea) {
        var res = new List<string>();
        var seen = new bool[W * H];
        var st = new Stack<int>();
        for (int s = 0; s < W * H; s++) {
            if (Bg[s] || seen[s]) continue;
            int x0 = W, y0 = H, x1 = 0, y1 = 0, area = 0;
            st.Push(s); seen[s] = true;
            while (st.Count > 0) {
                int i = st.Pop(); area++;
                int x = i % W, y = i / W;
                if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
                int[] nb = { x > 0 ? i - 1 : -1, x < W - 1 ? i + 1 : -1, y > 0 ? i - W : -1, y < H - 1 ? i + W : -1 };
                foreach (int n in nb) if (n >= 0 && !Bg[n] && !seen[n]) { seen[n] = true; st.Push(n); }
            }
            if (area >= minArea) res.Add(x0 + "," + y0 + "," + x1 + "," + y1 + "," + area);
        }
        return res;
    }

    // Downsample a source rect into cell grid of size `cell` px; each output pixel = median-ish (mode by
    // center sampling) of fg pixels; transparent if majority background.
    public static int[] Down(int sx, int sy, int sw, int sh, double cell, out int ow, out int oh) {
        ow = (int)Math.Round(sw / cell); oh = (int)Math.Round(sh / cell);
        var o = new int[ow * oh];
        for (int y = 0; y < oh; y++) for (int x = 0; x < ow; x++) {
            int ax = sx + (int)(x * cell), ay = sy + (int)(y * cell);
            int bx = sx + (int)((x + 1) * cell), by = sy + (int)((y + 1) * cell);
            // use inner 60% of the cell to avoid antialiased borders
            int mx = (int)((bx - ax) * 0.2), my = (int)((by - ay) * 0.2);
            long r = 0, g = 0, b = 0; int n = 0, tot = 0;
            for (int yy = ay + my; yy < by - my; yy++) for (int xx = ax + mx; xx < bx - mx; xx++) {
                if (xx < 0 || yy < 0 || xx >= W || yy >= H) continue;
                tot++; int i = yy * W + xx; if (Bg[i]) continue;
                int c = Px[i]; r += (c >> 16) & 255; g += (c >> 8) & 255; b += c & 255; n++;
            }
            if (tot == 0 || n * 2 < tot) { o[y * ow + x] = 0; continue; }
            int R = (int)(r / n), G = (int)(g / n), B = (int)(b / n);
            // snap near-black to pure outline colour for a crisp pixel look
            if (Math.Max(R, Math.Max(G, B)) < 48) { R = 16; G = 10; B = 12; }
            o[y * ow + x] = unchecked((int)0xFF000000) | (R << 16) | (G << 8) | B;
        }
        return o;
    }

    public static int[] Tight(int x0, int y0, int x1, int y1) {
        int a = x1, b = y1, c = x0, d = y0;
        for (int y = y0; y <= y1; y++) for (int x = x0; x <= x1; x++) {
            if (Bg[y * W + x]) continue;
            if (x < a) a = x; if (x > c) c = x; if (y < b) b = y; if (y > d) d = y;
        }
        return new int[] { a, b, c, d };
    }

    public static void Save(int[] data, int w, int h, string path) {
        using (var b = new Bitmap(w, h, PixelFormat.Format32bppArgb)) {
            var d = b.LockBits(new Rectangle(0, 0, w, h), ImageLockMode.WriteOnly, PixelFormat.Format32bppArgb);
            Marshal.Copy(data, 0, d.Scan0, data.Length); b.UnlockBits(d);
            b.Save(path, ImageFormat.Png);
        }
    }

    // Debug: write mask-composited image (bg -> magenta)
    public static void SaveMask(string path) {
        var o = new int[W * H];
        for (int i = 0; i < W * H; i++) o[i] = Bg[i] ? unchecked((int)0xFFFF00FF) : Px[i];
        Save(o, W, H, path);
    }

    // Area-average resize of whole image region (for backgrounds), optional colour quantisation step.
    public static int[] Resize(int sx, int sy, int sw, int sh, int ow, int oh, int quant) {
        var o = new int[ow * oh];
        double fx = (double)sw / ow, fy = (double)sh / oh;
        for (int y = 0; y < oh; y++) for (int x = 0; x < ow; x++) {
            int ax = sx + (int)(x * fx), ay = sy + (int)(y * fy), bx = sx + (int)((x + 1) * fx), by = sy + (int)((y + 1) * fy);
            if (bx <= ax) bx = ax + 1; if (by <= ay) by = ay + 1;
            long r = 0, g = 0, b = 0, a = 0; int n = 0;
            for (int yy = ay; yy < by; yy++) for (int xx = ax; xx < bx; xx++) {
                int c = Px[yy * W + xx]; int A = (c >> 24) & 255;
                r += ((c >> 16) & 255); g += ((c >> 8) & 255); b += (c & 255); a += A; n++;
            }
            int R = (int)(r / n), G = (int)(g / n), B = (int)(b / n), AA = (int)(a / n);
            if (quant > 1) { R = R / quant * quant; G = G / quant * quant; B = B / quant * quant; }
            o[y * ow + x] = (AA << 24) | (R << 16) | (G << 8) | B;
        }
        return o;
    }
}
