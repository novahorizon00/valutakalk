import React from "react";
import { ArrowLeft, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { t, type Lang } from "@/lib/i18n";

interface PrivacyPolicyProps {
  lang: Lang;
  onBack: () => void;
}

export default function PrivacyPolicy({ lang, onBack }: PrivacyPolicyProps) {
  const isNb = lang === "nb";

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="safe-top gradient-primary" />
      <header className="gradient-primary px-4 py-3 flex items-center gap-2 text-primary-foreground">
        <Button variant="ghost" size="icon" onClick={onBack} className="text-primary-foreground hover:bg-primary-foreground/10 h-9 w-9">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="font-display text-xl font-bold">{t(lang, "privacyPolicyTitle")}</h1>
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-5 max-w-lg mx-auto w-full space-y-4">
        <Card>
          <CardContent className="pt-5 pb-4 space-y-4">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              <span className="font-semibold text-base">{t(lang, "privacyPolicyTitle")}</span>
            </div>

            <p className="text-sm text-muted-foreground leading-relaxed">
              {isNb
                ? "Offline FX samler ikke inn, lagrer eller deler noen personlige opplysninger. Appen krever ingen innlogging eller brukerregistrering."
                : "Offline FX does not collect, store, or share any personal information. The app requires no login or user registration."}
            </p>

            <h3 className="font-semibold text-sm mt-3">
              {isNb ? "Data som lagres lokalt" : "Data stored locally"}
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {isNb
                ? "Appen lagrer valutakurser, innstillinger, favoritter og konverteringshistorikk kun lokalt på din enhet. Disse dataene forlater aldri enheten din og deles ikke med noen tredjeparter."
                : "The app stores exchange rates, settings, favorites, and conversion history only locally on your device. This data never leaves your device and is not shared with any third parties."}
            </p>

            <h3 className="font-semibold text-sm mt-3">
              {isNb ? "Nettverkstilkoblinger" : "Network connections"}
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {isNb
                ? "Appen kobler seg kun til internett for å hente oppdaterte valutakurser fra open.er-api.com. Ingen personlig informasjon sendes med disse forespørslene."
                : "The app only connects to the internet to fetch updated exchange rates from open.er-api.com. No personal information is sent with these requests."}
            </p>

            <h3 className="font-semibold text-sm mt-3">
              {isNb ? "Abonnement" : "Subscriptions"}
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {isNb
                ? "Kjøp og abonnementer håndteres av Apple via App Store. Vi har ikke tilgang til betalingsinformasjonen din."
                : "Purchases and subscriptions are handled by Apple via the App Store. We do not have access to your payment information."}
            </p>

            <h3 className="font-semibold text-sm mt-3">
              {isNb ? "Datakilde" : "Data source"}
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {isNb
                ? "Valutakursene i appen hentes fra ExchangeRate-API (open.er-api.com), en gratis og åpen API-tjeneste som leverer daglig oppdaterte valutakurser. Kursene er veiledende og kan avvike fra faktiske bank- eller markedskurser."
                : "Exchange rates in the app are fetched from ExchangeRate-API (open.er-api.com), a free and open API service providing daily updated exchange rates. Rates are indicative and may differ from actual bank or market rates."}
            </p>

            <h3 className="font-semibold text-sm mt-3">
              {isNb ? "Kontakt" : "Contact"}
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {isNb
                ? "Har du spørsmål om personvern? Kontakt oss på valutakalk@gmail.com."
                : "Questions about privacy? Contact us at valutakalk@gmail.com."}
            </p>
          </CardContent>
        </Card>

        <p className="text-center text-[10px] text-muted-foreground/50 pb-2 safe-bottom">
          🇳🇴 {isNb ? "Utviklet i Norge" : "Developed in Norway"}
        </p>
      </div>
    </div>
  );
}
