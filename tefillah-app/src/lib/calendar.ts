// מנוע הלוח העברי — כל "מה אומרים היום" מחושב כאן
import { HDate, HebrewCalendar, Location, Zmanim, months, flags, Event } from '@hebcal/core';

export const CITIES = [
  { id: 'Jerusalem', label: 'ירושלים' },
  { id: 'Tel Aviv', label: 'תל אביב' },
  { id: 'Haifa', label: 'חיפה' },
  { id: 'Eilat', label: 'אילת' },
] as const;

export interface ZmanRow {
  label: string;
  time: Date;
}

export interface DayInfo {
  gdate: Date;
  hd: HDate;
  hdateStr: string;
  events: { name: string; emoji: string }[];
  isRoshChodesh: boolean;
  isCholHamoed: boolean;
  isYomTov: boolean;
  yaalehVeyavo: boolean;
  winterPrayer: boolean; // משיב הרוח ומוריד הגשם
  talUmatar: boolean; // ברך עלינו / ותן טל ומטר (א"י)
  omerDay: number | null;
  hallel: 'שלם' | 'חצי' | null;
  tachanunShacharit: boolean;
  tachanunMincha: boolean;
  parsha: string | null;
  candleLighting: Date | null;
  havdalah: Date | null;
  zmanim: ZmanRow[];
  tzid: string;
}

const IL = true;

function eventEmoji(ev: Event): string {
  const m = ev.getFlags();
  if (m & flags.ROSH_CHODESH) return '🌒';
  if (m & flags.CHANUKAH_CANDLES) return '🕎';
  if (m & flags.MAJOR_FAST || m & flags.MINOR_FAST) return '🥀';
  if (m & flags.OMER_COUNT) return '🌾';
  if (m & flags.CHAG) return '🎉';
  if (m & flags.CHOL_HAMOED) return '🌿';
  return '📅';
}

/** האם היום בעונת "משיב הרוח ומוריד הגשם" (משמיני עצרת עד פסח) */
export function isWinterPrayer(hd: HDate): boolean {
  const m = hd.getMonth();
  const d = hd.getDate();
  if (m === months.TISHREI) return d >= 22;
  if (m === months.NISAN) return d < 15;
  // חשוון עד אדר ב'
  return m >= months.CHESHVAN && m <= months.ADAR_II && m !== months.NISAN;
}

/** האם אומרים "ברך עלינו... ותן טל ומטר" (בארץ ישראל: מז' חשוון עד ערב פסח) */
export function isTalUmatar(hd: HDate): boolean {
  const m = hd.getMonth();
  const d = hd.getDate();
  if (m === months.CHESHVAN) return d >= 7;
  if (m === months.NISAN) return d < 15;
  return m >= months.KISLEV && m <= months.ADAR_II;
}

export function omerDay(hd: HDate): number | null {
  const pesach1 = new HDate(15, months.NISAN, hd.getFullYear());
  const diff = hd.abs() - pesach1.abs();
  return diff >= 1 && diff <= 49 ? diff : null;
}

