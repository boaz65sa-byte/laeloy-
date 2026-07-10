// מוריד משניות מקוואות פרק ז' מ-Sefaria — הפרק הנהוג ללימוד לעילוי נשמה
import { writeFileSync } from 'node:fs';

function clean(v) {
  return v
    .replace(/<[^>]+>/g, '')
    .replace(/&thinsp;|&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&[a-z]+;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const res = await fetch('https://www.sefaria.org/api/texts/Mishnah_Mikvaot.7?context=0');
if (!res.ok) throw new Error(`HTTP ${res.status}`);
const data = await res.json();
const out = { 'mikvaot-7': data.he.map(clean) };
writeFileSync(new URL('../src/data/mishnayot.json', import.meta.url), JSON.stringify(out, null, 1), 'utf8');
console.log('מקוואות פרק ז:', out['mikvaot-7'].length, 'משניות');
