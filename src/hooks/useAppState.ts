import { useState, useEffect, useCallback, useRef } from "react";
import {
  getSettings,
  saveSettings,
  getFavorites,
  saveFavorites,
  getHistory,
  addToHistory,
  clearHistory as clearHistoryStorage,
  getCachedRates,
  type UserSettings,
  type ConversionRecord,
  type CachedRates,
} from "@/lib/storage";
import { fetchRates, getCrossRate, convert, areRatesStale, type FetchResult } from "@/lib/rateService";
import { getProStatus, saveProStatus, canUseOffline, type ProSubscription } from "@/lib/proSubscription";
import { useConnectivity } from "./useConnectivity";

export type FetchStatus = "idle" | "loading" | "success" | "error";

export function useAppState() {
  const { isOnline } = useConnectivity();
  const [settings, setSettingsState] = useState<UserSettings | null>(null);
  const [favorites, setFavoritesState] = useState<string[]>([]);
  const [history, setHistoryState] = useState<ConversionRecord[]>([]);
  const [rates, setRates] = useState<CachedRates | null>(null);
  const [fetchStatus, setFetchStatus] = useState<FetchStatus>("idle");
  const [lastError, setLastError] = useState<string | null>(null);
  const [proStatus, setProStatus] = useState<ProSubscription>({ isActive: false });
  const initialized = useRef(false);

  // Derived: can the user convert right now?
  const isPro = proStatus.isActive;
  const canConvertOffline = canUseOffline(proStatus);

  // Load persisted state
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    Promise.all([getSettings(), getFavorites(), getHistory(), getCachedRates(), getProStatus()]).then(
      ([s, f, h, r, p]) => {
        setSettingsState(s);
        setFavoritesState(f);
        setHistoryState(h);
        setRates(r);
        setProStatus(p);

        // Auto-fetch if online and no rates or stale
        if (navigator.onLine && (!r || areRatesStale(r.timestamp))) {
          refreshRates();
        }
      }
    );
  }, []);

  const refreshRates = useCallback(async () => {
    setFetchStatus("loading");
    setLastError(null);
    const result = await fetchRates();
    if (result.success && result.rates) {
      setRates(result.rates);
      setFetchStatus("success");
    } else {
      setLastError(result.error ?? "Unknown error");
      setFetchStatus("error");
      if (result.rates) setRates(result.rates);
    }
  }, []);

  const updateSettings = useCallback(async (partial: Partial<UserSettings>) => {
    setSettingsState((prev) => {
      const updated = { ...prev!, ...partial };
      saveSettings(updated);
      return updated;
    });
  }, []);

  const toggleFavorite = useCallback(
    async (code: string) => {
      setFavoritesState((prev) => {
        const updated = prev.includes(code)
          ? prev.filter((c) => c !== code)
          : [...prev, code];
        saveFavorites(updated);
        return updated;
      });
    },
    []
  );

  const addConversion = useCallback(
    async (fromCurrency: string, toCurrency: string, amount: number, result: number, rate: number) => {
      const record: ConversionRecord = {
        id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
        fromCurrency,
        toCurrency,
        amount,
        result,
        rate,
        timestamp: Date.now(),
      };
      await addToHistory(record);
      setHistoryState((prev) => [record, ...prev].slice(0, 50));
    },
    []
  );

  const clearAllHistory = useCallback(async () => {
    await clearHistoryStorage();
    setHistoryState([]);
  }, []);

  const getRate = useCallback(
    (from: string, to: string): number | null => {
      if (!rates) return null;
      return getCrossRate(rates.rates, rates.base, from, to);
    },
    [rates]
  );

  const convertAmount = useCallback(
    (amount: number, from: string, to: string): number | null => {
      const rate = getRate(from, to);
      if (rate === null) return null;
      return convert(amount, rate);
    },
    [getRate]
  );

  const updateProStatus = useCallback(async (status: ProSubscription) => {
    await saveProStatus(status);
    setProStatus(status);
  }, []);

  return {
    settings,
    favorites,
    history,
    rates,
    isOnline,
    fetchStatus,
    lastError,
    proStatus,
    isPro,
    canConvertOffline,
    refreshRates,
    updateSettings,
    toggleFavorite,
    addConversion,
    clearAllHistory,
    getRate,
    convertAmount,
    updateProStatus,
  };
}
