import { useMemo, useState } from 'react';
import { PRAYERS, CATEGORIES, type Prayer } from '../data/prayers';
import { searchScore, sanitizeSacred } from '../lib/hebrew';
import type { Settings } from '../lib/store';
import TEHILLIM from '../data/tehillim.json';

const tehillim = TEHILLIM as Record<string, string[]>;

const HEB_NUM = (n: number) => {
  // מספר פרק בגימטריה פשוטה לתצוגה
  const ones = ['', 'א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ז', 'ח', 'ט'];
  const tens = ['', 'י', 'כ', 'ל', 'מ', 'נ', 'ס', 'ע', 'פ', 'צ'];
  const hundreds = ['', 'ק', 'ר', 'ש', 'ת'];
  let s = hundreds[Math.floor(n / 100)] + tens[Math.floor((n % 100) / 10)] + ones[n % 10];
  if (s === 'יה') s = 'טו';
  if (s === 'יו') s = 'טז';
  return s.length > 1 ? s.slice(0, -1) + '"' + s.slice(-1) : s + "'";
};

function prayerBody(p: Prayer): string {
  if (p.text) return p.text;
  if (p.tehillimChapters) {
    return p.tehillimChapters
      .map((ch) => `— תהילים פרק ${HEB_NUM(ch)} —\n\n${sanitizeSacred((tehillim[String(ch)] ?? []).join(' '))}`)
      .join('\n\n');
  }
  return '';
}

export function PrayerBank({ settings }: { settings: Settings }) {
  const [query, setQuery] = useState('');
  const [cat, setCat] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [fontScale, setFontScale] = useState(settings.fontScale);

  const results = useMemo(() => {
    let list = PRAYERS.filter((p) => p.nusach === 'both' || p.nusach === settings.nusach);
    if (cat) list = list.filter((p) => p.category === cat);
    if (query.trim()) {
      list = list
        .map((p) => ({ p, score: searchScore(query, p.title, p.tags, prayerBody(p) + ' ' + p.whenToSay) }))
        .filter((r) => r.score > 0)
        .sort((a, b) => b.score - a.score)
        .map((r) => r.p);
    }
    return list;
  }, [query, cat, settings.nusach]);

  const open = openId ? PRAYERS.find((p) => p.id === openId) : null;

  if (open) {
    return (
      <div>
        <div className="reader-controls">
          <button className="btn secondary small" onClick={() => setOpenId(null)}>→ חזרה לרשימה</button>
          <button className="btn secondary small" onClick={() => setFontScale((f) => Math.min(f + 0.15, 2))}>א+ הגדל</button>
          <button className="btn secondary small" onClick={() => setFontScale((f) => Math.max(f - 0.15, 0.7))}>א- הקטן</button>
          <button className="btn small" onClick={() => window.print()}>🖨️ הדפסה</button>
        </div>
        <div className="card print-area" style={{ ['--font-scale' as string]: fontScale }}>
          <div className="doc-header">
            <div className="doc-title">{open.title}</div>
            {open.source && <div className="doc-sub">{open.source}</div>}
          </div>
          {settings.beginner && <div className="explain">💡 {open.whenToSay}</div>}
          <div className="holy-text">{prayerBody(open)}</div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="search-row">
        <input
          placeholder="🔍 חיפוש תפילה או סגולה... (למשל: פרנסה, שמירה, זיווג)"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>
      <div className="cat-chips">
        <button className={cat === null ? 'active' : ''} onClick={() => setCat(null)}>הכל</button>
        {CATEGORIES.map((c) => (
          <button key={c} className={cat === c ? 'active' : ''} onClick={() => setCat(c)}>{c}</button>
        ))}
      </div>
      {results.length === 0 && <div className="card muted">לא נמצאו תוצאות עבור "{query}"</div>}
      {results.map((p) => (
        <div className="card prayer-card" key={p.id} onClick={() => setOpenId(p.id)}>
          <h3>{p.title}</h3>
          <div className="muted">{p.whenToSay}</div>
          <div className="tags">
            <span className="tag">📂 {p.category}</span>
            {p.source && <span className="tag">📜 {p.source}</span>}
            {p.tags.slice(0, 4).map((t) => (
              <span className="tag" key={t}>{t}</span>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
