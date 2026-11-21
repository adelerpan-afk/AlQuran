import type {
  AudioMap,
  QariId,
  SearchResultItem,
  SurahDetail,
  SurahSummary,
} from '../types/quran';

interface RawCompactAyat {
  nomorAyat: number;
  teksArab: string;
  teksLatin: string;
  teksIndonesia: string;
}

interface RawCompactSurah {
  nomor: number;
  nama: string;
  namaLatin: string;
  jumlahAyat: number;
  tempatTurun: string;
  arti: string;
  deskripsi: string;
  ayat: RawCompactAyat[];
}

interface RawQuranDataset {
  version: number;
  source: string;
  totalSurah: number;
  totalAyat: number;
  audioFullBases: Record<QariId, string>;
  audioAyatBases: Record<QariId, string>;
  surahs: RawCompactSurah[];
}

interface LoadedDataset {
  summaries: SurahSummary[];
  detailsByNomor: Map<number, SurahDetail>;
  detailsList: SurahDetail[];
}

const QARI_IDS: QariId[] = ['01', '02', '03', '04', '05', '06'];

let datasetPromise: Promise<LoadedDataset> | null = null;

function buildAudioFull(bases: Record<QariId, string>, surahNomor: number): AudioMap {
  const pad3 = String(surahNomor).padStart(3, '0');
  const map = {} as AudioMap;
  for (const id of QARI_IDS) {
    map[id] = `${bases[id]}/${pad3}.mp3`;
  }
  return map;
}

function buildAudioAyat(
  bases: Record<QariId, string>,
  surahNomor: number,
  ayahNomor: number,
): AudioMap {
  const sPad = String(surahNomor).padStart(3, '0');
  const aPad = String(ayahNomor).padStart(3, '0');
  const map = {} as AudioMap;
  for (const id of QARI_IDS) {
    map[id] = `${bases[id]}/${sPad}${aPad}.mp3`;
  }
  return map;
}

async function loadLocalDataset(): Promise<LoadedDataset> {
  if (datasetPromise) return datasetPromise;

  datasetPromise = (async () => {
    const response = await fetch('/data/quran-full.json');
    if (!response.ok) {
      throw new Error('Gagal memuat bundel data Al-Qur\'an lokal.');
    }
    const raw = (await response.json()) as RawQuranDataset;
    if (!Array.isArray(raw.surahs) || raw.surahs.length === 0) {
      throw new Error('Format data Al-Qur\'an lokal tidak valid.');
    }

    const summaries: SurahSummary[] = raw.surahs.map((s) => ({
      nomor: s.nomor,
      nama: s.nama,
      namaLatin: s.namaLatin,
      jumlahAyat: s.jumlahAyat,
      tempatTurun: s.tempatTurun,
      arti: s.arti,
      deskripsi: s.deskripsi,
      audioFull: buildAudioFull(raw.audioFullBases, s.nomor),
    }));

    const detailsByNomor = new Map<number, SurahDetail>();
    const detailsList: SurahDetail[] = [];

    for (let i = 0; i < raw.surahs.length; i++) {
      const s = raw.surahs[i];
      const summary = summaries[i];
      const prev = i > 0 ? summaries[i - 1] : null;
      const next = i < summaries.length - 1 ? summaries[i + 1] : null;

      const detail: SurahDetail = {
        ...summary,
        ayat: s.ayat.map((a) => ({
          nomorAyat: a.nomorAyat,
          teksArab: a.teksArab,
          teksLatin: a.teksLatin,
          teksIndonesia: a.teksIndonesia,
          audio: buildAudioAyat(raw.audioAyatBases, s.nomor, a.nomorAyat),
        })),
        suratSebelumnya: prev
          ? {
              nomor: prev.nomor,
              nama: prev.nama,
              namaLatin: prev.namaLatin,
              jumlahAyat: prev.jumlahAyat,
            }
          : false,
        suratSelanjutnya: next
          ? {
              nomor: next.nomor,
              nama: next.nama,
              namaLatin: next.namaLatin,
              jumlahAyat: next.jumlahAyat,
            }
          : false,
      };

      detailsByNomor.set(s.nomor, detail);
      detailsList.push(detail);
    }

    return { summaries, detailsByNomor, detailsList };
  })().catch((err) => {
    datasetPromise = null;
    throw err;
  });

  return datasetPromise;
}

export async function fetchSurahList(): Promise<SurahSummary[]> {
  const ds = await loadLocalDataset();
  return ds.summaries;
}

export async function fetchSurahDetail(nomor: number): Promise<SurahDetail> {
  const ds = await loadLocalDataset();
  const detail = ds.detailsByNomor.get(nomor);
  if (!detail) {
    throw new Error(`Surat ke-${nomor} tidak ditemukan di bundel lokal.`);
  }
  return detail;
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
}> {
  const query = rawQuery.trim();
  if (!query) {
    return { directJump: null, results: [] };
  }

  const ds = await loadLocalDataset();

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

  if (directJump) {
    const detail = ds.detailsByNomor.get(directJump.surah.nomor);
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
    return { directJump, results };
  }

  for (const surah of ds.detailsList) {
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

      if ((scope === 'all' || scope === 'arab') && normArabicQuery) {
        if (normalizeArabicText(ayah.teksArab).includes(normArabicQuery)) {
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
          return { directJump, results };
        }
      }
    }
  }

  return { directJump, results };
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
