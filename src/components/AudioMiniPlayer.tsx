import React from 'react';
import { Loader2, Pause, Play, SkipBack, SkipForward, X } from 'lucide-react';
import { QARI_LIST, type AudioState, type QariId } from '../types/quran';

interface AudioMiniPlayerProps {
  audioState: AudioState;
  onTogglePlayPause: () => void;
  onStop: () => void;
  onSeek: (time: number) => void;
  onNextAyah: () => void;
  onPrevAyah: () => void;
  onSwitchQari: (qariId: QariId) => void;
}

function formatTime(sec: number): string {
  if (!Number.isFinite(sec) || sec <= 0) return '0:00';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}

export const AudioMiniPlayer: React.FC<AudioMiniPlayerProps> = ({
  audioState,
  onTogglePlayPause,
  onStop,
  onSeek,
  onNextAyah,
  onPrevAyah,
  onSwitchQari,
}) => {
  if (!audioState.active) return null;

  const qari = QARI_LIST.find((q) => q.id === audioState.qariId) ?? QARI_LIST[0];

  return (
    <div className="fixed bottom-[calc(58px+env(safe-area-inset-bottom,0px))] lg:bottom-4 left-2.5 right-2.5 sm:left-4 sm:right-4 lg:left-auto lg:right-6 lg:w-[420px] max-w-2xl mx-auto lg:mx-0 z-40 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md shadow-lg px-3.5 pt-2.5 pb-2">
      {audioState.error && (
        <p className="text-[11px] text-amber-700 dark:text-amber-300 mb-1.5 leading-snug">
          {audioState.error}
        </p>
      )}

      {/* Row 1: Surah / Ayah Progress + Close */}
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate min-w-0">
          {audioState.surahName} ·{' '}
          {audioState.mode === 'surah'
            ? `Surat Penuh · Ayat ${audioState.ayahNumber ?? 1}/${audioState.totalAyahs}`
            : `Ayat ${audioState.ayahNumber}`}
        </p>

        <button
          type="button"
          onClick={onStop}
          aria-label={`Tutup pemutar ${qari.shortName}`}
          className="min-h-[36px] min-w-[36px] -mr-1 flex items-center justify-center rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors shrink-0"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Row 2: Qari + Time on Left, Thumb Transport Controls on Right */}
      <div className="mt-1 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0 flex-1">
          <select
            aria-label="Ganti Qari"
            value={audioState.qariId}
            onChange={(e) => onSwitchQari(e.target.value as QariId)}
            className="min-h-[36px] text-[11px] sm:text-xs text-teal-700 dark:text-teal-400 bg-transparent font-medium focus:outline-none cursor-pointer truncate min-w-0 max-w-[145px] sm:max-w-[210px]"
          >
            {QARI_LIST.map((item) => (
              <option
                key={item.id}
                value={item.id}
                className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100"
              >
                {item.name}
              </option>
            ))}
          </select>
          <span className="text-[11px] text-zinc-400 tabular-nums shrink-0 whitespace-nowrap">
            · {formatTime(audioState.currentTime)} / {formatTime(audioState.duration)}
          </span>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={onPrevAyah}
            disabled={!audioState.ayahNumber || audioState.ayahNumber <= 1}
            aria-label="Ayat sebelumnya"
            className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl text-zinc-600 dark:text-zinc-300 disabled:opacity-30 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <SkipBack className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={onTogglePlayPause}
            aria-label={audioState.isPlaying ? 'Jeda murottal' : 'Putar murottal'}
            className="min-h-[42px] min-w-[44px] flex items-center justify-center rounded-xl bg-teal-700 hover:bg-teal-800 dark:bg-teal-600 dark:hover:bg-teal-500 text-white transition-colors"
          >
            {audioState.isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : audioState.isPlaying ? (
              <Pause className="w-4 h-4" />
            ) : (
              <Play className="w-4 h-4" />
            )}
          </button>

          <button
            type="button"
            onClick={onNextAyah}
            disabled={
              !audioState.ayahNumber || audioState.ayahNumber >= audioState.totalAyahs
            }
            aria-label="Ayat berikutnya"
            className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl text-zinc-600 dark:text-zinc-300 disabled:opacity-30 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <SkipForward className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Row 3: Seekable Progress Scrubber */}
      <div className="mt-1">
        <input
          type="range"
          aria-label="Posisi audio"
          min={0}
          max={audioState.duration || 100}
          step={0.5}
          value={Math.min(audioState.currentTime, audioState.duration || 100)}
          onChange={(e) => onSeek(Number(e.target.value))}
          className="quran-range w-full h-3.5 block"
        />
      </div>
    </div>
  );
};
