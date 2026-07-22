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

/** מרחק עריכה (Levenshtein) בין שתי מחרוזות קצרות */
function editDistance(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  let prev = Array.from({ length: n + 1 }, (_, j) => j);
  for (let i = 1; i <= m; i++) {
    const cur = [i];
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + cost);
    }
    prev = cur;
  }
  return prev[n];
}

/** כמה שגיאות כתיב סובלים, לפי אורך המילה המחופשת */
function toleranceFor(len: number): number {
  if (len <= 3) return 0;
  if (len <= 6) return 1;
  return 2;
}

/**
 * בדיקה סלחנית לשגיאות כתיב: מחפשת חלון בגודל דומה לאורך השאילתה
 * בתוך הטקסט שמרחק העריכה שלו מהשאילתה נמוך מהסף. תומכת גם בשאילתה
 * רב-מילולית ע"י בדיקת כל מילה בנפרד מול כל מילה בטקסט.
 */
export function fuzzyIncludes(text: string, query: string): boolean {
  if (!query) return false;
  if (text.includes(query)) return true;
  const tol = toleranceFor(query.length);
  if (tol === 0) return false;
  const words = text.split(' ');
  for (const w of words) {
    if (Math.abs(w.length - query.length) > tol) continue;
    if (editDistance(w, query) <= tol) return true;
  }
  return false;
}

/** ציון התאמה: 3=כותרת, 2=תגית, 1=גוף; התאמה סלחנית לשגיאות כתיב מקבלת ציון נמוך יותר */
export function searchScore(
  query: string,
  title: string,
  tags: string[],
  body: string
): number {
  const q = normalizeForSearch(query);
  if (!q) return 0;
  const nTitle = normalizeForSearch(title);
  const nTags = tags.map(normalizeForSearch);
  const nBody = normalizeForSearch(body);

  let score = 0;
  if (nTitle.includes(q)) score += 3;
  else if (fuzzyIncludes(nTitle, q)) score += 1.5;

  if (nTags.some((t) => t.includes(q))) score += 2;
  else if (nTags.some((t) => fuzzyIncludes(t, q))) score += 1;

  if (nBody.includes(q)) score += 1;
  else if (fuzzyIncludes(nBody, q)) score += 0.5;

  return score;
}
