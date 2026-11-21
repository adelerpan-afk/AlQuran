import React from 'react';
import { Bookmark, BookOpen, Trash2 } from 'lucide-react';
import type { BookmarkItem, LastReadState } from '../types/quran';

interface BookmarksViewProps {
  lastRead: LastReadState | null;
  bookmarks: BookmarkItem[];
  onOpenAyah: (surahNumber: number, ayahNumber: number) => void;
  onRemoveBookmark: (id: string) => void;
}

export const BookmarksView: React.FC<BookmarksViewProps> = ({
  lastRead,
  bookmarks,
  onOpenAyah,
  onRemoveBookmark,
}) => {
  return (
    <div className="space-y-5">
      {lastRead && (
        <div className="space-y-2">
          <h2 className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 px-1">
            Posisi Terakhir Dibaca
          </h2>
          <button
            type="button"
            onClick={() => onOpenAyah(lastRead.surahNumber, lastRead.ayahNumber)}
            className="w-full text-left rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 hover:border-teal-600/40 dark:hover:border-teal-500/40 transition-colors flex items-center justify-between gap-3"
          >
            <div>
              <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                QS. {lastRead.surahName} · Ayat {lastRead.ayahNumber}
              </p>
              <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                Diperbarui {new Date(lastRead.updatedAt).toLocaleDateString('id-ID', {
                  day: 'numeric',
                  month: 'short',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-400 flex items-center justify-center shrink-0">
              <BookOpen className="w-5 h-5" />
            </div>
          </button>
        </div>
      )}

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
    </div>
  );
};
