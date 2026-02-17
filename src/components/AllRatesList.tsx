import React, { useState, useMemo } from "react";
import { ChevronDown, ChevronUp, Crown } from "lucide-react";
import FlagIcon from "@/components/FlagIcon";
import { currencies, getCurrencyName } from "@/lib/currencies";
import { t, type Lang } from "@/lib/i18n";

interface AllRatesListProps {
  lang: Lang;
  fromCurrency: string;
  getRate: (from: string, to: string) => number | null;
  formatResult: (num: number) => string;
}

export default function AllRatesList({ lang, fromCurrency, getRate, formatResult }: AllRatesListProps) {
  const [expanded, setExpanded] = useState(false);

  const ratesList = useMemo(() => {
    if (!expanded) return [];
    return currencies
      .filter((c) => c.code !== fromCurrency)
      .map((c) => ({
        code: c.code,
        rate: getRate(fromCurrency, c.code),
      }))
      .filter((r) => r.rate !== null)
      .sort((a, b) => a.code.localeCompare(b.code));
  }, [expanded, fromCurrency, getRate]);

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-3 text-left"
      >
        <div className="flex items-center gap-2">
          <Crown className="h-3.5 w-3.5 text-primary" />
          <span className="text-sm font-semibold text-foreground">
            {t(lang, "allRatesFrom", { currency: fromCurrency })}
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
        <div className="border-t border-border max-h-[50vh] overflow-y-auto">
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
      )}
    </div>
  );
}
