import { useState } from 'react';
import { type Niftar, deathHDate, nextYahrzeit, nextYahrzeits, mourningMilestones } from '../lib/yahrzeit';
import type { Settings } from '../lib/store';
import { HDate } from '@hebcal/core';
import { HebrewDateInput } from './HebrewDateInput';
import { googleCalendarUrl, downloadICS } from '../lib/ics';

interface Props {
  settings: Settings;
  niftarim: Niftar[];
  setNiftarim: (fn: (prev: Niftar[]) => Niftar[]) => void;
  onPrepareAzkara: (id: string) => void;
}

const RELATIONS = ['אבא', 'אמא', 'סבא', 'סבתא', 'אח', 'אחות', 'בן/בת זוג', 'חבר/ה', 'אחר'];

export function Niftarim({ settings, niftarim, setNiftarim, onPrepareAzkara }: Props) {
  const [name, setName] = useState('');
  const [parentName, setParentName] = useState('');
  const [gender, setGender] = useState<'m' | 'f'>('m');
  const [relation, setRelation] = useState('אבא');
  const [dateISO, setDateISO] = useState('');
  const [afterSunset, setAfterSunset] = useState(false);

  const add = () => {
    if (!name.trim() || !dateISO) return;
    const n: Niftar = {
      id: String(Date.now()),
      name: name.trim(),
      parentName: parentName.trim(),
      parentType: settings.nusach === 'sefardi' ? 'em' : 'av',
      gender,
      deathDateISO: dateISO,
      afterSunset,
      relation,
    };
    setNiftarim((prev) => [...prev, n]);
    setName('');
    setParentName('');
    setDateISO('');
    setAfterSunset(false);
  };

  const today = new HDate(new Date());

  return (
    <div>
      <div className="card">
        <h2>➕ הוספת יקיר/ה לרשימת האזכרות</h2>
        {settings.beginner && (
          <div className="explain">
            💡 מזינים את תאריך הפטירה — עברי או לועזי — והאפליקציה מחשבת את האזכרה בכל שנה לפי
            כללי ההלכה. אם הפטירה הייתה אחרי השקיעה, מסמנים ✓ — כי בלוח העברי היום מתחיל בשקיעה.
            נפטר באדר של שנה פשוטה? בשנה מעוברת האזכרה תחושב לפי הנוסח שבהגדרות: ספרדי — אדר ב',
            אשכנזי — אדר א'.
          </div>
        )}
        <div className="form-grid">
          <div className="field">
            <label>שם הנפטר/ת</label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="שם פרטי" />
          </div>
          <div className="field">
            <label>{settings.nusach === 'sefardi' ? 'שם האם' : 'שם האב'}</label>
            <input value={parentName} onChange={(e) => setParentName(e.target.value)} />
          </div>
          <div className="field">
            <label>מגדר</label>
            <select value={gender} onChange={(e) => setGender(e.target.value as 'm' | 'f')}>
              <option value="m">זכר</option>
              <option value="f">נקבה</option>
            </select>
          </div>
          <div className="field">
            <label>קרבה</label>
            <select value={relation} onChange={(e) => setRelation(e.target.value)}>
              {RELATIONS.map((r) => (
                <option key={r}>{r}</option>
              ))}
            </select>
          </div>
          <HebrewDateInput label="תאריך פטירה" valueISO={dateISO} onChange={setDateISO} />
          <div className="field">
            <label>&nbsp;</label>
            <label className="check">
              <input type="checkbox" checked={afterSunset} onChange={(e) => setAfterSunset(e.target.checked)} />
              הפטירה הייתה אחרי השקיעה (בתאריך לועזי)
            </label>
          </div>
        </div>
        <div style={{ marginTop: 14 }}>
          <button className="btn" onClick={add} style={{ opacity: !name.trim() || !dateISO ? 0.5 : 1 }}>
            שמור ברשימה
          </button>
        </div>
      </div>

      {niftarim.length === 0 && (
        <div className="card muted">עדיין אין נפטרים ברשימה. הוסיפו יקיר/ה כדי לקבל חישוב אזכרה אוטומטי.</div>
      )}

      {niftarim
        .map((n) => ({ n, yz: nextYahrzeit(n, settings.nusach) }))
        .sort((a, b) => (a.yz?.daysUntil ?? 9999) - (b.yz?.daysUntil ?? 9999))
        .map(({ n, yz }) => {
          const death = deathHDate(n);
          const ms = mourningMilestones(n, settings.nusach);
          const inKaddishPeriod = today.abs() <= ms.kaddishEnd.abs();
          const gregYz = yz
            ? new Intl.DateTimeFormat('he-IL', { day: 'numeric', month: 'long', year: 'numeric', weekday: 'long' }).format(yz.gdate)
            : '';
          return (
            <div className="card" key={n.id}>
              <div className="niftar-row">
                <div>
                  <h3>
                    {n.name} {n.gender === 'm' ? 'בן' : 'בת'} {n.parentName} {n.gender === 'm' ? 'ז"ל' : 'ע"ה'}{' '}
                    <span className="muted">({n.relation})</span>
                  </h3>
                  <div className="muted">נפטר/ה: {death.renderGematriya()}</div>
                  {yz && (
                    <div style={{ marginTop: 8 }}>
                      <span className="badge">
                        🕯️ אזכרה {yz.yearsSince > 0 ? `(${yz.yearsSince} שנים)` : ''}: {yz.hd.renderGematriya()} — {gregYz}
                      </span>{' '}
                      <span className="muted">
                        {yz.daysUntil === 0 ? 'היום!' : yz.daysUntil === 1 ? 'מחר' : `בעוד ${yz.daysUntil} ימים`}
                      </span>
                    </div>
                  )}
                </div>
                <div className="actions">
                  <button className="btn small" onClick={() => onPrepareAzkara(n.id)}>🕯️ הכן סידור אזכרה</button>
                  {yz && (
                    <>
                      <button
                        className="btn secondary small"
                        onClick={() => {
                          const title = `🕯️ אזכרה: ${n.name} ${n.gender === 'm' ? 'בן' : 'בת'} ${n.parentName}`;
                          window.open(
                            googleCalendarUrl({
                              date: yz.gdate,
                              title,
                              description: `יום השנה (${yz.hd.renderGematriya()}) — נוצר באפליקציית עילוי ונשמה`,
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
                          const title = `🕯️ אזכרה: ${n.name} ${n.gender === 'm' ? 'בן' : 'בת'} ${n.parentName}`;
                          const events = nextYahrzeits(n, settings.nusach, 10).map((y) => ({
                            date: y.gdate,
                            title,
                            description: `יום השנה (${y.hd.renderGematriya()}) — נוצר באפליקציית עילוי ונשמה`,
                          }));
                          downloadICS(events, `azkara-${n.name}`);
                        }}
                      >
                        📲 ליומן הטלפון (10 שנים)
                      </button>
                    </>
                  )}
                  <button
                    className="btn danger small"
                    onClick={() => {
                      if (confirm(`להסיר את ${n.name} מהרשימה?`)) {
                        setNiftarim((prev) => prev.filter((x) => x.id !== n.id));
                      }
                    }}
                  >
                    הסר
                  </button>
                </div>
              </div>
              {inKaddishPeriod && (
                <div className="milestones">
                  <div className="milestone"><b>סיום שבעה (משוער)</b>{ms.shivaEnd.renderGematriya()}</div>
                  <div className="milestone"><b>שלושים (משוער)</b>{ms.shloshim.renderGematriya()}</div>
                  <div className="milestone"><b>סיום י"א חודשי קדיש</b>{ms.kaddishEnd.renderGematriya()}</div>
                  {ms.firstYahrzeit && (
                    <div className="milestone"><b>אזכרת השנה</b>{ms.firstYahrzeit.renderGematriya()}</div>
                  )}
                </div>
              )}
              {inKaddishPeriod && settings.beginner && (
                <div className="explain" style={{ marginTop: 10 }}>
                  💡 השבעה והשלושים נספרים מיום הקבורה — התאריכים כאן משוערים לפי יום הפטירה. יש
                  הנוהגים להפסיק קדיש שבוע לפני תום י"א חודש. התייעצו עם רב.
                </div>
              )}
            </div>
          );
        })}
    </div>
  );
}
