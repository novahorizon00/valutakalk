// IndexedDB storage layer with versioning

const DB_NAME = "offline-fx";
const DB_VERSION = 1;

export interface CachedRates {
  base: string;
  rates: Record<string, number>;
  timestamp: number; // ms epoch
}

export interface UserSettings {
  baseCurrency: string;
  targetCurrency: string;
  quickAmounts: number[];
  autoUpdateWifiOnly: boolean;
  language: "nb" | "en";
}

export interface ConversionRecord {
  id: string;
  fromCurrency: string;
  toCurrency: string;
  amount: number;
  result: number;
  rate: number;
  timestamp: number;
}

const DEFAULT_SETTINGS: UserSettings = {
  baseCurrency: "NOK",
  targetCurrency: "EUR",
  quickAmounts: [10, 25, 50, 100, 500],
  autoUpdateWifiOnly: false,
  language: "nb",
};

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

async function getFromStore<T>(storeName: string, key: string): Promise<T | null> {
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
    // Fallback to localStorage
    const raw = localStorage.getItem(`${DB_NAME}-${storeName}-${key}`);
    return raw ? JSON.parse(raw) : null;
  }
}

async function putToStore<T>(storeName: string, key: string, data: T): Promise<void> {
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

// Rates
export async function getCachedRates(): Promise<CachedRates | null> {
  return getFromStore<CachedRates>("rates", "current");
}

export async function saveRates(rates: CachedRates): Promise<void> {
  return putToStore("rates", "current", rates);
}

// Settings
export async function getSettings(): Promise<UserSettings> {
  const stored = await getFromStore<UserSettings>("settings", "user");
  return stored ? { ...DEFAULT_SETTINGS, ...stored } : DEFAULT_SETTINGS;
}

export async function saveSettings(settings: UserSettings): Promise<void> {
  return putToStore("settings", "user", settings);
}

// Favorites
export async function getFavorites(): Promise<string[]> {
  const stored = await getFromStore<string[]>("favorites", "list");
  return stored ?? ["NOK", "EUR", "USD", "GBP", "SEK", "THB"];
}

export async function saveFavorites(favorites: string[]): Promise<void> {
  return putToStore("favorites", "list", favorites);
}

// History
export async function getHistory(): Promise<ConversionRecord[]> {
  const stored = await getFromStore<ConversionRecord[]>("history", "list");
  return stored ?? [];
}

export async function addToHistory(record: ConversionRecord): Promise<void> {
  const history = await getHistory();
  const updated = [record, ...history].slice(0, 50);
  return putToStore("history", "list", updated);
}

export async function clearHistory(): Promise<void> {
  return putToStore("history", "list", []);
}
