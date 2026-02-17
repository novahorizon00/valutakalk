import React from "react";
import { WifiOff, Plane } from "lucide-react";
import { Button } from "@/components/ui/button";
import { t, type Lang } from "@/lib/i18n";

interface OfflinePaywallProps {
  lang: Lang;
  onUpgrade: () => void;
}

export default function OfflinePaywall({ lang, onUpgrade }: OfflinePaywallProps) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6 text-center space-y-4 mx-auto max-w-sm">
      <div className="mx-auto w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
        <Plane className="h-7 w-7 text-primary" />
      </div>
      <div>
        <h3 className="font-display text-lg font-bold text-foreground">
          {t(lang, "offlinePaywallTitle")}
        </h3>
        <p className="text-sm text-muted-foreground mt-1">
          {t(lang, "offlinePaywallSubtitle")}
        </p>
      </div>
      <p className="text-sm text-muted-foreground">
        {t(lang, "proDescription")}
      </p>
      <Button
        onClick={onUpgrade}
        className="w-full py-5 text-sm font-semibold rounded-xl"
        size="lg"
      >
        {t(lang, "offlinePaywallCta")}
      </Button>
    </div>
  );
}