export function getDayInfo(gdate: Date, cityId: string): DayInfo {
  const hd = new HDate(gdate);
  const location = Location.lookup(cityId) ?? Location.lookup('Jerusalem')!;

  const events = HebrewCalendar.calendar({ start: gdate, end: gdate, il: IL }) as Event[];
  const mask = events.reduce((acc, ev) => acc | ev.getFlags(), 0);

  const isRoshChodesh = !!(mask & flags.ROSH_CHODESH);
  const isCholHamoed = !!(mask & flags.CHOL_HAMOED);
  const isYomTov = !!(mask & flags.CHAG);

  const hallelNum = HebrewCalendar.hallel(hd, IL);
  const tach = HebrewCalendar.tachanun(hd, IL) as { shacharit: boolean; mincha: boolean };

  // פרשת השבוע — לשבת הקרובה
  const saturday = hd.getDay() === 6 ? hd : new HDate(hd.abs() + (6 - hd.getDay()));
  let parsha: string | null = null;
  try {
    const sedra = HebrewCalendar.getSedra(saturday.getFullYear(), IL);
    const satEvents = HebrewCalendar.calendar({
      start: saturday.greg(),
      end: saturday.greg(),
      il: IL,
      sedrot: true,
      noHolidays: true,
    }) as Event[];
    parsha = satEvents.length ? satEvents[0].render('he') : sedra.getString(saturday, 'he');
  } catch {
    parsha = null;
  }

  // זמני שבת — הדלקת נרות (שישי הקרוב) והבדלה
  let candleLighting: Date | null = null;
  let havdalah: Date | null = null;
  try {
    const friday = new HDate(hd.abs() + ((5 - hd.getDay() + 7) % 7));
    const shabbatEvents = HebrewCalendar.calendar({
      start: friday.greg(),
      end: new HDate(friday.abs() + 1).greg(),
      il: IL,
      candlelighting: true,
      location,
      noHolidays: false,
    }) as Event[];
    for (const ev of shabbatEvents) {
      const t = (ev as unknown as { eventTime?: Date }).eventTime;
      if (!t) continue;
      if (ev.getDesc().startsWith('Candle lighting')) candleLighting = t;
      if (ev.getDesc().startsWith('Havdalah')) havdalah = t;
    }
  } catch {
    /* אין זמנים — לא חוסם */
  }

  // זמני היום
  const z = new Zmanim(location as never, gdate, false);
  const zmanim: ZmanRow[] = [
    { label: 'עלות השחר', time: z.alotHaShachar() },
    { label: 'משיכיר', time: z.misheyakir() },
    { label: 'הנץ החמה', time: z.neitzHaChama() },
    { label: 'סוף זמן ק"ש (מג"א)', time: z.sofZmanShmaMGA() },
    { label: 'סוף זמן ק"ש (גר"א)', time: z.sofZmanShma() },
    { label: 'סוף זמן תפילה', time: z.sofZmanTfilla() },
    { label: 'חצות היום', time: z.chatzot() },
    { label: 'מנחה גדולה', time: z.minchaGedola() },
    { label: 'מנחה קטנה', time: z.minchaKetana() },
    { label: 'פלג המנחה', time: z.plagHaMincha() },
    { label: 'שקיעה', time: z.shkiah() },
    { label: 'צאת הכוכבים', time: z.tzeit() },
  ].filter((r) => r.time instanceof Date && !isNaN(r.time.getTime()));

  return {
    gdate,
    hd,
    hdateStr: hd.renderGematriya(),
    events: events
      .filter((ev) => !(ev.getFlags() & flags.OMER_COUNT))
      .map((ev) => ({ name: ev.render('he'), emoji: eventEmoji(ev) })),
    isRoshChodesh,
    isCholHamoed,
    isYomTov,
    yaalehVeyavo: isRoshChodesh || isCholHamoed || isYomTov,
    winterPrayer: isWinterPrayer(hd),
    talUmatar: isTalUmatar(hd),
    omerDay: omerDay(hd),
    hallel: hallelNum === 2 ? 'שלם' : hallelNum === 1 ? 'חצי' : null,
    tachanunShacharit: !!tach.shacharit,
    tachanunMincha: !!tach.mincha,
    parsha,
    candleLighting,
    havdalah,
    zmanim,
    tzid: location.getTzid(),
  };
}

export function formatTime(d: Date | null, tzid: string): string {
  if (!d) return '—';
  return new Intl.DateTimeFormat('he-IL', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: tzid,
  }).format(d);
}

/** תאריך עברי → לועזי בשנה עברית נתונה (להילולות) */
export function hilulaGregDate(hm: number, hdDay: number, hyear: number): Date {
  let m = hm;
  // אדר בשנה מעוברת: הילולות אדר נופלות באדר ב' לפי רוב הפוסקים? המנהג הרווח: אדר א'. נשמור אדר רגיל → בשנה מעוברת אדר ב' עבור הילולות שנקבעו באדר.
  if (m === months.ADAR_I && !HDate.isLeapYear(hyear)) m = months.ADAR_I; // אדר רגיל
  const daysIn = HDate.daysInMonth(m, hyear);
  return new HDate(Math.min(hdDay, daysIn), m, hyear).greg();
}
