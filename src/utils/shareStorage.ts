/**
 * Pure IndexedDB utility for storing and retrieving Web Share Target payloads
 * Compatible with both Service Worker (WorkerGlobalScope) and Window contexts.
 */

export interface SharedFileItem {
  name: string;
  type: string;
  data: Blob;
}

export interface SharedPayload {
  id: string;
  title: string;
  text: string;
  url: string;
  files: SharedFileItem[];
  timestamp: number;
}

const DB_NAME = 'doghoney_share_db';
const DB_VERSION = 1;
const STORE_NAME = 'shared_payloads';

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    // Works in both window and self (service worker)
    const idb = typeof indexedDB !== 'undefined' ? indexedDB : (typeof self !== 'undefined' ? (self as any).indexedDB : null);
    if (!idb) {
      reject(new Error('IndexedDB is not supported in this environment.'));
      return;
    }

    const request = idb.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event: any) => {
      const db = event.target.result as IDBDatabase;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('timestamp', 'timestamp', { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Save a shared payload into IndexedDB
 */
export async function saveSharedData(payload: SharedPayload): Promise<void> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const request = store.put(payload);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

/**
 * Retrieve a shared payload by ID
 */
export async function getSharedData(id: string): Promise<SharedPayload | null> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.get(id);

    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Delete a specific shared payload by ID
 */
export async function deleteSharedData(id: string): Promise<void> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const request = store.delete(id);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

/**
 * Clear shared payloads older than specified age (default 10 minutes)
 */
export async function clearOldSharedData(maxAgeMs = 10 * 60 * 1000): Promise<void> {
  try {
    const db = await openDatabase();
    const now = Date.now();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const index = store.index('timestamp');
      const range = IDBKeyRange.upperBound(now - maxAgeMs);
      const request = index.openCursor(range);

      request.onsuccess = (event: any) => {
        const cursor = event.target.result;
        if (cursor) {
          cursor.delete();
          cursor.continue();
        } else {
          resolve();
        }
      };

      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.warn('[shareStorage] Cleanup failed:', err);
  }
}
