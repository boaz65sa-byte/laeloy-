// מייצר Feature Graphic (1024×500) ל-Google Play — אותה שיטת ציור פיקסלים כמו make-icons.mjs,
// בלי תלות חיצונית. רקע גרדיאנט של המותג + נר עם להבה מוגדל במרכז (בלי טקסט — קשה לצייר עברית פיקסל-אחר-פיקסל).
import { writeFileSync } from 'node:fs';
import { deflateSync } from 'node:zlib';

const CRC_TABLE = new Int32Array(256).map((_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c;
});
function crc32(buf) {
  let c = -1;
  for (const b of buf) c = CRC_TABLE[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ -1) >>> 0;
}
function chunk(type, data) {
  const t = Buffer.from(type, 'ascii');
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([t, data])));
  return Buffer.concat([len, t, data, crc]);
}
function encodePNG(w, h, rgba) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  const raw = Buffer.alloc(h * (1 + w * 4));
  for (let y = 0; y < h; y++) {
    raw[y * (1 + w * 4)] = 0;
    rgba.copy(raw, y * (1 + w * 4) + 1, y * w * 4, (y + 1) * w * 4);
  }
  return Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', deflateSync(raw, { level: 9 })), chunk('IEND', Buffer.alloc(0))]);
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}
function clamp01(t) {
  return Math.max(0, Math.min(1, t));
}
function mix(c1, c2, t) {
  return [
    Math.round(lerp(c1[0], c2[0], t)),
    Math.round(lerp(c1[1], c2[1], t)),
    Math.round(lerp(c1[2], c2[2], t)),
  ];
}

const W = 1024;
const H = 500;
const img = Buffer.alloc(W * H * 4);
const put = (x, y, r, g, b, a = 255) => {
  const i = (y * W + x) * 4;
  img[i] = r; img[i + 1] = g; img[i + 2] = b; img[i + 3] = a;
};

const cx = W * 0.5;
const cy = H * 0.54;
const S = H; // יחידת קנה מידה תואמת לגובה — אותם יחסים כמו באייקונים

const DEEP = [9, 12, 24];
const MID = [19, 27, 52];
const WARM = [46, 34, 28];

const SPARKS = [
  { x: 0.075, y: -0.235, r: 0.018, a: 0.85 },
  { x: -0.11, y: -0.29, r: 0.012, a: 0.55 },
  { x: 0.035, y: -0.335, r: 0.009, a: 0.4 },
  { x: -0.06, y: -0.37, r: 0.006, a: 0.28 },
];
const STARS = [
  [0.1, 0.15, 0.5], [0.9, 0.12, 0.4], [0.85, 0.35, 0.5], [0.06, 0.4, 0.35],
  [0.94, 0.7, 0.45], [0.04, 0.75, 0.4], [0.5, 0.08, 0.35], [0.96, 0.5, 0.3],
  [0.15, 0.85, 0.35], [0.8, 0.85, 0.3], [0.3, 0.1, 0.3], [0.65, 0.9, 0.35],
];

for (let y = 0; y < H; y++) {
  for (let x = 0; x < W; x++) {
    const vign = clamp01(Math.hypot((x - cx) / (S * 1.55), (y - cy) / (S * 0.62)));
    let [r, g, b] = mix(MID, DEEP, vign);
    const warmDist = Math.hypot((x - cx) / (S * 0.5), (y - (cy - S * 0.19)) / (S * 0.5));
    const warmT = clamp01(1 - warmDist) * 0.5;
    [r, g, b] = mix([r, g, b], WARM, warmT);

    for (const [sx, sy, br] of STARS) {
      const ddx = x - sx * W;
      const ddy = y - sy * H;
      if (ddx * ddx + ddy * ddy < (S * 0.007) ** 2) {
        r = Math.min(255, r + br * 60);
        g = Math.min(255, g + br * 60);
        b = Math.min(255, b + br * 70);
      }
    }

    const rx = x;
    const ry = y;

    for (const sp of SPARKS) {
      const sxp = cx + sp.x * S;
      const syp = cy + sp.y * S;
      const dd = Math.hypot(rx - sxp, ry - syp) / (S * sp.r);
      if (dd < 1) {
        const glow = (1 - dd) * sp.a;
        r = Math.round(lerp(r, 255, glow));
        g = Math.round(lerp(g, 224, glow));
        b = Math.round(lerp(b, 150, glow));
      }
    }

    // גוף הנר
    const candleW = S * 0.16;
    const candleTop = cy - S * 0.02;
    const candleBottom = cy + S * 0.36;
    const dxCandle = rx - cx;
    if (Math.abs(dxCandle) < candleW / 2 && ry > candleTop && ry < candleBottom) {
      const edgeT = clamp01((dxCandle + candleW / 2) / candleW);
      [r, g, b] = mix([214, 207, 188], [248, 244, 232], 1 - Math.abs(edgeT - 0.22) * 1.8);
      const dripY = candleTop + (candleBottom - candleTop) * 0.32;
      if (dxCandle > candleW * 0.28 && ry > dripY && ry < dripY + S * 0.05) {
        const dripT = clamp01(1 - (ry - dripY) / (S * 0.05));
        if (dxCandle < candleW * (0.42 + dripT * 0.1)) { r = 231; g = 224; b = 205; }
      }
    }
    if (Math.abs(dxCandle) < S * 0.007 && ry > candleTop - S * 0.025 && ry < candleTop + S * 0.01) {
      r = 60; g = 46; b = 34;
    }

    // להבה נוטה קלות, שלוש שכבות טיפה מקוננות
    const flameBaseY = candleTop + S * 0.01;
    const flameTipY = cy - S * 0.34;
    const tNorm = clamp01((flameBaseY - ry) / (flameBaseY - flameTipY));
    const lean = S * 0.028 * tNorm * tNorm;
    const flameCx = cx + lean;
    const flameCy = cy - S * 0.16;

    const fx = (rx - flameCx) / (S * 0.135);
    const fy = (ry - flameCy) / (S * 0.185);
    const dGlow = fx * fx + fy * fy;
    if (dGlow < 3) {
      const glow = Math.max(0, 1 - dGlow / 3);
      r = Math.min(255, r + Math.round(glow * 95));
      g = Math.min(255, g + Math.round(glow * 62));
      b = Math.min(255, b + Math.round(glow * 14));
    }

    const tipNarrow = 1 + Math.max(0, -fy) * 1.55;
    const outer = fx * fx * tipNarrow + fy * fy;
    if (outer < 1) {
      const layerT = clamp01(1 - outer);
      [r, g, b] = mix([196, 78, 34], [236, 150, 62], layerT * 0.7);
      const midShape = (fx * 1.35) * (fx * 1.35) * tipNarrow + ((fy + 0.12) * 1.25) ** 2;
      if (midShape < 1) {
        const midT = clamp01(1 - midShape);
        [r, g, b] = mix([r, g, b], [247, 190, 96], midT);
        const coreShape = (fx * 2.1) * (fx * 2.1) * tipNarrow + ((fy + 0.22) * 2.3) ** 2;
        if (coreShape < 1) {
          const coreT = clamp01(1 - coreShape);
          [r, g, b] = mix([r, g, b], [255, 246, 214], coreT);
        }
      }
    }

    put(x, y, r, g, b, 255);
  }
}

writeFileSync(new URL('../../store-assets/feature-graphic.png', import.meta.url), encodePNG(W, H, img));
console.log('store-assets/feature-graphic.png נוצר (1024x500)');
