import React, { useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Bookmark,
  BookOpenCheck,
  Check,
  ChevronUp,
  Copy,
  HelpCircle,
  ImageDown,
  List,
  Maximize2,
  Pause,
  Play,
  ScrollText,
  SlidersHorizontal,
  Volume2,
  X,
} from 'lucide-react';
import {
  getAsbabunNuzulKey,
  loadAsbabunNuzulMap,
  type AsbabunNuzulMap,
} from '../services/asbabunNuzul';
import { stripHtmlToText } from '../services/quranApi';
import {
  QARI_LIST,
  type AsbabunNuzulEntry,
  type AudioState,
  type Ayat,
  type QariId,
  type ReaderPreferences,
  type SurahDetail,
} from '../types/quran';
import { exportAyahAsTransparentPng } from '../utils/exportAyahPng';
import { SettingsView } from './SettingsView';
import { TajwidGuideModal } from './TajwidGuideModal';
import { TajwidText } from './TajwidText';

interface SurahReaderViewProps {
  surah: SurahDetail | null;
  loading: boolean;
  error: string | null;
  focusAyahNumber: number | null;
  focusNonce?: number;
  prefs: ReaderPreferences;
  audioState: AudioState;
  isBookmarked: (surahNumber: number, ayahNumber: number) => boolean;
  lastReadAyah: number | null;
  onBack?: () => void;
  onSelectSurah: (nomor: number) => void;
  onRetry: () => void;
  onPlayAyah: (surah: SurahDetail, ayahNumber: number) => void;
  onPlaySurahFull: (surah: SurahDetail) => void;
  onPlaySurahFullScreen: (surah: SurahDetail) => void;
  onTogglePlayPause: () => void;
  onSelectQari: (qariId: QariId) => void;
  onUpdatePrefs: (partial: Partial<ReaderPreferences>) => void;
  onToggleBookmark: (surahNumber: number, surahName: string, ayah: Ayat) => void;
  onMarkLastRead: (surahNumber: number, surahName: string, ayahNumber: number) => void;
  onSelectedAyahChange?: (ayahNumber: number | null) => void;
}

