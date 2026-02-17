import React, { useState, useMemo } from "react";
import { ChevronDown, ChevronUp, Crown, ChevronRight } from "lucide-react";
import FlagIcon from "@/components/FlagIcon";
import { currencies, COMMON_CURRENCY_CODES, getCurrencyName } from "@/lib/currencies";
import { t, type Lang } from "@/lib/i18n";

interface AllRatesListProps {
  lang: Lang;
  fromCurrency: string;
  getRate: (from: string, to: string) => number | null;
  formatResult: (num: number) => string;
}

export default function AllRatesList({ lang, fromCurrency, getRate, formatResult }: AllRatesListProps) {
  const [expanded, setExpanded] = useState(false);
  const [baseCurrency, setBaseCurrency] = useState(fromCurrency);
  const [showPicker, setShowPicker] = useState(false);

  React.useEffect(() => {
    setBaseCurrency(fromCurrency);
  }, [fromCurrency]);

  const ratesList = useMemo(() => {
    if (!expanded) return [];
    return currencies
      .filter((c) => c.code !== baseCurrency)
      .map((c) => ({ code: c.code, rate: getRate(baseCurrency, c.code) }))
      .filter((r) => r.rate !== null)
      .sort((a, b) => a.code.localeCompare(b.code));
  }, [expanded, baseCurrency, getRate]);

  const quickCurrencies = useMemo(
    () => COMMON_CURRENCY_CODES.filter((c) => c !== baseCurrency).slice(0, 8),
    [baseCurrency]
  );

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-3 text-left"
      >
        <div className="flex items-center gap-2">
          <Crown className="h-3.5 w-3.5 text-primary" />
          <span className="text-sm font-semibold text-foreground">
            {t(lang, "allRatesFrom", { currency: baseCurrency })}
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
          {/* Currency selector */}
          <div className="px-4 py-2.5 border-b border-border/50 space-y-2">
            <button
              onClick={() => setShowPicker(!showPicker)}
              className="flex items-center gap-2 group"
            >
              <FlagIcon currencyCode={baseCurrency} size={22} />
              <span className="text-sm font-bold text-foreground">{baseCurrency}</span>
              <span className="text-xs text-muted-foreground">{getCurrencyName(baseCurrency, lang)}</span>
              <ChevronRight className={`h-3.5 w-3.5 text-muted-foreground transition-transform ${showPicker ? "rotate-90" : ""}`} />
            </button>

            {showPicker && (
              <div className="flex gap-1.5 flex-wrap">
                {quickCurrencies.map((code) => (
                  <button
                    key={code}
                    onClick={() => { setBaseCurrency(code); setShowPicker(false); }}
                    className={`flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-semibold transition-all
                      ${baseCurrency === code
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                      }`}
                  >
                    <FlagIcon currencyCode={code} size={14} />
                    {code}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Rates list */}
          <div className="max-h-[50vh] overflow-y-auto">
            {ratesList.map(({ code, rate }) => (
              <div
                key={code}
                className="flex items-center gap-3 px-4 py-2.5 border-b border-border/50 last:border-b-0"
              >
                <FlagIcon currencyCode={code} size={20} />
                <div className="flex-1 min-w-0">
                  <span className="text-xs font-semibold text-foreground">{code}</span>
                  <span className="text-[11px] text-muted-foreground ml-1.5 truncate">
                    {getCurrencyName(code, lang)}
                  </span>
                </div>
                <span className="text-xs font-mono font-medium text-foreground tabular-nums">
                  {formatResult(rate!)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
