import React, { useState, useMemo } from "react";
import { X, Star, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { currencies, COMMON_CURRENCY_CODES, getCurrencyName, type CurrencyInfo } from "@/lib/currencies";
import { t, type Lang } from "@/lib/i18n";

interface CurrencyPickerProps {
  lang: Lang;
  favorites: string[];
  selected: string;
  onSelect: (code: string) => void;
  onToggleFavorite: (code: string) => void;
  onClose: () => void;
}

export default function CurrencyPicker({
  lang, favorites, selected, onSelect, onToggleFavorite, onClose,
}: CurrencyPickerProps) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    if (!q) return null; // show grouped view
    return currencies.filter(
      (c) =>
        c.code.toLowerCase().includes(q) ||
        c.name.toLowerCase().includes(q) ||
        c.nameNb.toLowerCase().includes(q)
    );
  }, [search]);

  const commonCurrencies = useMemo(
    () => COMMON_CURRENCY_CODES.map((code) => currencies.find((c) => c.code === code)!).filter(Boolean),
    []
  );

  const otherCurrencies = useMemo(
    () => currencies.filter((c) => !COMMON_CURRENCY_CODES.includes(c.code)),
    []
  );

  const renderItem = (c: CurrencyInfo) => (
    <button
      key={c.code}
      onClick={() => onSelect(c.code)}
      className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-accent/50
        ${c.code === selected ? "bg-primary/10" : ""}`}
    >
      <span className="text-xl">{c.flag}</span>
      <div className="flex-1 min-w-0">
        <div className="font-medium text-foreground">{c.code}</div>
        <div className="text-sm text-muted-foreground truncate">
          {getCurrencyName(c.code, lang)}
        </div>
      </div>
      <button
        onClick={(e) => { e.stopPropagation(); onToggleFavorite(c.code); }}
        className="p-1.5 rounded-full hover:bg-secondary transition-colors"
        aria-label={favorites.includes(c.code) ? t(lang, "removeFavorite") : t(lang, "addFavorite")}
      >
        <Star
          className={`h-4 w-4 ${favorites.includes(c.code) ? "fill-warning text-warning" : "text-muted-foreground"}`}
        />
      </button>
    </button>
  );

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col animate-in slide-in-from-bottom duration-200">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            autoFocus
            placeholder={t(lang, "search")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} aria-label={t(lang, "close")}>
          <X className="h-5 w-5" />
        </Button>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {filtered ? (
          filtered.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">No results</div>
          ) : (
            filtered.map(renderItem)
          )
        ) : (
          <>
            <div className="px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider bg-muted/50">
              {t(lang, "commonCurrencies")}
            </div>
            {commonCurrencies.map(renderItem)}
            <div className="px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider bg-muted/50">
              {t(lang, "allCurrencies")}
            </div>
            {otherCurrencies.map(renderItem)}
          </>
        )}
      </div>
    </div>
  );
}
