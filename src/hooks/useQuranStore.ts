import { useCallback, useEffect, useState } from 'react';
import type { Ayat, BookmarkItem, LastReadState, QariId, ReaderPreferences } from '../types/quran';

const PREFS_KEY = 'alquran_prefs_v1';
const BOOKMARKS_KEY = 'alquran_bookmarks_v1';
const LAST_READ_KEY = 'alquran_last_read_v1';

const DEFAULT_PREFS: ReaderPreferences = {
  theme: 'light',
  qariId: '05',
  arabicFontSize: 30,
  latinFontSize: 15,
  showLatin: true,
  showTranslation: true,
};

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return { ...fallback, ...JSON.parse(raw) };
  } catch {
    return fallback;
  }
}

function readArray<T>(key: string): T[] {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function useQuranStore() {
  const [prefs, setPrefs] = useState<ReaderPreferences>(() => {
    const initial = readJson<ReaderPreferences>(PREFS_KEY, DEFAULT_PREFS);
    if (typeof document !== 'undefined' && document.documentElement.classList.contains('dark')) {
      initial.theme = 'dark';
    }
    return initial;
  });

  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>(() =>
    readArray<BookmarkItem>(BOOKMARKS_KEY),
  );

  const [lastRead, setLastRead] = useState<LastReadState | null>(() => {
    try {
      const raw = localStorage.getItem(LAST_READ_KEY);
      return raw ? (JSON.parse(raw) as LastReadState) : null;
    } catch {
      return null;
    }
  });

  // Sync theme to <html> class & meta theme-color
  useEffect(() => {
    const root = document.documentElement;
    if (prefs.theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    const metaTheme = document.querySelector('meta[name="theme-color"]');
    if (metaTheme) {
      metaTheme.setAttribute('content', prefs.theme === 'dark' ? '#09090b' : '#0f766e');
    }
    try {
      localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
    } catch {
      // Ignore storage write errors
    }
  }, [prefs]);

  useEffect(() => {
    try {
      localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(bookmarks));
    } catch {
      // Ignore
    }
  }, [bookmarks]);

  useEffect(() => {
    try {
      if (lastRead) {
        localStorage.setItem(LAST_READ_KEY, JSON.stringify(lastRead));
      } else {
        localStorage.removeItem(LAST_READ_KEY);
      }
    } catch {
      // Ignore
    }
  }, [lastRead]);

  const updatePrefs = useCallback((partial: Partial<ReaderPreferences>) => {
    setPrefs((prev) => ({ ...prev, ...partial }));
  }, []);

  const toggleTheme = useCallback(() => {
    setPrefs((prev) => ({ ...prev, theme: prev.theme === 'dark' ? 'light' : 'dark' }));
  }, []);

  const setQariId = useCallback((qariId: QariId) => {
    setPrefs((prev) => ({ ...prev, qariId }));
  }, []);

  const toggleBookmark = useCallback(
    (surahNumber: number, surahName: string, ayah: Ayat): boolean => {
      const id = `${surahNumber}:${ayah.nomorAyat}`;
      let added = false;
      setBookmarks((prev) => {
        const exists = prev.some((b) => b.id === id);
        if (exists) {
          added = false;
          return prev.filter((b) => b.id !== id);
        }
        added = true;
        return [
          {
            id,
            surahNumber,
            surahName,
            ayahNumber: ayah.nomorAyat,
            teksArab: ayah.teksArab,
            teksIndonesia: ayah.teksIndonesia,
            savedAt: Date.now(),
          },
          ...prev,
        ];
      });
      return added;
    },
    [],
  );

  const removeBookmark = useCallback((id: string) => {
    setBookmarks((prev) => prev.filter((b) => b.id !== id));
  }, []);

  const markLastRead = useCallback((surahNumber: number, surahName: string, ayahNumber: number) => {
    setLastRead({
      surahNumber,
      surahName,
      ayahNumber,
      updatedAt: Date.now(),
    });
  }, []);

  const isBookmarked = useCallback(
    (surahNumber: number, ayahNumber: number) =>
      bookmarks.some((b) => b.id === `${surahNumber}:${ayahNumber}`),
    [bookmarks],
  );

  return {
    prefs,
    updatePrefs,
    toggleTheme,
    setQariId,
    bookmarks,
    toggleBookmark,
    removeBookmark,
    isBookmarked,
    lastRead,
    markLastRead,
  };
}
