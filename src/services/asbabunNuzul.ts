import type { AsbabunNuzulEntry } from '../types/quran';

export type AsbabunNuzulMap = Record<string, AsbabunNuzulEntry>;

let cachePromise: Promise<AsbabunNuzulMap> | null = null;

export async function loadAsbabunNuzulMap(): Promise<AsbabunNuzulMap> {
  if (!cachePromise) {
    cachePromise = fetch('/data/asbabun-nuzul.json')
      .then((res) => {
        if (!res.ok) return {};
        return res.json() as Promise<AsbabunNuzulMap>;
      })
      .catch(() => ({}));
  }
  return cachePromise;
}

export function getAsbabunNuzulKey(surahNumber: number, ayahNumber: number): string {
  return `${surahNumber}:${ayahNumber}`;
}
