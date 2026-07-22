// חיפוש תאריך עברי ליום הולדת — לפי תאריך לועזי, כולל מתי חוזר יום ההולדת העברי הקרוב
import { useMemo, useState } from 'react';
import { HDate } from '@hebcal/core';
import { nextHebrewAnniversary } from '../lib/dates';

export function HebrewBirthday() {
  const [open, setOpen] = useState(false);
  const [iso, setIso] = useState('');

  const birthHd = useMemo(() => (iso ? new HDate(new Date(iso + 'T12:00:00')) : null), [iso]);
  const next = useMemo(() => (birthHd ? nextHebrewAnniversary(birthHd) : null), [birthHd]);

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }} onClick={() => setOpen((o) => !o)}>
        <h2 style={{ margin: 0 }}>🎂 יום הולדת עברי — לפי תאריך לועזי</h2>
        <span className="muted">{open ? '▲' : '▼'}</span>
      </div>
      {open && (
        <div style={{ marginTop: 12 }}>
          <div className="field">
            <label>תאריך לידה (לועזי)</label>
            <input type="date" value={iso} onChange={(e) => setIso(e.target.value)} />
          </div>
          {birthHd && next && (
            <div style={{ marginTop: 10 }}>
              <div className="muted" style={{ marginBottom: 6 }}>
                התאריך העברי: <b style={{ color: 'var(--gold-bright)' }}>{birthHd.renderGematriya()}</b>
              </div>
              <span className="badge">
                יום ההולדת העברי הבא — {next.hd.renderGematriya()}
                {' · '}
                {next.daysUntil === 0 ? 'היום! 🎉' : next.daysUntil === 1 ? 'מחר' : `בעוד ${next.daysUntil} ימים`}
              </span>
              <div className="muted" style={{ marginTop: 8, fontSize: '0.82rem' }}>
                בלועזי: {new Intl.DateTimeFormat('he-IL', { day: 'numeric', month: 'long', year: 'numeric' }).format(next.gdate)}
              </div>
              <div className="muted" style={{ marginTop: 6, fontSize: '0.78rem' }}>
                💡 מי שנולד בחודש אדר בשנה פשוטה — בשנה מעוברת יום ההולדת חל באדר א׳ (מנהג אשכנז; יש הנוהגים באדר ב׳).
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
