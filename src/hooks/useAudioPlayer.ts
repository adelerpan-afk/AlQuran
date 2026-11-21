import { useCallback, useEffect, useRef, useState } from 'react';
import type { AudioMode, AudioState, QariId, RepeatMode, SurahDetail } from '../types/quran';

const REPEAT_SEQUENCE: RepeatMode[] = ['off', 3, 5, 'infinite'];

const INITIAL_STATE: AudioState = {
  active: false,
  isPlaying: false,
  isLoading: false,
  mode: 'ayah',
  surahNumber: 1,
  surahName: '',
  totalAyahs: 0,
  ayahNumber: null,
  qariId: '05',
  currentTime: 0,
  duration: 0,
  repeatMode: 'off',
  repeatIteration: 1,
  error: null,
};

export function useAudioPlayer(defaultQariId: QariId) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const preloadRef = useRef<HTMLAudioElement | null>(null);
  const surahRef = useRef<SurahDetail | null>(null);
  const stateRef = useRef<AudioState>({ ...INITIAL_STATE, qariId: defaultQariId });

  const [state, setState] = useState<AudioState>(() => ({
    ...INITIAL_STATE,
    qariId: defaultQariId,
  }));

  const updateState = useCallback(
    (updater: Partial<AudioState> | ((prev: AudioState) => AudioState)) => {
      setState((prev) => {
        const next = typeof updater === 'function' ? updater(prev) : { ...prev, ...updater };
        stateRef.current = next;
        return next;
      });
    },
    [],
  );

  const preloadNextAyah = useCallback(
    (surah: SurahDetail, currentAyahNumber: number, qari: QariId) => {
      const nextAyah = surah.ayat.find((a) => a.nomorAyat === currentAyahNumber + 1);
      if (!nextAyah) return;
      const nextUrl = nextAyah.audio[qari] || Object.values(nextAyah.audio)[0];
      if (!nextUrl) return;
      try {
        if (!preloadRef.current) {
          preloadRef.current = new Audio();
        }
        preloadRef.current.preload = 'auto';
        preloadRef.current.src = nextUrl;
      } catch {
        // Ignore preload failures
      }
    },
    [],
  );

  const playUrl = useCallback(
    (url: string, meta: Partial<AudioState>) => {
      if (!audioRef.current) {
        audioRef.current = new Audio();
        audioRef.current.preload = 'auto';
      }
      const audio = audioRef.current;
      audio.pause();
      audio.src = url;
      audio.currentTime = 0;

      updateState({
        ...meta,
        active: true,
        isLoading: true,
        isPlaying: false,
        currentTime: 0,
        duration: 0,
        error: null,
      });

      audio
        .play()
        .then(() => {
          updateState({ isPlaying: true, isLoading: false, error: null });
        })
        .catch((err: unknown) => {
          const msg =
            err instanceof Error && err.name === 'NotAllowedError'
              ? 'Ketuk tombol Putar untuk memulai audio.'
              : 'Audio tidak dapat diputar. Pastikan koneksi tersedia atau coba Qari lain.';
          updateState({ isPlaying: false, isLoading: false, error: msg });
        });
    },
    [updateState],
  );

  const playAyahSequence = useCallback(
    (
      surah: SurahDetail,
      ayahNumber: number,
      mode: AudioMode,
      qariOverride?: QariId,
      repeatIterationOverride?: number,
    ) => {
      surahRef.current = surah;
      const qari = qariOverride ?? stateRef.current.qariId ?? defaultQariId;
      const targetAyah = surah.ayat.find((a) => a.nomorAyat === ayahNumber);
      if (!targetAyah) return;

      const url = targetAyah.audio[qari] || Object.values(targetAyah.audio)[0];
      if (!url) return;

      playUrl(url, {
        mode,
        surahNumber: surah.nomor,
        surahName: surah.namaLatin,
        totalAyahs: surah.jumlahAyat,
        ayahNumber,
        qariId: qari,
        repeatIteration: repeatIterationOverride ?? stateRef.current.repeatIteration,
      });

      preloadNextAyah(surah, ayahNumber, qari);
    },
    [defaultQariId, playUrl, preloadNextAyah],
  );

  const playAyah = useCallback(
    (surah: SurahDetail, ayahNumber: number, qariOverride?: QariId) => {
      playAyahSequence(surah, ayahNumber, 'ayah', qariOverride, 1);
    },
    [playAyahSequence],
  );

  const playSurahFull = useCallback(
    (surah: SurahDetail, qariOverride?: QariId) => {
      playAyahSequence(surah, 1, 'surah', qariOverride, 1);
    },
    [playAyahSequence],
  );

  const togglePlayPause = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || !stateRef.current.active) return;

    if (stateRef.current.isPlaying) {
      audio.pause();
      updateState({ isPlaying: false });
    } else {
      audio
        .play()
        .then(() => updateState({ isPlaying: true, error: null }))
        .catch(() =>
          updateState({
            isPlaying: false,
            error: 'Gagal melanjutkan audio. Periksa koneksi internet Anda.',
          }),
        );
    }
  }, [updateState]);

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.removeAttribute('src');
      audioRef.current.load();
    }
    updateState({
      ...INITIAL_STATE,
      qariId: stateRef.current.qariId,
      repeatMode: stateRef.current.repeatMode,
    });
  }, [updateState]);

  const seek = useCallback(
    (time: number) => {
      if (!audioRef.current) return;
      audioRef.current.currentTime = Math.max(0, Math.min(time, audioRef.current.duration || 0));
      updateState({ currentTime: audioRef.current.currentTime });
    },
    [updateState],
  );

  const nextAyah = useCallback(() => {
    const s = stateRef.current;
    const surah = surahRef.current;
    if (!surah || s.ayahNumber === null) return;
    if (s.ayahNumber < surah.jumlahAyat) {
      playAyahSequence(
        surah,
        s.ayahNumber + 1,
        s.mode,
        s.qariId,
        s.mode === 'ayah' ? 1 : s.repeatIteration,
      );
    }
  }, [playAyahSequence]);

  const prevAyah = useCallback(() => {
    const s = stateRef.current;
    const surah = surahRef.current;
    if (!surah || s.ayahNumber === null) return;
    if (s.ayahNumber > 1) {
      playAyahSequence(
        surah,
        s.ayahNumber - 1,
        s.mode,
        s.qariId,
        s.mode === 'ayah' ? 1 : s.repeatIteration,
      );
    }
  }, [playAyahSequence]);

  const switchQari = useCallback(
    (newQariId: QariId) => {
      const s = stateRef.current;
      const surah = surahRef.current;
      updateState({ qariId: newQariId });
      if (!s.active || !surah || s.ayahNumber === null) return;
      playAyahSequence(surah, s.ayahNumber, s.mode, newQariId, s.repeatIteration);
    },
    [playAyahSequence, updateState],
  );

  const cycleRepeatMode = useCallback(() => {
    updateState((prev) => {
      const idx = REPEAT_SEQUENCE.indexOf(prev.repeatMode);
      const nextMode = REPEAT_SEQUENCE[(idx + 1) % REPEAT_SEQUENCE.length];
      return {
        ...prev,
        repeatMode: nextMode,
        repeatIteration: 1,
      };
    });
  }, [updateState]);

  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
      audioRef.current.preload = 'auto';
    }
    const audio = audioRef.current;

    const onTimeUpdate = () => {
      updateState({
        currentTime: audio.currentTime || 0,
        duration: Number.isFinite(audio.duration) ? audio.duration : 0,
      });
    };

    const onLoadedMetadata = () => {
      updateState({
        duration: Number.isFinite(audio.duration) ? audio.duration : 0,
        isLoading: false,
      });
    };

    const onWaiting = () => updateState({ isLoading: true });
    const onCanPlay = () => updateState({ isLoading: false });

    const onEnded = () => {
      const s = stateRef.current;
      const surah = surahRef.current;
      if (!surah || s.ayahNumber === null) {
        updateState({ isPlaying: false, currentTime: 0, repeatIteration: 1 });
        return;
      }

      const shouldRepeatCurrent =
        s.repeatMode === 'infinite' ||
        (typeof s.repeatMode === 'number' && s.repeatIteration < s.repeatMode);

      if (s.mode === 'ayah') {
        if (shouldRepeatCurrent) {
          const nextIter = s.repeatIteration + 1;
          updateState({ repeatIteration: nextIter, currentTime: 0, isPlaying: true });
          audio.currentTime = 0;
          audio.play().catch(() => updateState({ isPlaying: false }));
          return;
        }
        if (s.ayahNumber < surah.jumlahAyat) {
          playAyahSequence(surah, s.ayahNumber + 1, 'ayah', s.qariId, 1);
        } else {
          updateState({ isPlaying: false, currentTime: 0, repeatIteration: 1 });
        }
        return;
      }

      // Mode 'surah': advance sequentially through all ayahs, then repeat whole surah if configured
      if (s.ayahNumber < surah.jumlahAyat) {
        playAyahSequence(surah, s.ayahNumber + 1, 'surah', s.qariId, s.repeatIteration);
      } else if (shouldRepeatCurrent) {
        playAyahSequence(surah, 1, 'surah', s.qariId, s.repeatIteration + 1);
      } else {
        updateState({ isPlaying: false, currentTime: 0, repeatIteration: 1 });
      }
    };

    const onError = () => {
      if (!stateRef.current.active) return;
      updateState({
        isPlaying: false,
        isLoading: false,
        error: 'Gagal memuat audio murottal. Pastikan jaringan terhubung.',
      });
    };

    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('loadedmetadata', onLoadedMetadata);
    audio.addEventListener('waiting', onWaiting);
    audio.addEventListener('canplay', onCanPlay);
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('error', onError);

    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('loadedmetadata', onLoadedMetadata);
      audio.removeEventListener('waiting', onWaiting);
      audio.removeEventListener('canplay', onCanPlay);
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('error', onError);
    };
  }, [playAyahSequence, updateState]);

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, []);

  return {
    audioState: state,
    playAyah,
    playSurahFull,
    togglePlayPause,
    stop,
    seek,
    nextAyah,
    prevAyah,
    switchQari,
    cycleRepeatMode,
  };
}
