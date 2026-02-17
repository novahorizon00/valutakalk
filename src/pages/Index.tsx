import React, { useState, useEffect, useRef } from "react";
import { ArrowLeftRight, RefreshCw, History, Settings, Wifi, WifiOff, ChevronRight, Plane } from "lucide-react";
import FlagIcon from "@/components/FlagIcon";
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
import AllRatesList from "@/components/AllRatesList";

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
      {/* Pro banner for free users */}
      {!isPro && (
        <button
          onClick={handleUpgrade}
          className="w-full flex items-center gap-2.5 px-4 py-2.5 bg-gradient-to-r from-primary/10 via-accent/10 to-primary/5 border-b border-primary/10 text-xs font-medium text-primary hover:from-primary/15 hover:via-accent/15 transition-all"
        >
          <Plane className="h-3.5 w-3.5 flex-shrink-0" />
          <span className="flex-1 text-left">{t(lang, "offlinePaywallCta")}</span>
          <ChevronRight className="h-3.5 w-3.5 flex-shrink-0 opacity-50" />
        </button>
      )}

      {/* Top bar */}
      <div className="flex items-center justify-between px-4 pt-3 pb-1">
        <h1 className="font-display text-lg font-bold text-foreground">{t(lang, "currencyCalculator")}</h1>
        <div className="flex items-center gap-0.5">
          <span className={`flex items-center gap-1 text-[11px] font-medium mr-1 ${isOnline ? "text-muted-foreground" : "text-destructive"}`}>
            {isOnline ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
          </span>
          {isPro && (
            <span className="text-[10px] font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-full mr-1">PRO</span>
          )}
          <Button variant="ghost" size="icon" onClick={() => setView("history")} className="h-8 w-8 text-muted-foreground hover:text-foreground">
            <History className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setView("settings")} className="h-8 w-8 text-muted-foreground hover:text-foreground">
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Offline banner */}
      {!isOnline && rates && (
        <div className="mx-4 mt-2 bg-accent/50 border border-border rounded-xl px-4 py-3 space-y-1">
          <div className="flex items-center gap-2">
            <WifiOff className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <span className="text-sm font-semibold text-foreground">{t(lang, "offlineBannerTitle")}</span>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">{t(lang, "offlineBannerDesc")}</p>
          <p className="text-[11px] text-muted-foreground/70">{t(lang, "lastUpdated")}: {formatAge()}</p>
        </div>
      )}

      {/* Stale / no rates warnings */}
      {isStale && rates && isOnline && (
        <div className="bg-warning/10 text-warning px-4 py-1.5 text-xs text-center font-medium">
          ⚠️ {t(lang, "staleWarning", { days: Math.floor(getRatesAge(rates.timestamp) / 86_400_000).toString() })}
        </div>
      )}
      {!rates && isOnline && (
        <div className="bg-destructive/10 text-destructive px-4 py-1.5 text-xs text-center">
          {t(lang, "noRates")}
        </div>
      )}

      <main className="flex-1 px-4 py-3 max-w-lg mx-auto w-full space-y-3">
        {/* FROM: currency selector + amount */}
        <div className="bg-card border border-border rounded-2xl p-4 space-y-2">
          <button
            onClick={() => setPickerTarget("from")}
            className="w-full flex items-center gap-3 text-left group"
          >
            <FlagIcon currencyCode={fromCurrency} size={36} />
            <div className="flex-1 min-w-0">
              <div className="font-display font-bold text-base text-foreground leading-tight">{fromCurrency}</div>
              <div className="text-xs text-muted-foreground truncate">{getCurrencyName(fromCurrency, lang)}</div>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
          </button>
          <input
            type="number"
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full text-3xl font-display font-bold bg-muted/50 border border-border rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground/30 focus:outline-none focus:ring-2 focus:ring-ring transition-all"
            placeholder="0"
            aria-label={t(lang, "amount")}
          />
          {/* Quick amounts */}
          <div className="flex gap-1.5 flex-wrap">
            {quickAmounts.map((val) => (
              <button
                key={val}
                onClick={() => handleQuickAmount(val)}
                className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold transition-all
                  ${parseFloat(amount) === val
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
              >
                {val}
              </button>
            ))}
          </div>
        </div>

        {/* Swap */}
        <div className="flex justify-center -my-1 relative z-10">
          <Button
            variant="outline"
            size="icon"
            onClick={handleSwap}
            className="rounded-full h-9 w-9 border-2 border-border bg-card shadow-sm hover:shadow-md hover:border-primary/40 transition-all"
            aria-label={t(lang, "swap")}
          >
            <ArrowLeftRight className="h-4 w-4 text-primary" />
          </Button>
        </div>

        {/* TO: currency selector + result */}
        {showOfflinePaywall ? (
          <OfflinePaywall lang={lang} onUpgrade={handleUpgrade} />
        ) : (
          <div className="bg-card border border-border rounded-2xl p-4 space-y-2">
            <button
              onClick={() => setPickerTarget("to")}
              className="w-full flex items-center gap-3 text-left group"
            >
              <FlagIcon currencyCode={toCurrency} size={36} />
              <div className="flex-1 min-w-0">
                <div className="font-display font-bold text-base text-foreground leading-tight">{toCurrency}</div>
                <div className="text-xs text-muted-foreground truncate">{getCurrencyName(toCurrency, lang)}</div>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
            </button>
            <div className="bg-muted/50 border border-border rounded-xl px-4 py-3 min-h-[60px] flex items-center">
              {result !== null ? (
                <span className="text-3xl font-display font-bold text-foreground tracking-tight">
                  {formatResult(result)}
                </span>
              ) : (
                <span className="text-3xl font-display font-bold text-muted-foreground/30">—</span>
              )}
            </div>
            {rate !== null && (
              <div className="text-xs text-muted-foreground flex items-center gap-1">
                <FlagIcon currencyCode={fromCurrency} size={14} /> 1 {fromCurrency} = {formatResult(rate)} {toCurrency} <FlagIcon currencyCode={toCurrency} size={14} />
              </div>
            )}
            {!isOnline && isPro && (
              <Badge variant="secondary" className="text-[10px]">{t(lang, "offlineRates")}</Badge>
            )}
          </div>
        )}

        {/* Favorites */}
        {favorites.length > 0 && (
          <div className="flex gap-1.5 overflow-x-auto pb-0.5 scrollbar-hide">
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
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "bg-card border border-border text-foreground hover:border-primary/30"
                    }`}
                >
                  <FlagIcon currencyCode={code} size={16} />
                  <span>{code}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* All rates – Pro only */}
        {isPro && rates && (
          <AllRatesList
            lang={lang}
            fromCurrency={fromCurrency}
            getRate={getRate}
            formatResult={formatResult}
            isOnline={isOnline}
          />
        )}

        {/* Status + refresh */}
        <div className="flex items-center justify-between text-[11px] text-muted-foreground bg-card border border-border rounded-xl px-3 py-2">
          <div className="flex items-center gap-2">
            <span className={`flex items-center gap-1 font-medium ${isOnline ? "text-green-600 dark:text-green-400" : "text-destructive"}`}>
              {isOnline ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
              {isOnline ? "Online" : "Offline"}
            </span>
            <span className="text-muted-foreground/50">·</span>
            <span>{t(lang, "lastUpdated")}: {formatAge()}</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={refreshRates}
            disabled={!isOnline || fetchStatus === "loading"}
            className="gap-1 text-[11px] h-7 px-2"
          >
            <RefreshCw className={`h-3 w-3 ${fetchStatus === "loading" ? "animate-spin" : ""}`} />
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
