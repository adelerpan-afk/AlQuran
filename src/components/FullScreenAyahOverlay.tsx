import React, { useEffect, useRef } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Loader2,
  Pause,
  Play,
  Repeat,
  X,
} from 'lucide-react';
import {
  QARI_LIST,
  type AudioState,
  type ReaderPreferences,
  type RepeatMode,
  type SurahDetail,
} from '../types/quran';
import { TajwidText } from './TajwidText';

interface FullScreenAyahOverlayProps {
  open: boolean;
  surah: SurahDetail | null;
  ayahNumber: number;
  prefs: ReaderPreferences;
  audioState: AudioState;
  onClose: () => void;
  onPrevAyah: () => void;
  onNextAyah: () => void;
  onTogglePlayPause: () => void;
  onPlayAyah: (surah: SurahDetail, ayahNumber: number) => void;
  onCycleRepeat: () => void;
}

function getRepeatLabel(mode: RepeatMode): string {
  if (mode === 'off') return '1x';
  if (mode === 'infinite') return '∞';
  return `${mode}x`;
}

export const FullScreenAyahOverlay: React.FC<FullScreenAyahOverlayProps> = ({
  open,
  surah,
  ayahNumber,
  prefs,
  audioState,
  onClose,
  onPrevAyah,
  onNextAyah,
  onTogglePlayPause,
  onPlayAyah,
  onCycleRepeat,
}) => {
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowLeft' && surah && ayahNumber < surah.jumlahAyat) {
        onNextAyah();
      } else if (e.key === 'ArrowRight' && ayahNumber > 1) {
        onPrevAyah();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, surah, ayahNumber, onClose, onNextAyah, onPrevAyah]);

  useEffect(() => {
    if (open && scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [open, ayahNumber, surah?.nomor]);

  if (!open || !surah) return null;

  const ayah =
    surah.ayat.find((item) => item.nomorAyat === ayahNumber) ?? surah.ayat[0] ?? null;

  if (!ayah) return null;

  const hasNext = ayah.nomorAyat < surah.jumlahAyat;
  const hasPrev = ayah.nomorAyat > 1;

  const isThisSurahAudioActive =
    audioState.active && audioState.surahNumber === surah.nomor;
  const isThisAyahPlaying =
    isThisSurahAudioActive && audioState.ayahNumber === ayah.nomorAyat;
  const isRepeatActive = audioState.repeatMode !== 'off';
  const activeQari = QARI_LIST.find((q) => q.id === audioState.qariId) ?? QARI_LIST[0];

  const repeatStatusText =
    isThisSurahAudioActive && isRepeatActive
      ? ` · Ulang ${audioState.repeatIteration}${
          audioState.repeatMode === 'infinite' ? '/∞' : `/${audioState.repeatMode}`
        }`
      : '';

  const arabicFontSize = Math.min(Math.max(prefs.arabicFontSize + 6, 28), 50);
  const latinFontSize = Math.min(prefs.latinFontSize + 2, 22);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Mode layar penuh QS. ${surah.namaLatin} ayat ${ayah.nomorAyat}`}
      className="fixed inset-0 z-50 h-dvh flex flex-col bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100"
    >
      {/* Top Overlay Bar: Quiet Metadata + Top-Right Close Badge */}
      <header className="shrink-0 px-4 sm:px-6 pt-3 pb-2.5 border-b border-zinc-200/80 dark:border-zinc-800/80 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm sm:text-base font-bold text-zinc-900 dark:text-zinc-100 truncate">
            {surah.nomor}. {surah.namaLatin}
          </p>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 tabular-nums truncate">
            Ayat {ayah.nomorAyat} dari {surah.jumlahAyat}
            {isThisSurahAudioActive ? ` · ${activeQari.shortName}${repeatStatusText}` : ''}
          </p>
        </div>

        <button
          type="button"
          onClick={onClose}
          aria-label="Tutup mode layar penuh"
          title="Tutup layar penuh"
          className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-200 hover:border-teal-600/50 hover:text-teal-700 dark:hover:text-teal-300 shadow-xs transition-colors shrink-0"
        >
          <X className="w-5 h-5" />
        </button>
      </header>

      {/* Center Single-Ayah Canvas + Desktop Side Navigation */}
      <div className="relative flex-1 min-h-0">
        {/* Desktop/Tablet Left Side Button -> Berikutnya (RTL Mushaf Flow) */}
        <button
          type="button"
          onClick={onNextAyah}
          disabled={!hasNext}
          aria-label="Ayat berikutnya"
          title="Ayat berikutnya"
          className="hidden md:flex fixed left-4 lg:left-8 top-1/2 -translate-y-1/2 z-10 min-h-[52px] px-3.5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-sm shadow-sm items-center gap-2 text-xs font-semibold text-zinc-700 dark:text-zinc-200 hover:border-teal-600/50 hover:text-teal-700 dark:hover:text-teal-300 disabled:opacity-25 disabled:pointer-events-none transition-colors whitespace-nowrap"
        >
          <ArrowLeft className="w-4 h-4 shrink-0" />
          <span>Berikutnya</span>
        </button>

        {/* Desktop/Tablet Right Side Button -> Sebelumnya (RTL Mushaf Flow) */}
        <button
          type="button"
          onClick={onPrevAyah}
          disabled={!hasPrev}
          aria-label="Ayat sebelumnya"
          title="Ayat sebelumnya"
          className="hidden md:flex fixed right-4 lg:right-8 top-1/2 -translate-y-1/2 z-10 min-h-[52px] px-3.5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-sm shadow-sm items-center gap-2 text-xs font-semibold text-zinc-700 dark:text-zinc-200 hover:border-teal-600/50 hover:text-teal-700 dark:hover:text-teal-300 disabled:opacity-25 disabled:pointer-events-none transition-colors whitespace-nowrap"
        >
          <span>Sebelumnya</span>
          <ArrowRight className="w-4 h-4 shrink-0" />
        </button>

        {/* Scrollable Full-Screen Ayah Container */}
        <div
          ref={scrollContainerRef}
          className="h-full overflow-y-auto px-4 sm:px-8 md:px-40 py-6 sm:py-10"
        >
          <div className="min-h-full max-w-3xl mx-auto flex flex-col justify-center space-y-6">
            <div className="flex items-center justify-center">
              <span className="text-xs font-semibold tabular-nums text-teal-700 dark:text-teal-400">
                QS. {surah.namaLatin} : Ayat {ayah.nomorAyat}
              </span>
            </div>

            <p
              dir="rtl"
              className="font-arabic text-right text-zinc-900 dark:text-zinc-100 leading-[2.3] tracking-normal"
              style={{ fontSize: `${arabicFontSize}px` }}
            >
              <TajwidText text={ayah.teksArab} enabled={prefs.showTajwid} />
            </p>

            {prefs.showLatin && (
              <p
                className="italic text-teal-800 dark:text-teal-300/90 leading-relaxed"
                style={{ fontSize: `${latinFontSize}px` }}
              >
                {ayah.teksLatin}
              </p>
            )}

            {prefs.showTranslation && (
              <p
                className="text-zinc-700 dark:text-zinc-300 leading-relaxed"
                style={{ fontSize: `${latinFontSize}px` }}
              >
                {ayah.teksIndonesia}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Thumb-Zone Navigation (RTL Mobile Left/Right) & Audio Controls */}
      <footer className="shrink-0 border-t border-zinc-200/80 dark:border-zinc-800/80 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md px-3 sm:px-6 py-2.5 pb-safe">
        <div className="max-w-3xl mx-auto grid grid-cols-[1fr_auto_1fr] md:flex md:items-center md:justify-center items-center gap-2 sm:gap-3">
          {/* Left -> Berikutnya */}
          <button
            type="button"
            onClick={onNextAyah}
            disabled={!hasNext}
            aria-label="Ayat berikutnya"
            className="md:hidden min-h-[46px] px-3 rounded-xl border border-zinc-200 dark:border-zinc-700 text-xs font-semibold text-zinc-800 dark:text-zinc-200 hover:border-teal-600/40 disabled:opacity-30 disabled:pointer-events-none flex items-center justify-start gap-1.5 transition-colors whitespace-nowrap"
          >
            <ArrowLeft className="w-4 h-4 text-teal-700 dark:text-teal-400 shrink-0" />
            <span className="truncate">Berikutnya</span>
          </button>

          {/* Center Audio Controls */}
          <div className="flex items-center justify-center gap-1.5 sm:gap-2">
            <button
              type="button"
              onClick={onCycleRepeat}
              aria-label={`Mode ulangi murottal: ${getRepeatLabel(audioState.repeatMode)}`}
              title="Ulangi (1x / 3x / 5x / ∞)"
              className={`min-h-[44px] px-2.5 rounded-xl border text-xs font-semibold inline-flex items-center justify-center gap-1 transition-colors whitespace-nowrap ${
                isRepeatActive
                  ? 'border-teal-600/50 bg-teal-50 text-teal-800 dark:border-teal-500/50 dark:bg-teal-950/60 dark:text-teal-300'
                  : 'border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'
              }`}
            >
              <Repeat className="w-3.5 h-3.5 shrink-0" />
              <span className="tabular-nums">{getRepeatLabel(audioState.repeatMode)}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                if (isThisAyahPlaying || isThisSurahAudioActive) {
                  onTogglePlayPause();
                } else {
                  onPlayAyah(surah, ayah.nomorAyat);
                }
              }}
              aria-label={
                isThisSurahAudioActive && audioState.isPlaying
                  ? 'Jeda murottal'
                  : `Putar ayat ${ayah.nomorAyat}`
              }
              className="min-h-[44px] px-3.5 rounded-xl bg-teal-700 hover:bg-teal-800 dark:bg-teal-600 dark:hover:bg-teal-500 text-white text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap"
            >
              {isThisSurahAudioActive && audioState.isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin shrink-0" />
              ) : isThisSurahAudioActive && audioState.isPlaying ? (
                <Pause className="w-4 h-4 shrink-0" />
              ) : (
                <Play className="w-4 h-4 shrink-0" />
              )}
              <span className="hidden sm:inline">
                {isThisSurahAudioActive && audioState.isPlaying ? 'Jeda' : 'Putar'}
              </span>
            </button>
          </div>

          {/* Right -> Sebelumnya */}
          <button
            type="button"
            onClick={onPrevAyah}
            disabled={!hasPrev}
            aria-label="Ayat sebelumnya"
            className="md:hidden min-h-[46px] px-3 rounded-xl border border-zinc-200 dark:border-zinc-700 text-xs font-semibold text-zinc-800 dark:text-zinc-200 hover:border-teal-600/40 disabled:opacity-30 disabled:pointer-events-none flex items-center justify-end gap-1.5 transition-colors whitespace-nowrap"
          >
            <span className="truncate">Sebelumnya</span>
            <ArrowRight className="w-4 h-4 text-teal-700 dark:text-teal-400 shrink-0" />
          </button>
        </div>
      </footer>
    </div>
  );
};
