export type QariId = '01' | '02' | '03' | '04' | '05' | '06';

export interface QariOption {
  id: QariId;
  name: string;
  shortName: string;
  origin: string;
}

export const QARI_LIST: QariOption[] = [
  { id: '05', name: 'Misyari Rasyid Al-Afasi', shortName: 'Al-Afasi', origin: 'Kuwait' },
  { id: '03', name: 'Abdurrahman As-Sudais', shortName: 'As-Sudais', origin: 'Mekah' },
  { id: '01', name: 'Abdullah Al-Juhany', shortName: 'Al-Juhany', origin: 'Mekah' },
  { id: '02', name: 'Abdul Muhsin Al-Qasim', shortName: 'Al-Qasim', origin: 'Madinah' },
  { id: '04', name: 'Ibrahim Al-Dossari', shortName: 'Al-Dossari', origin: 'Riyadh' },
  { id: '06', name: 'Yasser Al-Dosari', shortName: 'Y. Al-Dosari', origin: 'Mekah' },
];

export type AudioMap = Record<QariId, string>;

export interface SurahSummary {
  nomor: number;
  nama: string;
  namaLatin: string;
  jumlahAyat: number;
  tempatTurun: 'Mekah' | 'Madinah' | string;
  arti: string;
  deskripsi: string;
  audioFull: AudioMap;
}

export interface Ayat {
  nomorAyat: number;
  teksArab: string;
  teksLatin: string;
  teksIndonesia: string;
  audio: AudioMap;
}

export interface SurahAdjacent {
  nomor: number;
  nama: string;
  namaLatin: string;
  jumlahAyat: number;
}

export interface SurahDetail extends SurahSummary {
  ayat: Ayat[];
  suratSelanjutnya: SurahAdjacent | false;
  suratSebelumnya: SurahAdjacent | false;
}

export interface BookmarkItem {
  id: string; // `${surahNumber}:${ayahNumber}`
  surahNumber: number;
  surahName: string;
  ayahNumber: number;
  teksArab: string;
  teksIndonesia: string;
  savedAt: number;
}

export interface LastReadState {
  surahNumber: number;
  surahName: string;
  ayahNumber: number;
  updatedAt: number;
}

export interface ReadingHistoryItem {
  id: string;
  surahNumber: number;
  surahName: string;
  ayahNumber: number;
  timestamp: number;
}

export interface ReaderPreferences {
  theme: 'light' | 'dark';
  qariId: QariId;
  arabicFontSize: number;
  latinFontSize: number;
  showLatin: boolean;
  showTranslation: boolean;
  showTajwid: boolean;
}

export type AudioMode = 'ayah' | 'surah';

export interface AudioState {
  active: boolean;
  isPlaying: boolean;
  isLoading: boolean;
  mode: AudioMode;
  surahNumber: number;
  surahName: string;
  totalAyahs: number;
  ayahNumber: number | null; // null when mode === 'surah'
  qariId: QariId;
  currentTime: number;
  duration: number;
  error: string | null;
}

export interface SearchResultItem {
  surahNumber: number;
  surahName: string;
  surahMeaning: string;
  ayahNumber: number;
  teksArab: string;
  teksLatin: string;
  teksIndonesia: string;
  matchedIn: ('arab' | 'latin' | 'terjemahan' | 'rujukan')[];
}
