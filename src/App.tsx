import { useCallback, useEffect, useState } from 'react';
import { BookOpen, History, Info, Maximize2, Moon, Search, Settings, Sun } from 'lucide-react';
import { registerSW } from 'virtual:pwa-register';
import { AboutView } from './components/AboutView';
import { AudioMiniPlayer } from './components/AudioMiniPlayer';
import { BookmarksView } from './components/BookmarksView';
import { FullScreenAyahOverlay } from './components/FullScreenAyahOverlay';
import { OfflineIndicator } from './components/OfflineIndicator';
import { PWAInstallButton } from './components/PWAInstallButton';
import { SearchView } from './components/SearchView';
import { SettingsView } from './components/SettingsView';
import { SurahListView } from './components/SurahListView';
import { SurahReaderView } from './components/SurahReaderView';
import { TajwidGuideModal } from './components/TajwidGuideModal';
import { WelcomeScreen } from './components/WelcomeScreen';
import { useAudioPlayer } from './hooks/useAudioPlayer';
import { useQuranStore } from './hooks/useQuranStore';
import { fetchSurahDetail, fetchSurahList } from './services/quranApi';
import type { QariId, SurahDetail, SurahSummary } from './types/quran';

type TabKey = 'surat' | 'cari' | 'tersimpan' | 'pengaturan' | 'tentang';

