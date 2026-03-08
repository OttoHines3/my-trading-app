"use client";

import { cn } from "@/lib/utils";
import { Flame } from "lucide-react";
import { useWidgetFetch } from "@/lib/hooks/use-widget-fetch";

export default function CurrentStreakWidget() {
  const { data } = useWidgetFetch("/api/widget-data?fields=stats", { stats: null as { currentStreak?: { type: "win" | "loss"; count: number } } | null });
  const type = data.stats?.currentStreak?.type ?? "win";
  const count = data.stats?.currentStreak?.count ?? 3;

  const isWin = type === "win";

  return (
    <div className="relative rounded-xl border border-white/[0.08] bg-card p-5 transition-all duration-200 card-glow h-full">
      <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-gray-500">Current Streak</p>
      <div className="flex items-center gap-2">
        <Flame className={cn("h-6 w-6", isWin ? "text-[#22c55e]" : "text-[#ef4444]")} />
        <p className={cn("text-3xl font-bold", isWin ? "text-[#22c55e]" : "text-[#ef4444]")}>{count}</p>
      </div>
      <p className="mt-0.5 text-xs text-gray-500">{isWin ? "Winning" : "Losing"} streak</p>
    </div>
  );
}
