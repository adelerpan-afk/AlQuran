import React, { useMemo, useState } from 'react';
import { Bookmark, BookOpen, Clock, History, Trash2 } from 'lucide-react';
import type { BookmarkItem, LastReadState, ReadingHistoryItem } from '../types/quran';

interface BookmarksViewProps {
  lastRead: LastReadState | null;
  bookmarks: BookmarkItem[];
  readingHistory: ReadingHistoryItem[];
  onOpenAyah: (surahNumber: number, ayahNumber: number) => void;
  onRemoveBookmark: (id: string) => void;
  onRemoveHistory: (id: string) => void;
  onClearHistory: () => void;
}

type SavedSubTab = 'history' | 'bookmarks';

function formatDateTime(ts: number): string {
  return new Date(ts).toLocaleString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatDayTime(ts: number): string {
  return new Date(ts).toLocaleString('id-ID', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export const BookmarksView: React.FC<BookmarksViewProps> = ({
  lastRead,
  bookmarks,
  readingHistory,
  onOpenAyah,
  onRemoveBookmark,
  onRemoveHistory,
  onClearHistory,
}) => {
  const [subTab, setSubTab] = useState<SavedSubTab>('history');

  const historyByYear = useMemo(() => {
    const groups = new Map<number, ReadingHistoryItem[]>();
    const sorted = [...readingHistory].sort((a, b) => b.timestamp - a.timestamp);
    for (const item of sorted) {
      const year = new Date(item.timestamp).getFullYear();
      const list = groups.get(year);
      if (list) {
        list.push(item);
      } else {
        groups.set(year, [item]);
      }
    }
    return Array.from(groups.entries()).sort((a, b) => b[0] - a[0]);
  }, [readingHistory]);

  return (
    <div className="space-y-4">
      {/* Sub-tab Segmented Switcher */}
      <div
        role="tablist"
        aria-label="Riwayat dan Bookmark"
        className="grid grid-cols-2 p-1 rounded-xl bg-zinc-200/70 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800"
      >
        <button
          type="button"
          role="tab"
          aria-selected={subTab === 'history'}
          onClick={() => setSubTab('history')}
          className={`min-h-[40px] rounded-lg text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap ${
            subTab === 'history'
              ? 'bg-white dark:bg-zinc-800 text-teal-800 dark:text-teal-300 shadow-xs'
              : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
          }`}
        >
          <History className="w-3.5 h-3.5" />
          <span>Riwayat ({readingHistory.length})</span>
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={subTab === 'bookmarks'}
          onClick={() => setSubTab('bookmarks')}
          className={`min-h-[40px] rounded-lg text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap ${
            subTab === 'bookmarks'
              ? 'bg-white dark:bg-zinc-800 text-teal-800 dark:text-teal-300 shadow-xs'
              : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
          }`}
        >
          <Bookmark className="w-3.5 h-3.5" />
          <span>Bookmark ({bookmarks.length})</span>
        </button>
      </div>

      {subTab === 'history' ? (
        <div className="space-y-5">
          {lastRead && (
            <div className="space-y-2">
              <h2 className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 px-1">
                Terakhir Dibaca
              </h2>
              <button
                type="button"
                onClick={() => onOpenAyah(lastRead.surahNumber, lastRead.ayahNumber)}
                className="w-full text-left rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 hover:border-teal-600/40 dark:hover:border-teal-500/40 transition-colors flex items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                    QS. {lastRead.surahName} · Ayat {lastRead.ayahNumber}
                  </p>
                  <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 shrink-0" />
                    <span>{formatDateTime(lastRead.updatedAt)}</span>
                  </p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-400 flex items-center justify-center shrink-0">
                  <BookOpen className="w-5 h-5" />
                </div>
              </button>
            </div>
          )}

          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                Riwayat Bacaan ({readingHistory.length})
              </h2>
              {readingHistory.length > 0 && (
                <button
                  type="button"
                  onClick={onClearHistory}
                  className="text-xs font-medium text-zinc-500 hover:text-red-600 dark:text-zinc-400 dark:hover:text-red-400 transition-colors"
                >
                  Hapus Semua
                </button>
              )}
            </div>

            {historyByYear.length === 0 ? (
              <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-8 text-center space-y-2">
                <History className="w-7 h-7 text-zinc-300 dark:text-zinc-700 mx-auto" />
                <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                  Belum ada riwayat bacaan
                </p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-xs mx-auto leading-relaxed">
                  Riwayat bacaan akan tercatat otomatis beserta tanggal dan jam saat Anda membaca atau menandai ayat terakhir dibaca.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {historyByYear.map(([year, items]) => (
                  <section key={year} className="space-y-2">
                    <div className="flex items-center justify-between px-1">
                      <h3 className="text-xs font-bold tracking-wide text-teal-800 dark:text-teal-300 tabular-nums">
                        Tahun {year}
                      </h3>
                      <span className="text-[11px] text-zinc-500 dark:text-zinc-400 tabular-nums">
                        {items.length} catatan
                      </span>
                    </div>

                    <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 divide-y divide-zinc-100 dark:divide-zinc-800 overflow-hidden">
                      {items.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between gap-2 px-4 py-3 hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors"
                        >
                          <button
                            type="button"
                            onClick={() => onOpenAyah(item.surahNumber, item.ayahNumber)}
                            className="flex-1 min-w-0 text-left py-0.5"
                          >
                            <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                              QS. {item.surahName} · Ayat {item.ayahNumber}
                            </p>
                            <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400 tabular-nums">
                              {formatDayTime(item.timestamp)}
                            </p>
                          </button>

                          <button
                            type="button"
                            onClick={() => onRemoveHistory(item.id)}
                            aria-label={`Hapus riwayat ${item.surahName} ayat ${item.ayahNumber}`}
                            className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-lg text-zinc-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors shrink-0"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </section>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
              Ayat Tersimpan ({bookmarks.length})
            </h2>
          </div>

          {bookmarks.length === 0 ? (
            <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-8 text-center space-y-2">
              <Bookmark className="w-7 h-7 text-zinc-300 dark:text-zinc-700 mx-auto" />
              <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                Belum ada ayat yang ditandai
              </p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-xs mx-auto leading-relaxed">
                Ketuk ikon penanda pada ayat mana saja saat membaca untuk menyimpannya di perangkat ini.
              </p>
            </div>
          ) : (
            <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 divide-y divide-zinc-100 dark:divide-zinc-800 overflow-hidden">
              {bookmarks.map((item) => (
                <div key={item.id} className="p-4 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => onOpenAyah(item.surahNumber, item.ayahNumber)}
                      className="min-h-[36px] text-left text-xs font-semibold text-teal-700 dark:text-teal-400 hover:underline"
                    >
                      QS. {item.surahName} · Ayat {item.ayahNumber}
                    </button>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => onOpenAyah(item.surahNumber, item.ayahNumber)}
                        className="min-h-[40px] px-2.5 rounded-lg text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                      >
                        Baca
                      </button>
                      <button
                        type="button"
                        onClick={() => onRemoveBookmark(item.id)}
                        aria-label={`Hapus penanda ${item.surahName} ayat ${item.ayahNumber}`}
                        className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-lg text-zinc-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <p
                    dir="rtl"
                    className="font-arabic text-2xl leading-[2.0] text-zinc-900 dark:text-zinc-100 text-right"
                  >
                    {item.teksArab}
                  </p>
                  <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400 line-clamp-2">
                    {item.teksIndonesia}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
