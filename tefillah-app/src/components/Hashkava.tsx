import { useMemo, useState } from 'react';
import { nameToLetters, letterIndex, sanitizeSacred } from '../lib/hebrew';
import {
  HASHKAVA_SEFARDI_MALE,
  HASHKAVA_SEFARDI_FEMALE,
  EL_MALEH_MALE,
  EL_MALEH_FEMALE,
  KADDISH_SEFARDI,
  KADDISH_ASHKENAZI,
  KADDISH_DERABANAN_SEFARDI,
  KADDISH_DERABANAN_ASHKENAZI,
  RABBI_CHANANYA,
  PERSONAL_PRAYER_SAYER_MALE,
  PERSONAL_PRAYER_SAYER_FEMALE,
  CHALLAH_SEDER,
  AZKARA_TEHILLIM,
  TIKKUN_KLALI,
} from '../data/hashkava';
import type { Settings } from '../lib/store';
import type { Niftar } from '../lib/yahrzeit';
import { deathHDate } from '../lib/yahrzeit';
import TEHILLIM from '../data/tehillim.json';
import MISHNAYOT from '../data/mishnayot.json';

const tehillim = TEHILLIM as Record<string, string[]>;
const mishnayot = MISHNAYOT as Record<string, string[]>;
const T119 = tehillim['119'] ?? [];

/** מספור סעיפים עברי */
const SECTION_LETTERS = ['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ז', 'ח', 'ט', 'י', 'י"א', 'י"ב', 'י"ג', 'י"ד'];

function versesForLetter(ch: string): string[] {
  const idx = letterIndex(ch);
  if (idx === -1) return [];
  return T119.slice(idx * 8, idx * 8 + 8).map(sanitizeSacred);
}

function psalmText(ch: number): string {
  return sanitizeSacred((tehillim[String(ch)] ?? []).join(' '));
}

const TEHILLIM_NAMES: Record<number, string> = {
  33: 'ל"ג — רַנְּנוּ צַדִּיקִים',
  16: 'ט"ז — מִכְתָּם לְדָוִד',
  17: 'י"ז — תְּפִלָּה לְדָוִד',
  72: 'ע"ב — לִשְׁלֹמֹה',
  91: 'צ"א — יוֹשֵׁב בְּסֵתֶר עֶלְיוֹן',
  104: 'ק"ד — בָּרְכִי נַפְשִׁי',
  130: 'ק"ל — מִמַּעֲמַקִּים',
  32: 'ל"ב — אַשְׁרֵי נְשׂוּי פֶּשַׁע',
  41: 'מ"א — אַשְׁרֵי מַשְׂכִּיל אֶל דָּל',
  42: 'מ"ב — כְּאַיָּל תַּעֲרֹג',
  59: 'נ"ט — הַצִּילֵנִי מֵאֹיְבַי',
  77: 'ע"ז — קוֹלִי אֶל אֱלֹהִים',
  90: 'צ\' — תְּפִלָּה לְמֹשֶׁה',
  105: 'ק"ה — הוֹדוּ לַה\'',
  137: 'קל"ז — עַל נַהֲרוֹת בָּבֶל',
  150: 'ק"נ — הַלְלוּ אֵל בְּקָדְשׁוֹ',
};

/** תג "מי אומר" */
function Who({ children }: { children: string }) {
  return <span className="who-badge">{children}</span>;
}

interface Props {
  settings: Settings;
  niftarim: Niftar[];
  prefillId: string | null;
}

