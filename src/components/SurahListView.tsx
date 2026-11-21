import React, { useMemo, useState } from 'react';
import { BookOpen, ChevronDown, ChevronRight, Search, X } from 'lucide-react';
import { buildJuzGroups } from '../data/juzData';
import type { LastReadState, SurahSummary } from '../types/quran';

interface SurahListViewProps {
  surahList: SurahSummary[];
  loading: boolean;
  error: string | null;
  activeSurahNumber: number | null;
  lastRead: LastReadState | null;
  onSelectSurah: (nomor: number, ayahNumber?: number) => void;
  onRetry: () => void;
}

type ViewMode = 'surat' | 'juz';
type OriginFilter = 'semua' | 'Mekah' | 'Madinah';

export const SurahListView: React.FC<SurahListViewProps> = ({
  surahList,
  loading,
  error,
  activeSurahNumber,
  lastRead,
  onSelectSurah,
  onRetry,
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>('surat');
  const [query, setQuery] = useState('');
  const [origin, setOrigin] = useState<OriginFilter>('semua');
  const [expandedJuz, setExpandedJuz] = useState<number | null>(1);

  const filteredSurahs = useMemo(() => {
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

  const juzGroups = useMemo(() => buildJuzGroups(surahList), [surahList]);

  const filteredJuzGroups = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      return juzGroups.map((group) => ({ group, matchedEntries: group.entries }));
    }

    return juzGroups
      .map((group) => {
        const juzTitleMatch =
          `juz ${group.juz}`.includes(q) ||
          String(group.juz) === q ||
          (group.alias ? group.alias.toLowerCase().includes(q) : false);

        if (juzTitleMatch) {
          return { group, matchedEntries: group.entries };
        }

        const matchedEntries = group.entries.filter(
          (entry) =>
            entry.surah.namaLatin.toLowerCase().includes(q) ||
            entry.surah.arti.toLowerCase().includes(q) ||
            String(entry.surah.nomor) === q,
        );

        return matchedEntries.length > 0 ? { group, matchedEntries } : null;
      })
      .filter((item): item is NonNullable<typeof item> => item !== null);
  }, [juzGroups, query]);

  const hasSearchQuery = query.trim().length > 0;

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

      {/* Search + Mode Switcher (Surat / Juz) */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={
              viewMode === 'juz'
                ? 'Cari juz atau surat (mis. Juz 30, Yasin)...'
                : 'Cari surat atau nomor (mis. Yasin, 36)...'
            }
            aria-label={viewMode === 'juz' ? 'Cari juz atau nama surat' : 'Cari nama atau nomor surat'}
            className="w-full min-h-[44px] pl-10 pr-10 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-teal-600/30 dark:focus:ring-teal-500/30 focus:border-teal-600 dark:focus:border-teal-500"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              aria-label="Hapus pencarian"
              className="absolute right-1 top-1/2 -translate-y-1/2 min-h-[40px] min-w-[40px] flex items-center justify-center text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* View Mode Switcher: Surat vs Juz */}
        <div className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200/70 dark:border-zinc-800">
          <button
            type="button"
            onClick={() => setViewMode('surat')}
            className={`min-h-[40px] px-2 sm:px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
              viewMode === 'surat'
                ? 'bg-white dark:bg-zinc-800 text-teal-700 dark:text-teal-400 shadow-xs'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
            }`}
          >
            Urutan Surat (114)
          </button>
          <button
            type="button"
            onClick={() => setViewMode('juz')}
            className={`min-h-[40px] px-2 sm:px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
              viewMode === 'juz'
                ? 'bg-white dark:bg-zinc-800 text-teal-700 dark:text-teal-400 shadow-xs'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
            }`}
          >
            Daftar Juz (30)
          </button>
        </div>

        {/* Origin Filter (only in Surat mode) */}
        {viewMode === 'surat' && (
          <div className="grid grid-cols-3 gap-1 p-1 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200/70 dark:border-zinc-800">
            {(['semua', 'Mekah', 'Madinah'] as OriginFilter[]).map((item) => {
              const active = origin === item;
              const label = item === 'semua' ? 'Semua' : item;
              return (
                <button
                  key={item}
                  type="button"
                  onClick={() => setOrigin(item)}
                  className={`min-h-[40px] px-2 sm:px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
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
        )}
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

      {/* Mode 1: Daftar 114 Surat */}
      {!loading && !error && viewMode === 'surat' && filteredSurahs.length === 0 && (
        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-8 text-center">
          <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
            Surat tidak ditemukan
          </p>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            Coba ketik kata kunci lain atau ubah filter Mekah/Madinah.
          </p>
        </div>
      )}

      {!loading && !error && viewMode === 'surat' && filteredSurahs.length > 0 && (
        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 divide-y divide-zinc-100 dark:divide-zinc-800/80 overflow-hidden">
          {filteredSurahs.map((surah) => {
            const isActive = activeSurahNumber === surah.nomor;
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

      {/* Mode 2: Daftar Juz 1-30 Accordion */}
      {!loading && !error && viewMode === 'juz' && filteredJuzGroups.length === 0 && (
        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-8 text-center">
          <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
            Juz atau surat tidak ditemukan
          </p>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            Coba ketik angka 1–30 atau nama surat seperti Al-Mulk atau Yasin.
          </p>
        </div>
      )}

      {!loading && !error && viewMode === 'juz' && filteredJuzGroups.length > 0 && (
        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 divide-y divide-zinc-100 dark:divide-zinc-800/80 overflow-hidden">
          {filteredJuzGroups.map(({ group, matchedEntries }) => {
            const isExpanded = hasSearchQuery ? true : expandedJuz === group.juz;
            const firstEntry = group.entries[0];
            const lastEntry = group.entries[group.entries.length - 1];
            const entriesToShow = hasSearchQuery ? matchedEntries : group.entries;

            return (
              <div key={group.juz}>
                <button
                  type="button"
                  aria-expanded={isExpanded}
                  onClick={() =>
                    setExpandedJuz((prev) => (prev === group.juz ? null : group.juz))
                  }
                  className={`w-full text-left px-4 py-3.5 min-h-[64px] flex items-center justify-between gap-3 transition-colors ${
                    isExpanded
                      ? 'bg-teal-50/50 dark:bg-teal-950/30'
                      : 'hover:bg-zinc-50 dark:hover:bg-zinc-800/50'
                  }`}
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center text-xs font-semibold tabular-nums shrink-0 transition-colors ${
                        isExpanded
                          ? 'bg-teal-700 text-white dark:bg-teal-500 dark:text-zinc-950'
                          : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300'
                      }`}
                    >
                      {group.juz}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                        Juz {group.juz}
                        {group.alias ? ` · ${group.alias}` : ''}
                      </p>
                      {firstEntry && lastEntry && (
                        <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400 truncate tabular-nums">
                          {firstEntry.surah.namaLatin} {group.startAyat} – {lastEntry.surah.namaLatin}{' '}
                          {group.endAyat} · {group.entries.length} Surat
                        </p>
                      )}
                    </div>
                  </div>

                  <ChevronDown
                    className={`w-4 h-4 text-zinc-400 shrink-0 transition-transform duration-150 ${
                      isExpanded ? 'rotate-180 text-teal-700 dark:text-teal-400' : ''
                    }`}
                  />
                </button>

                {isExpanded && (
                  <div className="bg-zinc-50/70 dark:bg-zinc-950/40 border-t border-zinc-100 dark:border-zinc-800/80 divide-y divide-zinc-100 dark:divide-zinc-800/70">
                    {entriesToShow.map((entry) => {
                      const isActive = activeSurahNumber === entry.surah.nomor;
                      return (
                        <button
                          key={`${group.juz}-${entry.surah.nomor}`}
                          type="button"
                          onClick={() => onSelectSurah(entry.surah.nomor, entry.startAyat)}
                          className={`w-full text-left pl-5 sm:pl-7 pr-3.5 sm:pr-4 py-3 min-h-[56px] flex items-center justify-between gap-2.5 sm:gap-3 transition-colors ${
                            isActive
                              ? 'bg-teal-50/70 dark:bg-teal-950/40'
                              : 'hover:bg-zinc-100/70 dark:hover:bg-zinc-800/40'
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <span className="w-7 h-7 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-[11px] font-semibold tabular-nums text-zinc-600 dark:text-zinc-300 flex items-center justify-center shrink-0">
                              {entry.surah.nomor}
                            </span>
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">
                                {entry.surah.namaLatin}
                              </p>
                              <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate tabular-nums">
                                Ayat {entry.startAyat}–{entry.endAyat}
                                {entry.isPartial ? ' · Sebagian' : ''}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <span
                              dir="rtl"
                              className="font-arabic text-lg leading-none text-zinc-800 dark:text-zinc-200"
                            >
                              {entry.surah.nama}
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
          })}
        </div>
      )}
    </div>
  );
};
