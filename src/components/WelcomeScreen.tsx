import React from 'react';
import { ArrowRight, BookOpen, Moon, Sun } from 'lucide-react';
import type { LastReadState } from '../types/quran';

interface WelcomeScreenProps {
  theme: 'light' | 'dark';
  lastRead: LastReadState | null;
  onToggleTheme: () => void;
  onEnter: () => void;
  onResumeLastRead: (surahNumber: number, ayahNumber: number) => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({
  theme,
  lastRead,
  onToggleTheme,
  onEnter,
  onResumeLastRead,
}) => {
  return (
    <div className="min-h-screen flex flex-col bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 relative overflow-hidden">
      {/* Subtle top-right theme switcher */}
      <header className="w-full max-w-5xl mx-auto px-5 pt-5 flex items-center justify-end relative z-10">
        <button
          type="button"
          onClick={onToggleTheme}
          aria-label={theme === 'dark' ? 'Aktifkan mode terang' : 'Aktifkan mode gelap'}
          className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
        >
          {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>
      </header>

      {/* Main Centered Islamic Cover */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-8 relative z-10">
        <div className="w-full max-w-md text-center space-y-6">
          {/* Geometric Rub el Hizb Islamic Emblem */}
          <div className="mx-auto w-24 h-24 flex items-center justify-center">
            <svg
              viewBox="0 0 120 120"
              className="w-24 h-24 text-teal-700 dark:text-teal-400"
              fill="none"
              aria-hidden="true"
            >
              <rect
                x="24"
                y="24"
                width="72"
                height="72"
                rx="8"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeOpacity="0.35"
              />
              <rect
                x="24"
                y="24"
                width="72"
                height="72"
                rx="8"
                transform="rotate(45 60 60)"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeOpacity="0.65"
              />
              <circle
                cx="60"
                cy="60"
                r="24"
                fill="currentColor"
                fillOpacity="0.08"
                stroke="currentColor"
                strokeWidth="2.2"
              />
              <path
                d="M49 54C49 50 53.5 47.5 60 50.5C66.5 47.5 71 50 71 54V69C66.5 66.5 63 67.5 60 70C57 67.5 53.5 66.5 49 69V54Z"
                fill="currentColor"
              />
            </svg>
          </div>

          <div className="space-y-3">
            <p
              dir="rtl"
              className="font-arabic text-2xl sm:text-3xl text-teal-800 dark:text-teal-300"
            >
              بِسْمِ اللّٰهِ الرَّحْمٰنِ الرَّحِيْمِ
            </p>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 text-balance">
              Al-Qur&apos;an Jariyah
            </h1>
            <p className="text-sm sm:text-base leading-relaxed text-zinc-600 dark:text-zinc-400">
              Mushaf digital dengan tajwid warna khusus, tulisan Latin, terjemahan Kemenag RI, navigasi 30 Juz, dan audio murottal 6 Qari.
            </p>
          </div>

          <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
            114 Surat · 30 Juz · 6.236 Ayat · Tersedia Offline
          </p>

          <div className="pt-2 space-y-3">
            <button
              type="button"
              onClick={onEnter}
              className="w-full min-h-[50px] px-6 py-3 rounded-2xl bg-teal-700 hover:bg-teal-800 dark:bg-teal-600 dark:hover:bg-teal-500 text-white font-semibold text-base inline-flex items-center justify-center gap-2 shadow-sm transition-colors active:scale-[0.99]"
            >
              <span>Masuk</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            {lastRead && (
              <button
                type="button"
                onClick={() => onResumeLastRead(lastRead.surahNumber, lastRead.ayahNumber)}
                className="w-full min-h-[46px] px-4 py-2.5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-teal-600/40 dark:hover:border-teal-500/40 text-sm font-medium text-zinc-700 dark:text-zinc-200 inline-flex items-center justify-center gap-2 transition-colors"
              >
                <BookOpen className="w-4 h-4 text-teal-700 dark:text-teal-400 shrink-0" />
                <span className="truncate">
                  Lanjutkan QS. {lastRead.surahName} · Ayat {lastRead.ayahNumber}
                </span>
              </button>
            )}
          </div>
        </div>
      </main>

      <footer className="pb-6 px-6 text-center text-xs text-zinc-400 dark:text-zinc-500">
        Dikembangkan oleh Prasitama
      </footer>
    </div>
  );
};
