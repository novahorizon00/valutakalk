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
    const parsed = chipsInput.split(/[,\s]+/).map(Number).filter((n) => !isNaN(n) && n > 0).slice(0, 10);
    if (parsed.length > 0) onUpdate({ quickAmounts: parsed });
  };

  const formatAge = () => {
    if (!rates) return t(lang, "never");
    const hrs = Math.floor(getRatesAge(rates.timestamp) / 3_600_000);
    if (hrs < 1) return `< 1 ${t(lang, "hours")}`;
    if (hrs < 24) return `${hrs} ${t(lang, "hours")}`;
    return `${Math.floor(hrs / 24)} ${t(lang, "days")}`;
  };

  const formatExpiry = () => {
    if (!proStatus.expiresAt) return "";
    return new Date(proStatus.expiresAt).toLocaleDateString(lang === "nb" ? "nb-NO" : "en-US", { year: "numeric", month: "short", day: "numeric" });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="gradient-primary px-4 py-3 flex items-center gap-2 text-primary-foreground">
        <Button variant="ghost" size="icon" onClick={onBack} className="text-primary-foreground hover:bg-primary-foreground/10 h-9 w-9">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="font-display text-xl font-bold">{t(lang, "settings")}</h1>
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-5 max-w-lg mx-auto w-full space-y-3">
        {/* Subscription */}
        <Card className={`overflow-hidden ${proStatus.isActive ? "border-primary/30" : "border-border"}`}>
          {!proStatus.isActive && (
            <div className="gradient-primary px-5 py-4 text-primary-foreground">
              <div className="flex items-center gap-2 mb-1">
                <Crown className="h-5 w-5" />
                <span className="font-display font-bold text-base">{t(lang, "proUser")}</span>
              </div>
              <p className="text-xs text-primary-foreground/80">{t(lang, "proDescription")}</p>
              <Button onClick={onUpgrade} size="sm" className="mt-3 bg-primary-foreground text-primary hover:bg-primary-foreground/90 font-semibold text-xs w-full rounded-xl">
                {t(lang, "offlinePaywallCta")}
              </Button>
            </div>
          )}
          {proStatus.isActive && (
            <CardContent className="pt-5 pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Crown className="h-4 w-4 text-primary" />
                  <span className="font-semibold text-sm">{t(lang, "proUser")}</span>
                </div>
                <Badge className="bg-primary/10 text-primary border-primary/20 text-[10px] font-bold">{t(lang, "proActive")}</Badge>
              </div>
              {proStatus.expiresAt && (
                <div className="text-xs text-muted-foreground mt-1.5 ml-6">
                  {proStatus.isTrial && <Badge variant="secondary" className="text-[10px] mr-1 px-1.5 py-0">{t(lang, "proTrial")}</Badge>}
                  {t(lang, "proExpires", { date: formatExpiry() })}
                </div>
              )}
              <Button variant="outline" size="sm" className="text-xs mt-3 ml-6">{t(lang, "proManage")}</Button>
            </CardContent>
          )}
        </Card>

        {/* Language */}
        <Card>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-2 mb-3">
              <Globe className="h-4 w-4 text-muted-foreground" />
              <span className="font-semibold text-sm">{t(lang, "language")}</span>
            </div>
            <div className="flex gap-2">
              <Button variant={lang === "nb" ? "default" : "outline"} size="sm" onClick={() => onUpdate({ language: "nb" })} className="rounded-xl text-xs">
                🇳🇴 {t(lang, "norwegian")}
              </Button>
              <Button variant={lang === "en" ? "default" : "outline"} size="sm" onClick={() => onUpdate({ language: "en" })} className="rounded-xl text-xs">
                🇬🇧 {t(lang, "english")}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Quick amounts */}
        <Card>
          <CardContent className="pt-5 pb-4 space-y-3">
            <span className="font-semibold text-sm">{t(lang, "quickAmounts")}</span>
            <input
              value={chipsInput}
              onChange={(e) => setChipsInput(e.target.value)}
              className="w-full bg-muted border-0 rounded-xl px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="10, 25, 50, 100, 500"
            />
            <Button size="sm" onClick={saveChips} className="rounded-xl text-xs">{t(lang, "save")}</Button>
          </CardContent>
        </Card>

        {/* Auto-refresh interval */}
        <Card>
          <CardContent className="pt-5 pb-4 space-y-3">
            <span className="font-semibold text-sm">{t(lang, "autoRefresh")}</span>
            <div className="flex gap-1.5 flex-wrap">
              {[
                { value: 0, label: t(lang, "autoRefreshOff") },
                { value: 30, label: "30 min" },
                { value: 60, label: "1h" },
                { value: 180, label: "3h" },
                { value: 360, label: "6h" },
              ].map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => onUpdate({ autoRefreshMinutes: opt.value })}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all
                    ${settings.autoRefreshMinutes === opt.value
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                    }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Auto update Wi-Fi */}
        <Card>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="auto-wifi" className="cursor-pointer text-sm">{t(lang, "autoUpdateWifi")}</Label>
              <Switch id="auto-wifi" checked={settings.autoUpdateWifiOnly} onCheckedChange={(v) => onUpdate({ autoUpdateWifiOnly: v })} />
            </div>
          </CardContent>
        </Card>

        {/* Diagnostics */}
        <Card>
          <CardContent className="pt-5 pb-4 space-y-2.5">
            <span className="font-semibold text-sm">{t(lang, "diagnostics")}</span>
            {[
              [t(lang, "lastFetch"), fetchStatus === "error" ? `❌ ${lastError}` : fetchStatus === "success" ? `✅ ${t(lang, "success")}` : "—"],
              [t(lang, "cachedAge"), formatAge()],
              [t(lang, "appVersion"), "1.0.0"],
              [t(lang, "apiProvider"), "open.er-api.com"],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between text-xs">
                <span className="text-muted-foreground">{label}</span>
                <span className="font-medium text-foreground">{value}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Privacy */}
        <Card>
          <CardContent className="pt-5 pb-4">
            <span className="font-semibold text-sm block mb-1">{t(lang, "privacy")}</span>
            <p className="text-xs text-muted-foreground">{t(lang, "privacyText")}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
