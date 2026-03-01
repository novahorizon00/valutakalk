import React, { useState, useMemo } from "react";
import { X, Star, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { currencies, COMMON_CURRENCY_CODES, getCurrencyName, type CurrencyInfo } from "@/lib/currencies";
import { t, type Lang } from "@/lib/i18n";
import FlagIcon from "@/components/FlagIcon";

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
    if (!q) return null;
    return currencies.filter(
      (c) =>
        c.code.toLowerCase().includes(q) ||
        c.name.toLowerCase().includes(q) ||
        c.nameNb.toLowerCase().includes(q) ||
        getCurrencyName(c.code, lang).toLowerCase().includes(q)
    );
  }, [search, lang]);

  const commonCurrencies = useMemo(
    () => COMMON_CURRENCY_CODES.map((code) => currencies.find((c) => c.code === code)!).filter(Boolean),
    []
  );

  const otherCurrencies = useMemo(
    () => currencies.filter((c) => !COMMON_CURRENCY_CODES.includes(c.code)),
    []
  );

  const renderItem = (c: CurrencyInfo) => {
    const isFav = favorites.includes(c.code);
    const isSel = c.code === selected;
    return (
      <button
        key={c.code}
        onClick={() => onSelect(c.code)}
        className={`w-full flex items-center gap-3.5 px-4 py-3 text-left transition-all
          ${isSel ? "gradient-primary-subtle border-l-2 border-l-primary" : "hover:bg-muted/60"}`}
      >
        <FlagIcon currencyCode={c.code} size={28} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className={`font-display font-bold text-sm ${isSel ? "text-primary" : "text-foreground"}`}>{c.code}</span>
            {isFav && <Star className="h-3 w-3 fill-warning text-warning" />}
          </div>
          <div className="text-xs text-muted-foreground truncate mt-0.5">
            {getCurrencyName(c.code, lang)}
          </div>
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); onToggleFavorite(c.code); }}
          className="p-2 rounded-full hover:bg-secondary transition-colors"
          aria-label={isFav ? t(lang, "removeFavorite") : t(lang, "addFavorite")}
        >
          <Star className={`h-4 w-4 transition-colors ${isFav ? "fill-warning text-warning" : "text-muted-foreground/40"}`} />
        </button>
      </button>
    );
  };

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col animate-in slide-in-from-bottom duration-200">
      {/* Safe area spacer */}
      <div className="safe-top bg-card" />
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-card">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            autoFocus
            placeholder={t(lang, "search")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-muted border-0 rounded-xl pl-9 pr-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full" aria-label={t(lang, "close")}>
          <X className="h-5 w-5" />
        </Button>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto safe-bottom">
        {filtered ? (
          filtered.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground text-sm">No results</div>
          ) : (
            filtered.map(renderItem)
          )
        ) : (
          <>
            {favorites.length > 0 && (
              <>
                <div className="px-4 py-2.5 text-[10px] font-bold text-muted-foreground uppercase tracking-widest bg-muted/40 border-b border-border">
                  {t(lang, "favorites")}
                </div>
                {favorites.map((code) => {
                  const c = currencies.find((cur) => cur.code === code);
                  return c ? renderItem(c) : null;
                })}
              </>
            )}
            <div className="px-4 py-2.5 text-[10px] font-bold text-muted-foreground uppercase tracking-widest bg-muted/40 border-b border-border">
              {t(lang, "commonCurrencies")}
            </div>
            {commonCurrencies.map(renderItem)}
            <div className="px-4 py-2.5 text-[10px] font-bold text-muted-foreground uppercase tracking-widest bg-muted/40 border-b border-border">
              {t(lang, "allCurrencies")}
            </div>
            {otherCurrencies.map(renderItem)}
          </>
        )}
      </div>
    </div>
  );
}
