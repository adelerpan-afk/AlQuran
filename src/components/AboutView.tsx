import React, { useState } from 'react';
import { CheckCircle2, Mail, Send, ShieldCheck, User } from 'lucide-react';

const FEEDBACK_EMAIL = 'prasitama.games@gmail.com';
const FORMSUBMIT_AJAX_URL = `https://formsubmit.co/ajax/${FEEDBACK_EMAIL}`;

export const AboutView: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [category, setCategory] = useState('Kritik & Saran');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState('');

  const buildMailtoHref = () => {
    const subject = encodeURIComponent(`[Al-Qur'an Jariyah] ${category}`);
    const body = encodeURIComponent(
      `Nama: ${name || '-'}\nEmail: ${email || '-'}\n\nPesan:\n${message || ''}`,
    );
    return `mailto:${FEEDBACK_EMAIL}?subject=${subject}&body=${body}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedMessage = message.trim();
    if (!trimmedMessage) {
      setSubmitStatus('error');
      setStatusMessage('Mohon tuliskan kritik atau saran Anda terlebih dahulu.');
      return;
    }

    setSubmitting(true);
    setSubmitStatus('idle');
    setStatusMessage('');

    try {
      const response = await fetch(FORMSUBMIT_AJAX_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          name: name.trim() || 'Pengguna Al-Qur\'an Jariyah',
          email: email.trim() || 'tidak-disertakan@pengguna.local',
          kategori: category,
          message: trimmedMessage,
          _subject: `[Al-Qur'an Jariyah] ${category} dari ${name.trim() || 'Pengguna'}`,
          _template: 'table',
        }),
      });

      const result = (await response.json().catch(() => ({}))) as {
        success?: string | boolean;
        message?: string;
      };

      if (response.ok && (result.success === 'true' || result.success === true || !result.message)) {
        setSubmitStatus('success');
        setStatusMessage(
          `Terima kasih! Masukan Anda telah dikirim ke ${FEEDBACK_EMAIL}.`,
        );
        setMessage('');
      } else {
        setSubmitStatus('error');
        setStatusMessage(
          result.message ||
            `Gagal mengirim langsung. Anda dapat menggunakan tombol "Kirim via Email" di bawah.`,
        );
      }
    } catch {
      setSubmitStatus('error');
      setStatusMessage(
        'Tidak dapat terhubung ke server formulir (kemungkinan perangkat sedang offline). Silakan gunakan tombol "Kirim via Email".',
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* App & Verified Data Source Card */}
      <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
              Al-Qur&apos;an Jariyah
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Mushaf Digital Mobile & PWA Offline
            </p>
          </div>
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-teal-700 dark:text-teal-400 shrink-0">
            <ShieldCheck className="w-4 h-4" />
            <span>Data Terverifikasi</span>
          </span>
        </div>

        <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800 space-y-3 text-xs sm:text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">
          <div>
            <p className="font-semibold text-zinc-900 dark:text-zinc-100">
              Sumber Data Al-Qur&apos;an & Terjemahan
            </p>
            <p className="mt-1">
              Teks Arab (Rasm Utsmani / Mushaf Standar Indonesia), transliterasi huruf Latin, dan terjemahan bahasa Indonesia bersumber dari{' '}
              <strong className="text-zinc-900 dark:text-zinc-100">
                Lajnah Pentashihan Mushaf Al-Qur&apos;an (LPMQ) Kementerian Agama Republik Indonesia
              </strong>{' '}
              —{' '}
              <strong className="text-zinc-900 dark:text-zinc-100">
                Terjemahan Al-Qur&apos;an Edisi Penyempurnaan 2019
              </strong>{' '}
              (referensi resmi <span className="font-medium">quran.kemenag.go.id</span>) melalui bundel data terbuka terverifikasi <span className="font-medium">EQuran.id v2</span>.
            </p>
          </div>

          <div className="rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/70 dark:border-zinc-800 p-3 flex items-center justify-between gap-2 text-xs">
            <span className="text-zinc-600 dark:text-zinc-300">Kelengkapan Bundel Lokal</span>
            <span className="font-semibold tabular-nums text-teal-700 dark:text-teal-400">
              114 Surat · 30 Juz · 6.236 Ayat
            </span>
          </div>
        </div>
      </div>

      {/* Developer Profile */}
      <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-400 flex items-center justify-center shrink-0">
          <User className="w-6 h-6" />
        </div>
        <div className="min-w-0">
          <p className="text-xs text-zinc-500 dark:text-zinc-400">Pengembang</p>
          <p className="text-base font-bold text-zinc-900 dark:text-zinc-100">Prasitama</p>
          <p className="text-xs text-teal-700 dark:text-teal-400 truncate">{FEEDBACK_EMAIL}</p>
        </div>
      </div>

      {/* Feedback Form */}
      <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 space-y-4">
        <div>
          <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
            Kritik & Saran
          </h3>
          <p className="mt-0.5 text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
            Sampaikan masukan, koreksi bacaan, atau usulan fitur langsung ke{' '}
            <span className="font-medium text-zinc-700 dark:text-zinc-300">{FEEDBACK_EMAIL}</span>.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div className="space-y-1.5">
            <label
              htmlFor="feedback-name"
              className="text-xs font-medium text-zinc-700 dark:text-zinc-300 block"
            >
              Nama Anda
            </label>
            <input
              id="feedback-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Contoh: Ahmad"
              className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-teal-600/30 focus:border-teal-600"
            />
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="feedback-email"
              className="text-xs font-medium text-zinc-700 dark:text-zinc-300 block"
            >
              Email Anda (opsional, untuk balasan)
            </label>
            <input
              id="feedback-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nama@email.com"
              className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-teal-600/30 focus:border-teal-600"
            />
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="feedback-category"
              className="text-xs font-medium text-zinc-700 dark:text-zinc-300 block"
            >
              Kategori
            </label>
            <select
              id="feedback-category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-teal-600/30 focus:border-teal-600"
            >
              <option value="Kritik & Saran">Kritik & Saran</option>
              <option value="Laporan Kesalahan Ayat/Terjemahan">
                Laporan Kesalahan Ayat / Terjemahan
              </option>
              <option value="Usulan Fitur">Usulan Fitur Baru</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="feedback-message"
              className="text-xs font-medium text-zinc-700 dark:text-zinc-300 block"
            >
              Pesan
            </label>
            <textarea
              id="feedback-message"
              rows={4}
              required
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Tuliskan kritik, saran, atau pesan Anda di sini..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-teal-600/30 focus:border-teal-600 resize-y"
            />
          </div>

          {submitStatus === 'success' && (
            <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-900/60 px-3.5 py-2.5 text-xs text-emerald-800 dark:text-emerald-200 flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{statusMessage}</span>
            </div>
          )}

          {submitStatus === 'error' && (
            <div className="rounded-xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-900/60 px-3.5 py-2.5 text-xs text-amber-900 dark:text-amber-200">
              {statusMessage}
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 min-h-[46px] px-4 py-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 disabled:opacity-60 dark:bg-teal-600 dark:hover:bg-teal-500 text-white text-sm font-semibold inline-flex items-center justify-center gap-2 transition-colors"
            >
              <Send className="w-4 h-4" />
              <span>{submitting ? 'Mengirim...' : 'Kirim Kritik & Saran'}</span>
            </button>

            <a
              href={buildMailtoHref()}
              className="min-h-[46px] px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-200 text-sm font-medium inline-flex items-center justify-center gap-2 transition-colors"
            >
              <Mail className="w-4 h-4" />
              <span>Buka Email</span>
            </a>
          </div>
        </form>
      </div>
    </div>
  );
};
