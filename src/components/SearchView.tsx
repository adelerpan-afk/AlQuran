import React, { useEffect, useState } from 'react';
import { ArrowRight, Play, Search, X } from 'lucide-react';
import { searchAyahs, type SearchScope } from '../services/quranApi';
import type { SearchResultItem, SurahSummary } from '../types/quran';

interface SearchViewProps {
  surahList: SurahSummary[];
  onOpenAyah: (surahNumber: number, ayahNumber: number) => void;
  onPlaySearchResult: (surahNumber: number, ayahNumber: number) => void;
}

const SCOPE_OPTIONS: { id: SearchScope; label: string }[] = [
  { id: 'all', label: 'Semua' },
  { id: 'terjemahan', label: 'Terjemahan' },
  { id: 'latin', label: 'Latin' },
  { id: 'arab', label: 'Arab' },
];

export const SearchView: React.FC<SearchViewProps> = ({
  surahList,
  onOpenAyah,
  onPlaySearchResult,
}) => {
  const [query, setQuery] = useState('');
  const [scope, setScope] = useState<SearchScope>('all');
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [directJump, setDirectJump] = useState<{ surah: SurahSummary; ayahNumber: number } | null>(
    null,
  );
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    let active = true;
    const timer = setTimeout(async () => {
      if (!query.trim()) {
        if (active) {
          setDirectJump(null);
          setResults([]);
          setSearching(false);
        }
        return;
      }
      setSearching(true);
      const res = await searchAyahs(query, surahList, scope, 60);
      if (active) {
        setDirectJump(res.directJump);
        setResults(res.results);
        setSearching(false);
      }
    }, 120);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [query, scope, surahList]);

  const highlightText = (text: string, q: string) => {
    const clean = q.trim();
    if (clean.length < 2) return text;
    try {
      const escaped = clean.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`(${escaped})`, 'gi');
      const parts = text.split(regex);
      return parts.map((part, idx) =>
        regex.test(part) ? (
          <mark
            key={idx}
            className="bg-teal-100 dark:bg-teal-900/70 text-teal-900 dark:text-teal-200 rounded px-0.5"
          >
            {part}
          </mark>
        ) : (
          <React.Fragment key={idx}>{part}</React.Fragment>
        ),
      );
    } catch {
      return text;
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari ayat, terjemahan, latin, atau ketik 2:255..."
            aria-label="Cari ayat Al-Qur'an"
            className="w-full min-h-[46px] pl-10 pr-10 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-teal-600/30 dark:focus:ring-teal-500/30 focus:border-teal-600 dark:focus:border-teal-500"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              aria-label="Bersihkan kata kunci"
              className="absolute right-1 top-1/2 -translate-y-1/2 min-h-[40px] min-w-[40px] flex items-center justify-center text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-1 p-1 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200/70 dark:border-zinc-800">
          {SCOPE_OPTIONS.map((opt) => {
            const active = scope === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => setScope(opt.id)}
                className={`min-h-[40px] px-1.5 sm:px-2.5 py-1.5 text-[11px] sm:text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
                  opt.id === 'terjemahan' ? 'flex-[1.35]' : 'flex-1'
                } ${
                  active
                    ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-xs'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Direct Reference Jump Card */}
      {directJump && (
        <button
          type="button"
          onClick={() => onOpenAyah(directJump.surah.nomor, directJump.ayahNumber)}
          className="w-full text-left rounded-2xl border border-teal-600/30 dark:border-teal-500/30 bg-teal-50/70 dark:bg-teal-950/30 p-4 flex items-center justify-between gap-3 hover:bg-teal-50 dark:hover:bg-teal-950/50 transition-colors"
        >
          <div>
            <p className="text-xs font-medium text-teal-800 dark:text-teal-300">
              Lompat Langsung ke Rujukan
            </p>
            <p className="mt-0.5 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              QS. {directJump.surah.namaLatin} ({directJump.surah.nomor}) : Ayat {directJump.ayahNumber}
            </p>
          </div>
          <ArrowRight className="w-4 h-4 text-teal-700 dark:text-teal-400 shrink-0" />
        </button>
      )}

      {/* Empty Prompt Suggestions */}
      {!query.trim() && (
        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 space-y-3">
          <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
            Pencarian Instan 114 Surat (6.236 Ayat)
          </p>
          <p className="text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
            Ketik nomor surat dan ayat (mis. <span className="font-medium text-zinc-700 dark:text-zinc-300">2:255</span>), penggalan arti bahasa Indonesia, tulisan Latin, atau lafaz Arab. Seluruh pencarian berjalan lokal tanpa internet.
          </p>
          <div className="flex flex-wrap gap-2 pt-1">
            {['2:255', 'sabar', 'bersyukur', 'rahman', 'Al-Kahfi 10'].map((sample) => (
              <button
                key={sample}
                type="button"
                onClick={() => setQuery(sample)}
                className="min-h-[38px] px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/70 text-xs font-medium text-zinc-700 dark:text-zinc-200 hover:border-teal-600/40 dark:hover:border-teal-500/40 transition-colors"
              >
                {sample}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Search Results */}
      {query.trim() && searching && (
        <p className="text-xs text-zinc-500 dark:text-zinc-400 px-1">
          Mencari di seluruh 114 surat...
        </p>
      )}

      {query.trim() && !searching && results.length === 0 && !directJump && (
        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-8 text-center">
          <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
            Tidak ada ayat yang cocok
          </p>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            Coba gunakan kata kunci yang lebih singkat atau ganti cakupan pencarian.
          </p>
        </div>
      )}

      {results.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs text-zinc-500 dark:text-zinc-400 px-1 tabular-nums">
            Menampilkan {results.length} hasil{results.length >= 60 ? ' teratas' : ''}
          </p>
          <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 divide-y divide-zinc-100 dark:divide-zinc-800 overflow-hidden">
            {results.map((item) => (
              <div
                key={`${item.surahNumber}:${item.ayahNumber}`}
                className="p-4 space-y-2.5 hover:bg-zinc-50/70 dark:hover:bg-zinc-800/30 transition-colors"
              >
                <div className="flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => onOpenAyah(item.surahNumber, item.ayahNumber)}
                    className="text-left min-h-[40px] min-w-0 flex items-center gap-2 text-xs font-semibold text-teal-700 dark:text-teal-400 hover:underline"
                  >
                    <span className="truncate">
                      QS. {item.surahName} · Ayat {item.ayahNumber}
                    </span>
                  </button>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => onPlaySearchResult(item.surahNumber, item.ayahNumber)}
                      aria-label={`Putar audio ${item.surahName} ayat ${item.ayahNumber}`}
                      className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-lg text-zinc-500 dark:text-zinc-400 hover:text-teal-700 dark:hover:text-teal-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                    >
                      <Play className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onOpenAyah(item.surahNumber, item.ayahNumber)}
                      className="min-h-[40px] px-2.5 rounded-lg text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                    >
                      Buka
                    </button>
                  </div>
                </div>

                <p
                  dir="rtl"
                  className="font-arabic text-2xl leading-[2.1] text-zinc-900 dark:text-zinc-100 text-right"
                >
                  {item.teksArab}
                </p>

                <p className="text-xs italic leading-relaxed text-zinc-500 dark:text-zinc-400">
                  {highlightText(item.teksLatin, query)}
                </p>

                <p className="text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
                  {highlightText(item.teksIndonesia, query)}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
