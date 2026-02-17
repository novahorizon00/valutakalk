import React, { useState, useEffect, useCallback, useRef } from "react";
import { ArrowUpDown, RefreshCw, History, Settings, Wifi, WifiOff, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAppState } from "@/hooks/useAppState";
import { t, type Lang } from "@/lib/i18n";
import { getCurrencyInfo } from "@/lib/currencies";
import { areRatesStale, getRatesAge } from "@/lib/rateService";
import { activateDevSubscription } from "@/lib/proSubscription";
import CurrencyPicker from "@/components/CurrencyPicker";
import HistoryView from "@/components/HistoryView";
import SettingsView from "@/components/SettingsView";
import OfflinePaywall from "@/components/OfflinePaywall";

type View = "converter" | "history" | "settings";

const Index = () => {
  const {
    settings, favorites, history, rates, isOnline, fetchStatus,
    lastError, refreshRates, updateSettings, toggleFavorite,
    addConversion, clearAllHistory, getRate, convertAmount,
    proStatus, isPro, canConvertOffline, updateProStatus,
  } = useAppState();

  const [amount, setAmount] = useState("100");
  const [fromCurrency, setFromCurrency] = useState("NOK");
  const [toCurrency, setToCurrency] = useState("EUR");
  const [result, setResult] = useState<number | null>(null);
  const [pickerTarget, setPickerTarget] = useState<"from" | "to" | null>(null);
  const [view, setView] = useState<View>("converter");
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  const lang: Lang = settings?.language ?? "nb";

  // Feature flag: should we show the offline paywall?
  const showOfflinePaywall = !isOnline && !canConvertOffline;

  // Set currencies from settings on load
  useEffect(() => {
    if (settings) {
      setFromCurrency(settings.baseCurrency);
      setToCurrency(settings.targetCurrency);
    }
  }, [settings?.baseCurrency, settings?.targetCurrency]);

  // Debounced conversion
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    // If offline and not Pro, don't convert
    if (!isOnline && !canConvertOffline) {
      setResult(null);
      return;
    }

    debounceRef.current = setTimeout(() => {
      const num = parseFloat(amount);
      if (!isNaN(num) && num > 0) {
        const r = convertAmount(num, fromCurrency, toCurrency);
        setResult(r);
      } else {
        setResult(null);
      }
    }, 150);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [amount, fromCurrency, toCurrency, convertAmount, isOnline, canConvertOffline]);

  // Save conversion to history on result change (debounced)
  const lastSavedRef = useRef("");
  useEffect(() => {
    if (result === null) return;
    const num = parseFloat(amount);
    if (isNaN(num) || num <= 0) return;
    const rate = getRate(fromCurrency, toCurrency);
    if (!rate) return;
    const key = `${num}-${fromCurrency}-${toCurrency}`;
    if (lastSavedRef.current === key) return;
    lastSavedRef.current = key;
    const timer = setTimeout(() => {
      addConversion(fromCurrency, toCurrency, num, result, rate);
    }, 1000);
    return () => clearTimeout(timer);
  }, [result]);

  const handleSwap = () => {
    setFromCurrency(toCurrency);
    setToCurrency(fromCurrency);
  };

  const handleQuickAmount = (val: number) => {
    setAmount(val.toString());
  };

  const handleCurrencySelect = (code: string) => {
    if (pickerTarget === "from") setFromCurrency(code);
    else if (pickerTarget === "to") setToCurrency(code);
    setPickerTarget(null);
  };

  const handleFavoriteTap = (code: string) => {
    if (toCurrency === code) {
      setFromCurrency(code);
    } else {
      setToCurrency(code);
    }
  };

  const handleUpgrade = async () => {
    // In production, this triggers Apple IAP / Google Play purchase flow
    // via Capacitor plugin. For now, activate a dev subscription.
    const status = await activateDevSubscription(7); // 7-day trial
    updateProStatus(status);
  };

  const formatResult = (num: number): string => {
    if (num >= 1000) return num.toLocaleString(lang === "nb" ? "nb-NO" : "en-US", { maximumFractionDigits: 2 });
    if (num >= 1) return num.toLocaleString(lang === "nb" ? "nb-NO" : "en-US", { maximumFractionDigits: 4 });
    return num.toLocaleString(lang === "nb" ? "nb-NO" : "en-US", { maximumFractionDigits: 6 });
  };

  const formatAge = (): string => {
    if (!rates) return t(lang, "never");
    const ageMs = getRatesAge(rates.timestamp);
    const mins = Math.floor(ageMs / 60_000);
    if (mins < 1) return `< 1 ${t(lang, "minutes")} ${t(lang, "ago")}`;
    if (mins < 60) return `${mins} ${t(lang, "minutes")} ${t(lang, "ago")}`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs} ${t(lang, "hours")} ${t(lang, "ago")}`;
    const days = Math.floor(hrs / 24);
    return `${days} ${t(lang, "days")} ${t(lang, "ago")}`;
  };

  const quickAmounts = settings?.quickAmounts ?? [10, 25, 50, 100, 500];
  const isStale = rates ? areRatesStale(rates.timestamp) : false;
  const fromInfo = getCurrencyInfo(fromCurrency);
  const toInfo = getCurrencyInfo(toCurrency);
  const rate = getRate(fromCurrency, toCurrency);

  if (!settings) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="animate-pulse-soft text-muted-foreground font-display text-xl">Offline FX</div>
      </div>
    );
  }

  if (view === "history") {
    return (
      <HistoryView
        history={history}
        lang={lang}
        onBack={() => setView("converter")}
        onClear={clearAllHistory}
      />
    );
  }

  if (view === "settings") {
    return (
      <SettingsView
        settings={settings}
        lang={lang}
        fetchStatus={fetchStatus}
        lastError={lastError}
        rates={rates}
        proStatus={proStatus}
        onBack={() => setView("converter")}
        onUpdate={updateSettings}
        onUpgrade={handleUpgrade}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <h1 className="font-display text-xl font-bold text-foreground tracking-tight">
            Offline FX
          </h1>
          {isPro && (
            <Badge className="bg-primary/15 text-primary border-primary/25 text-[10px] font-bold px-1.5 py-0">
              PRO
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className={`text-xs gap-1 ${isOnline ? "text-success border-success/30" : "text-destructive border-destructive/30"}`}
          >
            {isOnline ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
            {isOnline ? t(lang, "online") : t(lang, "offline")}
          </Badge>
          <Button variant="ghost" size="icon" onClick={() => setView("history")} aria-label={t(lang, "history")}>
            <History className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setView("settings")} aria-label={t(lang, "settings")}>
            <Settings className="h-5 w-5" />
          </Button>
        </div>
      </header>

      {/* Stale warning */}
      {isStale && rates && (
        <div className="bg-warning/10 text-warning px-4 py-2 text-sm text-center font-medium">
          {t(lang, "staleWarning", { days: Math.floor(getRatesAge(rates.timestamp) / 86_400_000).toString() })}
        </div>
      )}

      {/* No rates warning (only when online — offline free users see paywall instead) */}
      {!rates && isOnline && (
        <div className="bg-destructive/10 text-destructive px-4 py-3 text-sm text-center">
          {t(lang, "noRates")}
        </div>
      )}

      <main className="flex-1 px-4 py-6 max-w-lg mx-auto w-full space-y-5">
        {/* Favorites bar */}
        {favorites.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide">
            {favorites.map((code) => {
              const info = getCurrencyInfo(code);
              if (!info) return null;
              return (
                <button
                  key={code}
                  onClick={() => handleFavoriteTap(code)}
                  className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors
                    ${code === fromCurrency || code === toCurrency
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                    }`}
                >
                  <span>{info.flag}</span>
                  <span>{code}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Amount input */}
        <div>
          <label className="text-sm font-medium text-muted-foreground mb-1.5 block">{t(lang, "amount")}</label>
          <input
            type="number"
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full text-4xl font-display font-bold bg-card border border-border rounded-xl px-4 py-4 text-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-shadow"
            placeholder="0"
            aria-label={t(lang, "amount")}
          />
        </div>

        {/* Quick amount chips */}
        <div className="flex gap-2 flex-wrap">
          {quickAmounts.map((val) => (
            <button
              key={val}
              onClick={() => handleQuickAmount(val)}
              className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-colors
                ${parseFloat(amount) === val
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                }`}
            >
              {val}
            </button>
          ))}
        </div>

        {/* Currency selectors + swap */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setPickerTarget("from")}
            className="flex-1 flex items-center gap-3 bg-card border border-border rounded-xl px-4 py-3.5 hover:border-ring transition-colors text-left"
          >
            <span className="text-2xl">{fromInfo?.flag}</span>
            <div className="min-w-0">
              <div className="text-xs text-muted-foreground">{t(lang, "from")}</div>
              <div className="font-display font-semibold text-foreground">{fromCurrency}</div>
            </div>
            <ChevronRight className="h-4 w-4 ml-auto text-muted-foreground" />
          </button>

          <Button
            variant="outline"
            size="icon"
            onClick={handleSwap}
            className="rounded-full h-11 w-11 flex-shrink-0 border-2"
            aria-label={t(lang, "swap")}
          >
            <ArrowUpDown className="h-5 w-5" />
          </Button>

          <button
            onClick={() => setPickerTarget("to")}
            className="flex-1 flex items-center gap-3 bg-card border border-border rounded-xl px-4 py-3.5 hover:border-ring transition-colors text-left"
          >
            <span className="text-2xl">{toInfo?.flag}</span>
            <div className="min-w-0">
              <div className="text-xs text-muted-foreground">{t(lang, "to")}</div>
              <div className="font-display font-semibold text-foreground">{toCurrency}</div>
            </div>
            <ChevronRight className="h-4 w-4 ml-auto text-muted-foreground" />
          </button>
        </div>

        {/* Offline paywall — shown instead of result when offline + free */}
        {showOfflinePaywall ? (
          <OfflinePaywall lang={lang} onUpgrade={handleUpgrade} />
        ) : (
          <>
            {/* Result */}
            <Card className="p-5 bg-card border-border">
              <div className="text-sm text-muted-foreground mb-1">{t(lang, "result")}</div>
              <div className="text-4xl font-display font-bold text-foreground tracking-tight">
                {result !== null ? (
                  <>
                    {formatResult(result)}{" "}
                    <span className="text-xl text-muted-foreground">{toCurrency}</span>
                  </>
                ) : (
                  <span className="text-muted-foreground/50">—</span>
                )}
              </div>
              {rate !== null && (
                <div className="text-sm text-muted-foreground mt-2">
                  1 {fromCurrency} = {formatResult(rate)} {toCurrency}
                </div>
              )}
              {!isOnline && isPro && (
                <div className="mt-2">
                  <Badge variant="secondary" className="text-xs">
                    {t(lang, "offlineRates")}
                  </Badge>
                </div>
              )}
            </Card>
          </>
        )}

        {/* Last updated + refresh */}
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <span>{t(lang, "lastUpdated")}: {formatAge()}</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={refreshRates}
            disabled={!isOnline || fetchStatus === "loading"}
            className="gap-1.5"
          >
            <RefreshCw className={`h-4 w-4 ${fetchStatus === "loading" ? "animate-spin" : ""}`} />
            {fetchStatus === "loading" ? t(lang, "updating") : t(lang, "updateNow")}
          </Button>
        </div>
      </main>

      {/* Currency Picker Modal */}
      {pickerTarget && (
        <CurrencyPicker
          lang={lang}
          favorites={favorites}
          selected={pickerTarget === "from" ? fromCurrency : toCurrency}
          onSelect={handleCurrencySelect}
          onToggleFavorite={toggleFavorite}
          onClose={() => setPickerTarget(null)}
        />
      )}
    </div>
  );
};

export default Index;
