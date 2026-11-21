import type { SearchResultItem, SurahDetail, SurahSummary } from '../types/quran';
import {
  getAllCachedSurahDetails,
  getCachedSurahDetail,
  getCachedSurahKeys,
  getCachedSurahList,
  saveSurahDetail,
  saveSurahList,
} from './quranDb';

const API_BASE = 'https://equran.id/api/v2';

interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}

export async function fetchSurahList(): Promise<SurahSummary[]> {
  const cached = await getCachedSurahList();
  if (cached && cached.length === 114) {
    // Refresh quietly in background when online
    if (typeof navigator === 'undefined' || navigator.onLine) {
      fetch(`${API_BASE}/surat`)
        .then((r) => (r.ok ? r.json() : null))
        .then((res: ApiResponse<SurahSummary[]> | null) => {
          if (res?.code === 200 && Array.isArray(res.data) && res.data.length === 114) {
            saveSurahList(res.data);
          }
        })
        .catch(() => {});
    }
    return cached;
  }

  const response = await fetch(`${API_BASE}/surat`);
  if (!response.ok) {
    throw new Error('Gagal memuat daftar surat Al-Qur\'an.');
  }
  const json = (await response.json()) as ApiResponse<SurahSummary[]>;
  if (json.code !== 200 || !Array.isArray(json.data)) {
    throw new Error('Format data daftar surat tidak valid.');
  }
  await saveSurahList(json.data);
  return json.data;
}

export async function fetchSurahDetail(nomor: number): Promise<SurahDetail> {
  const cached = await getCachedSurahDetail(nomor);
  if (cached && Array.isArray(cached.ayat) && cached.ayat.length > 0) {
    return cached;
  }

  const response = await fetch(`${API_BASE}/surat/${nomor}`);
  if (!response.ok) {
    throw new Error(`Gagal memuat Surat ke-${nomor}. Periksa koneksi internet Anda.`);
  }
  const json = (await response.json()) as ApiResponse<SurahDetail>;
  if (json.code !== 200 || !json.data) {
    throw new Error(`Data Surat ke-${nomor} tidak ditemukan.`);
  }
  await saveSurahDetail(json.data);
  return json.data;
}

export async function syncAllSurahs(
  onProgress?: (cachedCount: number, total: number) => void,
  signal?: AbortSignal,
): Promise<{ cachedCount: number; failed: number }> {
  const existingKeys = new Set(await getCachedSurahKeys());
  let completed = existingKeys.size;
  onProgress?.(completed, 114);

  const missing: number[] = [];
  for (let i = 1; i <= 114; i++) {
    if (!existingKeys.has(i)) missing.push(i);
  }

  if (missing.length === 0) {
    return { cachedCount: 114, failed: 0 };
  }

  let failed = 0;
  const CONCURRENCY = 6;
  let cursor = 0;

  async function worker() {
    while (cursor < missing.length) {
      if (signal?.aborted) return;
      const num = missing[cursor++];
      try {
        const resp = await fetch(`${API_BASE}/surat/${num}`, { signal });
        if (resp.ok) {
          const json = (await resp.json()) as ApiResponse<SurahDetail>;
          if (json.code === 200 && json.data) {
            await saveSurahDetail(json.data);
            completed++;
            onProgress?.(completed, 114);
          } else {
            failed++;
          }
        } else {
          failed++;
        }
      } catch (err) {
        if ((err as Error)?.name === 'AbortError') return;
        failed++;
      }
    }
  }

  const workers = Array.from({ length: Math.min(CONCURRENCY, missing.length) }, () => worker());
  await Promise.all(workers);

  const finalKeys = await getCachedSurahKeys();
  return { cachedCount: finalKeys.length, failed };
}

