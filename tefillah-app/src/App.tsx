import { useMemo, useState } from 'react';
import { HDate } from '@hebcal/core';
import { Dashboard } from './components/Dashboard';
import { PrayerBank } from './components/PrayerBank';
import { Hashkava } from './components/Hashkava';
import { Niftarim } from './components/Niftarim';
import { Hilulot } from './components/Hilulot';
import { useLocalStorage, useLocalList, DEFAULT_SETTINGS, type Settings } from './lib/store';
import type { Niftar } from './lib/yahrzeit';
import { CITIES } from './lib/calendar';

type Tab = 'today' | 'prayers' | 'azkara' | 'niftarim' | 'hilulot';

const TABS: { id: Tab; label: string; emoji: string }[] = [
  { id: 'today', label: 'היום', emoji: '📅' },
  { id: 'prayers', label: 'תפילות', emoji: '📖' },
  { id: 'azkara', label: 'אזכרה', emoji: '🕯️' },
  { id: 'niftarim', label: 'יקיריי', emoji: '💛' },
  { id: 'hilulot', label: 'הילולות', emoji: '✡️' },
];

export default function App() {
  const [tab, setTab] = useState<Tab>('today');
  const [settings, setSettings] = useLocalStorage<Settings>('tefillah.settings', DEFAULT_SETTINGS);
  const [niftarim, setNiftarim] = useLocalList<Niftar>('tefillah.niftarim');
  const [showSettings, setShowSettings] = useState(false);
  const [azkaraPrefill, setAzkaraPrefill] = useState<string | null>(null);

  const hdateStr = useMemo(() => new HDate(new Date()).renderGematriya(), []);

  return (
    <>
      <header className="header">
        <div className="brand">
          <h1>🕯️ לעילוי</h1>
          <span className="hdate">{hdateStr}</span>
        </div>
        <button className="icon-btn" onClick={() => setShowSettings(true)}>
          ⚙️ {settings.nusach === 'sefardi' ? 'ספרדי' : 'אשכנזי'}
        </button>
      </header>

      {tab === 'today' && <Dashboard settings={settings} />}
      {tab === 'prayers' && <PrayerBank settings={settings} />}
      {tab === 'azkara' && (
        <Hashkava key={azkaraPrefill ?? 'none'} settings={settings} niftarim={niftarim} prefillId={azkaraPrefill} />
      )}
      {tab === 'niftarim' && (
        <Niftarim
          settings={settings}
          niftarim={niftarim}
          setNiftarim={setNiftarim}
          onPrepareAzkara={(id) => {
            setAzkaraPrefill(id);
            setTab('azkara');
          }}
        />
      )}
      {tab === 'hilulot' && <Hilulot settings={settings} />}

      <div className="disclaimer">
        גרסת פיתוח ראשונית · הנוסחים והתאריכים טעונים בדיקה רבנית · אין להסתמך הלכה למעשה ללא אישור רב
      </div>

      <nav className="tabs">
        {TABS.map((t) => (
          <button key={t.id} className={tab === t.id ? 'active' : ''} onClick={() => setTab(t.id)}>
            <span className="emoji">{t.emoji}</span>
            {t.label}
          </button>
        ))}
      </nav>

      {showSettings && (
        <div className="modal-back" onClick={() => setShowSettings(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>⚙️ הגדרות</h2>
            <div className="field">
              <label>נוסח התפילה</label>
              <select
                value={settings.nusach}
                onChange={(e) => setSettings({ ...settings, nusach: e.target.value as Settings['nusach'] })}
              >
                <option value="sefardi">ספרדי / עדות המזרח</option>
                <option value="ashkenazi">אשכנזי</option>
              </select>
            </div>
            <div className="field">
              <label>עיר (לזמני היום והשבת)</label>
              <select
                value={settings.city}
                onChange={(e) => setSettings({ ...settings, city: e.target.value })}
              >
                {CITIES.map((c) => (
                  <option key={c.id} value={c.id}>{c.label}</option>
                ))}
              </select>
            </div>
            <div className="field">
              <label className="check">
                <input
                  type="checkbox"
                  checked={settings.beginner}
                  onChange={(e) => setSettings({ ...settings, beginner: e.target.checked })}
                />
                מצב מתחיל — הסברים לפני כל קטע (מומלץ לחוזרים בתשובה)
              </label>
            </div>
            <button className="btn" onClick={() => setShowSettings(false)}>שמור וסגור</button>
          </div>
        </div>
      )}
    </>
  );
}
