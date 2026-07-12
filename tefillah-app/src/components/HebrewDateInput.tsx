// קלט תאריך משולב — לועזי או עברי, עם המרה חיה בין השניים
import { useState } from 'react';
import { HDate } from '@hebcal/core';
import {
  hebrewMonthOptions,
  hebrewDayOptions,
  hebrewYearOptions,
  currentHebrewYear,
  hebrewToISO,
} from '../lib/dates';

interface Props {
  /** ISO לועזי (YYYY-MM-DD) — מקור האמת */
  valueISO: string;
  onChange: (iso: string) => void;
  label: string;
}

export function HebrewDateInput({ valueISO, onChange, label }: Props) {
  const [mode, setMode] = useState<'greg' | 'hebrew'>('greg');
  const [hDay, setHDay] = useState(1);
  const [hMonth, setHMonth] = useState(7); // תשרי
  const [hYear, setHYear] = useState(currentHebrewYear());

  const hdPreview = valueISO ? new HDate(new Date(valueISO + 'T12:00:00')) : null;

  const setHebrew = (d: number, m: number, y: number) => {
    setHDay(d);
    setHMonth(m);
    setHYear(y);
    onChange(hebrewToISO(d, m, y));
  };

  const switchMode = (next: 'greg' | 'hebrew') => {
    if (next === 'hebrew' && hdPreview) {
      // מאתחלים את בוררי העברי מהתאריך הקיים
      setHDay(hdPreview.getDate());
      setHMonth(hdPreview.getMonth());
      setHYear(hdPreview.getFullYear());
    }
    setMode(next);
  };

  return (
    <div className="field" style={{ gridColumn: 'span 2' }}>
      <label>
        {label}{' '}
        <span className="date-mode">
          <button type="button" className={mode === 'greg' ? 'active' : ''} onClick={() => switchMode('greg')}>
            לועזי
          </button>
          <button type="button" className={mode === 'hebrew' ? 'active' : ''} onClick={() => switchMode('hebrew')}>
            עברי
          </button>
        </span>
      </label>
      {mode === 'greg' ? (
        <>
          <input type="date" value={valueISO} onChange={(e) => onChange(e.target.value)} />
          {hdPreview && <span className="muted" style={{ fontSize: '0.82rem' }}>בעברית: {hdPreview.renderGematriya()}</span>}
        </>
      ) : (
        <>
          <div style={{ display: 'flex', gap: 6 }}>
            <select value={hDay} onChange={(e) => setHebrew(Number(e.target.value), hMonth, hYear)} style={{ flex: 1 }}>
              {hebrewDayOptions(hMonth, hYear).map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            <select value={hMonth} onChange={(e) => setHebrew(hDay, Number(e.target.value), hYear)} style={{ flex: 1.4 }}>
              {hebrewMonthOptions(hYear).map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            <select value={hYear} onChange={(e) => setHebrew(hDay, hMonth, Number(e.target.value))} style={{ flex: 1.2 }}>
              {hebrewYearOptions().map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
          {valueISO && (
            <span className="muted" style={{ fontSize: '0.82rem' }}>
              בלועזי: {new Intl.DateTimeFormat('he-IL', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(valueISO + 'T12:00:00'))}
            </span>
          )}
        </>
      )}
    </div>
  );
}
