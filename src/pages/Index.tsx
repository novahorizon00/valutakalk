import React, { useState, useEffect, useRef } from "react";
import { ArrowLeftRight, RefreshCw, History, Settings, Wifi, WifiOff, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAppState } from "@/hooks/useAppState";
import { t, type Lang } from "@/lib/i18n";
import { getCurrencyInfo, getCurrencyName } from "@/lib/currencies";
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
  const showOfflinePaywall = !isOnline && !canConvertOffline;

  useEffect(() => {
    if (settings) {
      setFromCurrency(settings.baseCurrency);
      setToCurrency(settings.targetCurrency);
    }
  }, [settings?.baseCurrency, settings?.targetCurrency]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!isOnline && !canConvertOffline) { setResult(null); return; }
    debounceRef.current = setTimeout(() => {
      const num = parseFloat(amount);
      if (!isNaN(num) && num > 0) setResult(convertAmount(num, fromCurrency, toCurrency));
      else setResult(null);
    }, 150);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [amount, fromCurrency, toCurrency, convertAmount, isOnline, canConvertOffline]);

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
    const timer = setTimeout(() => addConversion(fromCurrency, toCurrency, num, result, rate), 1000);
    return () => clearTimeout(timer);
  }, [result]);

  const handleSwap = () => { setFromCurrency(toCurrency); setToCurrency(fromCurrency); };
  const handleQuickAmount = (val: number) => setAmount(val.toString());
  const handleCurrencySelect = (code: string) => {
    if (pickerTarget === "from") setFromCurrency(code);
    else if (pickerTarget === "to") setToCurrency(code);
    setPickerTarget(null);
  };
  const handleFavoriteTap = (code: string) => {
    if (toCurrency === code) setFromCurrency(code);
    else setToCurrency(code);
  };
  const handleUpgrade = async () => {
    const status = await activateDevSubscription(7);
    updateProStatus(status);
  };

  const locale = lang === "nb" ? "nb-NO" : "en-US";
  const formatResult = (num: number): string => {
    if (num >= 1000) return num.toLocaleString(locale, { maximumFractionDigits: 2 });
    if (num >= 1) return num.toLocaleString(locale, { maximumFractionDigits: 4 });
    return num.toLocaleString(locale, { maximumFractionDigits: 6 });
  };
  const formatAge = (): string => {
    if (!rates) return t(lang, "never");
    const ageMs = getRatesAge(rates.timestamp);
    const mins = Math.floor(ageMs / 60_000);
    if (mins < 1) return `< 1 ${t(lang, "minutes")} ${t(lang, "ago")}`;
    if (mins < 60) return `${mins} ${t(lang, "minutes")} ${t(lang, "ago")}`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs} ${t(lang, "hours")} ${t(lang, "ago")}`;
    return `${Math.floor(hrs / 24)} ${t(lang, "days")} ${t(lang, "ago")}`;
  };

  const quickAmounts = settings?.quickAmounts ?? [10, 25, 50, 100, 500];
  const isStale = rates ? areRatesStale(rates.timestamp) : false;
  const fromInfo = getCurrencyInfo(fromCurrency);
  const toInfo = getCurrencyInfo(toCurrency);
  const rate = getRate(fromCurrency, toCurrency);

  if (!settings) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="animate-pulse-soft text-primary font-display text-2xl font-bold">Offline FX</div>
      </div>
    );
  }

  if (view === "history") return <HistoryView history={history} lang={lang} onBack={() => setView("converter")} onClear={clearAllHistory} />;
  if (view === "settings") return <SettingsView settings={settings} lang={lang} fetchStatus={fetchStatus} lastError={lastError} rates={rates} proStatus={proStatus} onBack={() => setView("converter")} onUpdate={updateSettings} onUpgrade={handleUpgrade} />;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header with gradient */}
      <header className="gradient-primary px-5 pt-4 pb-5 text-primary-foreground">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <h1 className="font-display text-2xl font-bold tracking-tight">Offline FX</h1>
            {isPro && (
              <span className="text-[10px] font-bold bg-primary-foreground/20 backdrop-blur-sm px-2 py-0.5 rounded-full">
                PRO
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            <span className={`flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full ${isOnline ? "bg-primary-foreground/15" : "bg-destructive/80 text-destructive-foreground"}`}>
              {isOnline ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
              {isOnline ? t(lang, "online") : t(lang, "offline")}
            </span>
            <Button variant="ghost" size="icon" onClick={() => setView("history")} className="text-primary-foreground/80 hover:text-primary-foreground hover:bg-primary-foreground/10 h-9 w-9">
              <History className="h-[18px] w-[18px]" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => setView("settings")} className="text-primary-foreground/80 hover:text-primary-foreground hover:bg-primary-foreground/10 h-9 w-9">
              <Settings className="h-[18px] w-[18px]" />
            </Button>
          </div>
        </div>

        {/* Amount input on gradient */}
        <div>
          <label className="text-xs font-medium text-primary-foreground/60 mb-1 block">{t(lang, "amount")}</label>
          <div className="relative">
            <input
              type="number"
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full text-[42px] font-display font-bold bg-primary-foreground/10 backdrop-blur-sm border border-primary-foreground/20 rounded-2xl px-5 py-3 text-primary-foreground placeholder:text-primary-foreground/30 focus:outline-none focus:ring-2 focus:ring-primary-foreground/30 transition-all"
              placeholder="0"
              aria-label={t(lang, "amount")}
            />
            {fromInfo && (
              <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-1.5 text-primary-foreground/70">
                <span className="text-lg">{fromInfo.flag}</span>
                <span className="text-sm font-semibold">{fromCurrency}</span>
              </div>
            )}
          </div>
        </div>

        {/* Quick amount chips */}
        <div className="flex gap-1.5 mt-3 flex-wrap">
          {quickAmounts.map((val) => (
            <button
              key={val}
              onClick={() => handleQuickAmount(val)}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-all
                ${parseFloat(amount) === val
                  ? "bg-primary-foreground text-primary shadow-lg"
                  : "bg-primary-foreground/15 text-primary-foreground/80 hover:bg-primary-foreground/25"
                }`}
            >
              {val}
            </button>
          ))}
        </div>
      </header>

      {/* Stale warning */}
      {isStale && rates && (
        <div className="bg-warning/10 text-warning px-4 py-2 text-xs text-center font-medium">
          ⚠️ {t(lang, "staleWarning", { days: Math.floor(getRatesAge(rates.timestamp) / 86_400_000).toString() })}
        </div>
      )}
      {!rates && isOnline && (
        <div className="bg-destructive/10 text-destructive px-4 py-2 text-xs text-center">
          {t(lang, "noRates")}
        </div>
      )}

      <main className="flex-1 px-4 py-4 max-w-lg mx-auto w-full space-y-4">
        {/* Favorites bar */}
        {favorites.length > 0 && (
          <div className="flex gap-1.5 overflow-x-auto pb-0.5 -mx-1 px-1 scrollbar-hide">
            {favorites.map((code) => {
              const info = getCurrencyInfo(code);
              if (!info) return null;
              const isActive = code === fromCurrency || code === toCurrency;
              return (
                <button
                  key={code}
                  onClick={() => handleFavoriteTap(code)}
                  className={`flex-shrink-0 flex items-center gap-1.5 pl-1.5 pr-2.5 py-1 rounded-full text-xs font-semibold transition-all
                    ${isActive
                      ? "gradient-primary text-primary-foreground shadow-md shadow-primary/25"
                      : "bg-card border border-border text-foreground hover:border-primary/30 hover:shadow-sm"
                    }`}
                >
                  <span className="text-sm leading-none">{info.flag}</span>
                  <span>{code}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Currency selectors + swap */}
        <div className="space-y-2">
          {/* From currency */}
          <button
            onClick={() => setPickerTarget("from")}
            className="w-full flex items-center gap-3.5 bg-card border border-border rounded-2xl px-4 py-3.5 hover:border-primary/40 hover:shadow-sm transition-all text-left group"
          >
            <span className="text-3xl leading-none">{fromInfo?.flag}</span>
            <div className="flex-1 min-w-0">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">{t(lang, "from")}</div>
              <div className="font-display font-bold text-lg text-foreground leading-tight">{fromCurrency}</div>
              <div className="text-xs text-muted-foreground truncate">{getCurrencyName(fromCurrency, lang)}</div>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
          </button>

          {/* Swap button */}
          <div className="flex justify-center -my-1 relative z-10">
            <Button
              variant="outline"
              size="icon"
              onClick={handleSwap}
              className="rounded-full h-10 w-10 border-2 border-border bg-card shadow-sm hover:shadow-md hover:border-primary/40 transition-all"
              aria-label={t(lang, "swap")}
            >
              <ArrowLeftRight className="h-4 w-4 text-primary" />
            </Button>
          </div>

          {/* To currency */}
          <button
            onClick={() => setPickerTarget("to")}
            className="w-full flex items-center gap-3.5 bg-card border border-border rounded-2xl px-4 py-3.5 hover:border-primary/40 hover:shadow-sm transition-all text-left group"
          >
            <span className="text-3xl leading-none">{toInfo?.flag}</span>
            <div className="flex-1 min-w-0">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">{t(lang, "to")}</div>
              <div className="font-display font-bold text-lg text-foreground leading-tight">{toCurrency}</div>
              <div className="text-xs text-muted-foreground truncate">{getCurrencyName(toCurrency, lang)}</div>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
          </button>
        </div>

        {/* Result or paywall */}
        {showOfflinePaywall ? (
          <OfflinePaywall lang={lang} onUpgrade={handleUpgrade} />
        ) : (
          <div className="gradient-primary-subtle rounded-2xl border border-primary/10 p-5">
            <div className="text-xs font-semibold uppercase tracking-wider text-primary/60 mb-2">{t(lang, "result")}</div>
            <div className="flex items-baseline gap-2">
              {result !== null ? (
                <>
                  <span className="text-3xl font-display font-bold text-foreground tracking-tight">
                    {toInfo?.flag && <span className="mr-2">{toInfo.flag}</span>}
                    {formatResult(result)}
                  </span>
                  <span className="text-base font-semibold text-muted-foreground">{toCurrency}</span>
                </>
              ) : (
                <span className="text-3xl font-display font-bold text-muted-foreground/30">—</span>
              )}
            </div>
            {rate !== null && (
              <div className="text-xs text-muted-foreground mt-2.5 flex items-center gap-1">
                <span>{fromInfo?.flag}</span> 1 {fromCurrency} = {formatResult(rate)} {toCurrency} <span>{toInfo?.flag}</span>
              </div>
            )}
            {!isOnline && isPro && (
              <Badge variant="secondary" className="text-[10px] mt-2">{t(lang, "offlineRates")}</Badge>
            )}
          </div>
        )}

        {/* Last updated + refresh */}
        <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
          <span>{t(lang, "lastUpdated")}: {formatAge()}</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={refreshRates}
            disabled={!isOnline || fetchStatus === "loading"}
            className="gap-1.5 text-xs h-8"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${fetchStatus === "loading" ? "animate-spin" : ""}`} />
            {fetchStatus === "loading" ? t(lang, "updating") : t(lang, "updateNow")}
          </Button>
        </div>
      </main>

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
