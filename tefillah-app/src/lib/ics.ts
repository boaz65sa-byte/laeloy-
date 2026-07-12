// הוספה ליומן — קישור Google Calendar וקובץ ICS (יומן הטלפון/אאוטלוק/אפל)

export interface CalEvent {
  date: Date; // אירוע של יום שלם
  title: string;
  description?: string;
}

function ymd(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}`;
}

function nextDay(d: Date): Date {
  const n = new Date(d);
  n.setDate(n.getDate() + 1);
  return n;
}

/** קישור להוספת אירוע אחד ליומן Google */
export function googleCalendarUrl(ev: CalEvent): string {
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: ev.title,
    dates: `${ymd(ev.date)}/${ymd(nextDay(ev.date))}`,
    details: ev.description ?? '',
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

function icsEscape(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
}

/** בונה קובץ ICS עם אירועי יום-שלם + תזכורת יום לפני */
export function buildICS(events: CalEvent[]): string {
  const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+Z$/, 'Z');
  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//bs-simple//Iluy VeNeshama//HE',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
  ];
  events.forEach((ev, i) => {
    lines.push(
      'BEGIN:VEVENT',
      `UID:iluy-${stamp}-${i}@bs-simple`,
      `DTSTAMP:${stamp}`,
      `DTSTART;VALUE=DATE:${ymd(ev.date)}`,
      `DTEND;VALUE=DATE:${ymd(nextDay(ev.date))}`,
      `SUMMARY:${icsEscape(ev.title)}`,
      ...(ev.description ? [`DESCRIPTION:${icsEscape(ev.description)}`] : []),
      'BEGIN:VALARM',
      'ACTION:DISPLAY',
      `DESCRIPTION:${icsEscape('תזכורת: ' + ev.title)}`,
      'TRIGGER:-P1D',
      'END:VALARM',
      'END:VEVENT'
    );
  });
  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}

/** מוריד קובץ ICS למכשיר — פתיחתו מוסיפה את האירועים ליומן */
export function downloadICS(events: CalEvent[], filename: string): void {
  const blob = new Blob([buildICS(events)], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename.endsWith('.ics') ? filename : `${filename}.ics`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
