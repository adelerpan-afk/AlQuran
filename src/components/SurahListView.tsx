import React, { useMemo, useState } from 'react';
import { BookOpen, ChevronRight, Search, X } from 'lucide-react';
import type { LastReadState, SurahSummary } from '../types/quran';

interface SurahListViewProps {
  surahList: SurahSummary[];
  loading: boolean;
  error: string | null;
  activeSurahNumber: number | null;
  lastRead: LastReadState | null;
  cachedSurahNumbers: Set<number>;
  onSelectSurah: (nomor: number, ayahNumber?: number) => void;
  onRetry: () => void;
}

type OriginFilter = 'semua' | 'Mekah' | 'Madinah';

export const SurahListView: React.FC<SurahListViewProps> = ({
  surahList,
  loading,
  error,
  activeSurahNumber,
  lastRead,
  cachedSurahNumbers,
  onSelectSurah,
  onRetry,
}) => {
  const [query, setQuery] = useState('');
  const [origin, setOrigin] = useState<OriginFilter>('semua');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return surahList.filter((s) => {
      if (origin !== 'semua' && s.tempatTurun !== origin) return false;
      if (!q) return true;
      return (
        s.namaLatin.toLowerCase().includes(q) ||
        s.arti.toLowerCase().includes(q) ||
        String(s.nomor) === q
      );
    });
  }, [surahList, query, origin]);

  return (
    <div className="space-y-4">
      {lastRead && (
        <button
          type="button"
          onClick={() => onSelectSurah(lastRead.surahNumber, lastRead.ayahNumber)}
          className="w-full text-left rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 hover:border-teal-600/40 dark:hover:border-teal-500/40 transition-colors flex items-center justify-between gap-3 group"
        >
          <div className="min-w-0">
            <p className="text-xs font-medium text-teal-700 dark:text-teal-400">
              Terakhir Dibaca
            </p>
            <p className="mt-0.5 text-base font-semibold text-zinc-900 dark:text-zinc-100 truncate">
              {lastRead.surahName} · Ayat {lastRead.ayahNumber}
            </p>
            <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
              Ketuk untuk melanjutkan bacaan
            </p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-400 flex items-center justify-center shrink-0 group-hover:translate-x-0.5 transition-transform">
            <BookOpen className="w-5 h-5" />
          </div>
        </button>
      )}

      {/* Search & Origin Segmented Filter */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari surat atau nomor (mis. Yasin, 36)..."
            aria-label="Cari nama atau nomor surat"
            className="w-full min-h-[44px] pl-10 pr-10 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-teal-600/30 dark:focus:ring-teal-500/30 focus:border-teal-600 dark:focus:border-teal-500"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              aria-label="Hapus pencarian surat"
              className="absolute right-1 top-1/2 -translate-y-1/2 min-h-[40px] min-w-[40px] flex items-center justify-center text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="grid grid-cols-3 gap-1 p-1 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200/70 dark:border-zinc-800">
          {(['semua', 'Mekah', 'Madinah'] as OriginFilter[]).map((item) => {
            const active = origin === item;
            const label = item === 'semua' ? 'Semua (114)' : item;
            return (
              <button
                key={item}
                type="button"
                onClick={() => setOrigin(item)}
                className={`min-h-[38px] px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                  active
                    ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-xs'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {loading && (
        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 divide-y divide-zinc-100 dark:divide-zinc-800">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="p-4 flex items-center justify-between animate-pulse">
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-800" />
                <div className="space-y-2">
                  <div className="h-4 w-28 bg-zinc-100 dark:bg-zinc-800 rounded" />
                  <div className="h-3 w-36 bg-zinc-100 dark:bg-zinc-800 rounded" />
                </div>
              </div>
              <div className="h-6 w-16 bg-zinc-100 dark:bg-zinc-800 rounded" />
            </div>
          ))}
        </div>
      )}

      {!loading && error && (
        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 text-center space-y-3">
          <p className="text-sm text-zinc-600 dark:text-zinc-300">{error}</p>
          <button
            type="button"
            onClick={onRetry}
            className="min-h-[44px] px-4 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-sm font-medium transition-colors"
          >
            Muat Ulang Daftar Surat
          </button>
        </div>
      )}

      {!loading && !error && filtered.length === 0 && (
        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-8 text-center">
          <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
            Surat tidak ditemukan
          </p>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            Coba ketik kata kunci lain atau ubah filter Mekah/Madinah.
          </p>
        </div>
      )}

      {!loading && !error && filtered.length > 0 && (
        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 divide-y divide-zinc-100 dark:divide-zinc-800/80 overflow-hidden">
          {filtered.map((surah) => {
            const isActive = activeSurahNumber === surah.nomor;
            const isCached = cachedSurahNumbers.has(surah.nomor);
            return (
              <button
                key={surah.nomor}
                type="button"
                onClick={() => onSelectSurah(surah.nomor)}
                className={`w-full text-left px-4 py-3.5 min-h-[64px] flex items-center justify-between gap-3 transition-colors ${
                  isActive
                    ? 'bg-teal-50/70 dark:bg-teal-950/40'
                    : 'hover:bg-zinc-50 dark:hover:bg-zinc-800/50'
                }`}
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center text-xs font-semibold tabular-nums shrink-0 ${
                      isActive
                        ? 'bg-teal-700 text-white dark:bg-teal-500 dark:text-zinc-950'
                        : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300'
                    }`}
                  >
                    {surah.nomor}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                        {surah.namaLatin}
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400 truncate">
                      {surah.arti} · {surah.tempatTurun} ·{' '}
                      <span className="tabular-nums">{surah.jumlahAyat}</span> Ayat
                      {isCached ? ' · Offline' : ''}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span
                    dir="rtl"
                    className="font-arabic text-xl leading-none text-zinc-800 dark:text-zinc-200"
                  >
                    {surah.nama}
                  </span>
                  <ChevronRight className="w-4 h-4 text-zinc-400 lg:hidden" />
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
