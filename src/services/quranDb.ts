import type { SurahDetail, SurahSummary } from '../types/quran';

const DB_NAME = 'alquran_digital_db';
const DB_VERSION = 1;
const STORE_LIST = 'surah_list';
const STORE_DETAILS = 'surah_details';

let dbPromise: Promise<IDBDatabase> | null = null;

function openDb(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB tidak tersedia di perangkat ini'));
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_LIST)) {
        db.createObjectStore(STORE_LIST);
      }
      if (!db.objectStoreNames.contains(STORE_DETAILS)) {
        db.createObjectStore(STORE_DETAILS, { keyPath: 'nomor' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('Gagal membuka database lokal'));
  });
  return dbPromise;
}

export async function getCachedSurahList(): Promise<SurahSummary[] | null> {
  try {
    const db = await openDb();
    return await new Promise((resolve) => {
      const tx = db.transaction(STORE_LIST, 'readonly');
      const req = tx.objectStore(STORE_LIST).get('all');
      req.onsuccess = () => resolve((req.result as SurahSummary[] | undefined) ?? null);
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

export async function saveSurahList(list: SurahSummary[]): Promise<void> {
  try {
    const db = await openDb();
    await new Promise<void>((resolve) => {
      const tx = db.transaction(STORE_LIST, 'readwrite');
      tx.objectStore(STORE_LIST).put(list, 'all');
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    });
  } catch {
    // Ignore storage quota errors gracefully
  }
}

export async function getCachedSurahDetail(nomor: number): Promise<SurahDetail | null> {
  try {
    const db = await openDb();
    return await new Promise((resolve) => {
      const tx = db.transaction(STORE_DETAILS, 'readonly');
      const req = tx.objectStore(STORE_DETAILS).get(nomor);
      req.onsuccess = () => resolve((req.result as SurahDetail | undefined) ?? null);
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

export async function saveSurahDetail(detail: SurahDetail): Promise<void> {
  try {
    const db = await openDb();
    await new Promise<void>((resolve) => {
      const tx = db.transaction(STORE_DETAILS, 'readwrite');
      tx.objectStore(STORE_DETAILS).put(detail);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    });
  } catch {
    // Ignore storage quota errors gracefully
  }
}

export async function getAllCachedSurahDetails(): Promise<SurahDetail[]> {
  try {
    const db = await openDb();
    return await new Promise((resolve) => {
      const tx = db.transaction(STORE_DETAILS, 'readonly');
      const req = tx.objectStore(STORE_DETAILS).getAll();
      req.onsuccess = () => {
        const items = (req.result as SurahDetail[] | undefined) ?? [];
        items.sort((a, b) => a.nomor - b.nomor);
        resolve(items);
      };
      req.onerror = () => resolve([]);
    });
  } catch {
    return [];
  }
}

export async function getCachedSurahKeys(): Promise<number[]> {
  try {
    const db = await openDb();
    return await new Promise((resolve) => {
      const tx = db.transaction(STORE_DETAILS, 'readonly');
      const req = tx.objectStore(STORE_DETAILS).getAllKeys();
      req.onsuccess = () => resolve(((req.result as number[] | undefined) ?? []).map(Number));
      req.onerror = () => resolve([]);
    });
  } catch {
    return [];
  }
}

export async function clearOfflineSurahCache(): Promise<void> {
  try {
    const db = await openDb();
    await new Promise<void>((resolve) => {
      const tx = db.transaction(STORE_DETAILS, 'readwrite');
      tx.objectStore(STORE_DETAILS).clear();
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    });
  } catch {
    // Ignore
  }
}
