"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

// ── Types ────────────────────────────────────────────────────────────────────

interface CalendarEvent {
  time: string;
  name: string;
  impact: string;
  forecast: string;
  previous: string;
  day: string;
}

type Impact = "HIGH" | "MED" | "LOW";

// ── Mock data ────────────────────────────────────────────────────────────────

const MOCK_CALENDAR: CalendarEvent[] = [
  { day: "Today", time: "08:30", name: "CPI m/m", impact: "HIGH", forecast: "0.3%", previous: "0.4%" },
  { day: "Today", time: "08:30", name: "Core CPI m/m", impact: "HIGH", forecast: "0.3%", previous: "0.3%" },
  { day: "Today", time: "10:00", name: "Fed Chair Speech", impact: "HIGH", forecast: "\u2014", previous: "\u2014" },
  { day: "Today", time: "14:00", name: "Beige Book", impact: "MED", forecast: "\u2014", previous: "\u2014" },
  { day: "Tomorrow", time: "08:30", name: "PPI m/m", impact: "MED", forecast: "0.2%", previous: "0.3%" },
  { day: "Tomorrow", time: "08:30", name: "Jobless Claims", impact: "MED", forecast: "215K", previous: "218K" },
  { day: "Tomorrow", time: "10:00", name: "Crude Oil Inventories", impact: "LOW", forecast: "-1.1M", previous: "2.3M" },
];

// ── Styles ───────────────────────────────────────────────────────────────────

const impactStyles: Record<Impact, string> = {
  HIGH: "bg-destructive/20 text-destructive",
  MED: "bg-amber-400/20 text-amber-400",
  LOW: "bg-white/10 text-muted-foreground",
};

// ── Event Row ────────────────────────────────────────────────────────────────

function EventRow({ event }: { event: CalendarEvent }) {
  return (
    <div className="flex items-center gap-2 rounded-lg p-2 hover:bg-white/5 transition-colors">
      <span className="w-9 shrink-0 text-[11px] font-mono text-muted-foreground">
        {event.time}
      </span>
      <span
        className={cn(
          "shrink-0 rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide",
          impactStyles[event.impact as Impact] ?? impactStyles.LOW
        )}
      >
        {event.impact}
      </span>
      <span className="flex-1 truncate text-xs font-medium text-foreground">
        {event.name}
      </span>
      <div className="flex shrink-0 gap-3 text-[10px]">
        <span className="text-muted-foreground">
          F <span className="text-foreground font-medium">{event.forecast}</span>
        </span>
        <span className="text-muted-foreground">
          P <span className="text-foreground font-medium">{event.previous}</span>
        </span>
      </div>
    </div>
  );
}

// ── Economic Calendar Widget ─────────────────────────────────────────────────

export default function EconomicCalendarWidget() {
  const [events, setEvents] = useState<CalendarEvent[]>(MOCK_CALENDAR);

  useEffect(() => {
    fetch("/api/calendar")
      .then((r) => r.json())
      .then((data) => {
        if (data.events && data.events.length > 0) {
          setEvents(data.events);
        }
      })
      .catch(() => {});
  }, []);

  // Group events by day, preserving insertion order (Today first, then Tomorrow, then later days)
  const grouped: Record<string, CalendarEvent[]> = {};
  for (const ev of events) {
    const key = ev.day ?? "Other";
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(ev);
  }

  // Stable sort: "Today" first, "Tomorrow" second, everything else in original order
  const dayOrder = (d: string) => (d === "Today" ? 0 : d === "Tomorrow" ? 1 : 2);
  const sortedDays = Object.keys(grouped).sort((a, b) => dayOrder(a) - dayOrder(b));

  // Limit total displayed events to keep the card compact
  const MAX_EVENTS = 10;
  let remaining = MAX_EVENTS;

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-white/5 bg-card p-4 card-glow transition-all duration-200 h-full">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
        Economic Calendar
      </p>

      <div className="flex flex-col gap-3 overflow-y-auto scrollbar-thin flex-1">
        {sortedDays.map((day) => {
          if (remaining <= 0) return null;
          const dayEvents = grouped[day].slice(0, remaining);
          remaining -= dayEvents.length;
          return (
            <div key={day}>
              <p className="mb-1.5 text-xs font-semibold text-foreground/60">{day}</p>
              <div className="flex flex-col gap-1">
                {dayEvents.map((ev, i) => <EventRow key={i} event={ev} />)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
