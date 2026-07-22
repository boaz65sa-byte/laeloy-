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
import { DONATION, donationHasPaymentDetails } from './data/donation';

type Tab = 'today' | 'prayers' | 'azkara' | 'niftarim' | 'hilulot';

const TABS: { id: Tab; label: string; emoji: string }[] = [
  { id: 'today', label: 'היום', emoji: '📅' },
  { id: 'prayers', label: 'תפילות', emoji: '📖' },
  { id: 'azkara', label: 'אזכרה', emoji: '🕯️' },
  { id: 'niftarim', label: 'יקיריי', emoji: '💛' },
  { id: 'hilulot', label: 'הילולות', emoji: '✡️' },
];

export interface Profile {
  id: string;
  name: string;
}

// הגירה חד-פעמית: נתונים מגרסאות קודמות (בלי פרופילים) עוברים לפרופיל הראשי
function migrateLegacyStorage() {
  try {
    for (const k of ['settings', 'niftarim']) {
      const legacy = localStorage.getItem(`tefillah.${k}`);
      if (legacy && !localStorage.getItem(`tefillah.${k}.default`)) {
        localStorage.setItem(`tefillah.${k}.default`, legacy);
      }
    }
  } catch {
    /* לא חוסם */
  }
}
migrateLegacyStorage();

export default function App() {
  const [profiles, setProfiles] = useLocalStorage<Profile[]>('iluy.profiles', [
    { id: 'default', name: 'ראשי' },
  ]);
  const [activePid, setActivePid] = useLocalStorage<string>('iluy.activeProfile', 'default');
  const active = profiles.find((p) => p.id === activePid) ?? profiles[0] ?? { id: 'default', name: 'ראשי' };

  return (
    <MainApp
      key={active.id}
      pid={active.id}
      profiles={profiles}
      setProfiles={setProfiles}
      activeProfile={active}
      setActivePid={setActivePid}
    />
  );
}

interface MainProps {
  pid: string;
  profiles: Profile[];
  setProfiles: (v: Profile[] | ((prev: Profile[]) => Profile[])) => void;
  activeProfile: Profile;
  setActivePid: (v: string) => void;
}

