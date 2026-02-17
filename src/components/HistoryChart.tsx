import React, { useState, useEffect, useMemo } from "react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { WifiOff, TrendingUp, TrendingDown, Minus } from "lucide-react";
import FlagIcon from "@/components/FlagIcon";
import { getCurrencyName } from "@/lib/currencies";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import {
  getCachedHistorical,
  saveHistorical,
  isHistoricalStale,
  type HistoricalPoint,
  type CachedHistoricalRates,
} from "@/lib/historicalRates";
import { t, type Lang } from "@/lib/i18n";

const PERIOD_OPTIONS = [
  { label: "24t", days: 1 },
  { label: "7d", days: 7 },
  { label: "30d", days: 30 },
  { label: "90d", days: 90 },
  { label: "1 år", days: 365 },
];

const PERIOD_OPTIONS_EN = [
  { label: "24h", days: 1 },
  { label: "7d", days: 7 },
  { label: "30d", days: 30 },
  { label: "90d", days: 90 },
  { label: "1y", days: 365 },
];

interface HistoryChartProps {
  lang: Lang;
  baseCurrency: string;
  targetCurrency: string;
  isOnline: boolean;
  compareCurrencies?: string[];
}

export default function HistoryChart({
  lang,
  baseCurrency,
  targetCurrency,
  isOnline,
  compareCurrencies,
}: HistoryChartProps) {
  const [days, setDays] = useState(30);
  const [data, setData] = useState<HistoricalPoint[]>([]);
  const [compareData, setCompareData] = useState<Record<string, HistoricalPoint[]>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fromCache, setFromCache] = useState(false);

  const periods = lang === "nb" ? PERIOD_OPTIONS : PERIOD_OPTIONS_EN;

  // Fetch data for the main pair
  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      setFromCache(false);

      // Check cache first
      const cached = await getCachedHistorical(baseCurrency, targetCurrency, days);
      if (cached && !isHistoricalStale(cached.fetchedAt)) {
        if (!cancelled) {
          setData(cached.points);
          setLoading(false);
        }
        return;
      }

      if (!isOnline) {
        // Use stale cache if offline
        if (cached) {
          if (!cancelled) {
            setData(cached.points);
            setFromCache(true);
            setLoading(false);
          }
          return;
        }
        if (!cancelled) {
          setError(lang === "nb" ? "Ingen tilkoblet – ingen bufrede data" : "Offline – no cached data");
          setLoading(false);
        }
        return;
      }

      try {
        const { data: respData, error: fnError } = await supabase.functions.invoke(
          "fetch-historical-rates",
          { body: { base: baseCurrency, target: targetCurrency, days } }
        );

        if (fnError) throw new Error(fnError.message);
        if (respData?.error) throw new Error(respData.error);

        const points: HistoricalPoint[] = respData.points ?? [];
        if (!cancelled) {
          setData(points);
          // Cache
          await saveHistorical({
            base: baseCurrency,
            target: targetCurrency,
            days,
            points,
            fetchedAt: Date.now(),
          });
        }
      } catch (err: unknown) {
        // Fallback to stale cache
        if (cached) {
          if (!cancelled) {
            setData(cached.points);
            setFromCache(true);
          }
        } else {
          if (!cancelled) setError(err instanceof Error ? err.message : "Error");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [baseCurrency, targetCurrency, days, isOnline, lang]);

  // Fetch compare currencies data
  useEffect(() => {
    if (!compareCurrencies?.length) {
      setCompareData({});
      return;
    }

    let cancelled = false;

    async function loadCompare() {
      const results: Record<string, HistoricalPoint[]> = {};

      for (const cur of compareCurrencies!) {
        const cached = await getCachedHistorical(baseCurrency, cur, days);
        if (cached && !isHistoricalStale(cached.fetchedAt)) {
          results[cur] = cached.points;
          continue;
        }

        if (!isOnline) {
          if (cached) results[cur] = cached.points;
          continue;
        }

        try {
          const { data: respData, error: fnError } = await supabase.functions.invoke(
            "fetch-historical-rates",
            { body: { base: baseCurrency, target: cur, days } }
          );
          if (!fnError && respData?.points) {
            results[cur] = respData.points;
            await saveHistorical({
              base: baseCurrency,
              target: cur,
              days,
              points: respData.points,
              fetchedAt: Date.now(),
            });
          } else if (cached) {
            results[cur] = cached.points;
          }
        } catch {
          if (cached) results[cur] = cached.points;
        }
      }

      if (!cancelled) setCompareData(results);
    }

    loadCompare();
    return () => { cancelled = true; };
  }, [baseCurrency, compareCurrencies, days, isOnline]);

  // Stats
  const stats = useMemo(() => {
    if (data.length < 2) return null;
    const first = data[0].rate;
    const last = data[data.length - 1].rate;
    const min = Math.min(...data.map((d) => d.rate));
    const max = Math.max(...data.map((d) => d.rate));
    const change = ((last - first) / first) * 100;
    return { first, last, min, max, change };
  }, [data]);

  const COLORS = ["hsl(var(--primary))", "hsl(var(--accent))", "hsl(38, 92%, 50%)", "hsl(330, 60%, 50%)", "hsl(152, 60%, 42%)"];

  // Merge compare data for multi-line chart
  const mergedChartData = useMemo(() => {
    if (!compareCurrencies?.length) return data.map((p) => ({ date: p.date, [targetCurrency]: p.rate }));

    const dateMap: Record<string, Record<string, number>> = {};

    // Add main target
    for (const p of data) {
      if (!dateMap[p.date]) dateMap[p.date] = {};
      dateMap[p.date][targetCurrency] = p.rate;
    }

    // Add compare currencies
    for (const [cur, points] of Object.entries(compareData)) {
      for (const p of points) {
        if (!dateMap[p.date]) dateMap[p.date] = {};
        dateMap[p.date][cur] = p.rate;
      }
    }

    return Object.entries(dateMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, rates]) => ({ date, ...rates }));
  }, [data, compareData, compareCurrencies, targetCurrency]);

  const allCurrencies = useMemo(() => {
    const list = [targetCurrency];
    if (compareCurrencies?.length) list.push(...compareCurrencies.filter((c) => compareData[c]?.length));
    return list;
  }, [targetCurrency, compareCurrencies, compareData]);

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    if (days <= 7) return d.toLocaleDateString(lang === "nb" ? "nb-NO" : "en-US", { day: "numeric", month: "short" });
    if (days <= 90) return d.toLocaleDateString(lang === "nb" ? "nb-NO" : "en-US", { day: "numeric", month: "short" });
    return d.toLocaleDateString(lang === "nb" ? "nb-NO" : "en-US", { month: "short", year: "2-digit" });
  };

  return (
    <div className="space-y-3 px-4 py-3">
      {/* Period selector */}
      <div className="flex gap-1">
        {periods.map((p) => (
          <button
            key={p.days}
            onClick={() => setDays(p.days)}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all ${
              days === p.days
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Offline badge */}
      {fromCache && (
        <Badge variant="secondary" className="text-[10px] gap-1">
          <WifiOff className="h-2.5 w-2.5" />
          {lang === "nb" ? "Bufrede data" : "Cached data"}
        </Badge>
      )}

      {/* Chart */}
      {loading ? (
        <div className="h-[180px] flex items-center justify-center">
          <div className="animate-pulse-soft text-xs text-muted-foreground">
            {lang === "nb" ? "Laster historikk..." : "Loading history..."}
          </div>
        </div>
      ) : error ? (
        <div className="h-[180px] flex items-center justify-center">
          <p className="text-xs text-destructive">{error}</p>
        </div>
      ) : mergedChartData.length > 0 ? (
        <div className="h-[180px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={mergedChartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
              <defs>
                {allCurrencies.map((cur, i) => (
                  <linearGradient key={cur} id={`grad-${cur}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={COLORS[i % COLORS.length]} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={COLORS[i % COLORS.length]} stopOpacity={0} />
                  </linearGradient>
                ))}
              </defs>
              <XAxis
                dataKey="date"
                tickFormatter={formatDate}
                tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }}
                axisLine={false}
                tickLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                domain={["auto", "auto"]}
                tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }}
                axisLine={false}
                tickLine={false}
                width={50}
                tickFormatter={(v: number) => v >= 1 ? v.toFixed(2) : v.toFixed(4)}
              />
              <Tooltip
                contentStyle={{
                  background: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "0.75rem",
                  fontSize: "11px",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                }}
                labelFormatter={formatDate}
                formatter={(value: number, name: string) => [
                  value >= 1 ? value.toFixed(4) : value.toFixed(6),
                  name,
                ]}
              />
              {allCurrencies.map((cur, i) => (
                <Area
                  key={cur}
                  type="monotone"
                  dataKey={cur}
                  stroke={COLORS[i % COLORS.length]}
                  strokeWidth={2}
                  fill={`url(#grad-${cur})`}
                  dot={false}
                  activeDot={{ r: 3, strokeWidth: 0 }}
                />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="h-[180px] flex items-center justify-center">
          <p className="text-xs text-muted-foreground">
            {lang === "nb" ? "Ingen data tilgjengelig" : "No data available"}
          </p>
        </div>
      )}

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-muted/40 rounded-xl px-3 py-2">
            <div className="text-[10px] text-muted-foreground font-medium mb-0.5">
              {lang === "nb" ? "Endring" : "Change"}
            </div>
            <div className={`flex items-center gap-1 text-xs font-bold ${
              stats.change > 0 ? "text-green-600 dark:text-green-400" : stats.change < 0 ? "text-destructive" : "text-muted-foreground"
            }`}>
              {stats.change > 0 ? <TrendingUp className="h-3 w-3" /> : stats.change < 0 ? <TrendingDown className="h-3 w-3" /> : <Minus className="h-3 w-3" />}
              {stats.change > 0 ? "+" : ""}{stats.change.toFixed(2)}%
            </div>
          </div>
          <div className="bg-muted/40 rounded-xl px-3 py-2">
            <div className="text-[10px] text-muted-foreground font-medium mb-0.5">
              {lang === "nb" ? "Nåværende" : "Current"}
            </div>
            <div className="text-xs font-bold text-foreground font-mono">
              {stats.last >= 1 ? stats.last.toFixed(4) : stats.last.toFixed(6)}
            </div>
          </div>
          <div className="bg-muted/40 rounded-xl px-3 py-2">
            <div className="text-[10px] text-muted-foreground font-medium mb-0.5">Min</div>
            <div className="text-xs font-medium text-foreground font-mono">
              {stats.min >= 1 ? stats.min.toFixed(4) : stats.min.toFixed(6)}
            </div>
          </div>
          <div className="bg-muted/40 rounded-xl px-3 py-2">
            <div className="text-[10px] text-muted-foreground font-medium mb-0.5">Max</div>
            <div className="text-xs font-medium text-foreground font-mono">
              {stats.max >= 1 ? stats.max.toFixed(4) : stats.max.toFixed(6)}
            </div>
          </div>
        </div>
      )}

      {/* Legend for compare mode */}
      {allCurrencies.length > 1 && (
        <div className="flex gap-2 flex-wrap">
          {allCurrencies.map((cur, i) => (
            <div key={cur} className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
              <FlagIcon currencyCode={cur} size={14} />
              <span className="text-[10px] font-semibold text-foreground">{cur}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
