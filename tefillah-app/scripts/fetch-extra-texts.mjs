// מוריד טקסטים מסורתיים נוספים מ-Sefaria (רישיון חופשי) ושומר כ-JSON:
// אגרת הרמב"ן, פרק שירה (6 פרקים + הקדמה + בקשה), ברכת המזון, בורא נפשות, אדון עולם, עלינו לשבח
import { writeFileSync } from 'node:fs';

function clean(v) {
  return v
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\{[סנפ]\}/g, ' ') // סימוני פרשה פתוחה/סתומה
    .replace(/&thinsp;|&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&[a-z]+;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

async function fetchText(title) {
  const url = `https://www.sefaria.org/api/texts/${encodeURIComponent(title)}?context=0`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${title}: HTTP ${res.status}`);
  const d = await res.json();
  if (d.error) throw new Error(`${title}: ${d.error}`);
  return d;
}

const out = {};

// אגרת הרמב"ן — רשימת פסקאות שטוחה
{
  const d = await fetchText('Iggeret HaRamban');
  out.igeretHaramban = d.he.map(clean).filter(Boolean);
  console.log('אגרת הרמב"ן:', out.igeretHaramban.length, 'פסקאות');
}

// פרק שירה — 6 פרקים ב-Sefaria (שמים/יום/עצי שדה/עופות/בהמות/שרצים), כל פרק = מערך שורות
{
  out.perekShira = [];
  for (let i = 1; i <= 6; i++) {
    const d = await fetchText(`Perek Shirah ${i}`);
    out.perekShira.push(d.he.map(clean).filter(Boolean));
  }
  console.log('פרק שירה:', out.perekShira.length, 'פרקים,', out.perekShira.flat().length, 'שורות');
}
{
  const d = await fetchText('Perek Shirah, Introductory Text');
  out.perekShiraIntro = d.he.map(clean).filter(Boolean);
}
{
  const d = await fetchText('Perek Shirah, Concluding Prayer');
  out.perekShiraClosing = d.he.map(clean).filter(Boolean);
}

// ברכת המזון — כל סעיף נשלף בנפרד ומחובר עם כותרות-הפרדה משלנו (לא חלק מהציטוט)
{
  const zimmun = (await fetchText('Birkat Hamazon, Zimmun')).he.map(clean).filter(Boolean);
  const hazan = (await fetchText('Birkat Hamazon, Blessing on the Food')).he.map(clean).filter(Boolean);
  const haaretz = (await fetchText('Birkat Hamazon, Blessing on the Land')).he.map(clean).filter(Boolean);
  const boneYerushalayim = (await fetchText('Birkat Hamazon, Blessing on Jerusalem')).he.map(clean).filter(Boolean);
  const hatovVehametiv = (await fetchText('Birkat Hamazon, Hatov Vehametiv')).he.map(clean).filter(Boolean);
  const boreNefashot = (await fetchText('Birkat Hamazon, Blessings After Other Foods, Bore Nefashot')).he.map(clean).filter(Boolean);

  out.boreNefashot = boreNefashot;

  out.birkatHamazon = [
    '(בזימון שלושה ומעלה — המזמן פותח, השאר עונים)',
    ...zimmun,
    'ברכה ראשונה — הזן:',
    ...hazan,
    'ברכה שנייה — ברכת הארץ:',
    ...haaretz,
    'ברכה שלישית — בונה ירושלים:',
    ...boneYerushalayim,
    'ברכה רביעית — הטוב והמטיב, ו"הרחמן":',
    ...hatovVehametiv,
  ];
  console.log('ברכת המזון:', out.birkatHamazon.length, 'פסקאות');
}

// אדון עולם ועלינו לשבח
{
  const d = await fetchText('Siddur Ashkenaz, Weekday, Shacharit, Preparatory Prayers, Adon Olam');
  out.adonOlam = d.he.map(clean).filter(Boolean);
  console.log('אדון עולם:', out.adonOlam.length, 'בתים');
}
{
  const d = await fetchText('Siddur Sefard, Weekday Shacharit, Aleinu');
  // פסקה ראשונה היא הוראת-קריאה על המנהג, לא חלק מהתפילה עצמה — משמיטים אותה
  const paras = d.he.map(clean).filter(Boolean);
  out.aleinu = paras.slice(1, 4); // עלינו לשבח + על כן נקווה + אל תירא (בלי הקדיש שאחריו)
  console.log('עלינו לשבח:', out.aleinu.length, 'פסקאות');
}

// ברכת כהנים (במדבר ו, כד-כו) — הליבה המקראית של ברכת הבנים בליל שבת
{
  const d = await fetchText('Numbers.6.24-26');
  out.birkatKohanim = d.he.map(clean).filter(Boolean);
  console.log('ברכת כהנים:', out.birkatKohanim.length, 'פסוקים');
}

writeFileSync(new URL('../src/data/extra-texts.json', import.meta.url), JSON.stringify(out, null, 1), 'utf8');
console.log('נשמר בהצלחה');
