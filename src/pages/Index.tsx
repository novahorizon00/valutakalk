import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeftRight, RefreshCw, History, Settings, Wifi, WifiOff, ChevronRight, Plane, Keyboard, Pencil, Plus } from "lucide-react";
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
import WidgetSetup, { type WidgetConfig } from "@/components/WidgetSetup";
import NumericKeypad from "@/components/NumericKeypad";
import OnboardingGuide from "@/components/OnboardingGuide";
import FavoritesManager from "@/components/FavoritesManager";

type View = "converter" | "history" | "settings" | "widget";

const ONBOARDING_KEY = "offline-fx-onboarding-done";

const Index = () => {
  const {
    settings, favorites, history, rates, isOnline, fetchStatus,
    lastError, refreshRates, updateSettings, toggleFavorite, reorderFavorites,
    addConversion, clearAllHistory, getRate, convertAmount,
    proStatus, isPro, canConvertOffline, updateProStatus,
  } = useAppState();

  const [amount, setAmount] = useState("100");
  const [fromCurrency, setFromCurrency] = useState("NOK");
  const [toCurrency, setToCurrency] = useState("EUR");
  const [result, setResult] = useState<number | null>(null);
  const [pickerTarget, setPickerTarget] = useState<"from" | "to" | "favorites" | null>(null);
  const [showFavManager, setShowFavManager] = useState(false);
  const [view, setView] = useState<View>("converter");
  const [widgetConfig, setWidgetConfig] = useState<WidgetConfig>({ currency1: "NOK", currency2: "EUR" });
  const [showKeypad, setShowKeypad] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  const lang: Lang = settings?.language ?? "nb";
  const showOfflinePaywall = !isOnline && !canConvertOffline;

  useEffect(() => {
    if (settings) {
      setFromCurrency(settings.baseCurrency);
      setToCurrency(settings.targetCurrency);
    }
  }, [settings?.baseCurrency, settings?.targetCurrency]);

  // Show onboarding only for Pro users on first visit
  useEffect(() => {
    if (isPro && !localStorage.getItem(ONBOARDING_KEY)) {
      setShowOnboarding(true);
    }
  }, [isPro]);

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
    if (pickerTarget === "favorites") {
      toggleFavorite(code);
      return; // Don't close picker — let user toggle multiple
    }
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
  const handleOnboardingComplete = () => {
    localStorage.setItem(ONBOARDING_KEY, "1");
    setShowOnboarding(false);
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
  const rate = getRate(fromCurrency, toCurrency);

  if (!settings) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-primary font-display text-2xl font-bold"
        >
          Offline FX
        </motion.div>
      </div>
    );
  }

  if (view === "history") return <HistoryView history={history} lang={lang} onBack={() => setView("converter")} onClear={clearAllHistory} />;
  if (view === "settings") return <SettingsView settings={settings} lang={lang} fetchStatus={fetchStatus} lastError={lastError} rates={rates} proStatus={proStatus} onBack={() => setView("converter")} onUpdate={updateSettings} onUpgrade={handleUpgrade} onOpenWidget={() => setView("widget")} />;
  if (view === "widget") return <WidgetSetup lang={lang} config={widgetConfig} onSave={setWidgetConfig} onBack={() => setView("settings")} />;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Onboarding */}
      <AnimatePresence>
        {showOnboarding && <OnboardingGuide lang={lang} onComplete={handleOnboardingComplete} />}
      </AnimatePresence>

      {/* Pro banner for free users */}
      {!isPro && (
        <motion.button
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={handleUpgrade}
          className="w-full flex items-center gap-2.5 px-4 py-2.5 bg-gradient-to-r from-primary/10 via-accent/10 to-primary/5 border-b border-primary/10 text-xs font-medium text-primary hover:from-primary/15 hover:via-accent/15 transition-all"
        >
          <Plane className="h-3.5 w-3.5 flex-shrink-0" />
          <span className="flex-1 text-left">{t(lang, "offlinePaywallCta")}</span>
          <ChevronRight className="h-3.5 w-3.5 flex-shrink-0 opacity-50" />
        </motion.button>
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
      <AnimatePresence>
        {!isOnline && rates && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mx-4 mt-2 bg-accent/50 border border-border rounded-xl px-4 py-3 space-y-1"
          >
            <div className="flex items-center gap-2">
              <WifiOff className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <span className="text-sm font-semibold text-foreground">{t(lang, "offlineBannerTitle")}</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">{t(lang, "offlineBannerDesc")}</p>
            <p className="text-[11px] text-muted-foreground/70">{t(lang, "lastUpdated")}: {formatAge()}</p>
          </motion.div>
        )}
      </AnimatePresence>

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
        <motion.div
          layout
          className="glass-card bg-card border border-border rounded-2xl p-4 space-y-2"
        >
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

          {/* Amount display (always shown) */}
          <div className="relative">
            <input
              type={showKeypad ? "text" : "number"}
              inputMode={showKeypad ? "none" : "decimal"}
              readOnly={showKeypad}
              value={amount}
              onChange={(e) => !showKeypad && setAmount(e.target.value)}
              onFocus={() => {}}
              className="w-full text-3xl font-display font-bold bg-muted/50 border border-border rounded-xl px-4 py-3 pr-12 text-foreground placeholder:text-muted-foreground/30 focus:outline-none focus:ring-2 focus:ring-ring transition-all"
              placeholder="0"
              aria-label={t(lang, "amount")}
            />
            <button
              onClick={() => setShowKeypad(!showKeypad)}
              className={`absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg transition-colors ${showKeypad ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"}`}
              aria-label="Toggle keypad"
            >
              <Keyboard className="h-4 w-4" />
            </button>
          </div>

          {/* Keypad */}
          <AnimatePresence>
            {showKeypad && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
              >
                <NumericKeypad value={amount} onChange={setAmount} lang={lang} />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Quick amounts */}
          <div className="flex gap-1.5 flex-wrap">
            {quickAmounts.map((val) => (
              <motion.button
                key={val}
                whileTap={{ scale: 0.93 }}
                onClick={() => handleQuickAmount(val)}
                className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold transition-all
                  ${parseFloat(amount) === val
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
              >
                {val}
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Swap */}
        <div className="flex justify-center -my-1 relative z-10">
          <motion.div whileTap={{ rotate: 180 }} transition={{ duration: 0.3 }}>
            <Button
              variant="outline"
              size="icon"
              onClick={handleSwap}
              className="rounded-full h-9 w-9 border-2 border-border bg-card shadow-sm hover:shadow-md hover:border-primary/40 transition-all"
              aria-label={t(lang, "swap")}
            >
              <ArrowLeftRight className="h-4 w-4 text-primary" />
            </Button>
          </motion.div>
        </div>

        {/* TO: currency selector + result */}
        {showOfflinePaywall ? (
          <OfflinePaywall lang={lang} onUpgrade={handleUpgrade} />
        ) : (
          <motion.div
            layout
            className="glass-card bg-card border border-border rounded-2xl p-4 space-y-2"
          >
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
              <AnimatePresence mode="wait">
                {result !== null ? (
                  <motion.span
                    key={result}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.2 }}
                    className="text-3xl font-display font-bold text-foreground tracking-tight"
                  >
                    {formatResult(result)}
                  </motion.span>
                ) : (
                  <span className="text-3xl font-display font-bold text-muted-foreground/30">—</span>
                )}
              </AnimatePresence>
            </div>
            {rate !== null && (
              <div className="text-xs text-muted-foreground flex items-center gap-1">
                <FlagIcon currencyCode={fromCurrency} size={14} /> 1 {fromCurrency} = {formatResult(rate)} {toCurrency} <FlagIcon currencyCode={toCurrency} size={14} />
              </div>
            )}
            {!isOnline && isPro && (
              <Badge variant="secondary" className="text-[10px]">{t(lang, "offlineRates")}</Badge>
            )}
          </motion.div>
        )}

        {/* Favorites / Quick currencies */}
        <div className="flex gap-1.5 items-center">
          <div className="flex gap-1.5 overflow-x-auto pb-0.5 scrollbar-hide items-center flex-1 min-w-0">
            {favorites.map((code) => {
              const info = getCurrencyInfo(code);
              if (!info) return null;
              const isActive = code === fromCurrency || code === toCurrency;
              return (
                <motion.button
                  key={code}
                  whileTap={{ scale: 0.93 }}
                  onClick={() => handleFavoriteTap(code)}
                  className={`flex-shrink-0 flex items-center gap-1.5 pl-1.5 pr-2.5 py-1 rounded-full text-xs font-semibold transition-all
                    ${isActive
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "bg-card border border-border text-foreground hover:border-primary/30"
                    }`}
                >
                  <FlagIcon currencyCode={code} size={16} />
                  <span>{code}</span>
                </motion.button>
              );
            })}
          </div>
          <motion.button
            whileTap={{ scale: 0.93 }}
            onClick={() => setShowFavManager(true)}
            className="flex-shrink-0 flex items-center justify-center h-7 w-7 rounded-full border border-dashed border-border text-muted-foreground hover:border-primary/40 hover:text-primary transition-all"
            aria-label="Edit favorites"
          >
            {favorites.length > 0 ? <Pencil className="h-3 w-3" /> : <Plus className="h-3.5 w-3.5" />}
          </motion.button>
        </div>

        {/* All rates – Pro only */}
        {isPro && rates && (
          <AllRatesList
            lang={lang}
            fromCurrency={fromCurrency}
            getRate={getRate}
            formatResult={formatResult}
            isOnline={isOnline}
            onQuickSetTarget={(code) => setToCurrency(code)}
          />
        )}

        {/* Status + refresh */}
        <div className="flex items-center justify-between text-[11px] text-muted-foreground glass-card bg-card border border-border rounded-xl px-3 py-2">
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
          selected={pickerTarget === "from" ? fromCurrency : pickerTarget === "to" ? toCurrency : ""}
          onSelect={handleCurrencySelect}
          onToggleFavorite={toggleFavorite}
          onClose={() => setPickerTarget(null)}
        />
      )}

      {/* Favorites Manager */}
      <AnimatePresence>
        {showFavManager && (
          <FavoritesManager
            lang={lang}
            favorites={favorites}
            onReorder={reorderFavorites}
            onRemove={(code) => toggleFavorite(code)}
            onAddMore={() => { setShowFavManager(false); setPickerTarget("favorites"); }}
            onClose={() => setShowFavManager(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default Index;
