// עזרי תאריך עברי — רשימות חודשים/ימים/שנים לבחירה, בעברית
import { HDate, months, gematriya } from '@hebcal/core';

const MONTH_LABELS: Record<number, string> = {
  [months.TISHREI]: 'תשרי',
  [months.CHESHVAN]: 'חשוון',
  [months.KISLEV]: 'כסלו',
  [months.TEVET]: 'טבת',
  [months.SHVAT]: 'שבט',
  [months.ADAR_I]: 'אדר',
  [months.ADAR_II]: 'אדר ב\'',
  [months.NISAN]: 'ניסן',
  [months.IYYAR]: 'אייר',
  [months.SIVAN]: 'סיוון',
  [months.TAMUZ]: 'תמוז',
  [months.AV]: 'אב',
  [months.ELUL]: 'אלול',
};

export interface MonthOption {
  value: number;
  label: string;
}

/** חודשי השנה העברית לפי סדר (תשרי→אלול), עם אדר א'/ב' בשנה מעוברת */
export function hebrewMonthOptions(hyear: number): MonthOption[] {
  const leap = HDate.isLeapYear(hyear);
  const order = leap
    ? [months.TISHREI, months.CHESHVAN, months.KISLEV, months.TEVET, months.SHVAT, months.ADAR_I, months.ADAR_II, months.NISAN, months.IYYAR, months.SIVAN, months.TAMUZ, months.AV, months.ELUL]
    : [months.TISHREI, months.CHESHVAN, months.KISLEV, months.TEVET, months.SHVAT, months.ADAR_I, months.NISAN, months.IYYAR, months.SIVAN, months.TAMUZ, months.AV, months.ELUL];
  return order.map((m) => ({
    value: m,
    label: leap && m === months.ADAR_I ? 'אדר א\'' : MONTH_LABELS[m],
  }));
}

/** ימי החודש (א'–כ"ט/ל') בגימטריה */
export function hebrewDayOptions(hmonth: number, hyear: number): MonthOption[] {
  const n = HDate.daysInMonth(hmonth, hyear);
  return Array.from({ length: n }, (_, i) => ({ value: i + 1, label: gematriya(i + 1) }));
}

/** טווח שנים עבריות לבחירה (120 שנה אחורה) בגימטריה */
export function hebrewYearOptions(): MonthOption[] {
  const current = new HDate(new Date()).getFullYear();
  return Array.from({ length: 121 }, (_, i) => {
    const y = current - i;
    return { value: y, label: gematriya(y % 1000) };
  });
}

export function currentHebrewYear(): number {
  return new HDate(new Date()).getFullYear();
}

/** תאריך עברי (יום/חודש/שנה) → ISO לועזי (בצהרי היום כדי להימנע מבעיות אזור זמן) */
export function hebrewToISO(day: number, month: number, year: number): string {
  const maxDay = HDate.daysInMonth(month, year);
  const g = new HDate(Math.min(day, maxDay), month, year).greg();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${g.getFullYear()}-${pad(g.getMonth() + 1)}-${pad(g.getDate())}`;
}
