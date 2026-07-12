// מוריד פרקי תהילים מנוקדים מ-Sefaria (טקסט חופשי) ושומר כ-JSON
import { writeFileSync } from 'node:fs';

// פרקים: השכבה/אזכרה (16,17,33,72,91,104,130), תיקון הכללי (16,32,41,42,59,77,90,105,137,150),
// מוכרים (20,23,121,128,142), קי"ט לאותיות השם
const CHAPTERS = [1, 16, 17, 20, 23, 32, 33, 41, 42, 59, 72, 77, 90, 91, 100, 103, 104, 105, 119, 121, 128, 130, 137, 142, 145, 150];

const out = {};
for (const ch of CHAPTERS) {
  const url = `https://www.sefaria.org/api/texts/Psalms.${ch}?context=0`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${ch}: HTTP ${res.status}`);
  const data = await res.json();
  // ניקוי תגי HTML וישויות (&thinsp; וכד')
  out[ch] = data.he.map((v) =>
    v
      .replace(/<[^>]+>/g, '')
      .replace(/&thinsp;|&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&[a-z]+;/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
  );
  console.log(`פרק ${ch}: ${out[ch].length} פסוקים`);
}

writeFileSync(new URL('../src/data/tehillim.json', import.meta.url), JSON.stringify(out, null, 1), 'utf8');
console.log('נשמר בהצלחה');
