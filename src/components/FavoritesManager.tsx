import React from "react";
import { X, GripVertical, Trash2, Plus } from "lucide-react";
import { motion, AnimatePresence, Reorder } from "framer-motion";
import { Button } from "@/components/ui/button";
import FlagIcon from "@/components/FlagIcon";
import { getCurrencyName } from "@/lib/currencies";
import { t, type Lang } from "@/lib/i18n";

interface FavoritesManagerProps {
  lang: Lang;
  favorites: string[];
  onReorder: (newOrder: string[]) => void;
  onRemove: (code: string) => void;
  onAddMore: () => void;
  onClose: () => void;
}

export default function FavoritesManager({
  lang, favorites, onReorder, onRemove, onAddMore, onClose,
}: FavoritesManagerProps) {
  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-end sm:items-center justify-center animate-in fade-in duration-150">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 40 }}
        className="w-full max-w-md bg-card border border-border rounded-t-2xl sm:rounded-2xl shadow-xl max-h-[80vh] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h2 className="font-display font-bold text-base text-foreground">
            {lang === "nb" ? "Rediger hurtigvalg" : "Edit quick picks"}
          </h2>
          <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full h-8 w-8">
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Reorderable list */}
        <div className="flex-1 overflow-y-auto px-2 py-2">
          {favorites.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground text-sm">
              {lang === "nb" ? "Ingen hurtigvalg ennå" : "No quick picks yet"}
            </div>
          ) : (
            <Reorder.Group axis="y" values={favorites} onReorder={onReorder} className="space-y-1">
              {favorites.map((code) => (
                <Reorder.Item
                  key={code}
                  value={code}
                  className="flex items-center gap-3 px-3 py-2.5 bg-background border border-border rounded-xl cursor-grab active:cursor-grabbing active:shadow-md transition-shadow"
                >
                  <GripVertical className="h-4 w-4 text-muted-foreground/50 flex-shrink-0" />
                  <FlagIcon currencyCode={code} size={24} />
                  <div className="flex-1 min-w-0">
                    <span className="font-display font-bold text-sm text-foreground">{code}</span>
                    <span className="text-xs text-muted-foreground ml-2">{getCurrencyName(code, lang)}</span>
                  </div>
                  <button
                    onClick={() => onRemove(code)}
                    className="p-1.5 rounded-full hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                    aria-label={`Remove ${code}`}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </Reorder.Item>
              ))}
            </Reorder.Group>
          )}
        </div>

        {/* Add more button */}
        <div className="px-4 py-3 border-t border-border">
          <Button
            variant="outline"
            className="w-full gap-2"
            onClick={onAddMore}
          >
            <Plus className="h-4 w-4" />
            {lang === "nb" ? "Legg til valuta" : "Add currency"}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
