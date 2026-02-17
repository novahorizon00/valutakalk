import React, { useState } from "react";
import { ArrowLeft, Globe, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { t, type Lang } from "@/lib/i18n";
import { getRatesAge } from "@/lib/rateService";
import type { UserSettings, CachedRates } from "@/lib/storage";
import type { ProSubscription } from "@/lib/proSubscription";
import type { FetchStatus } from "@/hooks/useAppState";

interface SettingsViewProps {
  settings: UserSettings;
  lang: Lang;
  fetchStatus: FetchStatus;
  lastError: string | null;
  rates: CachedRates | null;
  proStatus: ProSubscription;
  onBack: () => void;
  onUpdate: (partial: Partial<UserSettings>) => void;
  onUpgrade: () => void;
}

export default function SettingsView({
  settings, lang, fetchStatus, lastError, rates, proStatus, onBack, onUpdate, onUpgrade,
}: SettingsViewProps) {
  const [chipsInput, setChipsInput] = useState(settings.quickAmounts.join(", "));

  const saveChips = () => {
    const parsed = chipsInput
      .split(/[,\s]+/)
      .map(Number)
      .filter((n) => !isNaN(n) && n > 0)
      .slice(0, 10);
    if (parsed.length > 0) {
      onUpdate({ quickAmounts: parsed });
    }
  };

  const formatAge = () => {
    if (!rates) return t(lang, "never");
    const ageMs = getRatesAge(rates.timestamp);
    const hrs = Math.floor(ageMs / 3_600_000);
    if (hrs < 1) return `< 1 ${t(lang, "hours")}`;
    if (hrs < 24) return `${hrs} ${t(lang, "hours")}`;
    return `${Math.floor(hrs / 24)} ${t(lang, "days")}`;
  };

  const formatExpiry = () => {
    if (!proStatus.expiresAt) return "";
    return new Date(proStatus.expiresAt).toLocaleDateString(lang === "nb" ? "nb-NO" : "en-US", {
      year: "numeric", month: "short", day: "numeric",
    });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="flex items-center gap-2 px-4 py-3 border-b border-border">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="font-display text-xl font-bold">{t(lang, "settings")}</h1>
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-5 max-w-lg mx-auto w-full space-y-4">
        {/* Subscription */}
        <Card className={proStatus.isActive ? "border-primary/30 bg-primary/5" : ""}>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Crown className={`h-4 w-4 ${proStatus.isActive ? "text-primary" : "text-muted-foreground"}`} />
              {t(lang, "subscription")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-foreground">
                  {proStatus.isActive ? t(lang, "proUser") : t(lang, "freeUser")}
                </div>
                {proStatus.isActive && proStatus.expiresAt && (
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {proStatus.isTrial && (
                      <Badge variant="secondary" className="text-[10px] mr-1.5 px-1.5 py-0">
                        {t(lang, "proTrial")}
                      </Badge>
                    )}
                    {t(lang, "proExpires", { date: formatExpiry() })}
                  </div>
                )}
              </div>
              {proStatus.isActive && (
                <Badge className="bg-primary/15 text-primary border-primary/25 text-xs">
                  {t(lang, "proActive")}
                </Badge>
              )}
            </div>
            {!proStatus.isActive && (
              <>
                <p className="text-sm text-muted-foreground">
                  {t(lang, "proDescription")}
                </p>
                <Button onClick={onUpgrade} className="w-full" size="sm">
                  {t(lang, "offlinePaywallCta")}
                </Button>
              </>
            )}
            {proStatus.isActive && (
              <Button variant="outline" size="sm" className="text-xs">
                {t(lang, "proManage")}
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Language */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Globe className="h-4 w-4" />
              {t(lang, "language")}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex gap-2">
            <Button
              variant={lang === "nb" ? "default" : "outline"}
              size="sm"
              onClick={() => onUpdate({ language: "nb" })}
            >
              🇳🇴 {t(lang, "norwegian")}
            </Button>
            <Button
              variant={lang === "en" ? "default" : "outline"}
              size="sm"
              onClick={() => onUpdate({ language: "en" })}
            >
              🇬🇧 {t(lang, "english")}
            </Button>
          </CardContent>
        </Card>

        {/* Quick amounts */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{t(lang, "quickAmounts")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <input
              value={chipsInput}
              onChange={(e) => setChipsInput(e.target.value)}
              className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground"
              placeholder="10, 25, 50, 100, 500"
            />
            <Button size="sm" onClick={saveChips}>{t(lang, "save")}</Button>
          </CardContent>
        </Card>

        {/* Auto update */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <Label htmlFor="auto-wifi" className="cursor-pointer">
                {t(lang, "autoUpdateWifi")}
              </Label>
              <Switch
                id="auto-wifi"
                checked={settings.autoUpdateWifiOnly}
                onCheckedChange={(v) => onUpdate({ autoUpdateWifiOnly: v })}
              />
            </div>
          </CardContent>
        </Card>

        {/* Diagnostics */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{t(lang, "diagnostics")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t(lang, "lastFetch")}</span>
              <span className="font-medium">
                {fetchStatus === "error" ? `❌ ${lastError}` : fetchStatus === "success" ? `✅ ${t(lang, "success")}` : "—"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t(lang, "cachedAge")}</span>
              <span className="font-medium">{formatAge()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t(lang, "appVersion")}</span>
              <span className="font-medium">1.0.0</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t(lang, "apiProvider")}</span>
              <span className="font-medium text-xs">open.er-api.com</span>
            </div>
          </CardContent>
        </Card>

        {/* Privacy */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{t(lang, "privacy")}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{t(lang, "privacyText")}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
