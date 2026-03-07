"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export default function ExpectancyWidget() {
  const [expectancy, setExpectancy] = useState(45.6);

  useEffect(() => {
    fetch("/api/widget-data?fields=stats")
      .then((r) => r.json())
      .then((data) => { if (data.stats?.expectancy != null) setExpectancy(data.stats.expectancy); })
      .catch(() => {});
  }, []);

  const isPositive = expectancy >= 0;

  return (
    <div className="relative rounded-xl border border-white/5 bg-card p-4 transition-all duration-200 card-glow h-full">
      <p className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Expectancy</p>
      <p className={cn("text-2xl font-bold", isPositive ? "text-positive" : "text-destructive")}>
        {isPositive ? "+" : ""}${Math.abs(expectancy).toFixed(2)}
      </p>
      <p className="mt-0.5 text-xs text-muted-foreground">Expected $ per trade</p>
    </div>
  );
}
