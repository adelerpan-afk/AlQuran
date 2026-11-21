import React, { useState } from 'react';
import { Download, Share, CheckCircle2, X } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface PWAInstallButtonProps {
  variant?: 'compact' | 'card';
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({ variant = 'card' }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  if (isInstalled) {
    if (variant === 'compact') return null;
    return (
      <div className="flex items-center gap-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 px-4 py-3 text-sm text-zinc-700 dark:text-zinc-300">
        <CheckCircle2 className="w-5 h-5 text-teal-700 dark:text-teal-400 shrink-0" />
        <span>Aplikasi sudah terpasang di perangkat Anda.</span>
      </div>
    );
  }

  if (isInstallable) {
    return (
      <button
        type="button"
        onClick={install}
        className={
          variant === 'compact'
            ? 'inline-flex items-center gap-1.5 min-h-[44px] px-3 text-xs font-semibold text-teal-700 dark:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-950/50 rounded-lg transition-colors whitespace-nowrap shrink-0'
            : 'w-full min-h-[48px] flex items-center justify-center gap-2 rounded-xl bg-teal-700 hover:bg-teal-800 dark:bg-teal-600 dark:hover:bg-teal-500 text-white font-medium text-sm px-4 py-2.5 transition-colors active:scale-[0.99]'
        }
      >
        <Download className="w-4 h-4 shrink-0" />
        <span>Instal Aplikasi</span>
      </button>
    );
  }

  if (isIOS) {
    return (
      <>
        <button
          type="button"
          onClick={() => setShowIOSGuide(true)}
          className={
            variant === 'compact'
              ? 'inline-flex items-center gap-1.5 min-h-[44px] px-3 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors whitespace-nowrap shrink-0'
              : 'w-full min-h-[48px] flex items-center justify-center gap-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-medium text-sm px-4 py-2.5 transition-colors'
          }
        >
          <Share className="w-4 h-4 shrink-0" />
          <span>Pasang di iPhone / iPad</span>
        </button>

        {showIOSGuide && (
          <div
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-xs p-4"
            onClick={() => setShowIOSGuide(false)}
          >
            <div
              className="w-full max-w-sm rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-5 shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                  Pasang di Layar Utama iOS
                </h3>
                <button
                  type="button"
                  onClick={() => setShowIOSGuide(false)}
                  aria-label="Tutup panduan"
                  className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <ol className="mt-3 space-y-2.5 text-sm text-zinc-600 dark:text-zinc-300 list-decimal list-inside leading-relaxed">
                <li>
                  Ketuk tombol <strong className="text-zinc-900 dark:text-zinc-100">Bagikan (Share)</strong> di bilah Safari.
                </li>
                <li>
                  Gulir ke bawah lalu pilih <strong className="text-zinc-900 dark:text-zinc-100">Tambahkan ke Layar Utama</strong>.
                </li>
                <li>
                  Ketuk <strong className="text-zinc-900 dark:text-zinc-100">Tambah</strong> untuk membuka aplikasi secara penuh dan offline.
                </li>
              </ol>
              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                className="mt-5 w-full min-h-[44px] rounded-xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-sm font-medium transition-colors"
              >
                Mengerti
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  if (variant === 'compact') return null;

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 px-4 py-3 text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
      Buka melalui Chrome / Edge di Android atau Safari di iOS lalu pilih menu browser{' '}
      <strong className="text-zinc-900 dark:text-zinc-200">Instal Aplikasi / Tambahkan ke Layar Utama</strong> untuk akses offline penuh.
    </div>
  );
};
