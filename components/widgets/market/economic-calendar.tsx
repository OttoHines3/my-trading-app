"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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

// ── Styles ───────────────────────────────────────────────────────────────────

const impactStyles: Record<Impact, string> = {
  HIGH: "bg-destructive/20 text-destructive",
  MED: "bg-amber-400/20 text-amber-400",
  LOW: "bg-white/10 text-gray-500",
};

// ── Helpers ──────────────────────────────────────────────────────────────────

function getCurrentWeekRange() {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const day = now.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const monday = new Date(now);
  monday.setDate(monday.getDate() + diffToMonday);
  const sunday = new Date(monday);
  sunday.setDate(sunday.getDate() + 6);
  return {
    from: monday.toISOString().split("T")[0],
    to: sunday.toISOString().split("T")[0],
  };
}

// ── Event Row ────────────────────────────────────────────────────────────────

function EventRow({ event, onClick }: { event: CalendarEvent; onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      className="flex items-center gap-2 rounded-lg p-2 hover:bg-white/5 transition-colors cursor-pointer"
    >
      <span className="w-9 shrink-0 text-[11px] font-mono text-gray-500">
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
        <span className="text-gray-500">
          F <span className="text-foreground font-medium">{event.forecast}</span>
        </span>
        <span className="text-gray-500">
          P <span className="text-foreground font-medium">{event.previous}</span>
        </span>
      </div>
    </div>
  );
}

// ── Economic Calendar Widget ─────────────────────────────────────────────────

export default function EconomicCalendarWidget() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const { from, to } = getCurrentWeekRange();
    fetch(`/api/calendar?from=${from}&to=${to}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.events && data.events.length > 0) {
          setEvents(data.events);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
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
    <div className="flex flex-col gap-3 rounded-xl border border-white/[0.08] bg-card p-5 card-glow transition-all duration-200 h-full">
      <p className="text-xs font-semibold uppercase tracking-widest text-gray-500">
        Economic Calendar
      </p>

      <div className="flex flex-col gap-3 overflow-y-auto scrollbar-thin flex-1">
        {loading ? (
          <p className="text-xs text-gray-500 text-center py-4">Loading...</p>
        ) : sortedDays.length === 0 ? (
          <p className="text-xs text-gray-500 text-center py-4">No events this week</p>
        ) : (
          sortedDays.map((day) => {
            if (remaining <= 0) return null;
            const dayEvents = grouped[day].slice(0, remaining);
            remaining -= dayEvents.length;
            return (
              <div key={day}>
                <p className="mb-1.5 text-xs font-semibold text-foreground/60">{day}</p>
                <div className="flex flex-col gap-1">
                  {dayEvents.map((ev, i) => (
                    <EventRow key={i} event={ev} onClick={() => router.push("/calendar")} />
                  ))}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
