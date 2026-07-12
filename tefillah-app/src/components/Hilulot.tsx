import { useMemo, useState } from 'react';
import { HDate } from '@hebcal/core';
import { HILULOT, type Hilula } from '../data/hilulot';
import { hilulaGregDate } from '../lib/calendar';
import { normalizeForSearch } from '../lib/hebrew';
import { googleCalendarUrl, downloadICS } from '../lib/ics';
import type { Settings } from '../lib/store';

interface HilulaWithDate extends Omit<Hilula, 'hd'> {
  hd: number;
  gdate: Date;
  hdate: HDate;
  daysUntil: number;
}

export function Hilulot({ settings }: { settings: Settings }) {
  const [query, setQuery] = useState('');

  const list = useMemo<HilulaWithDate[]>(() => {
    const today = new HDate(new Date());
    const todayAbs = today.abs();
    return HILULOT.map((h) => {
      // התאריך הקרוב — השנה העברית הנוכחית, ואם עבר — השנה הבאה
      let g = hilulaGregDate(h.hm, h.hd, today.getFullYear());
      let hd = new HDate(g);
      if (hd.abs() < todayAbs) {
        g = hilulaGregDate(h.hm, h.hd, today.getFullYear() + 1);
        hd = new HDate(g);
      }
      return { ...h, gdate: g, hdate: hd, daysUntil: hd.abs() - todayAbs };
    }).sort((a, b) => a.daysUntil - b.daysUntil);
  }, []);

  const filtered = query.trim()
    ? list.filter((h) => {
        const q = normalizeForSearch(query);
        return (
          normalizeForSearch(h.name).includes(q) ||
          normalizeForSearch(h.title).includes(q) ||
          normalizeForSearch(h.about).includes(q) ||
          (h.place && normalizeForSearch(h.place).includes(q))
        );
      })
    : list;

  return (
    <div>
      <div className="card" style={{ textAlign: 'center' }}>
        <h2>🕯️ לוח הילולות צדיקים</h2>
        <div className="muted">
          התאריכים מחושבים אוטומטית לפי התאריך העברי — הלוח מתעדכן מעצמו כל שנה
        </div>
      </div>
      <div className="search-row">
        <input
          placeholder="🔍 חיפוש צדיק... (למשל: בבא סאלי, רשב״י, מירון)"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>
      {filtered.map((h) => {
        const gregStr = new Intl.DateTimeFormat('he-IL', { day: 'numeric', month: 'long', year: 'numeric' }).format(h.gdate);
        return (
          <div className="card" key={h.id}>
            <div className="hilula-row">
              <div className="hilula-date">
                <div className="day">{h.hdate.renderGematriya().split(' ').slice(0, 2).join(' ')}</div>
                <div className="muted" style={{ fontSize: '0.78rem' }}>{gregStr}</div>
                {h.daysUntil === 0 ? (
                  <div className="today-badge" style={{ marginTop: 4 }}>היום! 🔥</div>
                ) : (
                  <div className="muted" style={{ fontSize: '0.78rem', marginTop: 2 }}>
                    בעוד {h.daysUntil} ימים
                  </div>
                )}
              </div>
              <div>
                <h3>{h.name}</h3>
                <div style={{ color: 'var(--gold-bright)', fontSize: '0.9rem' }}>{h.title}</div>
                {h.place && <div className="muted" style={{ marginTop: 2 }}>📍 {h.place}</div>}
                <div className="muted" style={{ marginTop: 6 }}>{h.about}</div>
                <div style={{ display: 'flex', gap: 6, marginTop: 10, flexWrap: 'wrap' }}>
                  <button
                    className="btn secondary small"
                    onClick={() => {
                      window.open(
                        googleCalendarUrl({
                          date: h.gdate,
                          title: `✡️ הילולת ${h.name}`,
                          description: `${h.title}${h.place ? ' · ' + h.place : ''} — נוצר באפליקציית עילוי ונשמה`,
                        }),
                        '_blank'
                      );
                    }}
                  >
                    📅 יומן Google
                  </button>
                  <button
                    className="btn secondary small"
                    onClick={() => {
                      const today = new HDate(new Date());
                      const thisYear = hilulaGregDate(h.hm, h.hd, today.getFullYear());
                      const startYear = new HDate(thisYear).abs() < today.abs() ? today.getFullYear() + 1 : today.getFullYear();
                      const events = Array.from({ length: 10 }, (_, i) => ({
                        date: hilulaGregDate(h.hm, h.hd, startYear + i),
                        title: `✡️ הילולת ${h.name}`,
                        description: `${h.title}${h.place ? ' · ' + h.place : ''} — נוצר באפליקציית עילוי ונשמה`,
                      }));
                      downloadICS(events, `hilula-${h.id}`);
                    }}
                  >
                    📲 ליומן הטלפון (10 שנים)
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
