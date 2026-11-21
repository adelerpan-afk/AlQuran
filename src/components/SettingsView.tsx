import React from 'react';
import { Check, CheckCircle2, Moon, Sun } from 'lucide-react';
import { QARI_LIST, type QariId, type ReaderPreferences } from '../types/quran';
import { PWAInstallButton } from './PWAInstallButton';

interface SettingsViewProps {
  prefs: ReaderPreferences;
  onUpdatePrefs: (partial: Partial<ReaderPreferences>) => void;
  onSelectQari: (qariId: QariId) => void;
  compactMode?: boolean;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  prefs,
  onUpdatePrefs,
  onSelectQari,
  compactMode = false,
}) => {
  return (
    <div className="space-y-5">
      {/* Live Preview */}
      <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 space-y-3">
        <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
          Pratinjau Tampilan Baca
        </p>
        <p
          dir="rtl"
          className="font-arabic text-right text-zinc-900 dark:text-zinc-100 leading-[2.1]"
          style={{ fontSize: `${prefs.arabicFontSize}px` }}
        >
          بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
        </p>
        {prefs.showLatin && (
          <p
            className="italic text-teal-800 dark:text-teal-300 leading-relaxed"
            style={{ fontSize: `${prefs.latinFontSize}px` }}
          >
            Bismillāhir-raḥmānir-raḥīm(i).
          </p>
        )}
        {prefs.showTranslation && (
          <p
            className="text-zinc-700 dark:text-zinc-300 leading-relaxed"
            style={{ fontSize: `${prefs.latinFontSize}px` }}
          >
            Dengan nama Allah Yang Maha Pengasih lagi Maha Penyayang.
          </p>
        )}
      </div>

      {/* Theme Switcher */}
      <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 space-y-3">
        <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 block">
          Tema Tampilan
        </span>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => onUpdatePrefs({ theme: 'light' })}
            className={`min-h-[44px] flex items-center justify-center gap-2 rounded-xl border text-sm font-medium transition-colors ${
              prefs.theme === 'light'
                ? 'border-teal-700 bg-teal-50 text-teal-900 dark:bg-teal-950/50 dark:text-teal-200'
                : 'border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800'
            }`}
          >
            <Sun className="w-4 h-4" />
            <span>Terang</span>
          </button>
          <button
            type="button"
            onClick={() => onUpdatePrefs({ theme: 'dark' })}
            className={`min-h-[44px] flex items-center justify-center gap-2 rounded-xl border text-sm font-medium transition-colors ${
              prefs.theme === 'dark'
                ? 'border-teal-500 bg-teal-950/60 text-teal-200'
                : 'border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800'
            }`}
          >
            <Moon className="w-4 h-4" />
            <span>Gelap</span>
          </button>
        </div>
      </div>

      {/* Font & Text Toggles */}
      <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 space-y-4">
        <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 block">
          Teks & Ukuran Huruf
        </span>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <label htmlFor="arabic-size" className="font-medium text-zinc-700 dark:text-zinc-300">
              Ukuran Huruf Arab
            </label>
            <span className="tabular-nums text-zinc-500 dark:text-zinc-400">
              {prefs.arabicFontSize}px
            </span>
          </div>
          <input
            id="arabic-size"
            type="range"
            min={22}
            max={44}
            step={2}
            value={prefs.arabicFontSize}
            onChange={(e) => onUpdatePrefs({ arabicFontSize: Number(e.target.value) })}
            className="quran-range w-full h-6"
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <label htmlFor="latin-size" className="font-medium text-zinc-700 dark:text-zinc-300">
              Ukuran Latin & Terjemahan
            </label>
            <span className="tabular-nums text-zinc-500 dark:text-zinc-400">
              {prefs.latinFontSize}px
            </span>
          </div>
          <input
            id="latin-size"
            type="range"
            min={13}
            max={20}
            step={1}
            value={prefs.latinFontSize}
            onChange={(e) => onUpdatePrefs({ latinFontSize: Number(e.target.value) })}
            className="quran-range w-full h-6"
          />
        </div>

        <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 divide-y divide-zinc-100 dark:divide-zinc-800">
          <label className="flex items-center justify-between min-h-[48px] cursor-pointer">
            <span className="text-sm text-zinc-800 dark:text-zinc-200">
              Tampilkan Tulisan Latin
            </span>
            <input
              type="checkbox"
              checked={prefs.showLatin}
              onChange={(e) => onUpdatePrefs({ showLatin: e.target.checked })}
              className="w-5 h-5 accent-teal-700 dark:accent-teal-500 rounded cursor-pointer"
            />
          </label>
          <label className="flex items-center justify-between min-h-[48px] cursor-pointer">
            <span className="text-sm text-zinc-800 dark:text-zinc-200">
              Tampilkan Terjemahan Indonesia
            </span>
            <input
              type="checkbox"
              checked={prefs.showTranslation}
              onChange={(e) => onUpdatePrefs({ showTranslation: e.target.checked })}
              className="w-5 h-5 accent-teal-700 dark:accent-teal-500 rounded cursor-pointer"
            />
          </label>
        </div>
      </div>

      {/* Qari Selector */}
      <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 space-y-3">
        <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 block">
          Qari Murottal Pilihan
        </span>
        <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
          {QARI_LIST.map((qari) => {
            const selected = prefs.qariId === qari.id;
            return (
              <button
                key={qari.id}
                type="button"
                onClick={() => onSelectQari(qari.id)}
                className="w-full min-h-[48px] py-2 flex items-center justify-between gap-3 text-left hover:bg-zinc-50 dark:hover:bg-zinc-800/50 rounded-lg px-2 transition-colors"
              >
                <div className="min-w-0">
                  <p
                    className={`text-sm truncate ${
                      selected
                        ? 'font-semibold text-teal-700 dark:text-teal-400'
                        : 'font-medium text-zinc-800 dark:text-zinc-200'
                    }`}
                  >
                    {qari.name}
                  </p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">{qari.origin}</p>
                </div>
                {selected && <Check className="w-4 h-4 text-teal-700 dark:text-teal-400 shrink-0" />}
              </button>
            );
          })}
        </div>
      </div>

      {!compactMode && (
        <>
          {/* Local Dataset Info */}
          <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                Data Al-Qur&apos;an Offline
              </span>
              <span className="inline-flex items-center gap-1.5 text-xs font-medium tabular-nums text-teal-700 dark:text-teal-400">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>114 Surat · 6.236 Ayat</span>
              </span>
            </div>
            <p className="text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
              Seluruh teks Arab, tulisan Latin, dan terjemahan bahasa Indonesia tersimpan lokal di dalam aplikasi dan siap dibaca maupun dicari tanpa koneksi internet. Audio murottal diputar melalui jaringan dan tersimpan otomatis di cache setelah diputar.
            </p>
          </div>

          {/* PWA Install Section */}
          <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 space-y-3">
            <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 block">
              Instal Aplikasi (PWA)
            </span>
            <p className="text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
              Pasang Al-Qur&apos;an Digital ke layar utama ponsel untuk membuka lebih cepat dalam tampilan layar penuh.
            </p>
            <PWAInstallButton variant="card" />
          </div>
        </>
      )}
    </div>
  );
};
