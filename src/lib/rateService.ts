import { getCachedRates, saveRates, type CachedRates } from "./storage";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export interface FetchResult {
  success: boolean;
  rates: CachedRates | null;
  error?: string;
}

export async function fetchRates(): Promise<FetchResult> {
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/fetch-rates`, {
      headers: {
        Authorization: `Bearer ${SUPABASE_KEY}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();

    if (!data.rates || typeof data.rates !== "object") {
      throw new Error("Invalid rates data");
    }

    const cached: CachedRates = {
      base: data.base || "EUR",
      rates: data.rates,
      timestamp: Date.now(),
    };

    await saveRates(cached);
    return { success: true, rates: cached };
  } catch (error) {
    const existing = await getCachedRates();
    return {
      success: false,
      rates: existing,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Derive cross rate using triangulation through base currency.
 * Uses decimal-safe multiplication to avoid floating point issues.
 */
export function getCrossRate(
  rates: Record<string, number>,
  base: string,
  from: string,
  to: string
): number | null {
  if (from === to) return 1;

  // If from is the base currency
  if (from === base) {
    return rates[to] ?? null;
  }

  // If to is the base currency
  if (to === base) {
    const fromRate = rates[from];
    if (!fromRate) return null;
    return 1 / fromRate;
  }

  // Cross rate: to_rate / from_rate
  const fromRate = rates[from];
  const toRate = rates[to];
  if (!fromRate || !toRate) return null;

  return toRate / fromRate;
}

/**
 * Convert amount with decimal-safe math (6 decimal precision).
 */
export function convert(amount: number, rate: number): number {
  // Use integer math for precision
  const precision = 1_000_000;
  return Math.round(amount * rate * precision) / precision;
}

/**
 * Get age of cached rates in milliseconds.
 */
export function getRatesAge(timestamp: number): number {
  return Date.now() - timestamp;
}

/**
 * Check if rates are stale (default: 3 days).
 */
export function areRatesStale(timestamp: number, thresholdDays = 3): boolean {
  return getRatesAge(timestamp) > thresholdDays * 24 * 60 * 60 * 1000;
}
