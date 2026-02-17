import React, { useState, useMemo } from "react";
import { ArrowLeft, Smartphone, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import FlagIcon from "@/components/FlagIcon";
import { currencies, COMMON_CURRENCY_CODES, getCurrencyName } from "@/lib/currencies";
import { t, type Lang } from "@/lib/i18n";

export interface WidgetConfig {
  currency1: string;
  currency2: string;
}

interface WidgetSetupProps {
  lang: Lang;
  config: WidgetConfig;
  onSave: (config: WidgetConfig) => void;
  onBack: () => void;
}

type EditingSlot = "currency1" | "currency2" | null;

export default function WidgetSetup({ lang, config, onSave, onBack }: WidgetSetupProps) {
  const [c1, setC1] = useState(config.currency1);
  const [c2, setC2] = useState(config.currency2);
  const [editing, setEditing] = useState<EditingSlot>(null);
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    const exclude = editing === "currency1" ? c2 : c1;
    return currencies
      .filter((c) => c.code !== exclude)
      .filter((c) => !q || c.code.toLowerCase().includes(q) || c.name.toLowerCase().includes(q) || c.nameNb.toLowerCase().includes(q))
      .slice(0, 40);
  }, [search, editing, c1, c2]);

  const handleSelect = (code: string) => {
    if (editing === "currency1") setC1(code);
    else if (editing === "currency2") setC2(code);
    setEditing(null);
    setSearch("");
  };

  const handleSave = () => {
    onSave({ currency1: c1, currency2: c2 });
    onBack();
  };

  const nb = lang === "nb";

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="gradient-primary px-4 py-3 flex items-center gap-2 text-primary-foreground">
        <Button variant="ghost" size="icon" onClick={onBack} className="text-primary-foreground hover:bg-primary-foreground/10 h-9 w-9">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="font-display text-xl font-bold">{nb ? "Widget-oppsett" : "Widget Setup"}</h1>
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-5 max-w-lg mx-auto w-full space-y-4">
        {/* Info */}
        <Card>
          <CardContent className="pt-5 pb-4 flex items-start gap-3">
            <Smartphone className="h-8 w-8 text-primary flex-shrink-0 mt-0.5" />
            <div>
              <h2 className="font-semibold text-sm text-foreground mb-1">
                {nb ? "Hjemskjerm-widget" : "Home Screen Widget"}
              </h2>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {nb
                  ? "Velg to valutaer som vises i widgeten på hjemskjermen din. Widgeten viser gjeldende kurs mellom de valgte valutaene og oppdateres automatisk."
                  : "Choose two currencies to display in your home screen widget. The widget shows the current rate between the selected currencies and updates automatically."}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Currency slots */}
        {(["currency1", "currency2"] as const).map((slot, i) => {
          const code = slot === "currency1" ? c1 : c2;
          const isEditing = editing === slot;
          return (
            <Card key={slot} className={isEditing ? "border-primary/40" : ""}>
              <CardContent className="pt-4 pb-3">
                <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">
                  {nb ? `Valuta ${i + 1}` : `Currency ${i + 1}`}
                </div>
                <button
                  onClick={() => { setEditing(isEditing ? null : slot); setSearch(""); }}
                  className="w-full flex items-center gap-3 text-left group"
                >
                  <FlagIcon currencyCode={code} size={28} />
                  <div className="flex-1">
                    <span className="text-sm font-bold text-foreground">{code}</span>
                    <span className="text-xs text-muted-foreground ml-2">{getCurrencyName(code, lang)}</span>
                  </div>
                  <span className="text-xs text-primary font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                    {nb ? "Endre" : "Change"}
                  </span>
                </button>
              </CardContent>

              {isEditing && (
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
                    <button onClick={() => { setEditing(null); setSearch(""); }} className="p-1 rounded-full hover:bg-muted transition-colors">
                      <X className="h-3 w-3 text-muted-foreground" />
                    </button>
                  </div>
                  {!search && (
                    <div className="px-3 pb-1.5 flex gap-1.5 flex-wrap">
                      {COMMON_CURRENCY_CODES.filter((c) => c !== (slot === "currency1" ? c2 : c1)).slice(0, 8).map((cc) => (
                        <button key={cc} onClick={() => handleSelect(cc)} className="flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-semibold bg-muted text-muted-foreground hover:bg-primary/10 hover:text-primary transition-all">
                          <FlagIcon currencyCode={cc} size={14} />
                          {cc}
                        </button>
                      ))}
                    </div>
                  )}
                  <div className="max-h-[30vh] overflow-y-auto divide-y divide-border/50">
                    {filtered.map((c) => (
                      <button key={c.code} onClick={() => handleSelect(c.code)} className="w-full flex items-center gap-2.5 px-3 py-2 text-left hover:bg-muted/40 transition-colors">
                        <FlagIcon currencyCode={c.code} size={18} />
                        <span className="text-[11px] font-semibold text-foreground">{c.code}</span>
                        <span className="text-[10px] text-muted-foreground truncate">{getCurrencyName(c.code, lang)}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          );
        })}

        {/* Preview */}
        <Card className="border-primary/20">
          <CardContent className="pt-4 pb-4">
            <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-3">
              {nb ? "Widget-forhåndsvisning" : "Widget Preview"}
            </div>
            <div className="bg-muted/50 rounded-2xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FlagIcon currencyCode={c1} size={24} />
                <span className="font-display font-bold text-sm text-foreground">{c1}</span>
              </div>
              <span className="text-xs text-muted-foreground font-mono">⇄</span>
              <div className="flex items-center gap-2">
                <span className="font-display font-bold text-sm text-foreground">{c2}</span>
                <FlagIcon currencyCode={c2} size={24} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Instructions */}
        <Card>
          <CardContent className="pt-4 pb-4 space-y-2">
            <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
              {nb ? "Slik legger du til widgeten" : "How to add the widget"}
            </div>
            <div className="space-y-1.5">
              {(nb
                ? [
                    "Hold inne på hjemskjermen til ikonene rister",
                    "Trykk på +-knappen øverst til venstre",
                    "Søk etter «Offline FX»",
                    "Velg widgetstørrelsen og trykk «Legg til widget»",
                  ]
                : [
                    "Long press on your home screen until icons jiggle",
                    "Tap the + button in the top left",
                    "Search for \"Offline FX\"",
                    "Choose widget size and tap \"Add Widget\"",
                  ]
              ).map((step, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/10 text-primary text-[10px] font-bold flex items-center justify-center">
                    {i + 1}
                  </span>
                  <span className="text-xs text-muted-foreground leading-relaxed">{step}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Button onClick={handleSave} className="w-full rounded-xl font-semibold">
          {nb ? "Lagre widget-innstillinger" : "Save Widget Settings"}
        </Button>
      </div>
    </div>
  );
}
