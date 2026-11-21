import React, { useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Bookmark,
  BookOpenCheck,
  Check,
  Copy,
  Info,
  Pause,
  Play,
  SlidersHorizontal,
  Volume2,
  X,
} from 'lucide-react';
import { stripHtmlToText } from '../services/quranApi';
import {
  QARI_LIST,
  type AudioState,
  type Ayat,
  type QariId,
  type ReaderPreferences,
  type SurahDetail,
} from '../types/quran';
import { SettingsView } from './SettingsView';

interface SurahReaderViewProps {
  surah: SurahDetail | null;
  loading: boolean;
  error: string | null;
  focusAyahNumber: number | null;
  prefs: ReaderPreferences;
  audioState: AudioState;
  isBookmarked: (surahNumber: number, ayahNumber: number) => boolean;
  lastReadAyah: number | null;
  onBack?: () => void;
  onSelectSurah: (nomor: number) => void;
  onRetry: () => void;
  onPlayAyah: (surah: SurahDetail, ayahNumber: number) => void;
  onPlaySurahFull: (surah: SurahDetail) => void;
  onTogglePlayPause: () => void;
  onSelectQari: (qariId: QariId) => void;
  onUpdatePrefs: (partial: Partial<ReaderPreferences>) => void;
  onToggleBookmark: (surahNumber: number, surahName: string, ayah: Ayat) => void;
  onMarkLastRead: (surahNumber: number, surahName: string, ayahNumber: number) => void;
}

