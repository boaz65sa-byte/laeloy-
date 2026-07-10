// חישובי אזכרה (יארצייט), שבעה, שלושים, סיום קדיש
import { HDate, HebrewCalendar, months } from '@hebcal/core';

export interface Niftar {
  id: string;
  name: string; // שם הנפטר/ת
  parentName: string; // שם האם (ספרדים) / האב (אשכנזים)
  parentType: 'em' | 'av';
  gender: 'm' | 'f';
  deathDateISO: string; // תאריך לועזי של הפטירה
  afterSunset: boolean; // נפטר/ה אחרי שקיעה → היום העברי הבא
  relation?: string; // קרבה (אבא, אמא, סבא...)
}

export function deathHDate(n: Niftar): HDate {
  const g = new Date(n.deathDateISO + 'T12:00:00');
  const hd = new HDate(g);
  return n.afterSunset ? new HDate(hd.abs() + 1) : hd;
}

export interface YahrzeitInfo {
  hd: HDate;
  gdate: Date;
  daysUntil: number;
  yearsSince: number;
}

/**
 * זהירות: getYahrzeit של hebcal משנה (mutates) את אובייקט התאריך שמועבר אליו
 * כשיש לו שדות yy/mm/dd — לכן מעבירים עותק טרי בכל קריאה.
 */
function yahrzeitInYear(hyear: number, death: HDate): HDate | undefined {
  const fresh = { yy: death.getFullYear(), mm: death.getMonth(), dd: death.getDate() };
  const raw = HebrewCalendar.getYahrzeit(hyear, fresh as unknown as HDate) as unknown;
  if (!raw) return undefined;
  return raw instanceof HDate ? raw : new HDate(raw as Date);
}

/** האזכרה הקרובה (כולל היום) — לפי כללי ההלכה של @hebcal (אדר, ל' בחודש חסר) */
export function nextYahrzeit(n: Niftar, from = new Date()): YahrzeitInfo | null {
  const death = deathHDate(n);
  const today = new HDate(from);
  for (let hy = today.getFullYear(); hy <= today.getFullYear() + 2; hy++) {
    const yz = yahrzeitInYear(hy, death);
    if (yz && yz.abs() >= today.abs()) {
      return {
        hd: yz,
        gdate: yz.greg(),
        daysUntil: yz.abs() - today.abs(),
        yearsSince: hy - death.getFullYear(),
      };
    }
  }
  return null;
}

function nextHebrewMonth(m: number, y: number): { m: number; y: number } {
  const order: number[] = HDate.isLeapYear(y)
    ? [months.TISHREI, months.CHESHVAN, months.KISLEV, months.TEVET, months.SHVAT, months.ADAR_I, months.ADAR_II, months.NISAN, months.IYYAR, months.SIVAN, months.TAMUZ, months.AV, months.ELUL]
    : [months.TISHREI, months.CHESHVAN, months.KISLEV, months.TEVET, months.SHVAT, months.ADAR_I, months.NISAN, months.IYYAR, months.SIVAN, months.TAMUZ, months.AV, months.ELUL];
  const idx = order.indexOf(m);
  if (idx === -1 || idx === order.length - 1) return { m: months.TISHREI, y: y + 1 };
  return { m: order[idx + 1], y };
}

/** תאריך בתום N חודשים עבריים מהפטירה (לסיום קדיש — 11 חודשים) */
export function addHebrewMonths(hd: HDate, n: number): HDate {
  let m = hd.getMonth();
  let y = hd.getFullYear();
  for (let i = 0; i < n; i++) {
    const next = nextHebrewMonth(m, y);
    m = next.m;
    y = next.y;
  }
  const day = Math.min(hd.getDate(), HDate.daysInMonth(m, y));
  return new HDate(day, m, y);
}

export interface MourningMilestones {
  shivaEnd: HDate; // משוער — מבוסס יום פטירה (בפועל נספר מהקבורה)
  shloshim: HDate;
  kaddishEnd: HDate; // 11 חודשים
  firstYahrzeit: HDate | null;
}

export function mourningMilestones(n: Niftar): MourningMilestones {
  const death = deathHDate(n);
  const yz = yahrzeitInYear(death.getFullYear() + 1, death);
  return {
    shivaEnd: new HDate(death.abs() + 6),
    shloshim: new HDate(death.abs() + 29),
    kaddishEnd: addHebrewMonths(death, 11),
    firstYahrzeit: yz ?? null,
  };
}