export default function App() {
  const {
    prefs,
    updatePrefs,
    toggleTheme,
    setQariId,
    bookmarks,
    toggleBookmark,
    removeBookmark,
    isBookmarked,
    lastRead,
    markLastRead,
    pushHistory,
    readingHistory,
    removeHistoryItem,
    clearHistory,
  } = useQuranStore();

  const {
    audioState,
    playAyah,
    playSurahFull,
    togglePlayPause,
    stop,
    seek,
    nextAyah,
    prevAyah,
    switchQari,
    cycleRepeatMode,
  } = useAudioPlayer(prefs.qariId);

  const [hasEntered, setHasEntered] = useState(false);
  const [showTajwidGuide, setShowTajwidGuide] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>('surat');
  const [mobileReading, setMobileReading] = useState(false);

  const [surahList, setSurahList] = useState<SurahSummary[]>([]);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);

  const [selectedSurahNumber, setSelectedSurahNumber] = useState<number>(
    () => lastRead?.surahNumber ?? 1,
  );
  const [focusAyahNumber, setFocusAyahNumber] = useState<number | null>(
    () => lastRead?.ayahNumber ?? null,
  );
  const [focusNonce, setFocusNonce] = useState(0);
  const [activeSurah, setActiveSurah] = useState<SurahDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(true);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [readerSelectedAyah, setReaderSelectedAyah] = useState<number | null>(
    () => lastRead?.ayahNumber ?? null,
  );
  const [fullScreenOpen, setFullScreenOpen] = useState(false);
  const [fullScreenAyah, setFullScreenAyah] = useState(1);

  useEffect(() => {
    if (import.meta.env.DEV) {
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker
          .getRegistrations()
          .then((regs) => {
            regs.forEach((reg) => {
              const url =
                reg.active?.scriptURL || reg.installing?.scriptURL || reg.waiting?.scriptURL || '';
              if (url.includes('dev-sw.js')) {
                reg.unregister();
              }
            });
          })
          .catch(() => {});
      }
      return;
    }
    try {
      registerSW({ immediate: true });
    } catch {
      // Ignore registration issues in unsupported environments
    }
  }, []);

  const loadSurahList = useCallback(async () => {
    setListLoading(true);
    setListError(null);
    try {
      const list = await fetchSurahList();
      setSurahList(list);
    } catch (err) {
      setListError(err instanceof Error ? err.message : 'Gagal memuat daftar surat.');
    } finally {
      setListLoading(false);
    }
  }, []);

  const loadSurahDetail = useCallback(async (nomor: number) => {
    setDetailLoading(true);
    setDetailError(null);
    try {
      const detail = await fetchSurahDetail(nomor);
      setActiveSurah(detail);
    } catch (err) {
      setDetailError(err instanceof Error ? err.message : 'Gagal memuat isi surat.');
    } finally {
      setDetailLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSurahList();
  }, [loadSurahList]);

  useEffect(() => {
    loadSurahDetail(selectedSurahNumber);
  }, [selectedSurahNumber, loadSurahDetail]);

  const handleOpenSurah = useCallback(
    (nomor: number, ayahNumber?: number) => {
      setSelectedSurahNumber(nomor);
      setFocusAyahNumber(ayahNumber ?? null);
      setFocusNonce((n) => n + 1);
      setMobileReading(true);
      setActiveTab('surat');

      const matchedSurah = surahList.find((s) => s.nomor === nomor);
      if (matchedSurah) {
        pushHistory(nomor, matchedSurah.namaLatin, ayahNumber ?? 1);
      }

      if (!ayahNumber) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    },
    [pushHistory, surahList],
  );

  const handlePlaySearchResult = useCallback(
    async (surahNumber: number, ayahNumber: number) => {
      try {
        const detail = await fetchSurahDetail(surahNumber);
        setSelectedSurahNumber(surahNumber);
        setActiveSurah(detail);
        setFocusAyahNumber(ayahNumber);
        setFocusNonce((n) => n + 1);
        pushHistory(surahNumber, detail.namaLatin, ayahNumber);
        playAyah(detail, ayahNumber, prefs.qariId);
      } catch {
        handleOpenSurah(surahNumber, ayahNumber);
      }
    },
    [handleOpenSurah, playAyah, prefs.qariId, pushHistory],
  );

  const handleSelectQari = useCallback(
    (qariId: QariId) => {
      setQariId(qariId);
      switchQari(qariId);
    },
    [setQariId, switchQari],
  );

  // Keep Full Screen ayah synced automatically with active audio playback
  useEffect(() => {
    if (
      fullScreenOpen &&
      activeSurah &&
      audioState.active &&
      audioState.surahNumber === activeSurah.nomor &&
      audioState.ayahNumber
    ) {
      setFullScreenAyah(audioState.ayahNumber);
    }
  }, [
    fullScreenOpen,
    activeSurah?.nomor,
    audioState.active,
    audioState.surahNumber,
    audioState.ayahNumber,
  ]);

  const handleOpenFullScreenManual = useCallback(() => {
    if (!activeSurah) return;
    let targetAyah = 1;
    if (
      audioState.active &&
      audioState.surahNumber === activeSurah.nomor &&
      audioState.ayahNumber
    ) {
      targetAyah = audioState.ayahNumber;
    } else if (readerSelectedAyah) {
      targetAyah = Math.min(Math.max(readerSelectedAyah, 1), activeSurah.jumlahAyat);
    } else if (lastRead?.surahNumber === activeSurah.nomor) {
      targetAyah = Math.min(Math.max(lastRead.ayahNumber, 1), activeSurah.jumlahAyat);
    }
    setFullScreenAyah(targetAyah);
    setFullScreenOpen(true);
  }, [
    activeSurah,
    audioState.active,
    audioState.surahNumber,
    audioState.ayahNumber,
    readerSelectedAyah,
    lastRead,
  ]);

  const handlePlaySurahFullScreen = useCallback(
    (surah: SurahDetail) => {
      const isAlreadySurahMode =
        audioState.active &&
        audioState.mode === 'surah' &&
        audioState.surahNumber === surah.nomor;
      if (isAlreadySurahMode) {
        setFullScreenAyah(audioState.ayahNumber ?? 1);
        setFullScreenOpen(true);
        if (!audioState.isPlaying) {
          togglePlayPause();
        }
        return;
      }
      playSurahFull(surah, prefs.qariId);
      setFullScreenAyah(1);
      setFullScreenOpen(true);
    },
    [
      audioState.active,
      audioState.mode,
      audioState.surahNumber,
      audioState.ayahNumber,
      audioState.isPlaying,
      playSurahFull,
      prefs.qariId,
      togglePlayPause,
    ],
  );

  if (!hasEntered) {
    return (
      <WelcomeScreen
        theme={prefs.theme}
        lastRead={lastRead}
        onToggleTheme={toggleTheme}
        onEnter={() => setHasEntered(true)}
        onResumeLastRead={(surahNum, ayahNum) => {
          setHasEntered(true);
          handleOpenSurah(surahNum, ayahNum);
        }}
      />
    );
  }

  const navItems: { key: TabKey; label: string; icon: typeof BookOpen }[] = [
    { key: 'surat', label: 'Surat', icon: BookOpen },
    { key: 'cari', label: 'Cari', icon: Search },
    { key: 'tersimpan', label: 'Riwayat', icon: History },
    { key: 'pengaturan', label: 'Setelan', icon: Settings },
    { key: 'tentang', label: 'Tentang', icon: Info },
  ];

  const renderSidebarPanel = () => {
    switch (activeTab) {
      case 'surat':
        return (
          <SurahListView
            surahList={surahList}
            loading={listLoading}
            error={listError}
            activeSurahNumber={selectedSurahNumber}
            lastRead={lastRead}
            onSelectSurah={handleOpenSurah}
            onRetry={loadSurahList}
          />
        );
      case 'cari':
        return (
          <SearchView
            surahList={surahList}
            onOpenAyah={handleOpenSurah}
            onPlaySearchResult={handlePlaySearchResult}
          />
        );
      case 'tersimpan':
        return (
          <BookmarksView
            lastRead={lastRead}
            bookmarks={bookmarks}
            readingHistory={readingHistory}
            onOpenAyah={handleOpenSurah}
            onRemoveBookmark={removeBookmark}
            onRemoveHistory={removeHistoryItem}
            onClearHistory={clearHistory}
          />
        );
      case 'pengaturan':
        return (
          <SettingsView
            prefs={prefs}
            onUpdatePrefs={updatePrefs}
            onSelectQari={handleSelectQari}
            onOpenTajwidGuide={() => setShowTajwidGuide(true)}
          />
        );
      case 'tentang':
        return <AboutView />;
    }
  };

  return (
    <div className="min-h-dvh flex flex-col bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
      <OfflineIndicator />

      <header className="sticky top-0 z-30 h-12 lg:h-15 bg-white/90 dark:bg-zinc-950/90 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800">
        <div className="max-w-7xl mx-auto h-full px-3.5 sm:px-6 flex items-center justify-between gap-4 sm:gap-8">
          <button
            type="button"
            onClick={() => {
              setMobileReading(false);
              setActiveTab('surat');
            }}
            className="text-base sm:text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-100 whitespace-nowrap shrink-0 text-left"
          >
            Al-Qur&apos;an Jariyah
          </button>

          <nav className="hidden lg:flex items-center gap-6">
            {navItems.map((item) => {
              const active = activeTab === item.key;
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setActiveTab(item.key)}
                  className={`py-1.5 text-sm font-medium transition-colors whitespace-nowrap shrink-0 border-b-2 ${
                    active
                      ? 'border-teal-700 dark:border-teal-400 text-zinc-900 dark:text-zinc-100'
                      : 'border-transparent text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>

          <div className="flex items-center gap-1 shrink-0">
            <PWAInstallButton variant="compact" />
            <button
              type="button"
              onClick={handleOpenFullScreenManual}
              disabled={!activeSurah}
              aria-label="Mode baca satu ayat layar penuh"
              title="Baca layar penuh (1 ayat)"
              className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-300 hover:border-teal-600/50 hover:text-teal-700 dark:hover:text-teal-300 disabled:opacity-40 transition-colors"
            >
              <Maximize2 className="w-[18px] h-[18px]" />
            </button>
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={prefs.theme === 'dark' ? 'Aktifkan mode terang' : 'Aktifkan mode gelap'}
              className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              {prefs.theme === 'dark' ? (
                <Sun className="w-5 h-5" />
              ) : (
                <Moon className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      </header>

      <main
        className={`flex-1 w-full max-w-7xl mx-auto px-3.5 sm:px-6 pt-3.5 sm:pt-6 ${
          audioState.active ? 'pb-48 lg:pb-28' : 'pb-24 lg:pb-12'
        }`}
      >
        <div className="lg:hidden max-w-2xl mx-auto">
          {mobileReading && activeTab === 'surat' ? (
            <SurahReaderView
              surah={activeSurah}
              loading={detailLoading}
              error={detailError}
              focusAyahNumber={focusAyahNumber}
              focusNonce={focusNonce}
              prefs={prefs}
              audioState={audioState}
              isBookmarked={isBookmarked}
              lastReadAyah={
                lastRead?.surahNumber === selectedSurahNumber ? lastRead.ayahNumber : null
              }
              onBack={() => setMobileReading(false)}
              onSelectSurah={(num) => handleOpenSurah(num)}
              onRetry={() => loadSurahDetail(selectedSurahNumber)}
              onPlayAyah={(s, a) => playAyah(s, a, prefs.qariId)}
              onPlaySurahFull={(s) => playSurahFull(s, prefs.qariId)}
              onPlaySurahFullScreen={handlePlaySurahFullScreen}
              onTogglePlayPause={togglePlayPause}
              onSelectQari={handleSelectQari}
              onUpdatePrefs={updatePrefs}
              onToggleBookmark={toggleBookmark}
              onMarkLastRead={markLastRead}
              onSelectedAyahChange={setReaderSelectedAyah}
            />
          ) : (
            renderSidebarPanel()
          )}
        </div>

        <div className="hidden lg:grid lg:grid-cols-[380px_1fr] lg:gap-8 lg:items-start">
          <aside className="sticky top-21 max-h-[calc(100vh-6.5rem)] overflow-y-auto pr-1 pb-6">
            {renderSidebarPanel()}
          </aside>

          <section aria-label="Area Baca Al-Qur'an">
            <SurahReaderView
              surah={activeSurah}
              loading={detailLoading}
              error={detailError}
              focusAyahNumber={focusAyahNumber}
              focusNonce={focusNonce}
              prefs={prefs}
              audioState={audioState}
              isBookmarked={isBookmarked}
              lastReadAyah={
                lastRead?.surahNumber === selectedSurahNumber ? lastRead.ayahNumber : null
              }
              onSelectSurah={(num) => handleOpenSurah(num)}
              onRetry={() => loadSurahDetail(selectedSurahNumber)}
              onPlayAyah={(s, a) => playAyah(s, a, prefs.qariId)}
              onPlaySurahFull={(s) => playSurahFull(s, prefs.qariId)}
              onPlaySurahFullScreen={handlePlaySurahFullScreen}
              onTogglePlayPause={togglePlayPause}
              onSelectQari={handleSelectQari}
              onUpdatePrefs={updatePrefs}
              onToggleBookmark={toggleBookmark}
              onMarkLastRead={markLastRead}
              onSelectedAyahChange={setReaderSelectedAyah}
            />
          </section>
        </div>
      </main>

      {!fullScreenOpen && (
        <AudioMiniPlayer
          audioState={audioState}
          onTogglePlayPause={togglePlayPause}
          onStop={stop}
          onSeek={seek}
          onNextAyah={nextAyah}
          onPrevAyah={prevAyah}
          onSwitchQari={handleSelectQari}
          onCycleRepeat={cycleRepeatMode}
        />
      )}

      <FullScreenAyahOverlay
        open={fullScreenOpen}
        surah={activeSurah}
        ayahNumber={fullScreenAyah}
        prefs={prefs}
        audioState={audioState}
        onClose={() => setFullScreenOpen(false)}
        onNextAyah={() => {
          if (!activeSurah) return;
          if (audioState.active && audioState.surahNumber === activeSurah.nomor) {
            nextAyah();
          } else {
            setFullScreenAyah((prev) => Math.min(prev + 1, activeSurah.jumlahAyat));
          }
        }}
        onPrevAyah={() => {
          if (!activeSurah) return;
          if (audioState.active && audioState.surahNumber === activeSurah.nomor) {
            prevAyah();
          } else {
            setFullScreenAyah((prev) => Math.max(prev - 1, 1));
          }
        }}
        onTogglePlayPause={togglePlayPause}
        onPlayAyah={(s, a) => playAyah(s, a, prefs.qariId)}
        onCycleRepeat={cycleRepeatMode}
      />

      <TajwidGuideModal
        open={showTajwidGuide}
        tajwidEnabled={prefs.showTajwid}
        onToggleTajwid={(enabled) => updatePrefs({ showTajwid: enabled })}
        onClose={() => setShowTajwidGuide(false)}
      />

      <nav
        aria-label="Navigasi Utama"
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-md border-t border-zinc-200 dark:border-zinc-800 pb-safe"
      >
        <div className="grid grid-cols-5 h-[52px] max-w-2xl mx-auto items-center">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = activeTab === item.key;
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => {
                  if (item.key === 'surat' && activeTab === 'surat') {
                    setMobileReading(false);
                  } else {
                    setActiveTab(item.key);
                  }
                }}
                className={`h-full min-h-[44px] flex flex-col items-center justify-center gap-0.5 transition-colors ${
                  active
                    ? 'text-teal-700 dark:text-teal-400'
                    : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200'
                }`}
              >
                <Icon className={`w-[19px] h-[19px] ${active ? 'stroke-[2.2]' : 'stroke-[1.8]'}`} />
                <span className="text-[10px] font-medium tracking-tight leading-none whitespace-nowrap">
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