export const SurahReaderView: React.FC<SurahReaderViewProps> = ({
  surah,
  loading,
  error,
  focusAyahNumber,
  prefs,
  audioState,
  isBookmarked,
  lastReadAyah,
  onBack,
  onSelectSurah,
  onRetry,
  onPlayAyah,
  onPlaySurahFull,
  onTogglePlayPause,
  onSelectQari,
  onUpdatePrefs,
  onToggleBookmark,
  onMarkLastRead,
}) => {
  const [showInfo, setShowInfo] = useState(false);
  const [showDisplaySheet, setShowDisplaySheet] = useState(false);
  const [copiedAyah, setCopiedAyah] = useState<number | null>(null);
  const ayahRefs = useRef<Record<number, HTMLDivElement | null>>({});

  // Scroll smoothly to jumped ayah (from search/bookmark/last-read)
  useEffect(() => {
    if (!surah || !focusAyahNumber) return;
    const timer = setTimeout(() => {
      const el = ayahRefs.current[focusAyahNumber];
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 120);
    return () => clearTimeout(timer);
  }, [surah?.nomor, focusAyahNumber]);

  // Auto-scroll to currently playing ayah
  useEffect(() => {
    if (
      !surah ||
      !audioState.active ||
      audioState.mode !== 'ayah' ||
      audioState.surahNumber !== surah.nomor ||
      !audioState.ayahNumber
    ) {
      return;
    }
    const el = ayahRefs.current[audioState.ayahNumber];
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [audioState.active, audioState.mode, audioState.surahNumber, audioState.ayahNumber, surah?.nomor]);

  const handleCopyAyah = async (ayah: Ayat) => {
    if (!surah) return;
    const text = [
      ayah.teksArab,
      prefs.showLatin ? ayah.teksLatin : '',
      `${ayah.teksIndonesia} (QS. ${surah.namaLatin}: ${ayah.nomorAyat})`,
    ]
      .filter(Boolean)
      .join('\n\n');
    try {
      await navigator.clipboard.writeText(text);
      setCopiedAyah(ayah.nomorAyat);
      setTimeout(() => setCopiedAyah(null), 1800);
    } catch {
      // Clipboard blocked gracefully
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 animate-pulse space-y-3">
          <div className="h-6 w-44 bg-zinc-100 dark:bg-zinc-800 rounded mx-auto" />
          <div className="h-4 w-56 bg-zinc-100 dark:bg-zinc-800 rounded mx-auto" />
          <div className="h-10 w-64 bg-zinc-100 dark:bg-zinc-800 rounded-xl mx-auto mt-4" />
        </div>
        {Array.from({ length: 4 }).map((_, idx) => (
          <div
            key={idx}
            className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 animate-pulse space-y-4"
          >
            <div className="h-7 w-full bg-zinc-100 dark:bg-zinc-800 rounded" />
            <div className="h-4 w-3/4 bg-zinc-100 dark:bg-zinc-800 rounded" />
            <div className="h-4 w-5/6 bg-zinc-100 dark:bg-zinc-800 rounded" />
          </div>
        ))}
      </div>
    );
  }

  if (error || !surah) {
    return (
      <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-8 text-center space-y-3">
        <p className="text-sm text-zinc-600 dark:text-zinc-300">
          {error ?? 'Pilih surat dari daftar untuk mulai membaca.'}
        </p>
        {error && (
          <button
            type="button"
            onClick={onRetry}
            className="min-h-[44px] px-4 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-sm font-medium transition-colors"
          >
            Coba Lagi
          </button>
        )}
      </div>
    );
  }

  const isThisSurahFullPlaying =
    audioState.active &&
    audioState.mode === 'surah' &&
    audioState.surahNumber === surah.nomor &&
    audioState.isPlaying;

  const isThisSurahFullActive =
    audioState.active && audioState.mode === 'surah' && audioState.surahNumber === surah.nomor;

  const activeQari = QARI_LIST.find((q) => q.id === prefs.qariId) ?? QARI_LIST[0];

  return (
    <div className="space-y-4">
      {/* Surah Hero Header */}
      <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 sm:p-6">
        <div className="flex items-start justify-between gap-3">
          {onBack ? (
            <button
              type="button"
              onClick={onBack}
              aria-label="Kembali ke daftar surat"
              className="min-h-[44px] min-w-[44px] -ml-2 flex items-center justify-center rounded-xl text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors lg:hidden"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          ) : (
            <div className="w-10 lg:hidden" />
          )}

          <div className="flex-1 text-center">
            <p dir="rtl" className="font-arabic text-3xl sm:text-4xl text-zinc-900 dark:text-zinc-100">
              {surah.nama}
            </p>
            <h1 className="mt-1 text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
              {surah.nomor}. {surah.namaLatin}
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-zinc-500 dark:text-zinc-400">
              {surah.arti} · {surah.tempatTurun} ·{' '}
              <span className="tabular-nums">{surah.jumlahAyat}</span> Ayat
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowDisplaySheet(true)}
            aria-label="Pengaturan tampilan baca"
            className="min-h-[44px] min-w-[44px] -mr-2 flex items-center justify-center rounded-xl text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <SlidersHorizontal className="w-5 h-5" />
          </button>
        </div>

        {/* Murottal Controls Bar */}
        <div className="mt-5 pt-4 border-t border-zinc-100 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex items-center gap-2 flex-1 min-w-[200px]">
            <Volume2 className="w-4 h-4 text-zinc-400 shrink-0" />
            <select
              aria-label="Pilih Qari Murottal"
              value={prefs.qariId}
              onChange={(e) => onSelectQari(e.target.value as QariId)}
              className="w-full min-h-[42px] rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/70 px-3 py-1.5 text-xs font-medium text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-teal-600/30"
            >
              {QARI_LIST.map((q) => (
                <option key={q.id} value={q.id}>
                  Qari: {q.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setShowInfo(true)}
              className="min-h-[42px] px-3 rounded-xl border border-zinc-200 dark:border-zinc-700 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 inline-flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0"
            >
              <Info className="w-4 h-4" />
              <span>Info</span>
            </button>

            <button
              type="button"
              onClick={() =>
                isThisSurahFullActive ? onTogglePlayPause() : onPlaySurahFull(surah)
              }
              className="min-h-[42px] px-4 rounded-xl bg-teal-700 hover:bg-teal-800 dark:bg-teal-600 dark:hover:bg-teal-500 text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0"
            >
              {isThisSurahFullPlaying ? (
                <>
                  <Pause className="w-4 h-4" />
                  <span>Jeda Surat</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  <span>Putar Surat</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Basmalah (except Al-Fatihah #1 and At-Taubah #9) */}
      {surah.nomor !== 1 && surah.nomor !== 9 && (
        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 py-5 px-4 text-center">
          <p
            dir="rtl"
            className="font-arabic text-2xl sm:text-3xl text-zinc-900 dark:text-zinc-100"
          >
            بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
          </p>
        </div>
      )}

      {/* Ayah List */}
      <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 divide-y divide-zinc-100 dark:divide-zinc-800 overflow-hidden">
        {surah.ayat.map((ayah) => {
          const isAyahPlaying =
            audioState.active &&
            audioState.mode === 'ayah' &&
            audioState.surahNumber === surah.nomor &&
            audioState.ayahNumber === ayah.nomorAyat;
          const isFocused = focusAyahNumber === ayah.nomorAyat;
          const bookmarked = isBookmarked(surah.nomor, ayah.nomorAyat);
          const isLastReadHere = lastReadAyah === ayah.nomorAyat;

          return (
            <div
              key={ayah.nomorAyat}
              ref={(el) => {
                ayahRefs.current[ayah.nomorAyat] = el;
              }}
              className={`p-4 sm:p-6 transition-colors ${
                isAyahPlaying
                  ? 'bg-teal-50/80 dark:bg-teal-950/35'
                  : isFocused
                  ? 'bg-zinc-50 dark:bg-zinc-800/40'
                  : ''
              }`}
            >
              {/* Ayah Number & Action Bar */}
              <div className="flex items-center justify-between gap-2 mb-4">
                <div className="flex items-center gap-2.5">
                  <span
                    className={`min-w-[34px] h-[34px] px-2 rounded-lg text-xs font-semibold tabular-nums inline-flex items-center justify-center ${
                      isAyahPlaying
                        ? 'bg-teal-700 text-white dark:bg-teal-500 dark:text-zinc-950'
                        : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300'
                    }`}
                  >
                    {ayah.nomorAyat}
                  </span>
                  {isLastReadHere && (
                    <span className="text-xs font-medium text-teal-700 dark:text-teal-400">
                      Terakhir dibaca
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-0.5">
                  <button
                    type="button"
                    onClick={() =>
                      isAyahPlaying ? onTogglePlayPause() : onPlayAyah(surah, ayah.nomorAyat)
                    }
                    aria-label={
                      isAyahPlaying && audioState.isPlaying
                        ? `Jeda ayat ${ayah.nomorAyat}`
                        : `Putar ayat ${ayah.nomorAyat} (${activeQari.shortName})`
                    }
                    title={`Putar ayat ${ayah.nomorAyat}`}
                    className={`min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl transition-colors ${
                      isAyahPlaying
                        ? 'text-teal-700 dark:text-teal-400 bg-teal-100/70 dark:bg-teal-900/40'
                        : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                    }`}
                  >
                    {isAyahPlaying && audioState.isPlaying ? (
                      <Pause className="w-4 h-4" />
                    ) : (
                      <Play className="w-4 h-4" />
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => onMarkLastRead(surah.nomor, surah.namaLatin, ayah.nomorAyat)}
                    aria-label={`Tandai ayat ${ayah.nomorAyat} sebagai terakhir dibaca`}
                    title="Tandai terakhir dibaca"
                    className={`min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl transition-colors ${
                      isLastReadHere
                        ? 'text-teal-700 dark:text-teal-400'
                        : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                    }`}
                  >
                    <BookOpenCheck className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => onToggleBookmark(surah.nomor, surah.namaLatin, ayah)}
                    aria-label={
                      bookmarked
                        ? `Hapus bookmark ayat ${ayah.nomorAyat}`
                        : `Simpan bookmark ayat ${ayah.nomorAyat}`
                    }
                    title="Bookmark ayat"
                    className={`min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl transition-colors ${
                      bookmarked
                        ? 'text-teal-700 dark:text-teal-400'
                        : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                    }`}
                  >
                    <Bookmark className={`w-4 h-4 ${bookmarked ? 'fill-current' : ''}`} />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleCopyAyah(ayah)}
                    aria-label={`Salin ayat ${ayah.nomorAyat}`}
                    title="Salin ayat"
                    className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                  >
                    {copiedAyah === ayah.nomorAyat ? (
                      <Check className="w-4 h-4 text-teal-700 dark:text-teal-400" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Arabic Text */}
              <p
                dir="rtl"
                className="font-arabic text-right text-zinc-900 dark:text-zinc-100 leading-[2.25] tracking-normal"
                style={{ fontSize: `${prefs.arabicFontSize}px` }}
              >
                {ayah.teksArab}
              </p>

              {/* Latin Transliteration */}
              {prefs.showLatin && (
                <p
                  className="mt-4 italic text-teal-800 dark:text-teal-300/90 leading-relaxed"
                  style={{ fontSize: `${prefs.latinFontSize}px` }}
                >
                  {ayah.teksLatin}
                </p>
              )}

              {/* Indonesian Translation */}
              {prefs.showTranslation && (
                <p
                  className="mt-2.5 text-zinc-700 dark:text-zinc-300 leading-relaxed"
                  style={{ fontSize: `${prefs.latinFontSize}px` }}
                >
                  {ayah.teksIndonesia}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* Previous / Next Surah Footer */}
      <div className="grid grid-cols-2 gap-3 pt-1">
        {surah.suratSebelumnya ? (
          <button
            type="button"
            onClick={() => {
              if (surah.suratSebelumnya) onSelectSurah(surah.suratSebelumnya.nomor);
            }}
            className="min-h-[56px] rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-4 py-3 text-left hover:border-teal-600/40 dark:hover:border-teal-500/40 transition-colors flex items-center gap-2.5"
          >
            <ArrowLeft className="w-4 h-4 text-zinc-400 shrink-0" />
            <div className="min-w-0">
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">Surat Sebelumnya</p>
              <p className="text-xs sm:text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                {surah.suratSebelumnya.namaLatin}
              </p>
            </div>
          </button>
        ) : (
          <div />
        )}

        {surah.suratSelanjutnya ? (
          <button
            type="button"
            onClick={() => {
              if (surah.suratSelanjutnya) onSelectSurah(surah.suratSelanjutnya.nomor);
            }}
            className="min-h-[56px] rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-4 py-3 text-right hover:border-teal-600/40 dark:hover:border-teal-500/40 transition-colors flex items-center justify-end gap-2.5"
          >
            <div className="min-w-0">
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">Surat Berikutnya</p>
              <p className="text-xs sm:text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                {surah.suratSelanjutnya.namaLatin}
              </p>
            </div>
            <ArrowRight className="w-4 h-4 text-zinc-400 shrink-0" />
          </button>
        ) : (
          <div />
        )}
      </div>

      {/* Info Surat Modal */}
      {showInfo && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-xs p-0 sm:p-4"
          onClick={() => setShowInfo(false)}
        >
          <div
            className="w-full sm:max-w-lg rounded-t-3xl sm:rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-5 sm:p-6 max-h-[82vh] overflow-y-auto shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-10 h-1.5 bg-zinc-300 dark:bg-zinc-700 rounded-full mx-auto mb-4 sm:hidden" />
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                  Tentang Surat {surah.namaLatin}
                </h2>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  {surah.arti} · {surah.tempatTurun} · {surah.jumlahAyat} Ayat
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowInfo(false)}
                aria-label="Tutup info surat"
                className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="mt-4 space-y-3 text-sm leading-relaxed text-zinc-700 dark:text-zinc-300 whitespace-pre-line">
              {stripHtmlToText(surah.deskripsi)}
            </div>
          </div>
        </div>
      )}

      {/* Quick Display Settings Bottom Sheet */}
      {showDisplaySheet && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-xs p-0 sm:p-4"
          onClick={() => setShowDisplaySheet(false)}
        >
          <div
            className="w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-5 max-h-[85vh] overflow-y-auto shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-10 h-1.5 bg-zinc-300 dark:bg-zinc-700 rounded-full mx-auto mb-3 sm:hidden" />
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                Pengaturan Tampilan Baca
              </h2>
              <button
                type="button"
                onClick={() => setShowDisplaySheet(false)}
                aria-label="Tutup pengaturan"
                className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-zinc-500 hover:bg-zinc-200/70 dark:hover:bg-zinc-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <SettingsView
              prefs={prefs}
              onUpdatePrefs={onUpdatePrefs}
              onSelectQari={onSelectQari}
              cachedCount={0}
              isSyncing={false}
              syncProgress={{ current: 0, total: 114 }}
              onStartSync={() => {}}
              onClearCache={() => {}}
              compactMode
            />
          </div>
        </div>
      )}
    </div>
  );
};