export function normalizeLatinText(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[‘’'`´-]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function normalizeArabicText(input: string): string {
  return input
    .replace(/[\u064B-\u065F\u0670\u06D6-\u06ED]/g, '')
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه')
    .trim();
}

export type SearchScope = 'all' | 'terjemahan' | 'latin' | 'arab';

export async function searchAyahs(
  rawQuery: string,
  surahList: SurahSummary[],
  scope: SearchScope = 'all',
  limit = 60,
): Promise<{
  directJump: { surah: SurahSummary; ayahNumber: number } | null;
  results: SearchResultItem[];
  searchedSurahCount: number;
}> {
  const query = rawQuery.trim();
  const cachedSurahs = await getAllCachedSurahDetails();
  const searchedSurahCount = cachedSurahs.length;

  if (!query) {
    return { directJump: null, results: [], searchedSurahCount };
  }

  // 1. Detect direct reference patterns: "2:255", "2 255", "Al-Baqarah 255", "Yasin:1"
  let directJump: { surah: SurahSummary; ayahNumber: number } | null = null;
  const colonMatch = query.match(/^(\d{1,3})\s*[:.]\s*(\d{1,3})$/);
  if (colonMatch) {
    const sNum = Number(colonMatch[1]);
    const aNum = Number(colonMatch[2]);
    const found = surahList.find((s) => s.nomor === sNum);
    if (found && aNum >= 1 && aNum <= found.jumlahAyat) {
      directJump = { surah: found, ayahNumber: aNum };
    }
  } else {
    const nameAyahMatch = query.match(/^([a-zA-Z\s'-]+?)[\s:]+(\d{1,3})$/);
    if (nameAyahMatch) {
      const namePart = normalizeLatinText(nameAyahMatch[1]);
      const aNum = Number(nameAyahMatch[2]);
      const found = surahList.find((s) => normalizeLatinText(s.namaLatin).includes(namePart));
      if (found && aNum >= 1 && aNum <= found.jumlahAyat) {
        directJump = { surah: found, ayahNumber: aNum };
      }
    }
  }

  const normLatinQuery = normalizeLatinText(query);
  const normArabicQuery = normalizeArabicText(query);
  const isArabicQuery = /[\u0600-\u06FF]/.test(query);

  const results: SearchResultItem[] = [];

  // If directJump is matched and that surah is cached, include it at the top
  if (directJump) {
    const detail = cachedSurahs.find((s) => s.nomor === directJump!.surah.nomor);
    const ayah = detail?.ayat.find((a) => a.nomorAyat === directJump!.ayahNumber);
    if (detail && ayah) {
      results.push({
        surahNumber: detail.nomor,
        surahName: detail.namaLatin,
        surahMeaning: detail.arti,
        ayahNumber: ayah.nomorAyat,
        teksArab: ayah.teksArab,
        teksLatin: ayah.teksLatin,
        teksIndonesia: ayah.teksIndonesia,
        matchedIn: ['rujukan'],
      });
    }
  }

  if (query.length < 2 && !directJump) {
    return { directJump, results, searchedSurahCount };
  }

  for (const surah of cachedSurahs) {
    for (const ayah of surah.ayat) {
      if (
        directJump &&
        surah.nomor === directJump.surah.nomor &&
        ayah.nomorAyat === directJump.ayahNumber
      ) {
        continue;
      }

      const matchedIn: SearchResultItem['matchedIn'] = [];

      if ((scope === 'all' || scope === 'terjemahan') && !isArabicQuery) {
        if (normalizeLatinText(ayah.teksIndonesia).includes(normLatinQuery)) {
          matchedIn.push('terjemahan');
        }
      }

      if ((scope === 'all' || scope === 'latin') && !isArabicQuery) {
        if (normalizeLatinText(ayah.teksLatin).includes(normLatinQuery)) {
          matchedIn.push('latin');
        }
      }

      if (scope === 'all' || scope === 'arab') {
        if (normArabicQuery && normalizeArabicText(ayah.teksArab).includes(normArabicQuery)) {
          matchedIn.push('arab');
        }
      }

      if (matchedIn.length > 0) {
        results.push({
          surahNumber: surah.nomor,
          surahName: surah.namaLatin,
          surahMeaning: surah.arti,
          ayahNumber: ayah.nomorAyat,
          teksArab: ayah.teksArab,
          teksLatin: ayah.teksLatin,
          teksIndonesia: ayah.teksIndonesia,
          matchedIn,
        });
        if (results.length >= limit) {
          return { directJump, results, searchedSurahCount };
        }
      }
    }
  }

  return { directJump, results, searchedSurahCount };
}

export function stripHtmlToText(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .trim();
}
