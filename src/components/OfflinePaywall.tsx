import React from "react";
import { Plane } from "lucide-react";
import { Button } from "@/components/ui/button";
import { t, type Lang } from "@/lib/i18n";

interface OfflinePaywallProps {
  lang: Lang;
  onUpgrade: () => void;
}

export default function OfflinePaywall({ lang, onUpgrade }: OfflinePaywallProps) {
  return (
    <div className="rounded-2xl overflow-hidden">
      <div className="gradient-primary p-6 text-primary-foreground text-center space-y-3">
        <div className="mx-auto w-12 h-12 rounded-full bg-primary-foreground/15 backdrop-blur-sm flex items-center justify-center">
          <Plane className="h-6 w-6" />
        </div>
        <div>
          <h3 className="font-display text-lg font-bold">{t(lang, "offlinePaywallTitle")}</h3>
          <p className="text-sm text-primary-foreground/80 mt-1">{t(lang, "offlinePaywallSubtitle")}</p>
        </div>
        <p className="text-xs text-primary-foreground/70">{t(lang, "proDescription")}</p>
        <Button
          onClick={onUpgrade}
          className="w-full py-5 text-sm font-bold rounded-xl bg-primary-foreground text-primary hover:bg-primary-foreground/90 shadow-lg"
          size="lg"
        >
          {t(lang, "offlinePaywallCta")}
        </Button>
      </div>
    </div>
  );
}
