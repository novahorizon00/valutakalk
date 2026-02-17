// Extracted shared storage helpers for use across modules

const DB_NAME = "offline-fx";
const DB_VERSION = 1;

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains("rates")) {
        db.createObjectStore("rates", { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains("settings")) {
        db.createObjectStore("settings", { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains("favorites")) {
        db.createObjectStore("favorites", { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains("history")) {
        const store = db.createObjectStore("history", { keyPath: "id" });
        store.createIndex("timestamp", "timestamp", { unique: false });
      }
    };
  });
}

export async function getFromStore<T>(storeName: string, key: string): Promise<T | null> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, "readonly");
      const store = tx.objectStore(storeName);
      const request = store.get(key);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result?.data ?? null);
    });
  } catch {
    const raw = localStorage.getItem(`${DB_NAME}-${storeName}-${key}`);
    return raw ? JSON.parse(raw) : null;
  }
}

export async function putToStore<T>(storeName: string, key: string, data: T): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, "readwrite");
      const store = tx.objectStore(storeName);
      const request = store.put({ id: key, data });
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  } catch {
    localStorage.setItem(`${DB_NAME}-${storeName}-${key}`, JSON.stringify(data));
  }
}
