import { useEffect, useState } from 'react';

export interface Settings {
  nusach: 'sefardi' | 'ashkenazi';
  city: string;
  beginner: boolean; // מצב מתחיל — הסברים לפני כל קטע
  fontScale: number; // 1 = רגיל
}

export const DEFAULT_SETTINGS: Settings = {
  nusach: 'sefardi',
  city: 'Jerusalem',
  beginner: true,
  fontScale: 1,
};

export function useLocalStorage<T>(key: string, initial: T): [T, (v: T | ((prev: T) => T)) => void] {
  const [value, setValue] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(key);
      return raw ? { ...initial, ...JSON.parse(raw) } : initial;
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
