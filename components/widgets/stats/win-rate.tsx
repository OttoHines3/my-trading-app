"use client";

import { useEffect, useState } from "react";
import { useTradeFilters } from "@/lib/stores/trade-filters";

const RADIUS = 24;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

function getDateLabel(dateFrom: string | null, dateTo: string | null): string {
  if (!dateFrom && !dateTo) return "All time";
  const fmt = (d: string) => {
    const date = new Date(d + "T12:00:00");
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };
  if (dateFrom && dateTo) return `${fmt(dateFrom)} – ${fmt(dateTo)}`;
  if (dateFrom) return `From ${fmt(dateFrom)}`;
  return `Until ${fmt(dateTo!)}`;
}

export default function WinRateWidget() {
  const [winRate, setWinRate] = useState(67);
  const [wins, setWins] = useState(43);
  const [losses, setLosses] = useState(21);
  const dateFrom = useTradeFilters((s) => s.dateFrom);
  const dateTo = useTradeFilters((s) => s.dateTo);

  useEffect(() => {
    fetch("/api/dashboard-stats")
      .then((r) => r.json())
      .then((data) => {
        setWinRate(data.winRate);
        setWins(data.wins);
        setLosses(data.losses);
      })
      .catch(() => {});
  }, []);

  const dashOffset = CIRCUMFERENCE - (winRate / 100) * CIRCUMFERENCE;
  const dateLabel = getDateLabel(dateFrom, dateTo);

  return (
    <div className="relative rounded-xl border border-white/5 bg-card p-4 transition-all duration-200 card-glow h-full">
      <p className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Win Rate</p>
      <div className="flex items-center gap-4">
        <div className="relative h-16 w-16 shrink-0">
          <svg className="h-full w-full -rotate-90" viewBox="0 0 64 64" aria-hidden="true">
            <circle cx="32" cy="32" r={RADIUS} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="5" />
            <circle cx="32" cy="32" r={RADIUS} fill="none" stroke="#3b82f6" strokeWidth="5" strokeLinecap="round" strokeDasharray={CIRCUMFERENCE} strokeDashoffset={dashOffset} style={{ transition: "stroke-dashoffset 1s ease" }} />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-foreground">{winRate}%</span>
        </div>
        <div>
          <p className="text-2xl font-bold text-foreground">{winRate}%</p>
          <p className="mt-0.5 text-xs text-muted-foreground">{wins} W / {losses} L</p>
          <p className="text-xs text-muted-foreground">{dateLabel}</p>
        </div>
      </div>
    </div>
  );
}
