// עזרי טקסט עברי — נירמול, אותיות, חיפוש
// כל טווחי ה-Unicode כתובים בקודים מפורשים כדי למנוע בלבול בתווים משולבים

// U+0591–U+05C7: טעמי מקרא + ניקוד (הכל)
const NIKUD_RE = /[\u0591-\u05C7]/g;

export function stripNikud(s: string): string {
  return s.replace(NIKUD_RE, '');
}

// אותיות סופיות → רגילות
const FINALS: Record<string, string> = { ך: 'כ', ם: 'מ', ן: 'נ', ף: 'פ', ץ: 'צ' };

export function normalizeLetter(ch: string): string {
  return FINALS[ch] ?? ch;
}

/** מפרק שם לאותיות עבריות בלבד, בסדר הופעתן (כולל חזרות), סופיות מנורמלות */
export function nameToLetters(name: string): string[] {
  return stripNikud(name)
    .split('')
    .filter((ch) => /[א-ת]/.test(ch))
    .map(normalizeLetter);
}

/** סדר האלף-בית לצורך אינדוקס תהילים קי"ט (8 פסוקים לאות) */
export const ALEF_BET = 'אבגדהוזחטיכלמנסעפצקרשת'.split('');

export function letterIndex(ch: string): number {
  return ALEF_BET.indexOf(normalizeLetter(ch));
}

// טעמי מקרא בלבד (U+0591–U+05AF) + מתג (U+05BD) + רפה (U+05BF) — הניקוד (U+05B0–U+05BC) נשאר
const CANTILLATION_RE = /[\u0591-\u05AF\u05BD\u05BF]/g;

// שם הוי"ה עם ניקוד כלשהו, כשאינו חלק ממילה ארוכה יותר
const SHEM_RE = /י[\u05B0-\u05BC]*ה[\u05B0-\u05BC]*ו[\u05B0-\u05BC]*ה(?![\u05B0-\u05BC]*[א-ת])/g;

/**
 * הכנת טקסט מקראי לתפילה ולהדפסה:
 * מסיר טעמי מקרא ומחליף את השם המפורש ב-ה' (מטעמי קדושת השם וגניזה)
 */
export function sanitizeSacred(s: string): string {
  return s.replace(CANTILLATION_RE, '').replace(SHEM_RE, "ה'");
}

/** נירמול לחיפוש: בלי ניקוד, בלי פיסוק, סופיות מנורמלות, רווחים מצומצמים */
export function normalizeForSearch(s: string): string {
  return stripNikud(s)
    .split('')
    .map(normalizeLetter)
    .join('')
    .replace(/["'״׳.,:;()\-–—?!]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

/** ציון התאמה פשוט: 3=כותרת, 2=תגית, 1=גוף */
export function searchScore(
  query: string,
  title: string,
  tags: string[],
  body: string
): number {
  const q = normalizeForSearch(query);
  if (!q) return 0;
  let score = 0;
  if (normalizeForSearch(title).includes(q)) score += 3;
  if (tags.some((t) => normalizeForSearch(t).includes(q))) score += 2;
  if (normalizeForSearch(body).includes(q)) score += 1;
  return score;
}
