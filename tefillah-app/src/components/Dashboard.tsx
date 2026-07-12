import { useMemo } from 'react';
import { HDate } from '@hebcal/core';
import { getDayInfo, formatTime, hilulaGregDate, CITIES } from '../lib/calendar';
import { HILULOT } from '../data/hilulot';
import { nextYahrzeit, type Niftar } from '../lib/yahrzeit';
import type { Settings } from '../lib/store';

interface Props {
  settings: Settings;
  niftarim: Niftar[];
}

export function Dashboard({ settings, niftarim }: Props) {
  const info = useMemo(() => getDayInfo(new Date(), settings.city), [settings.city]);

  // ההילולה הקרובה ביותר
  const nextHilula = useMemo(() => {
    const today = new HDate(new Date());
    const todayAbs = today.abs();
    return HILULOT.map((h) => {
      let hd = new HDate(hilulaGregDate(h.hm, h.hd, today.getFullYear()));
      if (hd.abs() < todayAbs) hd = new HDate(hilulaGregDate(h.hm, h.hd, today.getFullYear() + 1));
      return { ...h, hdate: hd, daysUntil: hd.abs() - todayAbs };
    }).sort((a, b) => a.daysUntil - b.daysUntil)[0];
  }, []);

  // האזכרה הקרובה ביותר מרשימת יקיריי
  const nextAzkara = useMemo(() => {
    const list = niftarim
      .map((n) => ({ n, yz: nextYahrzeit(n) }))
      .filter((x) => x.yz !== null)
      .sort((a, b) => a.yz!.daysUntil - b.yz!.daysUntil);
    return list[0] ?? null;
  }, [niftarim]);

  const gregStr = new Intl.DateTimeFormat('he-IL', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(info.gdate);

  const cityLabel = CITIES.find((c) => c.id === settings.city)?.label ?? settings.city;

  return (
    <div>
      <div className="card hero">
        <div className="hebrew-date">{info.hdateStr}</div>
        <div className="greg-date">{gregStr}</div>
        {info.parsha && <div className="parsha">📖 {info.parsha}</div>}
        {(info.events.length > 0 || info.omerDay) && (
          <div className="chips">
            {info.events.map((ev, i) => (
              <span key={i} className="chip gold">
                {ev.emoji} {ev.name}
              </span>
            ))}
            {info.omerDay && <span className="chip gold">🌾 היום {info.omerDay} לעומר</span>}
          </div>
        )}
      </div>

      <div className="card">
        <h2>מה אומרים היום בתפילה</h2>
        <div className="say-grid">
          <div className="say-item">
            <div className="say-title">משיב הרוח / מוריד הטל</div>
            <div className="say-value">{info.winterPrayer ? 'מַשִּׁיב הָרוּחַ וּמוֹרִיד הַגֶּשֶׁם' : 'מוֹרִיד הַטָּל'}</div>
            {settings.beginner && (
              <div className="say-note">
                {info.winterPrayer
                  ? 'עונת החורף — משמיני עצרת ועד פסח מזכירים גשם בתחילת העמידה.'
                  : 'עונת הקיץ — מפסח ועד שמיני עצרת מזכירים טל.'}
              </div>
            )}
          </div>
          <div className="say-item">
            <div className="say-title">ברכת השנים</div>
            <div className="say-value">{info.talUmatar ? 'בָּרֵךְ עָלֵינוּ (וְתֵן טַל וּמָטָר)' : 'בָּרְכֵנוּ'}</div>
            {settings.beginner && (
              <div className="say-note">
                {info.talUmatar
                  ? 'בארץ ישראל שואלים גשמים מז׳ בחשוון ועד ערב פסח.'
                  : 'בקיץ מבקשים ברכה בלי בקשת גשם.'}
              </div>
            )}
          </div>
          <div className="say-item">
            <div className="say-title">יעלה ויבוא</div>
            <div className="say-value">{info.yaalehVeyavo ? 'אומרים היום ✓' : 'לא אומרים היום'}</div>
            {settings.beginner && (
              <div className="say-note">נאמר בעמידה ובברכת המזון בראש חודש, בחגים ובחול המועד.</div>
            )}
          </div>
          <div className="say-item">
            <div className="say-title">הלל</div>
            <div className="say-value">
              {info.hallel === 'שלם' ? 'הלל שלם ✓' : info.hallel === 'חצי' ? 'חצי הלל (בדילוג)' : 'אין הלל היום'}
            </div>
            {settings.beginner && info.hallel && (
              <div className="say-note">ההלל נאמר אחרי חזרת הש״ץ בשחרית.</div>
            )}
          </div>
          <div className="say-item">
            <div className="say-title">תחנון</div>
            <div className="say-value">
              {info.tachanunShacharit && info.tachanunMincha
                ? 'אומרים תחנון היום'
                : !info.tachanunShacharit && !info.tachanunMincha
                  ? 'אין תחנון היום 🎉'
                  : info.tachanunShacharit
                    ? 'תחנון בשחרית בלבד'
                    : 'תחנון במנחה בלבד'}
            </div>
          </div>
          {info.isRoshChodesh && (
            <div className="say-item">
              <div className="say-title">ראש חודש 🌒</div>
              <div className="say-value">יעלה ויבוא + חצי הלל + מוסף</div>
              {settings.beginner && <div className="say-note">נשים נוהגות שלא לעשות מלאכות מסוימות בראש חודש.</div>}
            </div>
          )}
        </div>
      </div>

      <div className="say-grid" style={{ marginBottom: 14 }}>
        {nextHilula && (
          <div className="card" style={{ marginBottom: 0 }}>
            <h2>✡️ ההילולה הקרובה</h2>
            <h3>{nextHilula.name}</h3>
            <div className="muted">{nextHilula.title}</div>
            <div style={{ marginTop: 8 }}>
              <span className="badge">
                {nextHilula.hdate.renderGematriya()}
                {' · '}
                {nextHilula.daysUntil === 0 ? 'היום! 🔥' : nextHilula.daysUntil === 1 ? 'מחר' : `בעוד ${nextHilula.daysUntil} ימים`}
              </span>
            </div>
          </div>
        )}
        {nextAzkara && (
          <div className="card" style={{ marginBottom: 0 }}>
            <h2>🕯️ אזכרה קרובה</h2>
            <h3>
              {nextAzkara.n.name} {nextAzkara.n.gender === 'm' ? 'בן' : 'בת'} {nextAzkara.n.parentName}{' '}
              {nextAzkara.n.gender === 'm' ? 'ז"ל' : 'ע"ה'}
            </h3>
            <div style={{ marginTop: 8 }}>
              <span className="badge">
                {nextAzkara.yz!.hd.renderGematriya()}
                {' · '}
                {nextAzkara.yz!.daysUntil === 0 ? 'היום' : nextAzkara.yz!.daysUntil === 1 ? 'מחר' : `בעוד ${nextAzkara.yz!.daysUntil} ימים`}
              </span>
            </div>
          </div>
        )}
      </div>

      <div className="card">
        <h2>זמני שבת — {cityLabel}</h2>
        <div className="zmanim-grid">
          <div className="zman">
            <span>🕯️ הדלקת נרות</span>
            <b>{formatTime(info.candleLighting, info.tzid)}</b>
          </div>
          <div className="zman">
            <span>✨ צאת שבת</span>
            <b>{formatTime(info.havdalah, info.tzid)}</b>
          </div>
        </div>
      </div>

      <div className="card">
        <h2>זמני היום — {cityLabel}</h2>
        <div className="zmanim-grid">
          {info.zmanim.map((z) => (
            <div className="zman" key={z.label}>
              <span>{z.label}</span>
              <b>{formatTime(z.time, info.tzid)}</b>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
