import React, { useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  Loader2,
  Pause,
  Play,
  Repeat,
  SkipBack,
  SkipForward,
  X,
} from 'lucide-react';
import { QARI_LIST, type AudioState, type QariId, type RepeatMode } from '../types/quran';

interface AudioMiniPlayerProps {
  audioState: AudioState;
  onTogglePlayPause: () => void;
  onStop: () => void;
  onSeek: (time: number) => void;
  onNextAyah: () => void;
  onPrevAyah: () => void;
  onSwitchQari: (qariId: QariId) => void;
  onCycleRepeat: () => void;
}

function formatTime(sec: number): string {
  if (!Number.isFinite(sec) || sec <= 0) return '0:00';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}

function getRepeatLabel(mode: RepeatMode): string {
  if (mode === 'off') return '1x';
  if (mode === 'infinite') return '∞';
  return `${mode}x`;
}

export const AudioMiniPlayer: React.FC<AudioMiniPlayerProps> = ({
  audioState,
  onTogglePlayPause,
  onStop,
  onSeek,
  onNextAyah,
  onPrevAyah,
  onSwitchQari,
  onCycleRepeat,
}) => {
  const [minimized, setMinimized] = useState(false);

  if (!audioState.active) return null;

  const qari = QARI_LIST.find((q) => q.id === audioState.qariId) ?? QARI_LIST[0];
  const isRepeatActive = audioState.repeatMode !== 'off';
  const repeatCounterText = isRepeatActive
    ? ` · Ulang ${audioState.repeatIteration}${
        audioState.repeatMode === 'infinite' ? '/∞' : `/${audioState.repeatMode}`
      }`
    : '';

  if (minimized) {
    return (
      <div className="fixed bottom-[calc(58px+env(safe-area-inset-bottom,0px))] lg:bottom-4 right-3 sm:right-4 lg:right-6 z-40 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md shadow-lg px-2.5 py-1.5 flex items-center gap-1.5 max-w-[calc(100vw-24px)]">
        <button
          type="button"
          onClick={onTogglePlayPause}
          aria-label={audioState.isPlaying ? 'Jeda murottal' : 'Putar murottal'}
          className="min-h-[38px] min-w-[38px] flex items-center justify-center rounded-xl bg-teal-700 hover:bg-teal-800 dark:bg-teal-600 dark:hover:bg-teal-500 text-white transition-colors shrink-0"
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
          onClick={() => setMinimized(false)}
          className="min-h-[38px] px-1.5 text-left min-w-0 flex items-center gap-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
        >
          <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate max-w-[140px] sm:max-w-[200px]">
            {audioState.surahName} · {audioState.ayahNumber ?? 1}
            {isRepeatActive ? ` (${getRepeatLabel(audioState.repeatMode)})` : ''}
          </span>
          <ChevronUp className="w-4 h-4 text-zinc-500 dark:text-zinc-400 shrink-0" />
        </button>

        <button
          type="button"
          onClick={onStop}
          aria-label="Tutup pemutar murottal"
          className="min-h-[38px] min-w-[34px] flex items-center justify-center rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors shrink-0"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-[calc(58px+env(safe-area-inset-bottom,0px))] lg:bottom-4 left-2.5 right-2.5 sm:left-4 sm:right-4 lg:left-auto lg:right-6 lg:w-[430px] max-w-2xl mx-auto lg:mx-0 z-40 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md shadow-lg px-3.5 pt-2.5 pb-2">
      {audioState.error && (
        <p className="text-[11px] text-amber-700 dark:text-amber-300 mb-1.5 leading-snug">
          {audioState.error}
        </p>
      )}

      {/* Row 1: Surah / Ayah Progress + Minimize + Close */}
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate min-w-0">
          {audioState.surahName} ·{' '}
          {audioState.mode === 'surah'
            ? `Surat Penuh · Ayat ${audioState.ayahNumber ?? 1}/${audioState.totalAyahs}`
            : `Ayat ${audioState.ayahNumber}`}
          {repeatCounterText && (
            <span className="text-teal-700 dark:text-teal-400 font-semibold tabular-nums">
              {repeatCounterText}
            </span>
          )}
        </p>

        <div className="flex items-center gap-0.5 shrink-0 -mr-1">
          <button
            type="button"
            onClick={() => setMinimized(true)}
            aria-label="Perkecil pemutar audio"
            title="Minimize pemutar"
            className="min-h-[36px] min-w-[36px] flex items-center justify-center rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <ChevronDown className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={onStop}
            aria-label={`Tutup pemutar ${qari.shortName}`}
            className="min-h-[36px] min-w-[36px] flex items-center justify-center rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Row 2: Qari + Time on Left, Repeat + Transport Controls on Right */}
      <div className="mt-1 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1 min-w-0 flex-1">
          <select
            aria-label="Ganti Qari"
            value={audioState.qariId}
            onChange={(e) => onSwitchQari(e.target.value as QariId)}
            className="min-h-[36px] text-[11px] sm:text-xs text-teal-700 dark:text-teal-400 bg-transparent font-medium focus:outline-none cursor-pointer truncate min-w-0 max-w-[115px] sm:max-w-[175px]"
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
            · {formatTime(audioState.currentTime)}/{formatTime(audioState.duration)}
          </span>
        </div>

        <div className="flex items-center gap-0.5 sm:gap-1 shrink-0">
          <button
            type="button"
            onClick={onCycleRepeat}
            aria-label={`Ulangi murottal: ${getRepeatLabel(audioState.repeatMode)}`}
            title="Mode ulangi (1x / 3x / 5x / ∞)"
            className={`min-h-[40px] px-2 rounded-xl text-[11px] font-semibold inline-flex items-center justify-center gap-1 transition-colors whitespace-nowrap ${
              isRepeatActive
                ? 'bg-teal-50 text-teal-800 border border-teal-600/40 dark:bg-teal-950/60 dark:text-teal-300 dark:border-teal-500/40'
                : 'text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
            }`}
          >
            <Repeat className="w-3.5 h-3.5 shrink-0" />
            <span className="tabular-nums">{getRepeatLabel(audioState.repeatMode)}</span>
          </button>

          <button
            type="button"
            onClick={onPrevAyah}
            disabled={!audioState.ayahNumber || audioState.ayahNumber <= 1}
            aria-label="Ayat sebelumnya"
            className="min-h-[40px] min-w-[36px] sm:min-w-[40px] flex items-center justify-center rounded-xl text-zinc-600 dark:text-zinc-300 disabled:opacity-30 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <SkipBack className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={onTogglePlayPause}
            aria-label={audioState.isPlaying ? 'Jeda murottal' : 'Putar murottal'}
            className="min-h-[42px] min-w-[42px] sm:min-w-[44px] flex items-center justify-center rounded-xl bg-teal-700 hover:bg-teal-800 dark:bg-teal-600 dark:hover:bg-teal-500 text-white transition-colors"
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
            className="min-h-[40px] min-w-[36px] sm:min-w-[40px] flex items-center justify-center rounded-xl text-zinc-600 dark:text-zinc-300 disabled:opacity-30 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
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
