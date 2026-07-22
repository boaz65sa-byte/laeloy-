import { Component, type ErrorInfo, type ReactNode } from 'react';
import { DONATION } from '../data/donation';

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

// תופס קריסות React כדי שהמשתמש לא יישאר מול מסך לבן — קריטי דווקא ברגע
// שבו האפליקציה נפתחת בבית העלמין או באמצע טקס.
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('שגיאה לא צפויה באפליקציה:', error, info.componentStack);
  }

  private reset = () => {
    this.setState({ error: null });
  };

  private reload = () => {
    window.location.reload();
  };

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    return (
      <div style={{ padding: 24, textAlign: 'center', direction: 'rtl' }}>
        <h2>🕯️ משהו השתבש</h2>
        <p className="muted" style={{ marginTop: 8, lineHeight: 1.7 }}>
          אירעה שגיאה לא צפויה. הנתונים שלכם (נפטרים, הגדרות) נשמרים במכשיר ולא נפגעו.
        </p>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 18, flexWrap: 'wrap' }}>
          <button className="btn" onClick={this.reload}>🔄 טעינה מחדש</button>
          <button className="btn secondary" onClick={this.reset}>חזרה למסך הקודם</button>
          <a
            className="btn secondary"
            href={`mailto:${DONATION.contactEmail}?subject=${encodeURIComponent('דיווח על תקלה — עילוי ונשמה')}&body=${encodeURIComponent(
              'תיאור התקלה: ' + error.message
            )}`}
          >
            ✉️ דיווח על התקלה
          </a>
        </div>
      </div>
    );
  }
}
