import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingCart, Trash2, X } from "lucide-react";
import { t, type Lang } from "@/lib/i18n";
import FlagIcon from "@/components/FlagIcon";

export interface SumItem {
  id: string;
  amount: number;
  fromCurrency: string;
  converted: number;
  toCurrency: string;
}

interface SumCartProps {
  items: SumItem[];
  lang: Lang;
  toCurrency: string;
  onRemove: (id: string) => void;
  onClear: () => void;
  formatResult: (num: number) => string;
}

export default function SumCart({ items, lang, toCurrency, onRemove, onClear, formatResult }: SumCartProps) {
  if (items.length === 0) return null;

  const total = items.reduce((sum, item) => sum + item.converted, 0);

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
      className="glass-card bg-card border border-border rounded-2xl overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border">
        <div className="flex items-center gap-2">
          <ShoppingCart className="h-4 w-4 text-primary" />
          <span className="text-sm font-bold text-foreground">{t(lang, "shoppingTotal")}</span>
          <span className="text-[10px] font-medium text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">
            {t(lang, "itemsCount", { count: items.length.toString() })}
          </span>
        </div>
        <button
          onClick={onClear}
          className="text-[11px] font-medium text-destructive hover:text-destructive/80 transition-colors flex items-center gap-1"
        >
          <Trash2 className="h-3 w-3" />
          {t(lang, "clearSum")}
        </button>
      </div>

      {/* Items */}
      <div className="px-4 py-2 space-y-1.5 max-h-40 overflow-y-auto">
        <AnimatePresence>
          {items.map((item) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20, height: 0 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
              className="flex items-center justify-between gap-2 py-1"
            >
              <div className="flex items-center gap-2 text-xs text-muted-foreground min-w-0">
                <FlagIcon currencyCode={item.fromCurrency} size={14} />
                <span className="font-medium text-foreground">{formatResult(item.amount)}</span>
                <span>{item.fromCurrency}</span>
                <span className="text-muted-foreground/40">→</span>
                <span className="font-medium text-foreground">{formatResult(item.converted)}</span>
                <span>{item.toCurrency}</span>
              </div>
              <button
                onClick={() => onRemove(item.id)}
                className="flex-shrink-0 p-1 rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all"
              >
                <X className="h-3 w-3" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Total */}
      <div className="border-t border-border px-4 py-3 bg-muted/30">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground">
            {t(lang, "totalInCurrency", { currency: toCurrency })}
          </span>
          <div className="flex items-center gap-1.5">
            <FlagIcon currencyCode={toCurrency} size={16} />
            <motion.span
              key={total}
              initial={{ scale: 1.1 }}
              animate={{ scale: 1 }}
              className="text-lg font-display font-bold text-foreground"
            >
              {formatResult(total)}
            </motion.span>
            <span className="text-sm font-medium text-muted-foreground">{toCurrency}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
