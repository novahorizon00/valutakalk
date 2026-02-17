import React from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface RateChangeIndicatorProps {
  currentRate: number | null;
  previousRate?: number | null;
  size?: "sm" | "md";
}

export default function RateChangeIndicator({ currentRate, previousRate, size = "sm" }: RateChangeIndicatorProps) {
  if (!currentRate || !previousRate || previousRate === 0) return null;

  const change = ((currentRate - previousRate) / previousRate) * 100;
  const isUp = change > 0.01;
  const isDown = change < -0.01;

  const sizeClasses = size === "sm" ? "text-[10px] gap-0.5" : "text-xs gap-1";
  const iconSize = size === "sm" ? "h-2.5 w-2.5" : "h-3 w-3";

  return (
    <span className={`inline-flex items-center font-semibold ${sizeClasses} ${
      isUp ? "text-green-600 dark:text-green-400" : isDown ? "text-destructive" : "text-muted-foreground"
    }`}>
      {isUp ? <TrendingUp className={iconSize} /> : isDown ? <TrendingDown className={iconSize} /> : <Minus className={iconSize} />}
      {isUp ? "+" : ""}{change.toFixed(2)}%
    </span>
  );
}
