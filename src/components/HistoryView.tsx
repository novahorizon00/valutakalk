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
  const formatDate = (ts: number) => {
    return new Date(ts).toLocaleString(lang === "nb" ? "nb-NO" : "en-US", {
      month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
    });
  };

  const formatNum = (n: number) =>
    n.toLocaleString(lang === "nb" ? "nb-NO" : "en-US", { maximumFractionDigits: 4 });

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="font-display text-xl font-bold">{t(lang, "history")}</h1>
        </div>
        {history.length > 0 && (
          <Button variant="ghost" size="sm" onClick={onClear} className="text-destructive gap-1.5">
            <Trash2 className="h-4 w-4" />
            {t(lang, "clearHistory")}
          </Button>
        )}
      </header>

      <div className="flex-1 overflow-y-auto">
        {history.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground">{t(lang, "noHistory")}</div>
        ) : (
          <div className="divide-y divide-border">
            {history.map((item) => {
              const fromInfo = getCurrencyInfo(item.fromCurrency);
              const toInfo = getCurrencyInfo(item.toCurrency);
              return (
                <div key={item.id} className="px-4 py-3 flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-foreground">
                      {fromInfo?.flag} {formatNum(item.amount)} {item.fromCurrency}
                      <span className="mx-2 text-muted-foreground">→</span>
                      {toInfo?.flag} {formatNum(item.result)} {item.toCurrency}
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {formatDate(item.timestamp)}
                    </div>
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
