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

// נקודות "ניצוצות" עולים מעל הלהבה — מסמלות עילוי נשמה. יחסי לגובה/רוחב האייקון (S).
const SPARKS = [
  { x: 0.065, y: 0.155, r: 0.014, a: 0.85 },
  { x: -0.095, y: 0.1, r: 0.009, a: 0.55 },
  { x: 0.03, y: 0.055, r: 0.007, a: 0.4 },
  { x: -0.05, y: 0.02, r: 0.005, a: 0.28 },
];
// כוכבים קלושים ברקע — תחושת "שמי נצח", עמומים מאוד כדי לא להסיח דעת
const STARS = [
  [0.28, 0.2, 0.55], [0.72, 0.16, 0.4], [0.8, 0.38, 0.5], [0.2, 0.42, 0.35],
  [0.75, 0.68, 0.45], [0.25, 0.72, 0.4], [0.5, 0.12, 0.35], [0.85, 0.55, 0.3],
];

// maskable=true: רקע מלא לקצוות (בלי פינות מעוגלות/שקיפות — כללי Android adaptive icon),
// והתוכן (נר+להבה) מוקטן ב-scale כדי להישאר בתוך "אזור הבטיחות" המרכזי (~66% מהאייקון)
// שממנו מערכת ההפעלה חותכת את הצורה (עיגול/סקוואירקל וכו').
function drawIcon(S, { maskable = false, scale = 1 } = {}) {
  const img = Buffer.alloc(S * S * 4);
  const R = maskable ? 0 : S * 0.22; // רדיוס פינות
  const cx = S / 2;
  const cy = S / 2;
  const put = (x, y, r, g, b, a = 255) => {
    const i = (y * S + x) * 4;
    img[i] = r; img[i + 1] = g; img[i + 2] = b; img[i + 3] = a;
  };

  const DEEP = [9, 12, 24]; // כחול-שחור עמוק בקצוות
  const MID = [19, 27, 52]; // כחול-נייבי בסיסי
  const WARM = [46, 34, 28]; // זוהר חמים סביב הלהבה

  for (let y = 0; y < S; y++) {
    for (let x = 0; x < S; x++) {
      if (!maskable) {
        const dx = Math.max(R - x, x - (S - 1 - R), 0);
        const dy = Math.max(R - y, y - (S - 1 - R), 0);
        if (dx * dx + dy * dy > R * R) { put(x, y, 0, 0, 0, 0); continue; }
      }

      // רקע: וינייטה רדיאלית עדינה, כהה יותר בקצוות, עם זוהר חם עולה סביב הלהבה
      const vign = clamp01(Math.hypot((x - cx) / (S * 0.62), (y - cy) / (S * 0.62)));
      let [r, g, b] = mix(MID, DEEP, vign);
      const warmDist = Math.hypot((x - cx) / (S * 0.5), (y - S * 0.3) / (S * 0.5));
      const warmT = clamp01(1 - warmDist) * 0.5;
      [r, g, b] = mix([r, g, b], WARM, warmT);

      // כוכבים קלושים
      for (const [sx, sy, br] of STARS) {
        const ddx = x - sx * S;
        const ddy = y - sy * S;
        if (ddx * ddx + ddy * ddy < (S * 0.006) ** 2) {
          r = Math.min(255, r + br * 60);
          g = Math.min(255, g + br * 60);
          b = Math.min(255, b + br * 70);
        }
      }

      // מיקום יחסי למרכז, מוקטן לפי scale כדי שהתוכן יישאר באזור הבטוח
      const rx = cx + (x - cx) / scale;
      const ry = cy + (y - cy) / scale;

      // ניצוצות עולים (עילוי הנשמה) — זוהר רך, מצטמצם ככל שעולים. sp.y הוא חלק מוחלט מגובה S.
      for (const sp of SPARKS) {
        const sxp = cx + sp.x * S;
        const syp = sp.y * S;
        const dd = Math.hypot(rx - sxp, ry - syp) / (S * sp.r);
        if (dd < 1) {
          const glow = (1 - dd) * sp.a;
          r = Math.round(lerp(r, 255, glow));
          g = Math.round(lerp(g, 224, glow));
          b = Math.round(lerp(b, 150, glow));
        }
      }

      // גוף הנר — מלבן בהיר עם הבהרה בצד אחד (אור) וטיפת שעווה
      const candleW = S * 0.16;
      const candleTop = S * 0.48;
      const candleBottom = S * 0.86;
      const dxCandle = rx - cx;
      if (Math.abs(dxCandle) < candleW / 2 && ry > candleTop && ry < candleBottom) {
        const edgeT = clamp01((dxCandle + candleW / 2) / candleW); // 0=שמאל, 1=ימין
        const base = mix([214, 207, 188], [248, 244, 232], 1 - Math.abs(edgeT - 0.22) * 1.8);
        r = base[0]; g = base[1]; b = base[2];
        // טיפת שעווה נוזלת בצד ימין, כשליש מלמעלה
        const dripY = candleTop + (candleBottom - candleTop) * 0.32;
        if (dxCandle > candleW * 0.28 && ry > dripY && ry < dripY + S * 0.05) {
          const dripT = clamp01(1 - (ry - dripY) / (S * 0.05));
          if (dxCandle < candleW * (0.42 + dripT * 0.1)) {
            r = 231; g = 224; b = 205;
          }
        }
      }
      // פתיל קטן מעל הנר
      if (Math.abs(dxCandle) < S * 0.007 && ry > candleTop - S * 0.025 && ry < candleTop + S * 0.01) {
        r = 60; g = 46; b = 34;
      }

      // הלהבה: מרכז נוטה קלות ("מתנפנפת") ככל שעולים — עקומה רכה, לא סימטרית
      const flameBaseY = candleTop + S * 0.01;
      const flameTipY = S * 0.16;
      const tNorm = clamp01((flameBaseY - ry) / (flameBaseY - flameTipY));
      const lean = S * 0.028 * tNorm * tNorm;
      const flameCx = cx + lean;
      const flameCy = S * 0.34;

      const fx = (rx - flameCx) / (S * 0.135);
      const fy = (ry - flameCy) / (S * 0.185);
      const dGlow = fx * fx + fy * fy;
      if (dGlow < 3) {
        const glow = Math.max(0, 1 - dGlow / 3);
        r = Math.min(255, r + Math.round(glow * 95));
        g = Math.min(255, g + Math.round(glow * 62));
        b = Math.min(255, b + Math.round(glow * 14));
      }

      // שלוש שכבות טיפה מקוננות: חוץ אדום-כתום → אמצע זהב → ליבה חמה-לבנה
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

  // טבעת זהב דקה קרוב לשוליים — תחושת "מדליון" (רק בגרסה הלא-maskable, כדי לא להיחתך במסכות אנדרואיד)
  if (!maskable) {
    const ringR = S * 0.478;
    const ringW = S * 0.008;
    for (let y = 0; y < S; y++) {
      for (let x = 0; x < S; x++) {
        const d = Math.hypot(x - cx, y - cy);
        if (Math.abs(d - ringR) < ringW) {
          const i = (y * S + x) * 4;
          if (img[i + 3] === 0) continue;
          const fade = clamp01(1 - Math.abs(d - ringR) / ringW);
          const [r, g, b] = mix([img[i], img[i + 1], img[i + 2]], [201, 162, 90], fade * 0.8);
          img[i] = r; img[i + 1] = g; img[i + 2] = b;
        }
      }
    }
  }

  return encodePNG(S, S, img);
}

for (const size of [192, 512]) {
  writeFileSync(new URL(`../public/pwa-${size}.png`, import.meta.url), drawIcon(size));
  console.log(`pwa-${size}.png נוצר`);
}
// גרסת maskable: תוכן מוקטן ל-65% כדי להישאר בתוך אזור הבטיחות של Android (~66% קוטר)
writeFileSync(new URL('../public/pwa-512-maskable.png', import.meta.url), drawIcon(512, { maskable: true, scale: 0.65 }));
console.log('pwa-512-maskable.png נוצר');
