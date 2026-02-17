import React, { useState, useMemo } from "react";
import { ChevronDown, ChevronUp, Crown, ChevronRight, Plus, X, ArrowRightLeft, WifiOff, Search, LineChart } from "lucide-react";
import FlagIcon from "@/components/FlagIcon";
import { currencies, COMMON_CURRENCY_CODES, getCurrencyName } from "@/lib/currencies";
import { t, type Lang } from "@/lib/i18n";
import { Badge } from "@/components/ui/badge";
import HistoryChart from "@/components/HistoryChart";

type Mode = "single" | "multi" | "history";
type PickerFor = "base" | "target" | "addCompare" | "addBase" | "historyTarget" | "historyBase" | null;

interface AllRatesListProps {
  lang: Lang;
  fromCurrency: string;
  getRate: (from: string, to: string) => number | null;
  formatResult: (num: number) => string;
  isOnline: boolean;
  onQuickSetTarget?: (code: string) => void;
}

const DEFAULT_COMPARE = ["EUR", "USD", "GBP", "SEK", "DKK"];
const DEFAULT_BASES = ["NOK", "EUR", "USD"];

/** Mini inline currency picker with search */
function MiniPicker({ lang, exclude, onSelect, onClose }: {
  lang: Lang;
  exclude: string[];
  onSelect: (code: string) => void;
  onClose: () => void;
}) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return currencies
      .filter((c) => !exclude.includes(c.code))
      .filter((c) =>
        !q ||
        c.code.toLowerCase().includes(q) ||
        c.name.toLowerCase().includes(q) ||
        c.nameNb.toLowerCase().includes(q)
      )
      .slice(0, 30);
  }, [search, exclude]);

  const common = useMemo(
    () => COMMON_CURRENCY_CODES.filter((c) => !exclude.includes(c)),
    [exclude]
  );

  return (
    <div className="border-t border-border/50 bg-muted/20">
      <div className="px-3 py-2 flex items-center gap-2">
        <Search className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
        <input
          autoFocus
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t(lang, "search")}
          className="flex-1 bg-transparent text-xs text-foreground placeholder:text-muted-foreground/50 focus:outline-none"
        />
        <button onClick={onClose} className="p-1 rounded-full hover:bg-muted transition-colors">
          <X className="h-3 w-3 text-muted-foreground" />
        </button>
      </div>
      {!search && (
        <div className="px-3 pb-1.5 flex gap-1.5 flex-wrap">
          {common.slice(0, 10).map((code) => (
            <button
              key={code}
              onClick={() => onSelect(code)}
              className="flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-semibold bg-muted text-muted-foreground hover:bg-primary/10 hover:text-primary transition-all"
            >
              <FlagIcon currencyCode={code} size={14} />
              {code}
            </button>
          ))}
        </div>
      )}
      {search && (
        <div className="max-h-[30vh] overflow-y-auto divide-y divide-border/50">
          {filtered.map((c) => (
            <button
              key={c.code}
              onClick={() => onSelect(c.code)}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-left hover:bg-muted/40 transition-colors"
            >
              <FlagIcon currencyCode={c.code} size={18} />
              <span className="text-[11px] font-semibold text-foreground">{c.code}</span>
              <span className="text-[10px] text-muted-foreground truncate">{getCurrencyName(c.code, lang)}</span>
            </button>
          ))}
          {filtered.length === 0 && (
            <div className="px-3 py-4 text-center text-[11px] text-muted-foreground">
              {lang === "nb" ? "Ingen resultater" : "No results"}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function AllRatesList({ lang, fromCurrency, getRate, formatResult, isOnline, onQuickSetTarget }: AllRatesListProps) {
  const [expanded, setExpanded] = useState(false);
  const [mode, setMode] = useState<Mode>("single");
  const [pickerFor, setPickerFor] = useState<PickerFor>(null);

  // Single mode state
  const [baseCurrency, setBaseCurrency] = useState(fromCurrency);
  const [compareCurrencies, setCompareCurrencies] = useState<string[]>(() =>
    DEFAULT_COMPARE.filter((c) => c !== fromCurrency)
  );
  const [showAll, setShowAll] = useState(false);

  // Multi mode state
  const [baseCurrenciesMulti, setBaseCurrenciesMulti] = useState<string[]>(() =>
    DEFAULT_BASES.filter((c) => c !== fromCurrency).slice(0, 3)
  );
  const [targetCurrency, setTargetCurrency] = useState(fromCurrency);

  // History mode state
  const [historyTarget, setHistoryTarget] = useState("EUR");
  const [historyCompare, setHistoryCompare] = useState<string[]>([]);

  React.useEffect(() => {
    setBaseCurrency(fromCurrency);
    setTargetCurrency(fromCurrency);
    setCompareCurrencies((prev) => prev.filter((c) => c !== fromCurrency));
  }, [fromCurrency]);

  const closePicker = () => setPickerFor(null);

  const handlePickerSelect = (code: string) => {
    if (pickerFor === "base") {
      setBaseCurrency(code);
    } else if (pickerFor === "target") {
      setTargetCurrency(code);
    } else if (pickerFor === "addCompare") {
      setCompareCurrencies((prev) => [...prev, code]);
    } else if (pickerFor === "addBase") {
      setBaseCurrenciesMulti((prev) => [...prev, code]);
    } else if (pickerFor === "historyTarget") {
      setHistoryTarget(code);
    } else if (pickerFor === "historyBase") {
      setBaseCurrency(code);
    }
    setPickerFor(null);
  };

  const pickerExclude = useMemo(() => {
    if (pickerFor === "base") return [baseCurrency];
    if (pickerFor === "target") return [...baseCurrenciesMulti];
    if (pickerFor === "addCompare") return [baseCurrency, ...compareCurrencies];
    if (pickerFor === "addBase") return [targetCurrency, ...baseCurrenciesMulti];
    if (pickerFor === "historyTarget") return [baseCurrency, ...historyCompare];
    if (pickerFor === "historyBase") return [historyTarget, ...historyCompare];
    return [];
  }, [pickerFor, baseCurrency, compareCurrencies, baseCurrenciesMulti, targetCurrency, historyCompare]);

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

  const toggleCompare = (code: string) => {
    setCompareCurrencies((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    );
  };

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
        {expanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
      </button>

      {expanded && (
        <div className="border-t border-border">
          {/* Mode toggle + offline badge */}
          <div className="flex items-center justify-between px-4 py-2 border-b border-border/50 bg-muted/30">
            <div className="flex gap-1">
              <button
                onClick={() => { setMode("single"); closePicker(); }}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all ${mode === "single" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"}`}
              >
                {lang === "nb" ? "Enkeltvaluta" : "Single base"}
              </button>
              <button
                onClick={() => { setMode("multi"); closePicker(); }}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all flex items-center gap-1 ${mode === "multi" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"}`}
              >
                <ArrowRightLeft className="h-3 w-3" />
                {lang === "nb" ? "Sammenlign" : "Compare"}
              </button>
              <button
                onClick={() => { setMode("history"); closePicker(); }}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all flex items-center gap-1 ${mode === "history" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"}`}
              >
                <LineChart className="h-3 w-3" />
                {lang === "nb" ? "Historikk" : "History"}
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
              <div className="px-4 py-2.5 border-b border-border/50">
                <button
                  onClick={() => setPickerFor(pickerFor === "base" ? null : "base")}
                  className="flex items-center gap-2 group"
                >
                  <FlagIcon currencyCode={baseCurrency} size={22} />
                  <span className="text-sm font-bold text-foreground">{baseCurrency}</span>
                  <span className="text-xs text-muted-foreground">{getCurrencyName(baseCurrency, lang)}</span>
                  <ChevronRight className={`h-3.5 w-3.5 text-muted-foreground transition-transform ${pickerFor === "base" ? "rotate-90" : ""}`} />
                </button>
              </div>
              {pickerFor === "base" && (
                <MiniPicker lang={lang} exclude={pickerExclude} onSelect={handlePickerSelect} onClose={closePicker} />
              )}

              {/* Selected comparison currencies */}
              <div className="divide-y divide-border/50">
                {selectedRates.map(({ code, rate }) => (
                  <div key={code} className="flex items-center gap-3 px-4 py-2.5 group">
                    <button
                      onClick={() => onQuickSetTarget?.(code)}
                      className="flex items-center gap-3 flex-1 min-w-0 text-left hover:bg-muted/30 -ml-1 pl-1 rounded-lg transition-colors"
                      title={lang === "nb" ? `Sett ${code} som målvaluta` : `Set ${code} as target`}
                    >
                      <FlagIcon currencyCode={code} size={20} />
                      <div className="flex-1 min-w-0">
                        <span className="text-xs font-semibold text-foreground">{code}</span>
                        <span className="text-[11px] text-muted-foreground ml-1.5">{getCurrencyName(code, lang)}</span>
                      </div>
                      <span className="text-xs font-mono font-medium text-foreground tabular-nums">{formatResult(rate!)}</span>
                    </button>
                    <button onClick={() => toggleCompare(code)} className="p-1 rounded-full hover:bg-destructive/10 transition-colors" aria-label="Remove">
                      <X className="h-3 w-3 text-muted-foreground hover:text-destructive" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Add currency */}
              <div className="px-4 py-2.5 border-t border-border/50">
                <button
                  onClick={() => setPickerFor(pickerFor === "addCompare" ? null : "addCompare")}
                  className="flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary/80 transition-colors"
                >
                  <Plus className="h-3.5 w-3.5" />
                  {lang === "nb" ? "Legg til valuta" : "Add currency"}
                </button>
              </div>
              {pickerFor === "addCompare" && (
                <MiniPicker lang={lang} exclude={pickerExclude} onSelect={handlePickerSelect} onClose={closePicker} />
              )}

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
          ) : mode === "multi" ? (
            <>
              {/* Multi mode: target currency selector */}
              <div className="px-4 py-2.5 border-b border-border/50">
                <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
                  {lang === "nb" ? "Målvaluta" : "Target currency"}
                </div>
                <button
                  onClick={() => setPickerFor(pickerFor === "target" ? null : "target")}
                  className="flex items-center gap-2 group"
                >
                  <FlagIcon currencyCode={targetCurrency} size={22} />
                  <span className="text-sm font-bold text-foreground">{targetCurrency}</span>
                  <span className="text-xs text-muted-foreground">{getCurrencyName(targetCurrency, lang)}</span>
                  <ChevronRight className={`h-3.5 w-3.5 text-muted-foreground transition-transform ${pickerFor === "target" ? "rotate-90" : ""}`} />
                </button>
              </div>
              {pickerFor === "target" && (
                <MiniPicker lang={lang} exclude={pickerExclude} onSelect={handlePickerSelect} onClose={closePicker} />
              )}

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
                      <div className="text-sm font-mono font-bold text-foreground tabular-nums">{formatResult(rate!)}</div>
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
              <div className="px-4 py-2.5 border-t border-border/50">
                <button
                  onClick={() => setPickerFor(pickerFor === "addBase" ? null : "addBase")}
                  className="flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary/80 transition-colors"
                >
                  <Plus className="h-3.5 w-3.5" />
                  {lang === "nb" ? "Legg til valuta å sammenligne" : "Add currency to compare"}
                </button>
              </div>
              {pickerFor === "addBase" && (
                <MiniPicker lang={lang} exclude={pickerExclude} onSelect={handlePickerSelect} onClose={closePicker} />
              )}
            </>
          ) : mode === "history" ? (
            <>
              {/* History mode: base + target currency selectors */}
              <div className="px-4 py-2.5 border-b border-border/50 space-y-2">
                {/* Base currency (clickable) */}
                <button
                  onClick={() => setPickerFor(pickerFor === "historyBase" ? null : "historyBase")}
                  className="flex items-center gap-2 group"
                >
                  <FlagIcon currencyCode={baseCurrency} size={20} />
                  <span className="text-sm font-bold text-foreground">{baseCurrency}</span>
                  <span className="text-xs text-muted-foreground">{getCurrencyName(baseCurrency, lang)}</span>
                  <span className="text-xs text-muted-foreground mx-1">→</span>
                  <ChevronRight className={`h-3.5 w-3.5 text-muted-foreground transition-transform ${pickerFor === "historyBase" ? "rotate-90" : ""}`} />
                </button>
              </div>
              {pickerFor === "historyBase" && (
                <MiniPicker lang={lang} exclude={pickerExclude} onSelect={handlePickerSelect} onClose={closePicker} />
              )}

              {/* Target currency */}
              <div className="px-4 py-2.5 border-b border-border/50">
                <button
                  onClick={() => setPickerFor(pickerFor === "historyTarget" ? null : "historyTarget")}
                  className="flex items-center gap-2 group"
                >
                  <FlagIcon currencyCode={historyTarget} size={22} />
                  <span className="text-sm font-bold text-foreground">{historyTarget}</span>
                  <span className="text-xs text-muted-foreground">{getCurrencyName(historyTarget, lang)}</span>
                  <ChevronDown className={`h-3.5 w-3.5 text-muted-foreground transition-transform ${pickerFor === "historyTarget" ? "rotate-180" : ""}`} />
                </button>
              </div>
              {pickerFor === "historyTarget" && (
                <MiniPicker lang={lang} exclude={pickerExclude} onSelect={handlePickerSelect} onClose={closePicker} />
              )}

              <HistoryChart
                lang={lang}
                baseCurrency={baseCurrency}
                targetCurrency={historyTarget}
                isOnline={isOnline}
                compareCurrencies={historyCompare.length > 0 ? historyCompare : undefined}
              />

              {/* Add compare currency to chart */}
              <div className="px-4 py-2 border-t border-border/50">
                {historyCompare.length > 0 && (
                  <div className="flex gap-1.5 flex-wrap mb-2">
                    {historyCompare.map((c) => (
                      <span key={c} className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-muted text-muted-foreground">
                        <FlagIcon currencyCode={c} size={12} />
                        {c}
                        <button onClick={() => setHistoryCompare((prev) => prev.filter((x) => x !== c))} className="ml-0.5 hover:text-destructive">
                          <X className="h-2.5 w-2.5" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
                <button
                  onClick={() => {
                    const next = compareCurrencies.find((c) => c !== historyTarget && !historyCompare.includes(c));
                    if (next) setHistoryCompare((prev) => [...prev, next]);
                  }}
                  className="flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary/80 transition-colors"
                >
                  <Plus className="h-3.5 w-3.5" />
                  {lang === "nb" ? "Sammenlign med annen valuta" : "Compare with another currency"}
                </button>
              </div>
            </>
          ) : null}
        </div>
      )}
    </div>
  );
}