export function Hashkava({ settings, niftarim, prefillId }: Props) {
  const prefill = niftarim.find((n) => n.id === prefillId);
  const [name, setName] = useState(prefill?.name ?? '');
  const [parentName, setParentName] = useState(prefill?.parentName ?? '');
  const [gender, setGender] = useState<'m' | 'f'>(prefill?.gender ?? 'm');
  const [nusach, setNusach] = useState<'sefardi' | 'ashkenazi'>(settings.nusach);
  const [withTikkun, setWithTikkun] = useState(true);
  const [withMishnayot, setWithMishnayot] = useState(true);
  const [withChallah, setWithChallah] = useState(true);
  const [generated, setGenerated] = useState(false);

  const letters = useMemo(() => nameToLetters(name), [name]);
  const fullName = `${name.trim()} ${gender === 'm' ? 'בֶּן' : 'בַּת'} ${parentName.trim()}`;
  const honorific = gender === 'm' ? 'ז"ל' : 'ע"ה';
  const deathStr = prefill ? deathHDate(prefill).renderGematriya() : null;

  if (!generated) {
    return (
      <div>
        <div className="card">
          <h2>🕯️ הכנת סידור אזכרה והשכבה — הסדר המלא</h2>
          {settings.beginner && (
            <div className="explain">
              💡 מזינים את שם הנפטר/ת ובוחרים מה לכלול — האפליקציה בונה סידור אזכרה שלם לפי הסדר:
              נר נשמה, תהילים, פסוקי אותיות השם ונשמ"ה, תיקון הכללי, לימוד משניות (מקוואות פרק ז')
              עם קדיש דרבנן, השכבה, קדיש יתום, תפילות אישיות לגבר ולאישה, וסדר הפרשת חלה.
            </div>
          )}
          <div className="form-grid">
            <div className="field">
              <label>שם הנפטר/ת (בעברית)</label>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="למשל: אברהם" />
            </div>
            <div className="field">
              <label>{gender === 'm' ? 'בן —' : 'בת —'} שם האם (ולמנהג אשכנז: שם האב)</label>
              <input value={parentName} onChange={(e) => setParentName(e.target.value)} placeholder="למשל: שרה" />
            </div>
            <div className="field">
              <label>מגדר הנפטר/ת</label>
              <select value={gender} onChange={(e) => setGender(e.target.value as 'm' | 'f')}>
                <option value="m">זכר</option>
                <option value="f">נקבה</option>
              </select>
            </div>
            <div className="field">
              <label>נוסח</label>
              <select value={nusach} onChange={(e) => setNusach(e.target.value as 'sefardi' | 'ashkenazi')}>
                <option value="sefardi">ספרדי / עדות המזרח</option>
                <option value="ashkenazi">אשכנזי</option>
              </select>
            </div>
          </div>
          <h3 style={{ marginTop: 16 }}>מה לכלול בסידור:</h3>
          <div className="form-grid" style={{ marginTop: 8 }}>
            <label className="check">
              <input type="checkbox" checked={withMishnayot} onChange={(e) => setWithMishnayot(e.target.checked)} />
              לימוד משניות — מקוואות פרק ז' + קדיש דרבנן
            </label>
            <label className="check">
              <input type="checkbox" checked={withTikkun} onChange={(e) => setWithTikkun(e.target.checked)} />
              תיקון הכללי (י' מזמורי רבי נחמן)
            </label>
            <label className="check">
              <input type="checkbox" checked={withChallah} onChange={(e) => setWithChallah(e.target.checked)} />
              סדר הפרשת חלה לעילוי הנשמה
            </label>
          </div>
          {letters.length > 0 && (
            <p className="muted" style={{ marginTop: 12 }}>
              אותיות השם: {letters.join(' · ')} + אותיות נ·ש·מ·ה
            </p>
          )}
          <div style={{ marginTop: 16 }}>
            <button
              className="btn"
              disabled={!name.trim() || !parentName.trim()}
              onClick={() => setGenerated(true)}
              style={{ opacity: !name.trim() || !parentName.trim() ? 0.5 : 1 }}
            >
              ✨ בנה סידור אזכרה מלא
            </button>
          </div>
        </div>
        {niftarim.length > 0 && (
          <div className="card">
            <h2>או בחר מרשימת יקיריך</h2>
            {niftarim.map((n) => (
              <button
                key={n.id}
                className="btn secondary small"
                style={{ margin: '0 0 8px 8px' }}
                onClick={() => {
                  setName(n.name);
                  setParentName(n.parentName);
                  setGender(n.gender);
                }}
              >
                {n.name} {n.gender === 'm' ? 'בן' : 'בת'} {n.parentName}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  const hashkavaText =
    nusach === 'sefardi' ? (gender === 'm' ? HASHKAVA_SEFARDI_MALE : HASHKAVA_SEFARDI_FEMALE) : null;
  const elMaleh = nusach === 'ashkenazi' ? (gender === 'm' ? EL_MALEH_MALE : EL_MALEH_FEMALE) : null;
  const kaddishYatom = nusach === 'sefardi' ? KADDISH_SEFARDI : KADDISH_ASHKENAZI;
  const kaddishDerabanan = nusach === 'sefardi' ? KADDISH_DERABANAN_SEFARDI : KADDISH_DERABANAN_ASHKENAZI;
  const nishmatLetters = ['נ', 'ש', 'מ', 'ה'];
  const mikvaot7 = mishnayot['mikvaot-7'] ?? [];

  // בניית הסעיפים לפי הסדר — המספור (א. ב. ג.) מחושב דינמית לפי מה שנכלל
  let secIdx = 0;
  const secLetter = () => SECTION_LETTERS[secIdx++] ?? '';

  return (
    <div>
      <div className="reader-controls">
        <button className="btn secondary small" onClick={() => setGenerated(false)}>→ עריכה</button>
        <button className="btn small" onClick={() => window.print()}>🖨️ הדפסה / שמירה כ-PDF</button>
      </div>

      <div className="card print-area">
        <div className="doc-header">
          <div className="doc-title">סידור אזכרה לעילוי נשמת</div>
          <div className="doc-title">{fullName} {honorific}</div>
          {deathStr && <div className="doc-sub">יום פטירה: {deathStr}</div>}
          <div className="doc-sub">נוסח {nusach === 'sefardi' ? 'ספרדי — עדות המזרח' : 'אשכנז'} · הסדר המלא</div>
        </div>

        {/* ——— נר נשמה ——— */}
        <div className="doc-section">
          <div className="sec-title">{secLetter()}. הדלקת נר נשמה <Who>לכל המשתתפים</Who></div>
          {settings.beginner && (
            <div className="explain">
              💡 נוהגים להדליק נר נשמה לפני תחילת הלימוד והתפילה. הנר דולק כל יום האזכרה — "נֵר ה'
              נִשְׁמַת אָדָם".
            </div>
          )}
          <div className="holy-text">
            הֲרֵינִי מַדְלִיק/מַדְלִיקָה נֵר זֶה לְעִלּוּי נִשְׁמַת {fullName} {honorific}. יְהִי רָצוֹן שֶׁתְּהֵא נִשְׁמָתוֹ/נִשְׁמָתָהּ צְרוּרָה בִּצְרוֹר הַחַיִּים.
          </div>
        </div>

        {/* ——— תהילים לאזכרה ——— */}
        <div className="doc-section">
          <div className="sec-title">{secLetter()}. פרקי תהילים לאזכרה <Who>לכל המשתתפים — גברים ונשים</Who></div>
          {settings.beginner && (
            <div className="explain">
              💡 שבעת המזמורים הנהוגים באזכרה: ל"ג, ט"ז, י"ז, ע"ב, צ"א, ק"ד, ק"ל. אמירת תהילים
              היא זכות גדולה לנשמה, וכל אחד ואחת מהמשתתפים יכולים לומר.
            </div>
          )}
          {AZKARA_TEHILLIM.map((ch) => (
            <div key={ch} style={{ marginBottom: 16 }}>
              <div className="letter-head">תהילים {TEHILLIM_NAMES[ch] ?? ch}</div>
              <div className="holy-text">{psalmText(ch)}</div>
            </div>
          ))}
        </div>

        {/* ——— קי"ט אותיות השם ——— */}
        <div className="doc-section">
          <div className="sec-title">
            {secLetter()}. פסוקי תהילים קי"ט — לפי אותיות השם: {letters.join(' · ')} <Who>לכל המשתתפים</Who>
          </div>
          {settings.beginner && (
            <div className="explain">
              💡 מזמור קי"ט בנוי לפי סדר האלף-בית — שמונה פסוקים לכל אות. אומרים את פסוקי האותיות
              של שם הנפטר/ת, שהשם הוא שורש הנשמה.
            </div>
          )}
          {letters.map((ch, i) => (
            <div className="letter-verse" key={i}>
              <div className="letter-head">אות {ch}</div>
              <div className="holy-text">{versesForLetter(ch).join(' ')}</div>
            </div>
          ))}
        </div>

        {/* ——— קי"ט נשמ"ה ——— */}
        <div className="doc-section">
          <div className="sec-title">{secLetter()}. פסוקי קי"ט לאותיות נ־ש־מ־ה <Who>לכל המשתתפים</Who></div>
          {settings.beginner && (
            <div className="explain">💡 לאחר אותיות השם אומרים את פסוקי האותיות נ, ש, מ, ה — "נשמה".</div>
          )}
          {nishmatLetters.map((ch) => (
            <div className="letter-verse" key={ch}>
              <div className="letter-head">אות {ch}</div>
              <div className="holy-text">{versesForLetter(ch).join(' ')}</div>
            </div>
          ))}
        </div>

        {/* ——— תיקון הכללי ——— */}
        {withTikkun && (
          <div className="doc-section">
            <div className="sec-title">{secLetter()}. תיקון הכללי <Who>לכל המשתתפים</Who></div>
            {settings.beginner && (
              <div className="explain">
                💡 עשרת מזמורי התהילים שגילה רבי נחמן מברסלב (ט"ז, ל"ב, מ"א, מ"ב, נ"ט, ע"ז, צ',
                ק"ה, קל"ז, ק"נ) — תיקון גדול לנשמה. נאמרים ברצף.
              </div>
            )}
            {TIKKUN_KLALI.map((ch) => (
              <div key={ch} style={{ marginBottom: 16 }}>
                <div className="letter-head">תהילים {TEHILLIM_NAMES[ch] ?? ch}</div>
                <div className="holy-text">{psalmText(ch)}</div>
              </div>
            ))}
          </div>
        )}

        {/* ——— משניות ——— */}
        {withMishnayot && (
          <div className="doc-section">
            <div className="sec-title">{secLetter()}. לימוד משניות — מסכת מקוואות פרק ז' <Who>לכל הלומדים</Who></div>
            {settings.beginner && (
              <div className="explain">
                💡 "משנה" אותיות "נשמה" — לימוד משניות הוא התיקון הגדול ביותר לנשמת הנפטר. המנהג
                הרווח ללמוד את פרק ז' של מסכת מקוואות, על הקבר ובאזכרה. יש הנוהגים ללמוד גם פרקי
                משניות שמתחילים באותיות שם הנפטר/ת — התייעצו עם רב הקהילה.
              </div>
            )}
            {mikvaot7.map((m, i) => (
              <div key={i} style={{ marginBottom: 14 }}>
                <div className="letter-head">משנה {SECTION_LETTERS[i] ?? i + 1}</div>
                <div className="holy-text">{m}</div>
              </div>
            ))}
            <div style={{ marginTop: 18 }}>
              <div className="letter-head">בסיום הלימוד אומרים</div>
              <div className="holy-text">{RABBI_CHANANYA}</div>
            </div>
          </div>
        )}

        {/* ——— קדיש דרבנן ——— */}
        {withMishnayot && (
          <div className="doc-section">
            <div className="sec-title">
              {secLetter()}. קדיש דרבנן — "עַל יִשְׂרָאֵל" <Who>גבר, במניין בלבד</Who>
            </div>
            {settings.beginner && (
              <div className="explain">
                💡 אחרי לימוד משניות (תורה שבעל פה) אומרים קדיש דרבנן — קדיש מיוחד שמזכיר את
                לומדי התורה. נאמר על ידי גבר, בנוכחות מניין (עשרה גברים) בלבד. אם אין מניין —
                מדלגים, והלימוד עצמו עומד לזכות הנשמה.
              </div>
            )}
            <div className="holy-text">{kaddishDerabanan}</div>
          </div>
        )}

        {/* ——— השכבה / אל מלא ——— */}
        <div className="doc-section">
          <div className="sec-title">
            {secLetter()}. {nusach === 'sefardi' ? 'הַשְׁכָּבָה' : 'אֵל מָלֵא רַחֲמִים'} <Who>החזן או אחד המשתתפים</Who>
          </div>
          {settings.beginner && (
            <div className="explain">
              💡 {nusach === 'sefardi'
                ? 'ההשכבה היא תפילת הזיכרון הספרדית. נאמרת על ידי החזן או אחד המשתתפים, בעמידה.'
                : 'א-ל מלא רחמים היא תפילת הזיכרון האשכנזית. נאמרת בעמידה, ונהוג לנדוב צדקה לעילוי הנשמה.'}
            </div>
          )}
          {hashkavaText && (
            <div className="holy-text">
              {hashkavaText.opening}
              {'\n\n'}
              {hashkavaText.body.replace('{NAME}', fullName)}
              {'\n\n'}
              {hashkavaText.closing}
            </div>
          )}
          {elMaleh && <div className="holy-text">{elMaleh.replace('{NAME}', fullName)}</div>}
        </div>

        {/* ——— קדיש יתום ——— */}
        <div className="doc-section">
          <div className="sec-title">
            {secLetter()}. קדיש יתום — "יְהֵא שְׁלָמָא" <Who>גבר, במניין בלבד</Who>
          </div>
          {settings.beginner && (
            <div className="explain">
              💡 הקדיש נאמר על ידי הבן או קרוב משפחה, בנוכחות מניין. הקהל עונה "אמן" ו"יהא שמה
              רבא מברך לעלם ולעלמי עלמיא". אישה אינה אומרת קדיש לפי רוב המנהגים — זכותה עומדת
              בתהילים, בתפילה האישית ובהפרשת חלה שבהמשך.
            </div>
          )}
          <div className="holy-text">{kaddishYatom}</div>
        </div>

        {/* ——— תפילה אישית — גבר ——— */}
        <div className="doc-section">
          <div className="sec-title">{secLetter()}. תפילה אישית לעילוי הנשמה — לגבר <Who>האומר: גבר</Who></div>
          {settings.beginner && (
            <div className="explain">💡 תפילה אישית שאומר כל גבר מהמשתתפים, גם ביחיד וללא מניין.</div>
          )}
          <div className="holy-text">{PERSONAL_PRAYER_SAYER_MALE.replace('{NAME}', `${fullName} ${honorific}`)}</div>
        </div>

        {/* ——— תפילה אישית — אישה ——— */}
        <div className="doc-section">
          <div className="sec-title">{secLetter()}. תפילה אישית לעילוי הנשמה — לאישה <Who>האומרת: אישה</Who></div>
          {settings.beginner && (
            <div className="explain">💡 תפילה אישית שאומרת כל אישה מהמשתתפות, גם ביחידות. אמירת תהילים ותפילה זו — זכות גדולה לנשמה.</div>
          )}
          <div className="holy-text">{PERSONAL_PRAYER_SAYER_FEMALE.replace('{NAME}', `${fullName} ${honorific}`)}</div>
        </div>

        {/* ——— הפרשת חלה ——— */}
        {withChallah && (
          <div className="doc-section">
            <div className="sec-title">{secLetter()}. סדר הפרשת חלה לעילוי הנשמה <Who>מצווה הנוהגת בנשים</Who></div>
            <div className="explain">💡 {CHALLAH_SEDER.intro}</div>
            <div style={{ marginBottom: 14 }}>
              <div className="letter-head">1. כוונה לפני הלישה</div>
              <div className="holy-text">{CHALLAH_SEDER.kavana.replace('{NAME}', `${fullName} ${honorific}`)}</div>
            </div>
            <div style={{ marginBottom: 14 }}>
              <div className="letter-head">2. הברכה (בשיעור המחייב)</div>
              <div className="holy-text">{CHALLAH_SEDER.beracha}</div>
            </div>
            <div style={{ marginBottom: 14 }}>
              <div className="letter-head">3. ההפרשה</div>
              <div className="holy-text">{CHALLAH_SEDER.declaration}</div>
            </div>
            <div style={{ marginBottom: 14 }}>
              <div className="letter-head">4. תפילה לאחר ההפרשה</div>
              <div className="holy-text">{CHALLAH_SEDER.prayer.replace('{NAME}', `${fullName} ${honorific}`)}</div>
            </div>
          </div>
        )}

        <div className="disclaimer">
          תהא נשמתו/ה צרורה בצרור החיים · הנוסחים באפליקציה טעונים אישור רב — מומלץ לוודא עם רב הקהילה
        </div>
      </div>
    </div>
  );
}
