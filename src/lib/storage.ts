// IndexedDB storage layer with versioning
// Uses shared helpers from storageHelpers.ts

import { getFromStore, putToStore } from "./storageHelpers";

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
