import React from "react";
import { Plane, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { t, type Lang } from "@/lib/i18n";

interface OfflinePaywallProps {
  lang: Lang;
  onUpgrade: () => void;
  onRestore: () => void;
  onOpenPrivacy?: () => void;
}

export default function OfflinePaywall({ lang, onUpgrade, onRestore, onOpenPrivacy }: OfflinePaywallProps) {
  const isNb = lang === "nb";

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

        {/* Price & duration */}
        <div className="text-xs text-primary-foreground/90 font-medium">
          {isNb
            ? "9 kr/måned · Fornyes automatisk · 7 dager gratis prøveperiode"
            : "9 NOK/month · Auto-renews · 7-day free trial"}
        </div>

        <Button
          onClick={onUpgrade}
          className="w-full py-5 text-sm font-bold rounded-xl bg-primary-foreground text-primary hover:bg-primary-foreground/90 shadow-lg h-auto whitespace-normal leading-snug"
          size="lg"
        >
          {t(lang, "offlinePaywallCta")}
        </Button>

        <Button
          onClick={onRestore}
          variant="ghost"
          size="sm"
          className="w-full text-primary-foreground/70 hover:text-primary-foreground hover:bg-primary-foreground/10 text-xs rounded-xl gap-1.5"
        >
          <RotateCcw className="h-3 w-3" />
          {t(lang, "proRestore")}
        </Button>

        {/* Terms & Privacy links */}
        <div className="flex items-center justify-center gap-3 text-[10px] text-primary-foreground/60">
          <a
            href="https://www.apple.com/legal/internet-services/itunes/dev/stdeula/"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-primary-foreground/80"
          >
            {t(lang, "termsOfUse")}
          </a>
          <span>·</span>
          {onOpenPrivacy ? (
            <button onClick={onOpenPrivacy} className="underline hover:text-primary-foreground/80">
              {t(lang, "privacyPolicyTitle")}
            </button>
          ) : (
            <span>{t(lang, "privacyPolicyTitle")}</span>
          )}
        </div>
      </div>
    </div>
  );
}
