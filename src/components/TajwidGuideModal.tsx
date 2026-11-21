import React from 'react';
import { X } from 'lucide-react';
import { TAJWID_RULES } from '../utils/tajwid';
import { TajwidText } from './TajwidText';

interface TajwidGuideModalProps {
  open: boolean;
  tajwidEnabled: boolean;
  onToggleTajwid: (enabled: boolean) => void;
  onClose: () => void;
}

export const TajwidGuideModal: React.FC<TajwidGuideModalProps> = ({
  open,
  tajwidEnabled,
  onToggleTajwid,
  onClose,
}) => {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-xs p-0 sm:p-4"
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-lg rounded-t-3xl sm:rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 max-h-[86vh] flex flex-col shadow-xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 pt-4 pb-3 border-b border-zinc-100 dark:border-zinc-800 shrink-0">
          <div className="w-10 h-1.5 bg-zinc-300 dark:bg-zinc-700 rounded-full mx-auto mb-3 sm:hidden" />
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-zinc-100">
                Panduan Tajwid Warna Khusus
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Kode warna hukum bacaan untuk membantu ketepatan makhraj & dengung
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Tutup panduan tajwid"
              className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <label className="mt-3 flex items-center justify-between rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/70 dark:border-zinc-700/70 px-3.5 py-2.5 cursor-pointer">
            <span className="text-xs sm:text-sm font-medium text-zinc-800 dark:text-zinc-200">
              Aktifkan Warna Tajwid pada Ayat
            </span>
            <input
              type="checkbox"
              checked={tajwidEnabled}
              onChange={(e) => onToggleTajwid(e.target.checked)}
              className="w-5 h-5 accent-teal-700 dark:accent-teal-500 rounded cursor-pointer"
            />
          </label>
        </div>

        <div className="overflow-y-auto p-5 divide-y divide-zinc-100 dark:divide-zinc-800 space-y-4">
          {TAJWID_RULES.map((rule, index) => (
            <div key={rule.id} className={index > 0 ? 'pt-4 space-y-2' : 'space-y-2'}>
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <span
                    className={`w-3.5 h-3.5 rounded-sm shrink-0 ${rule.swatchClass}`}
                    aria-hidden="true"
                  />
                  <h3 className={`text-sm font-semibold ${rule.colorClass}`}>{rule.name}</h3>
                </div>
                <span className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
                  {rule.duration}
                </span>
              </div>

              <p className="text-xs leading-relaxed text-zinc-600 dark:text-zinc-300">
                {rule.description}
              </p>

              <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs">
                <span className="text-zinc-500 dark:text-zinc-400">
                  Huruf:{' '}
                  <span dir="rtl" className="font-arabic text-base text-zinc-800 dark:text-zinc-200">
                    {rule.letters}
                  </span>
                </span>
                <div className="text-right">
                  <span
                    dir="rtl"
                    className="font-arabic text-xl text-zinc-900 dark:text-zinc-100 block"
                  >
                    <TajwidText text={rule.example} enabled />
                  </span>
                  <span className="text-[11px] italic text-zinc-500 dark:text-zinc-400">
                    {rule.exampleNote}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