export const SurahReaderView: React.FC<SurahReaderViewProps> = ({
  surah,
  loading,
  error,
  focusAyahNumber,
  focusNonce,
  prefs,
  audioState,
  isBookmarked,
  lastReadAyah,
  onBack,
  onSelectSurah,
  onRetry,
  onPlayAyah,
  onPlaySurahFull,
  onPlaySurahFullScreen,
  onTogglePlayPause,
  onSelectQari,
  onUpdatePrefs,
  onToggleBookmark,
  onMarkLastRead,
  onSelectedAyahChange,
}) => {
  const [showInfo, setShowInfo] = useState(false);
  const [showAudioControls, setShowAudioControls] = useState(false);
  const [showDisplaySheet, setShowDisplaySheet] = useState(false);
  const [showTajwidGuide, setShowTajwidGuide] = useState(false);
  const [selectedAyah, setSelectedAyah] = useState<number | null>(focusAyahNumber ?? null);
  const [copiedAyah, setCopiedAyah] = useState<number | null>(null);
  const [exportedAyah, setExportedAyah] = useState<number | null>(null);
  const [asbabunNuzulMap, setAsbabunNuzulMap] = useState<AsbabunNuzulMap>({});
  const [activeHistoryModal, setActiveHistoryModal] = useState<{
    ayahNumber: number;
    entry: AsbabunNuzulEntry;
  } | null>(null);

  const ayahRefs = useRef<Record<number, HTMLDivElement | null>>({});
  const selectTimerRef = useRef<number | null>(null);

  useEffect(() => {
    loadAsbabunNuzulMap().then(setAsbabunNuzulMap);
  }, []);

  useEffect(() => {
    return () => {
      if (selectTimerRef.current !== null) {
        window.clearTimeout(selectTimerRef.current);
      }
    };
  }, []);

  // Move highlight first when jumping to a surah/ayah, pause briefly, then smoothly scroll
  useEffect(() => {
    if (!surah) return;
    const nextSelected = focusAyahNumber ?? null;
    setSelectedAyah(nextSelected);
    onSelectedAyahChange?.(nextSelected);
    if (!focusAyahNumber) return;
    const timer = window.setTimeout(() => {
      const el = ayahRefs.current[focusAyahNumber];
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 180);
    return () => window.clearTimeout(timer);
  }, [surah?.nomor, focusAyahNumber, focusNonce, onSelectedAyahChange]);

  // Auto-scroll to currently playing ayah
  useEffect(() => {
    if (
      !surah ||
      !audioState.active ||
      audioState.surahNumber !== surah.nomor ||
      !audioState.ayahNumber
    ) {
      return;
    }
    const el = ayahRefs.current[audioState.ayahNumber];
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [audioState.active, audioState.surahNumber, audioState.ayahNumber, surah?.nomor]);

  const handleSelectAyah = (ayahNumber: number) => {
    if (window.getSelection()?.toString()) return;
    setSelectedAyah(ayahNumber);
    onSelectedAyahChange?.(ayahNumber);
    if (selectTimerRef.current !== null) {
      window.clearTimeout(selectTimerRef.current);
    }
    selectTimerRef.current = window.setTimeout(() => {
      const el = ayahRefs.current[ayahNumber];
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      selectTimerRef.current = null;
    }, 180);
  };

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
      window.setTimeout(() => setCopiedAyah(null), 1800);
    } catch {
      // Clipboard blocked gracefully
    }
  };

  const handleExportPng = async (ayah: Ayat) => {
    if (!surah) return;
    try {
      await exportAyahAsTransparentPng({
        arabicText: ayah.teksArab,
        surahName: surah.namaLatin,
        surahNumber: surah.nomor,
        ayahNumber: ayah.nomorAyat,
        theme: prefs.theme,
      });
      setExportedAyah(ayah.nomorAyat);
      window.setTimeout(() => setExportedAyah(null), 1800);
    } catch {
      // Ignore canvas/download cancellation errors
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
      <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 sm:p-6">
        <div className="flex items-start justify-between gap-2">
          {onBack ? (
            <button
              type="button"
              onClick={onBack}
              aria-label="Kembali ke daftar surat"
              className="min-h-[44px] min-w-[44px] -ml-1.5 flex items-center justify-center rounded-xl text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors lg:hidden shrink-0"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          ) : (
            <div className="w-11 hidden lg:block shrink-0" />
          )}

          <div className="flex-1 min-w-0 text-center">
            <p dir="rtl" className="font-arabic text-3xl sm:text-4xl text-zinc-900 dark:text-zinc-100">
              {surah.nama}
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowDisplaySheet(true)}
            aria-label="Pengaturan tampilan baca dan tajwid"
            title="Pengaturan tampilan & tajwid"
            className="min-h-[44px] min-w-[44px] -mr-1.5 flex items-center justify-center rounded-xl text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors shrink-0"
          >
            <SlidersHorizontal className="w-5 h-5" />
          </button>
        </div>

        {/* Surah Name with Right-Aligned (?) Info Badge + Gap + Speaker Audio Badge */}
        <div className="mt-2 flex flex-col items-center text-center">
          <div className="flex items-center justify-center gap-3 max-w-full">
            <h1 className="text-lg sm:text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 truncate">
              {surah.nomor}. {surah.namaLatin}
            </h1>

            <div className="flex items-center gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setShowInfo(true)}
                aria-label="Informasi tentang surat ini"
                title="Info surat"
                className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/80 text-zinc-600 dark:text-zinc-300 hover:border-teal-600/50 hover:text-teal-700 dark:hover:text-teal-300 transition-colors"
              >
                <HelpCircle className="w-4 h-4 sm:w-[18px] sm:h-[18px]" />
              </button>

              <button
                type="button"
                onClick={() => setShowAudioControls((prev) => !prev)}
                aria-expanded={showAudioControls}
                aria-label={
                  showAudioControls
                    ? 'Sembunyikan pilihan qari dan putar surat'
                    : 'Tampilkan pilihan qari dan putar surat'
                }
                title="Pilihan Qari & Putar Surat"
                className={`min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full border transition-colors ${
                  showAudioControls || isThisSurahFullPlaying
                    ? 'border-teal-600/60 bg-teal-50 text-teal-700 dark:border-teal-500/60 dark:bg-teal-950/60 dark:text-teal-300'
                    : 'border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/80 text-zinc-600 dark:text-zinc-300 hover:border-teal-600/50 hover:text-teal-700 dark:hover:text-teal-300'
                }`}
              >
                <Volume2 className="w-4 h-4 sm:w-[18px] sm:h-[18px]" />
              </button>
            </div>
          </div>

          <p className="mt-1.5 text-xs sm:text-sm text-zinc-500 dark:text-zinc-400">
            {surah.arti} · {surah.tempatTurun} ·{' '}
            <span className="tabular-nums">{surah.jumlahAyat}</span> Ayat
          </p>
        </div>

        {/* Collapsible Qari Selector & Play Controls (Hiding never stops audio) */}
        {showAudioControls && (
          <div className="mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-800 space-y-2.5">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2.5">
              <div className="flex items-center gap-2 w-full sm:flex-1 sm:min-w-[200px]">
                <Volume2 className="w-4 h-4 text-zinc-400 shrink-0" />
                <select
                  aria-label="Pilih Qari Murottal"
                  value={prefs.qariId}
                  onChange={(e) => onSelectQari(e.target.value as QariId)}
                  className="w-full min-h-[44px] rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/70 px-3 py-1.5 text-xs font-medium text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-teal-600/30"
                >
                  {QARI_LIST.map((q) => (
                    <option key={q.id} value={q.id}>
                      Qari: {q.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 sm:flex sm:items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    isThisSurahFullActive ? onTogglePlayPause() : onPlaySurahFull(surah)
                  }
                  className="min-h-[44px] px-3 sm:px-4 rounded-xl bg-teal-700 hover:bg-teal-800 dark:bg-teal-600 dark:hover:bg-teal-500 text-white text-xs sm:text-sm font-semibold inline-flex items-center justify-center gap-1.5 sm:gap-2 transition-colors whitespace-nowrap shrink-0 active:scale-[0.99]"
                >
                  {isThisSurahFullPlaying ? (
                    <>
                      <Pause className="w-4 h-4 shrink-0" />
                      <span>Jeda Surat</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 shrink-0" />
                      <span>Putar Biasa</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => onPlaySurahFullScreen(surah)}
                  className="min-h-[44px] px-3 sm:px-4 rounded-xl border border-teal-700/40 dark:border-teal-500/40 bg-teal-50 dark:bg-teal-950/50 hover:bg-teal-100/80 dark:hover:bg-teal-950 text-teal-800 dark:text-teal-200 text-xs sm:text-sm font-semibold inline-flex items-center justify-center gap-1.5 sm:gap-2 transition-colors whitespace-nowrap shrink-0 active:scale-[0.99]"
                >
                  <Maximize2 className="w-4 h-4 shrink-0" />
                  <span className="sm:hidden">Full Screen</span>
                  <span className="hidden sm:inline">Putar Full Screen</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowAudioControls(false)}
                  className="col-span-2 sm:col-span-1 min-h-[44px] px-3 rounded-xl border border-zinc-200 dark:border-zinc-700 text-xs font-medium text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 inline-flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap shrink-0"
                >
                  <ChevronUp className="w-4 h-4 shrink-0" />
                  <span>Sembunyikan</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Basmalah (except Al-Fatihah #1 and At-Taubah #9) */}
      {surah.nomor !== 1 && surah.nomor !== 9 && (
        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 py-5 px-4 text-center">
          <p
            dir="rtl"
            className="font-arabic text-2xl sm:text-3xl text-zinc-900 dark:text-zinc-100"
          >
            <TajwidText text="بِسْمِ اللّٰهِ الرَّحْمٰنِ الرَّحِيْمِ" enabled={prefs.showTajwid} />
          </p>
        </div>
      )}

      {/* Ayah List */}
      <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 divide-y divide-zinc-100 dark:divide-zinc-800 overflow-hidden">
        {surah.ayat.map((ayah) => {
          const isAyahPlaying =
            audioState.active &&
            audioState.surahNumber === surah.nomor &&
            audioState.ayahNumber === ayah.nomorAyat;
          const isSelectedAyah = selectedAyah === ayah.nomorAyat;
          const bookmarked = isBookmarked(surah.nomor, ayah.nomorAyat);
          const isLastReadHere = lastReadAyah === ayah.nomorAyat;
          const historyEntry =
            asbabunNuzulMap[getAsbabunNuzulKey(surah.nomor, ayah.nomorAyat)];

          return (
            <div
              key={ayah.nomorAyat}
              ref={(el) => {
                ayahRefs.current[ayah.nomorAyat] = el;
              }}
              onClick={() => handleSelectAyah(ayah.nomorAyat)}
              className={`p-3.5 sm:p-6 cursor-pointer transition-colors ${
                isAyahPlaying
                  ? 'bg-teal-50/85 dark:bg-teal-950/40'
                  : isSelectedAyah
                  ? 'bg-teal-50/60 dark:bg-teal-950/25'
                  : ''
              }`}
            >
              {/* Ayah Number & Action Bar */}
              <div className="flex items-center justify-between gap-1.5 sm:gap-2 mb-4">
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className={`min-w-[30px] sm:min-w-[34px] h-[30px] sm:h-[34px] px-2 rounded-lg text-xs font-semibold tabular-nums inline-flex items-center justify-center shrink-0 transition-colors ${
                      isAyahPlaying || isSelectedAyah
                        ? 'bg-teal-700 text-white dark:bg-teal-500 dark:text-zinc-950'
                        : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300'
                    }`}
                  >
                    {ayah.nomorAyat}
                  </span>
                  {isLastReadHere && (
                    <span className="hidden sm:inline text-xs font-medium text-teal-700 dark:text-teal-400 truncate">
                      Terakhir dibaca
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-0.5 shrink-0">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (isAyahPlaying) {
                        onTogglePlayPause();
                      } else {
                        onPlayAyah(surah, ayah.nomorAyat);
                      }
                    }}
                    aria-label={
                      isAyahPlaying && audioState.isPlaying
                        ? `Jeda ayat ${ayah.nomorAyat}`
                        : `Putar ayat ${ayah.nomorAyat} (${activeQari.shortName})`
                    }
                    title={`Putar ayat ${ayah.nomorAyat}`}
                    className={`min-h-[40px] sm:min-h-[44px] min-w-[34px] sm:min-w-[42px] flex items-center justify-center rounded-xl transition-colors ${
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
                    onClick={(e) => {
                      e.stopPropagation();
                      onMarkLastRead(surah.nomor, surah.namaLatin, ayah.nomorAyat);
                    }}
                    aria-label={`Tandai ayat ${ayah.nomorAyat} sebagai terakhir dibaca`}
                    title="Tandai terakhir dibaca"
                    className={`min-h-[40px] sm:min-h-[44px] min-w-[34px] sm:min-w-[42px] flex items-center justify-center rounded-xl transition-colors ${
                      isLastReadHere
                        ? 'text-teal-700 dark:text-teal-400'
                        : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                    }`}
                  >
                    <BookOpenCheck className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleBookmark(surah.nomor, surah.namaLatin, ayah);
                    }}
                    aria-label={
                      bookmarked
                        ? `Hapus bookmark ayat ${ayah.nomorAyat}`
                        : `Simpan bookmark ayat ${ayah.nomorAyat}`
                    }
                    title="Bookmark ayat"
                    className={`min-h-[40px] sm:min-h-[44px] min-w-[34px] sm:min-w-[42px] flex items-center justify-center rounded-xl transition-colors ${
                      bookmarked
                        ? 'text-teal-700 dark:text-teal-400'
                        : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                    }`}
                  >
                    <Bookmark className={`w-4 h-4 ${bookmarked ? 'fill-current' : ''}`} />
                  </button>

                  {historyEntry && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveHistoryModal({
                          ayahNumber: ayah.nomorAyat,
                          entry: historyEntry,
                        });
                      }}
                      aria-label={`Lihat sejarah turunnya ayat ${ayah.nomorAyat}`}
                      title="Sejarah turunnya ayat"
                      className="min-h-[40px] sm:min-h-[44px] min-w-[34px] sm:min-w-[42px] flex items-center justify-center rounded-xl text-teal-700 dark:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-950/50 transition-colors"
                    >
                      <ScrollText className="w-4 h-4" />
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCopyAyah(ayah);
                    }}
                    aria-label={`Salin ayat ${ayah.nomorAyat}`}
                    title="Salin ayat"
                    className="min-h-[40px] sm:min-h-[44px] min-w-[34px] sm:min-w-[42px] flex items-center justify-center rounded-xl text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                  >
                    {copiedAyah === ayah.nomorAyat ? (
                      <Check className="w-4 h-4 text-teal-700 dark:text-teal-400" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleExportPng(ayah);
                    }}
                    aria-label={`Simpan ayat ${ayah.nomorAyat} sebagai gambar PNG transparan`}
                    title="Simpan sebagai PNG transparan"
                    className="min-h-[40px] sm:min-h-[44px] min-w-[34px] sm:min-w-[42px] flex items-center justify-center rounded-xl text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                  >
                    {exportedAyah === ayah.nomorAyat ? (
                      <Check className="w-4 h-4 text-teal-700 dark:text-teal-400" />
                    ) : (
                      <ImageDown className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {isLastReadHere && (
                <p className="sm:hidden text-[11px] font-medium text-teal-700 dark:text-teal-400 -mt-2 mb-3">
                  Terakhir dibaca
                </p>
              )}

              {/* Arabic Text */}
              <p
                dir="rtl"
                className="font-arabic text-right text-zinc-900 dark:text-zinc-100 leading-[2.25] tracking-normal"
                style={{ fontSize: `${prefs.arabicFontSize}px` }}
              >
                <TajwidText text={ayah.teksArab} enabled={prefs.showTajwid} />
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

      {/* Thumb-Zone Surah Footer Navigation (RTL Mushaf Flow: Berikutnya Left, Sebelumnya Right) */}
      <div className="space-y-2.5 pt-1">
        <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
          {surah.suratSelanjutnya ? (
            <button
              type="button"
              onClick={() => {
                if (surah.suratSelanjutnya) onSelectSurah(surah.suratSelanjutnya.nomor);
              }}
              className="min-h-[56px] rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 sm:px-4 py-3 text-left hover:border-teal-600/40 dark:hover:border-teal-500/40 transition-colors flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4 text-zinc-400 shrink-0" />
              <div className="min-w-0">
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400">Berikutnya</p>
                <p className="text-xs sm:text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                  {surah.suratSelanjutnya.namaLatin}
                </p>
              </div>
            </button>
          ) : (
            <div />
          )}

          {surah.suratSebelumnya ? (
            <button
              type="button"
              onClick={() => {
                if (surah.suratSebelumnya) onSelectSurah(surah.suratSebelumnya.nomor);
              }}
              className="min-h-[56px] rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 sm:px-4 py-3 text-right hover:border-teal-600/40 dark:hover:border-teal-500/40 transition-colors flex items-center justify-end gap-2"
            >
              <div className="min-w-0">
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400">Sebelumnya</p>
                <p className="text-xs sm:text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                  {surah.suratSebelumnya.namaLatin}
                </p>
              </div>
              <ArrowRight className="w-4 h-4 text-zinc-400 shrink-0" />
            </button>
          ) : (
            <div />
          )}
        </div>

        {/* Mobile Thumb-Zone Quick Return Bar */}
        <div className={`lg:hidden grid gap-2.5 ${onBack ? 'grid-cols-2' : 'grid-cols-1'}`}>
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="min-h-[46px] px-3.5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs font-semibold text-zinc-700 dark:text-zinc-200 hover:border-teal-600/40 dark:hover:border-teal-500/40 inline-flex items-center justify-center gap-2 transition-colors whitespace-nowrap"
            >
              <List className="w-4 h-4 text-teal-700 dark:text-teal-400 shrink-0" />
              <span>Daftar Surat</span>
            </button>
          )}
          <button
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="min-h-[46px] px-3.5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs font-semibold text-zinc-700 dark:text-zinc-200 hover:border-teal-600/40 dark:hover:border-teal-500/40 inline-flex items-center justify-center gap-2 transition-colors whitespace-nowrap"
          >
            <ArrowUp className="w-4 h-4 text-teal-700 dark:text-teal-400 shrink-0" />
            <span>Ke Atas</span>
          </button>
        </div>
      </div>

      {/* Info Surat Modal */}
      {showInfo && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-xs p-0 sm:p-4"
          onClick={() => setShowInfo(false)}
        >
          <div
            className="w-full sm:max-w-lg rounded-t-3xl sm:rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-5 pb-safe sm:p-6 max-h-[82vh] overflow-y-auto shadow-xl"
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

      {/* Sejarah Turunnya Ayat (Asbabun Nuzul) Overlay */}
      {activeHistoryModal && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-xs p-0 sm:p-4"
          onClick={() => setActiveHistoryModal(null)}
        >
          <div
            className="w-full sm:max-w-lg rounded-t-3xl sm:rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-5 pb-safe sm:p-6 max-h-[84vh] overflow-y-auto shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-10 h-1.5 bg-zinc-300 dark:bg-zinc-700 rounded-full mx-auto mb-4 sm:hidden" />
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <p className="text-xs font-semibold text-teal-700 dark:text-teal-400">
                  Sejarah Turunnya Ayat
                </p>
                <h2 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-zinc-100 leading-snug">
                  {activeHistoryModal.entry.title}
                </h2>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  QS. {surah.namaLatin} ({surah.nomor}) · Ayat {activeHistoryModal.ayahNumber}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveHistoryModal(null)}
                aria-label="Tutup sejarah ayat"
                className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-3 text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
              <p>{activeHistoryModal.entry.narration}</p>
            </div>

            <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800">
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Sumber: <span className="font-medium text-zinc-700 dark:text-zinc-300">{activeHistoryModal.entry.source}</span>
              </p>
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
            className="w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-5 pb-safe max-h-[85vh] overflow-y-auto shadow-xl"
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
              onOpenTajwidGuide={() => {
                setShowDisplaySheet(false);
                setShowTajwidGuide(true);
              }}
              compactMode
            />
          </div>
        </div>
      )}

      {/* Panduan Tajwid Warna Khusus Modal */}
      <TajwidGuideModal
        open={showTajwidGuide}
        tajwidEnabled={prefs.showTajwid}
        onToggleTajwid={(enabled) => onUpdatePrefs({ showTajwid: enabled })}
        onClose={() => setShowTajwidGuide(false)}
      />
    </div>
  );
};
