import React from "react";
import { ArrowLeft, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { t, type Lang } from "@/lib/i18n";
import { getCurrencyInfo } from "@/lib/currencies";
import type { ConversionRecord } from "@/lib/storage";

interface HistoryViewProps {
  history: ConversionRecord[];
  lang: Lang;
  onBack: () => void;
  onClear: () => void;
}

export default function HistoryView({ history, lang, onBack, onClear }: HistoryViewProps) {
  const locale = lang === "nb" ? "nb-NO" : "en-US";
  const formatDate = (ts: number) =>
    new Date(ts).toLocaleString(locale, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
  const formatNum = (n: number) =>
    n.toLocaleString(locale, { maximumFractionDigits: 4 });

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="safe-top gradient-primary" />
      <header className="gradient-primary px-4 py-3 flex items-center justify-between text-primary-foreground">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={onBack} className="text-primary-foreground hover:bg-primary-foreground/10 h-9 w-9">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="font-display text-xl font-bold">{t(lang, "history")}</h1>
        </div>
        {history.length > 0 && (
          <Button variant="ghost" size="sm" onClick={onClear} className="text-primary-foreground/70 hover:text-primary-foreground hover:bg-primary-foreground/10 gap-1.5 text-xs">
            <Trash2 className="h-3.5 w-3.5" />
            {t(lang, "clearHistory")}
          </Button>
        )}
      </header>

      <div className="flex-1 overflow-y-auto">
        {history.length === 0 ? (
          <div className="p-16 text-center text-muted-foreground text-sm">{t(lang, "noHistory")}</div>
        ) : (
          <div className="divide-y divide-border">
            {history.map((item) => {
              const fromInfo = getCurrencyInfo(item.fromCurrency);
              const toInfo = getCurrencyInfo(item.toCurrency);
              return (
                <div key={item.id} className="px-4 py-3.5 flex items-center gap-3 hover:bg-muted/30 transition-colors">
                  <div className="flex items-center gap-0.5 text-xl">
                    <span>{fromInfo?.flag}</span>
                    <span className="text-muted-foreground text-xs mx-1">→</span>
                    <span>{toInfo?.flag}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm text-foreground">
                      {formatNum(item.amount)} {item.fromCurrency}
                      <span className="mx-1.5 text-muted-foreground">=</span>
                      <span className="text-primary font-semibold">{formatNum(item.result)} {item.toCurrency}</span>
                    </div>
                    <div className="text-[10px] text-muted-foreground mt-0.5">{formatDate(item.timestamp)}</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
