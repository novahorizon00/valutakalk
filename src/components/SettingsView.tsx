import React, { useState } from "react";
import { ArrowLeft, Globe, Crown, Sun, Moon, Monitor, Smartphone, RotateCcw } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
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
  onRestore: () => void;
  onOpenWidget: () => void;
  onOpenPrivacy: () => void;
}

export default function SettingsView({
  settings, lang, fetchStatus, lastError, rates, proStatus, onBack, onUpdate, onUpgrade, onRestore, onOpenWidget, onOpenPrivacy,
}: SettingsViewProps) {
  const [chipsInput, setChipsInput] = useState(settings.quickAmounts.join(", "));
  const { theme, setTheme } = useTheme();

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

  const themeOptions = [
    { value: "light", icon: Sun, label: t(lang, "lightMode") },
    { value: "dark", icon: Moon, label: t(lang, "darkMode") },
    { value: "system", icon: Monitor, label: t(lang, "systemMode") },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="safe-top gradient-primary" />
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
              <p className="text-[10px] text-primary-foreground/70 mt-2">
                {lang === "nb"
                  ? "9 kr/måned · Fornyes automatisk · 7 dager gratis prøveperiode"
                  : "9 NOK/month · Auto-renews · 7-day free trial"}
              </p>
              <Button onClick={onUpgrade} size="sm" className="mt-3 bg-primary-foreground text-primary hover:bg-primary-foreground/90 font-semibold text-xs w-full rounded-xl">
                {t(lang, "offlinePaywallCta")}
              </Button>
              <Button onClick={onRestore} variant="ghost" size="sm" className="mt-2 text-primary-foreground/70 hover:text-primary-foreground hover:bg-primary-foreground/10 text-xs w-full rounded-xl gap-1.5">
                <RotateCcw className="h-3 w-3" />
                {t(lang, "proRestore")}
              </Button>
              <div className="flex items-center justify-center gap-3 text-[10px] text-primary-foreground/50 mt-3">
                <a href="https://www.apple.com/legal/internet-services/itunes/dev/stdeula/" target="_blank" rel="noopener noreferrer" className="underline hover:text-primary-foreground/70">
                  {t(lang, "termsOfUse")}
                </a>
                <span>·</span>
                <button onClick={onOpenPrivacy} className="underline hover:text-primary-foreground/70">
                  {t(lang, "privacyPolicyTitle")}
                </button>
              </div>
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
              <Button
                variant="outline"
                size="sm"
                className="text-xs mt-3 ml-6"
                onClick={(e) => {
                  e.stopPropagation();
                  window.open("https://apps.apple.com/account/subscriptions", "_blank");
                }}
              >
                {t(lang, "proManage")}
              </Button>
            </CardContent>
          )}
        </Card>

        {/* Theme / Dark mode */}
        <Card>
          <CardContent className="pt-5 pb-4 space-y-3">
            <div className="flex items-center gap-2">
              <Sun className="h-4 w-4 text-muted-foreground" />
              <span className="font-semibold text-sm">{t(lang, "theme")}</span>
            </div>
            <div className="flex gap-1.5">
              {themeOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setTheme(opt.value)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all
                    ${theme === opt.value
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                    }`}
                >
                  <opt.icon className="h-3.5 w-3.5" />
                  {opt.label}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Widget setup – Pro only */}
        {proStatus.isActive && (
          <Card className="cursor-pointer hover:border-primary/30 transition-colors" onClick={onOpenWidget}>
            <CardContent className="pt-5 pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Smartphone className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <span className="font-semibold text-sm block">{t(lang, "widgetSetup")}</span>
                    <span className="text-xs text-muted-foreground">{t(lang, "widgetDescription")}</span>
                  </div>
                </div>
                <Badge className="bg-primary/10 text-primary border-primary/20 text-[10px] font-bold">PRO</Badge>
              </div>
            </CardContent>
          </Card>
        )}

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
        <Card className="cursor-pointer hover:border-primary/30 transition-colors" onClick={onOpenPrivacy}>
          <CardContent className="pt-5 pb-4">
            <span className="font-semibold text-sm block mb-1">{t(lang, "privacy")}</span>
            <p className="text-xs text-muted-foreground">{t(lang, "privacyText")}</p>
            <span className="text-xs text-primary font-medium mt-2 block">{t(lang, "privacyPolicyLink")} →</span>
          </CardContent>
        </Card>

        <p className="text-center text-[10px] text-muted-foreground/50 pb-2 safe-bottom">🇳🇴 {lang === "nb" ? "Utviklet i Norge" : "Developed in Norway"}</p>
      </div>
    </div>
  );
}
