// מייצר אייקוני PWA (PNG) בציור גיאומטרי — נר עם להבת זהב על רקע כחול כהה
import { writeFileSync } from 'node:fs';
import { deflateSync } from 'node:zlib';

// ---- מקודד PNG מינימלי ----
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
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA
  const raw = Buffer.alloc(h * (1 + w * 4));
  for (let y = 0; y < h; y++) {
    raw[y * (1 + w * 4)] = 0; // no filter
    rgba.copy(raw, y * (1 + w * 4) + 1, y * w * 4, (y + 1) * w * 4);
  }
  return Buffer.concat([
    sig,
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

// ---- ציור ----
function lerp(a, b, t) {
  return a + (b - a) * t;
}
function drawIcon(S) {
  const img = Buffer.alloc(S * S * 4);
  const R = S * 0.22; // רדיוס פינות
  const cx = S / 2;
  const put = (x, y, r, g, b, a = 255) => {
    const i = (y * S + x) * 4;
    img[i] = r; img[i + 1] = g; img[i + 2] = b; img[i + 3] = a;
  };
  for (let y = 0; y < S; y++) {
    for (let x = 0; x < S; x++) {
      // פינות מעוגלות
      const dx = Math.max(R - x, x - (S - 1 - R), 0);
      const dy = Math.max(R - y, y - (S - 1 - R), 0);
      if (dx * dx + dy * dy > R * R) { put(x, y, 0, 0, 0, 0); continue; }
      // רקע — כחול כהה עם גרדיאנט
      const t = y / S;
      let r = Math.round(lerp(20, 14, t));
      let g = Math.round(lerp(29, 21, t));
      let b = Math.round(lerp(56, 38, t));
      // גוף הנר — מלבן בהיר
      const candleW = S * 0.16;
      if (Math.abs(x - cx) < candleW / 2 && y > S * 0.48 && y < S * 0.86) {
        r = 238; g = 233; b = 220;
        // פתילה קטנה כהה בראש הנר
      }
      // הילת הלהבה
      const fx = (x - cx) / (S * 0.13);
      const fy = (y - S * 0.33) / (S * 0.17);
      const d = fx * fx + fy * fy;
      if (d < 2.6) {
        const glow = Math.max(0, 1 - d / 2.6);
        r = Math.min(255, r + Math.round(glow * 90));
        g = Math.min(255, g + Math.round(glow * 60));
        b = Math.min(255, b + Math.round(glow * 10));
      }
      // הלהבה עצמה — טיפה (אליפסה מחודדת למעלה)
      const tipNarrow = 1 + Math.max(0, -((y - S * 0.33) / (S * 0.17))) * 1.6;
      if (fx * fx * tipNarrow + fy * fy < 1) {
        r = 236; g = 197; b = 116; // זהב
        // ליבה בהירה
        if (fx * fx * tipNarrow * 2 + ((y - S * 0.36) / (S * 0.1)) ** 2 < 1) {
          r = 255; g = 240; b = 200;
        }
      }
      put(x, y, r, g, b, 255);
    }
  }
  return encodePNG(S, S, img);
}

for (const size of [192, 512]) {
  writeFileSync(new URL(`../public/pwa-${size}.png`, import.meta.url), drawIcon(size));
  console.log(`pwa-${size}.png נוצר`);
}
