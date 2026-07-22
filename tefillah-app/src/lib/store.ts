import { useEffect, useState } from 'react';

export interface CustomLocation {
  lat: number;
  lon: number;
  label: string;
}

export interface Settings {
  nusach: 'sefardi' | 'ashkenazi';
  city: string;
  customLocation: CustomLocation | null; // מיקום GPS מדויק — עוקף את בחירת העיר בזמני היום
  beginner: boolean; // מצב מתחיל — הסברים לפני כל קטע
  fontScale: number; // 1 = רגיל
}

export const DEFAULT_SETTINGS: Settings = {
  nusach: 'sefardi',
  city: 'Jerusalem',
  customLocation: null,
  beginner: true,
  fontScale: 1,
};

export function useLocalStorage<T>(key: string, initial: T): [T, (v: T | ((prev: T) => T)) => void] {
  const [value, setValue] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return initial;
      const parsed = JSON.parse(raw);
      // מיזוג עם ברירת המחדל (כדי שהוספת שדה חדש ל-Settings תמיד תקבל ערך) — אבל
      // רק עבור אובייקטים: spread של מערך ({...arr}) הופך אותו לאובייקט עם מפתחות מספריים!
      if (Array.isArray(initial)) return parsed as T;
      if (parsed && typeof parsed === 'object') return { ...initial, ...parsed };
      return parsed as T;
    } catch {
      return initial;
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* אחסון מלא/חסום — לא חוסם */
    }
  }, [key, value]);
  return [value, setValue];
}

export function useLocalList<T>(key: string): [T[], (v: T[] | ((prev: T[]) => T[])) => void] {
  const [value, setValue] = useState<T[]>(() => {
    try {
      const raw = localStorage.getItem(key);
      return raw ? (JSON.parse(raw) as T[]) : [];
    } catch {
      return [];
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* לא חוסם */
    }
  }, [key, value]);
  return [value, setValue];
}
