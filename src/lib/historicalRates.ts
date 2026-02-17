import { getFromStore, putToStore } from "./storageHelpers";

export interface HistoricalPoint {
  date: string;
  rate: number;
}

export interface CachedHistoricalRates {
  base: string;
  target: string;
  days: number;
  points: HistoricalPoint[];
  fetchedAt: number;
}

const CACHE_MAX_AGE_MS = 6 * 60 * 60 * 1000; // 6 hours

function cacheKey(base: string, target: string, days: number): string {
  return `hist_${base}_${target}_${days}`;
}

export async function getCachedHistorical(
  base: string,
  target: string,
  days: number
): Promise<CachedHistoricalRates | null> {
  return getFromStore<CachedHistoricalRates>("settings", cacheKey(base, target, days));
}

export async function saveHistorical(data: CachedHistoricalRates): Promise<void> {
  return putToStore("settings", cacheKey(data.base, data.target, data.days), data);
}

export function isHistoricalStale(fetchedAt: number): boolean {
  return Date.now() - fetchedAt > CACHE_MAX_AGE_MS;
}