function MainApp({ pid, profiles, setProfiles, activeProfile, setActivePid }: MainProps) {
  const [tab, setTab] = useState<Tab>('today');
  const [settings, setSettings] = useLocalStorage<Settings>(`tefillah.settings.${pid}`, DEFAULT_SETTINGS);
  const [niftarim, setNiftarim] = useLocalList<Niftar>(`tefillah.niftarim.${pid}`);
  const [showSettings, setShowSettings] = useState(false);
  const [showDonation, setShowDonation] = useState(false);
  const [newProfileName, setNewProfileName] = useState('');
  const [azkaraPrefill, setAzkaraPrefill] = useState<string | null>(null);

  const hdateStr = useMemo(() => new HDate(new Date()).renderGematriya(), []);

  const addProfile = () => {
    const name = newProfileName.trim();
    if (!name) return;
    const id = `p${Date.now()}`;
    setProfiles((prev) => [...prev, { id, name }]);
    setNewProfileName('');
    setActivePid(id);
  };

  const removeProfile = (id: string) => {
    if (profiles.length <= 1) return;
    if (!confirm('להסיר את הפרופיל? הנתונים שלו (נפטרים והגדרות) יימחקו מהמכשיר.')) return;
    try {
      localStorage.removeItem(`tefillah.settings.${id}`);
      localStorage.removeItem(`tefillah.niftarim.${id}`);
    } catch {
      /* לא חוסם */
    }
    const rest = profiles.filter((p) => p.id !== id);
    setProfiles(rest);
    if (id === pid) setActivePid(rest[0].id);
  };

  return (
    <>
      <header className="header">
        <div className="brand">
          <h1>🕯️ עילוי ונשמה</h1>
          <span className="hdate">{hdateStr}</span>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button className="icon-btn" onClick={() => setShowDonation(true)}>💝 תרומה</button>
          <button className="icon-btn" onClick={() => setShowSettings(true)}>
            ⚙️ {activeProfile.name}
          </button>
        </div>
      </header>

      {tab === 'today' && <Dashboard settings={settings} niftarim={niftarim} pid={pid} />}
      {tab === 'prayers' && <PrayerBank settings={settings} pid={pid} />}
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
      {tab === 'hilulot' && <Hilulot settings={settings} pid={pid} />}

      <div className="disclaimer">
        גרסת פיתוח ראשונית · הנוסחים והתאריכים טעונים בדיקה רבנית · אין להסתמך הלכה למעשה ללא אישור רב
        {' · '}
        <a
          href={`mailto:${DONATION.contactEmail}?subject=${encodeURIComponent('דיווח על טעות בנוסח — עילוי ונשמה')}`}
        >
          דיווח על טעות
        </a>
        <div className="brand-line">bs-simple · בועז סעדה — פתרונות יצירתיים</div>
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
                disabled={!!settings.customLocation}
                onChange={(e) => setSettings({ ...settings, city: e.target.value })}
              >
                {CITIES.map((c) => (
                  <option key={c.id} value={c.id}>{c.label}</option>
                ))}
              </select>
              {settings.customLocation ? (
                <div className="muted" style={{ marginTop: 6, fontSize: '0.85rem' }}>
                  📍 משתמש במיקום GPS מדויק במקום רשימת הערים.{' '}
                  <button className="btn secondary small" onClick={() => setSettings({ ...settings, customLocation: null })}>
                    בטל וחזור לרשימת ערים
                  </button>
                </div>
              ) : (
                <button
                  className="btn secondary small"
                  style={{ marginTop: 6 }}
                  onClick={() => {
                    if (!navigator.geolocation) {
                      alert('הדפדפן הזה לא תומך באיתור מיקום.');
                      return;
                    }
                    navigator.geolocation.getCurrentPosition(
                      (pos) => {
                        setSettings({
                          ...settings,
                          customLocation: {
                            lat: pos.coords.latitude,
                            lon: pos.coords.longitude,
                            label: 'המיקום שלי',
                          },
                        });
                      },
                      () => alert('לא הצלחנו לקבל הרשאה למיקום. אפשר להמשיך עם רשימת הערים.'),
                      { timeout: 10000 }
                    );
                  }}
                >
                  📍 השתמש במיקום המדויק שלי (GPS)
                </button>
              )}
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

            <h2 style={{ marginTop: 18 }}>👥 כניסות (פרופילים)</h2>
            <p className="muted" style={{ marginBottom: 10, fontSize: '0.85rem' }}>
              לכל פרופיל רשימת נפטרים והגדרות משלו — למשל פרופיל לכל בן משפחה. הנתונים נשמרים
              במכשיר זה בלבד. בעתיד: התחברות עם חשבון וסנכרון בין מכשירים.
            </p>
            {profiles.map((p) => (
              <div key={p.id} style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 6 }}>
                <button
                  className={`btn small ${p.id === pid ? '' : 'secondary'}`}
                  style={{ flex: 1 }}
                  onClick={() => {
                    setActivePid(p.id);
                    setShowSettings(false);
                  }}
                >
                  {p.id === pid ? '✓ ' : ''}{p.name}
                </button>
                {profiles.length > 1 && (
                  <button className="btn danger small" onClick={() => removeProfile(p.id)}>הסר</button>
                )}
              </div>
            ))}
            <div style={{ display: 'flex', gap: 6, marginTop: 8, marginBottom: 14 }}>
              <input
                placeholder="שם פרופיל חדש..."
                value={newProfileName}
                onChange={(e) => setNewProfileName(e.target.value)}
                style={{
                  flex: 1, background: 'var(--bg2)', border: '1px solid var(--border)',
                  color: 'var(--text)', borderRadius: 10, padding: '8px 12px', fontFamily: 'var(--font-ui)',
                }}
              />
              <button className="btn small" onClick={addProfile}>➕ הוסף</button>
            </div>

            <button className="btn" onClick={() => setShowSettings(false)}>שמור וסגור</button>
            <div className="muted" style={{ textAlign: 'center', marginTop: 12, fontSize: '0.8rem' }}>
              <a href="/privacy.html" target="_blank" rel="noreferrer">מדיניות פרטיות</a>
            </div>
          </div>
        </div>
      )}

      {showDonation && (
        <div className="modal-back" onClick={() => setShowDonation(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>💝 תרומה והנצחה</h2>
            <p style={{ marginBottom: 12, lineHeight: 1.7 }}>{DONATION.dedication}</p>
            <p className="muted" style={{ marginBottom: 14, lineHeight: 1.7 }}>{DONATION.memorial}</p>

            {DONATION.bitPhone && (
              <div className="donate-row">📱 ביט: <b>{DONATION.bitPhone}</b></div>
            )}
            {DONATION.payboxUrl && (
              <a className="btn secondary small donate-btn" href={DONATION.payboxUrl} target="_blank" rel="noreferrer">
                💳 תרומה ב-PayBox
              </a>
            )}
            {DONATION.paypalUrl && (
              <a className="btn secondary small donate-btn" href={DONATION.paypalUrl} target="_blank" rel="noreferrer">
                🌐 תרומה ב-PayPal
              </a>
            )}
            {DONATION.bankDetails && (
              <div className="donate-row">🏦 העברה בנקאית: {DONATION.bankDetails}</div>
            )}
            {!donationHasPaymentDetails() && (
              <div className="explain">אמצעי התרומה יפורסמו בקרוב, בעזרת ה'.</div>
            )}
            {DONATION.contactEmail && (
              <a
                className="btn secondary small donate-btn"
                href={`mailto:${DONATION.contactEmail}?subject=${encodeURIComponent('תרומה / הנצחה — עילוי ונשמה')}`}
              >
                ✉️ לתרומות והנצחות: {DONATION.contactEmail}
              </a>
            )}

            <div style={{ marginTop: 14 }}>
              <button className="btn" onClick={() => setShowDonation(false)}>סגור</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
