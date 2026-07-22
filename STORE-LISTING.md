# תוכן לרישום בחנות — עילוי ונשמה

מסמך מרוכז: כל טקסט/נכס גרפי דרוש למילוי טופס Google Play Console. הטקסטים המלאים (עברית ואנגלית) כבר מוכנים ב-[ABOUT.md](ABOUT.md) — כאן רק מה שדורש עיבוד נוסף בשביל Play (קיצור לפי מגבלת תווים, רשימת נכסים, ורשימת TODO).

---

## נכסים גרפיים

| קובץ | שימוש | סטטוס |
|---|---|---|
| `tefillah-app/public/pwa-512.png` | אייקון "any" (512×512) | ✅ מוכן |
| `tefillah-app/public/pwa-512-maskable.png` | אייקון maskable — תוכן מרוכז ב-65% עם שוליים בטוחים | ✅ מוכן (נוצר מחדש עם ריפוד תקין) |
| Feature Graphic (1024×500) | חובה ל-Play Console | ✅ מוכן — `store-assets/feature-graphic.png` (נר על רקע גרדיאנט, תואם לאייקונים) |
| Screenshots (מינימום 2, מומלץ 4-8) | חובה ל-Play Console | ✅ 5 צילומים אמיתיים ב-`store-assets/screenshots/` (היום, אזכרה, יקיריי, תפילות + בונוס מסך קריאה). חסר עדיין צילום "הילולות" נקי — ראו הרשימה למטה |

**מסכים מומלצים לצילום** (פתחו את `laeloy.vercel.app` בכרום על הטלפון, או ב-DevTools במצב מובייל — Ctrl+Shift+M):
1. "היום" — הדשבורד (מה אומרים היום, זמני היום, ההילולה הקרובה)
2. "אזכרה" — מסך מחולל ההשכבה עם שם משולב
3. "הילולות" — לוח 40 הצדיקים
4. "יקיריי" — ניהול נפטרים + יארצייט
5. "תפילות" — בנק התפילות עם חיפוש

---

## Google Play — טופס הרישום

**שם האפליקציה** (עד 30 תווים): `עילוי ונשמה`

**תיאור קצר** (עד 80 תווים — התיאור המקורי ב-ABOUT.md ארוך מדי, 142 תווים; זו גרסה מקוצרת):
> סידור אזכרה לפי שם הנפטר, בנק תפילות וסגולות, לוח הילולות ותזכורות יארצייט

**תיאור קצר — English** (עד 80 תווים):
> Build a memorial service by name; prayers, hilula calendar & yahrzeit reminders

**תיאור מלא** (עד 4000 תווים) — ניתן להעתיק ישירות מ-[ABOUT.md](ABOUT.md), הפסקה תחת "### אודות" + "### נקודות עיקריות" — קצר בהרבה מהמגבלה, לא דורש קיצור.

**קטגוריה**: Lifestyle או Books & Reference (ל-Play אין קטגוריית "דת" נפרדת) — מומלץ Lifestyle כקטגוריה ראשית.

**Content Rating**: תוכן דתי/הנצחה, בלי אלימות/תוכן בוגר — צפוי Everyone. יש למלא בפועל את השאלון בקונסולה.

**Data Safety Form**: מאז הוספת Vercel Web Analytics (2026-07-22) התשובה כבר לא "No data collected" הטהורה — יש לסמן **"App collects usage data (App interactions)"** בקטע Analytics, עם: לא נמכר לצד ג', לא משמש לפרסום, ואופציונלי למחיקה (לא רלוונטי — לא מזוהה למשתמש ספציפי). כל שאר סוגי המידע (שמות/תאריכי נפטרים, מיקום GPS) עדיין "Not collected" — נשארים ב-localStorage בלבד ואינם נשלחים לשום שרת. ראו הרחבה ב-`tefillah-app/public/privacy.html`.

**כתובת מדיניות פרטיות (URL חובה)**: `https://laeloy.vercel.app/privacy.html` (הדף כבר קיים בקוד ויעלה אוטומטית עם הפריסה הבאה ל-Vercel).

---

## מוכנות ל-TWA (עטיפת Android) — ✅ ה-AAB החתום מוכן

נוצר `mobile/android/twa-manifest.json` (קונפיג-מקור, נשמר בגיט) עם:
- `packageId: app.vercel.laeloy.twa`
- `host: laeloy.vercel.app`
- אייקונים: `pwa-512.png` / `pwa-512-maskable.png`

**בוצע (2026-07-22)**:
1. נוצר `mobile/android/android.keystore` (RSA 2048, תוקף 10,000 יום) — **קובץ בלתי-הפיך, חובה עליך לגבות אותו + הסיסמה מיד** (הועברה בצ'אט בנפרד, לא נשמרת כאן בקובץ). אם הוא יאבד, לא ניתן יהיה לפרסם עדכון לאפליקציה תחת אותו רישום ב-Play לעולם.
2. חולץ ה-SHA256 fingerprint ועודכן ב-`tefillah-app/public/.well-known/assetlinks.json` (כבר לא placeholder).
3. נוצר `mobile/android/keystore.properties` (מקומי, ב-gitignore — לא מועלה לגיט) + חוברה תצורת חתימה ב-`app/build.gradle`.
4. נוספו קבצי `ic_maskable.png` בכל צפיפות מסך (חסרו בסקאפולד המקורי של Bubblewrap).
5. `./gradlew bundleRelease` הצליח — הקובץ החתום נמצא ב־`mobile/android/app/build/outputs/bundle/release/app-release.aab` (לא מועלה לגיט, נשאר מקומי).

**נותר לך בלבד (דורש חשבון Google Play Console שלך — אין לי גישה אליו)**:
1. להעלות את `app-release.aab` ל-Play Console (Production/Testing track).
2. למלא Content Rating ו-Data Safety (ראו סעיפים למעלה).
3. לוודא ש-`https://laeloy.vercel.app/.well-known/assetlinks.json` פרוס (ה-deploy האחרון כלל את זה).
4. Submit for review.

זו בדיוק אותה שיטת עבודה שכבר בוצעה בפרויקט בוזוקי אקדמי.

---

## שדות חסירים שצריך למלא בעצמך

- [ ] **גיבוי מיידי של android.keystore + הסיסמה** — הכי דחוף מכל השאר.
- [ ] **צילום "הילולות" נקי** — 5 מתוך 6 נשמרו, זה היחיד שחסר.
- [ ] **דירוג תוכן (Content Rating)** — שאלון בפועל בתוך Play Console.
- [ ] **החלטה על קטגוריה** — Lifestyle מול Books & Reference.
- [ ] **העלאה בפועל ל-Play Console** — דורש את חשבון ה-Google Play שלך.
- [ ] **בדיקה רבנית** של הנוסחים — עדיין לא בוצעה, ראוי לפני פרסום ציבורי.
