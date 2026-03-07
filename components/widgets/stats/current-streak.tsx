"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { Flame } from "lucide-react";

export default function CurrentStreakWidget() {
  const [type, setType] = useState<"win" | "loss">("win");
  const [count, setCount] = useState(3);

  useEffect(() => {
    fetch("/api/widget-data?fields=stats")
      .then((r) => r.json())
      .then((data) => {
        if (data.stats?.currentStreak) {
          setType(data.stats.currentStreak.type);
          setCount(data.stats.currentStreak.count);
        }
      })
      .catch(() => {});
  }, []);

  const isWin = type === "win";

  return (
    <div className="relative rounded-xl border border-white/5 bg-card p-4 transition-all duration-200 card-glow h-full">
      <p className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Current Streak</p>
      <div className="flex items-center gap-2">
        <Flame className={cn("h-6 w-6", isWin ? "text-positive" : "text-destructive")} />
        <p className={cn("text-2xl font-bold", isWin ? "text-positive" : "text-destructive")}>{count}</p>
      </div>
      <p className="mt-0.5 text-xs text-muted-foreground">{isWin ? "Winning" : "Losing"} streak</p>
    </div>
  );
}
