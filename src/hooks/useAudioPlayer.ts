import { useCallback, useEffect, useRef, useState } from 'react';
import type { AudioState, QariId, SurahDetail } from '../types/quran';

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
  error: null,
};

export function useAudioPlayer(defaultQariId: QariId) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const surahRef = useRef<SurahDetail | null>(null);
  const stateRef = useRef<AudioState>({ ...INITIAL_STATE, qariId: defaultQariId });

  const [state, setState] = useState<AudioState>(() => ({
    ...INITIAL_STATE,
    qariId: defaultQariId,
  }));

  const updateState = useCallback((updater: Partial<AudioState> | ((prev: AudioState) => AudioState)) => {
    setState((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : { ...prev, ...updater };
      stateRef.current = next;
      return next;
    });
  }, []);

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

  const playAyah = useCallback(
    (surah: SurahDetail, ayahNumber: number, qariOverride?: QariId) => {
      surahRef.current = surah;
      const qari = qariOverride ?? stateRef.current.qariId ?? defaultQariId;
      const targetAyah = surah.ayat.find((a) => a.nomorAyat === ayahNumber);
      if (!targetAyah) return;

      const url = targetAyah.audio[qari] || Object.values(targetAyah.audio)[0];
      if (!url) return;

      playUrl(url, {
        mode: 'ayah',
        surahNumber: surah.nomor,
        surahName: surah.namaLatin,
        totalAyahs: surah.jumlahAyat,
        ayahNumber,
        qariId: qari,
      });
    },
    [defaultQariId, playUrl],
  );

  const playSurahFull = useCallback(
    (surah: SurahDetail, qariOverride?: QariId) => {
      surahRef.current = surah;
      const qari = qariOverride ?? stateRef.current.qariId ?? defaultQariId;
      const url = surah.audioFull[qari] || Object.values(surah.audioFull)[0];
      if (!url) return;

      playUrl(url, {
        mode: 'surah',
        surahNumber: surah.nomor,
        surahName: surah.namaLatin,
        totalAyahs: surah.jumlahAyat,
        ayahNumber: null,
        qariId: qari,
      });
    },
    [defaultQariId, playUrl],
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
    updateState({ ...INITIAL_STATE, qariId: stateRef.current.qariId });
  }, [updateState]);

  const seek = useCallback((time: number) => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = Math.max(0, Math.min(time, audioRef.current.duration || 0));
    updateState({ currentTime: audioRef.current.currentTime });
  }, [updateState]);

  const nextAyah = useCallback(() => {
    const s = stateRef.current;
    const surah = surahRef.current;
    if (!surah || s.mode !== 'ayah' || s.ayahNumber === null) return;
    if (s.ayahNumber < surah.jumlahAyat) {
      playAyah(surah, s.ayahNumber + 1, s.qariId);
    }
  }, [playAyah]);

  const prevAyah = useCallback(() => {
    const s = stateRef.current;
    const surah = surahRef.current;
    if (!surah || s.mode !== 'ayah' || s.ayahNumber === null) return;
    if (s.ayahNumber > 1) {
      playAyah(surah, s.ayahNumber - 1, s.qariId);
    }
  }, [playAyah]);

  const switchQari = useCallback(
    (newQariId: QariId) => {
      const s = stateRef.current;
      const surah = surahRef.current;
      updateState({ qariId: newQariId });
      if (!s.active || !surah) return;
      if (s.mode === 'surah') {
        playSurahFull(surah, newQariId);
      } else if (s.ayahNumber !== null) {
        playAyah(surah, s.ayahNumber, newQariId);
      }
    },
    [playAyah, playSurahFull, updateState],
  );

  // Wire HTMLAudioElement lifecycle listeners once
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
      if (s.mode === 'ayah' && surah && s.ayahNumber !== null && s.ayahNumber < surah.jumlahAyat) {
        playAyah(surah, s.ayahNumber + 1, s.qariId);
      } else {
        updateState({ isPlaying: false, currentTime: 0 });
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
  }, [playAyah, updateState]);

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
  };
}
