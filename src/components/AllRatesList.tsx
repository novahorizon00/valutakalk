import React, { useState, useMemo } from "react";
import { ChevronDown, ChevronUp, Crown, ChevronRight, Plus, X, ArrowRightLeft, WifiOff } from "lucide-react";
import FlagIcon from "@/components/FlagIcon";
import { currencies, COMMON_CURRENCY_CODES, getCurrencyName } from "@/lib/currencies";
import { t, type Lang } from "@/lib/i18n";
import { Badge } from "@/components/ui/badge";

type Mode = "single" | "multi";

interface AllRatesListProps {
  lang: Lang;
  fromCurrency: string;
  getRate: (from: string, to: string) => number | null;
  formatResult: (num: number) => string;
  isOnline: boolean;
}

const DEFAULT_COMPARE = ["EUR", "USD", "GBP", "SEK", "DKK"];
const DEFAULT_BASES = ["NOK", "EUR", "USD"];

export default function AllRatesList({ lang, fromCurrency, getRate, formatResult, isOnline }: AllRatesListProps) {
  const [expanded, setExpanded] = useState(false);
  const [mode, setMode] = useState<Mode>("single");

  // Single mode state
  const [baseCurrency, setBaseCurrency] = useState(fromCurrency);
  const [showBasePicker, setShowBasePicker] = useState(false);
  const [compareCurrencies, setCompareCurrencies] = useState<string[]>(() =>
    DEFAULT_COMPARE.filter((c) => c !== fromCurrency)
  );
  const [showAddPicker, setShowAddPicker] = useState(false);
  const [showAll, setShowAll] = useState(false);

  // Multi mode state
  const [baseCurrenciesMulti, setBaseCurrenciesMulti] = useState<string[]>(() =>
    DEFAULT_BASES.filter((c) => c !== fromCurrency).slice(0, 3)
  );
  const [targetCurrency, setTargetCurrency] = useState(fromCurrency);
  const [showTargetPicker, setShowTargetPicker] = useState(false);
  const [showAddBase, setShowAddBase] = useState(false);

  React.useEffect(() => {
    setBaseCurrency(fromCurrency);
    setTargetCurrency(fromCurrency);
    setCompareCurrencies((prev) => prev.filter((c) => c !== fromCurrency));
  }, [fromCurrency]);

  // Single mode data
  const selectedRates = useMemo(() => {
    return compareCurrencies
      .map((code) => ({ code, rate: getRate(baseCurrency, code) }))
      .filter((r) => r.rate !== null);
  }, [compareCurrencies, baseCurrency, getRate]);

  const allRatesList = useMemo(() => {
    if (!showAll) return [];
    return currencies
      .filter((c) => c.code !== baseCurrency && !compareCurrencies.includes(c.code))
      .map((c) => ({ code: c.code, rate: getRate(baseCurrency, c.code) }))
      .filter((r) => r.rate !== null)
      .sort((a, b) => a.code.localeCompare(b.code));
  }, [showAll, baseCurrency, compareCurrencies, getRate]);

  // Multi mode data
  const multiRates = useMemo(() => {
    return baseCurrenciesMulti
      .map((code) => ({ code, rate: getRate(code, targetCurrency) }))
      .filter((r) => r.rate !== null);
  }, [baseCurrenciesMulti, targetCurrency, getRate]);

  const quickBaseCurrencies = useMemo(
    () => COMMON_CURRENCY_CODES.filter((c) => c !== baseCurrency).slice(0, 8),
    [baseCurrency]
  );

  const addableCurrencies = useMemo(
    () => COMMON_CURRENCY_CODES.filter((c) => c !== baseCurrency && !compareCurrencies.includes(c)),
    [baseCurrency, compareCurrencies]
  );

  const addableBasesMulti = useMemo(
    () => COMMON_CURRENCY_CODES.filter((c) => c !== targetCurrency && !baseCurrenciesMulti.includes(c)),
    [targetCurrency, baseCurrenciesMulti]
  );

  const quickTargets = useMemo(
    () => COMMON_CURRENCY_CODES.filter((c) => !baseCurrenciesMulti.includes(c)).slice(0, 8),
    [baseCurrenciesMulti]
  );

  const toggleCompare = (code: string) => {
    setCompareCurrencies((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    );
  };

  const modeLabel = mode === "single"
    ? (lang === "nb" ? "Enkeltvaluta" : "Single")
    : (lang === "nb" ? "Sammenlign flere" : "Multi-compare");

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-3 text-left"
      >
        <div className="flex items-center gap-2">
          <Crown className="h-3.5 w-3.5 text-primary" />
          <span className="text-sm font-semibold text-foreground">
            {t(lang, "allRatesFrom", { currency: mode === "single" ? baseCurrency : targetCurrency })}
          </span>
          <span className="text-[10px] font-bold bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">PRO</span>
        </div>
        {expanded ? (
          <ChevronUp className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        )}
      </button>

      {expanded && (
        <div className="border-t border-border">
          {/* Mode toggle + offline badge */}
          <div className="flex items-center justify-between px-4 py-2 border-b border-border/50 bg-muted/30">
            <div className="flex gap-1">
              <button
                onClick={() => setMode("single")}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                  mode === "single" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
                }`}
              >
                {lang === "nb" ? "Enkeltvaluta" : "Single base"}
              </button>
              <button
                onClick={() => setMode("multi")}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all flex items-center gap-1 ${
                  mode === "multi" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
                }`}
              >
                <ArrowRightLeft className="h-3 w-3" />
                {lang === "nb" ? "Sammenlign" : "Compare"}
              </button>
            </div>
            {!isOnline && (
              <Badge variant="secondary" className="text-[10px] gap-1">
                <WifiOff className="h-2.5 w-2.5" />
                {t(lang, "offlineRates")}
              </Badge>
            )}
          </div>

          {mode === "single" ? (
            <>
              {/* Base currency selector */}
              <div className="px-4 py-2.5 border-b border-border/50 space-y-2">
                <button
                  onClick={() => { setShowBasePicker(!showBasePicker); setShowAddPicker(false); }}
                  className="flex items-center gap-2 group"
                >
                  <FlagIcon currencyCode={baseCurrency} size={22} />
                  <span className="text-sm font-bold text-foreground">{baseCurrency}</span>
                  <span className="text-xs text-muted-foreground">{getCurrencyName(baseCurrency, lang)}</span>
                  <ChevronRight className={`h-3.5 w-3.5 text-muted-foreground transition-transform ${showBasePicker ? "rotate-90" : ""}`} />
                </button>
                {showBasePicker && (
                  <div className="flex gap-1.5 flex-wrap">
                    {quickBaseCurrencies.map((code) => (
                      <button
                        key={code}
                        onClick={() => { setBaseCurrency(code); setShowBasePicker(false); }}
                        className="flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-semibold transition-all bg-muted text-muted-foreground hover:bg-muted/80"
                      >
                        <FlagIcon currencyCode={code} size={14} />
                        {code}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Selected comparison currencies */}
              <div className="divide-y divide-border/50">
                {selectedRates.map(({ code, rate }) => (
                  <div key={code} className="flex items-center gap-3 px-4 py-2.5">
                    <FlagIcon currencyCode={code} size={20} />
                    <div className="flex-1 min-w-0">
                      <span className="text-xs font-semibold text-foreground">{code}</span>
                      <span className="text-[11px] text-muted-foreground ml-1.5">{getCurrencyName(code, lang)}</span>
                    </div>
                    <span className="text-xs font-mono font-medium text-foreground tabular-nums mr-2">{formatResult(rate!)}</span>
                    <button onClick={() => toggleCompare(code)} className="p-1 rounded-full hover:bg-destructive/10 transition-colors" aria-label="Remove">
                      <X className="h-3 w-3 text-muted-foreground hover:text-destructive" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Add currency */}
              <div className="px-4 py-2.5 border-t border-border/50 space-y-2">
                <button
                  onClick={() => { setShowAddPicker(!showAddPicker); setShowBasePicker(false); }}
                  className="flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary/80 transition-colors"
                >
                  <Plus className="h-3.5 w-3.5" />
                  {lang === "nb" ? "Legg til valuta" : "Add currency"}
                </button>
                {showAddPicker && (
                  <div className="flex gap-1.5 flex-wrap">
                    {addableCurrencies.map((code) => (
                      <button
                        key={code}
                        onClick={() => { toggleCompare(code); setShowAddPicker(false); }}
                        className="flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-semibold transition-all bg-muted text-muted-foreground hover:bg-primary/10 hover:text-primary"
                      >
                        <FlagIcon currencyCode={code} size={14} />
                        {code}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Show all toggle */}
              <div className="border-t border-border/50">
                <button
                  onClick={() => setShowAll(!showAll)}
                  className="w-full px-4 py-2 text-[11px] font-semibold text-muted-foreground hover:text-foreground transition-colors text-center"
                >
                  {showAll ? (lang === "nb" ? "Skjul alle kurser" : "Hide all rates") : (lang === "nb" ? "Vis alle kurser" : "Show all rates")}
                </button>
              </div>
              {showAll && (
                <div className="max-h-[40vh] overflow-y-auto border-t border-border/50 divide-y divide-border/50">
                  {allRatesList.map(({ code, rate }) => (
                    <div key={code} className="flex items-center gap-3 px-4 py-2 cursor-pointer hover:bg-muted/40 transition-colors" onClick={() => toggleCompare(code)}>
                      <FlagIcon currencyCode={code} size={18} />
                      <div className="flex-1 min-w-0">
                        <span className="text-[11px] font-semibold text-foreground">{code}</span>
                        <span className="text-[10px] text-muted-foreground ml-1.5">{getCurrencyName(code, lang)}</span>
                      </div>
                      <span className="text-[11px] font-mono text-muted-foreground tabular-nums mr-1">{formatResult(rate!)}</span>
                      <Plus className="h-3 w-3 text-primary/50" />
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <>
              {/* Multi mode: target currency selector */}
              <div className="px-4 py-2.5 border-b border-border/50 space-y-2">
                <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
                  {lang === "nb" ? "Målvaluta" : "Target currency"}
                </div>
                <button
                  onClick={() => { setShowTargetPicker(!showTargetPicker); setShowAddBase(false); }}
                  className="flex items-center gap-2 group"
                >
                  <FlagIcon currencyCode={targetCurrency} size={22} />
                  <span className="text-sm font-bold text-foreground">{targetCurrency}</span>
                  <span className="text-xs text-muted-foreground">{getCurrencyName(targetCurrency, lang)}</span>
                  <ChevronRight className={`h-3.5 w-3.5 text-muted-foreground transition-transform ${showTargetPicker ? "rotate-90" : ""}`} />
                </button>
                {showTargetPicker && (
                  <div className="flex gap-1.5 flex-wrap">
                    {quickTargets.map((code) => (
                      <button
                        key={code}
                        onClick={() => { setTargetCurrency(code); setShowTargetPicker(false); }}
                        className="flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-semibold transition-all bg-muted text-muted-foreground hover:bg-muted/80"
                      >
                        <FlagIcon currencyCode={code} size={14} />
                        {code}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Multi base comparison list */}
              <div className="divide-y divide-border/50">
                <div className="px-4 py-1.5 bg-muted/30">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                    {lang === "nb" ? `1 enhet → ${targetCurrency}` : `1 unit → ${targetCurrency}`}
                  </span>
                </div>
                {multiRates.map(({ code, rate }) => (
                  <div key={code} className="flex items-center gap-3 px-4 py-3">
                    <FlagIcon currencyCode={code} size={22} />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-semibold text-foreground">{code}</div>
                      <div className="text-[11px] text-muted-foreground">{getCurrencyName(code, lang)}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-mono font-bold text-foreground tabular-nums">
                        {formatResult(rate!)}
                      </div>
                      <div className="text-[10px] text-muted-foreground">{targetCurrency}</div>
                    </div>
                    <button
                      onClick={() => setBaseCurrenciesMulti((prev) => prev.filter((c) => c !== code))}
                      className="p-1 rounded-full hover:bg-destructive/10 transition-colors ml-1"
                      aria-label="Remove"
                    >
                      <X className="h-3 w-3 text-muted-foreground hover:text-destructive" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Add base currency */}
              <div className="px-4 py-2.5 border-t border-border/50 space-y-2">
                <button
                  onClick={() => { setShowAddBase(!showAddBase); setShowTargetPicker(false); }}
                  className="flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary/80 transition-colors"
                >
                  <Plus className="h-3.5 w-3.5" />
                  {lang === "nb" ? "Legg til valuta å sammenligne" : "Add currency to compare"}
                </button>
                {showAddBase && (
                  <div className="flex gap-1.5 flex-wrap">
                    {addableBasesMulti.map((code) => (
                      <button
                        key={code}
                        onClick={() => {
                          setBaseCurrenciesMulti((prev) => [...prev, code]);
                          setShowAddBase(false);
                        }}
                        className="flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-semibold transition-all bg-muted text-muted-foreground hover:bg-primary/10 hover:text-primary"
                      >
                        <FlagIcon currencyCode={code} size={14} />
                        {code}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
