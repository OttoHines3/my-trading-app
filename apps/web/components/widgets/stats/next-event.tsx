"use client";

import { useEffect, useState } from "react";
import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface CalendarEvent {
  time: string;
  name: string;
  impact: string;
  forecast: string;
  previous: string;
  country: string;
  datetime?: string;
}

const MOCK_EVENT: CalendarEvent = {
  time: "08:30",
  name: "CPI Release",
  impact: "HIGH",
  forecast: "3.1%",
  previous: "3.4%",
  country: "US",
};

function useCountdown(targetMs: number) {
  const [remaining, setRemaining] = useState(targetMs);
  useEffect(() => { setRemaining(targetMs); }, [targetMs]);
  useEffect(() => {
    const id = setInterval(() => setRemaining((r) => Math.max(0, r - 1000)), 1000);
    return () => clearInterval(id);
  }, []);
  const h = Math.floor(remaining / 3_600_000);
  const m = Math.floor((remaining % 3_600_000) / 60_000);
  const s = Math.floor((remaining % 60_000) / 1_000);
  return `${h}h ${String(m).padStart(2, "0")}m ${String(s).padStart(2, "0")}s`;
}

export default function NextEventWidget() {
  const [event, setEvent] = useState<CalendarEvent>(MOCK_EVENT);

  useEffect(() => {
    fetch("/api/calendar")
      .then((r) => r.json())
      .then((data) => { if (data.nextEvent) setEvent(data.nextEvent); })
      .catch(() => {});
  }, []);

  let targetMs = 2 * 3_600_000 + 14 * 60_000;
  if (event.datetime) {
    const diff = new Date(event.datetime).getTime() - Date.now();
    if (diff > 0) targetMs = diff;
  }

  const countdown = useCountdown(targetMs);
  const impactColor = event.impact === "HIGH"
    ? "bg-[#ef4444]/20 text-[#ef4444]"
    : event.impact === "MED"
    ? "bg-amber-400/20 text-amber-400"
    : "bg-white/10 text-gray-500";

  return (
    <div className="relative rounded-xl border border-white/[0.08] bg-card p-5 transition-all duration-200 card-glow h-full">
      <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-gray-500">Next Economic Event</p>
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-lg font-bold text-foreground leading-tight">{event.name}</p>
          <div className="mt-1 flex items-center gap-1.5">
            <span className={cn("rounded-sm px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide", impactColor)}>
              {event.impact}
            </span>
            <span className="text-xs text-gray-500">Impact</span>
          </div>
        </div>
        <div className="text-right">
          <div className="flex items-center gap-1 text-amber-400">
            <Clock className="h-3.5 w-3.5" aria-hidden="true" />
            <span className="text-sm font-bold tabular-nums">{countdown}</span>
          </div>
          <p className="mt-0.5 text-xs text-gray-500">{event.time} ET</p>
        </div>
      </div>
      <div className="mt-3 flex gap-3 text-xs">
        <div><span className="text-gray-500">Forecast </span><span className="font-semibold text-foreground">{event.forecast}</span></div>
        <div><span className="text-gray-500">Previous </span><span className="font-semibold text-foreground">{event.previous}</span></div>
      </div>
      <div className="mt-2 h-0.5 w-full rounded-full bg-white/5">
        <div className="h-full w-2/3 rounded-full bg-amber-400/60" />
      </div>
    </div>
  );
}
