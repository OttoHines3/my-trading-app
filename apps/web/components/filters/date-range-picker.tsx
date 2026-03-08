"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface DateRangePickerProps {
  dateFrom: string | null;
  dateTo: string | null;
  onDateFromChange: (val: string | null) => void;
  onDateToChange: (val: string | null) => void;
}

const DAYS_HEADER = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

const PRESETS = [
  { label: "Today", getRange: () => { const d = fmt(new Date()); return [d, d]; } },
  { label: "This week", getRange: () => {
    const now = new Date();
    const start = new Date(now); start.setDate(now.getDate() - now.getDay());
    return [fmt(start), fmt(now)];
  }},
  { label: "This month", getRange: () => {
    const now = new Date();
    return [fmt(new Date(now.getFullYear(), now.getMonth(), 1)), fmt(now)];
  }},
  { label: "Last 30 days", getRange: () => {
    const now = new Date();
    const start = new Date(now); start.setDate(now.getDate() - 30);
    return [fmt(start), fmt(now)];
  }},
  { label: "Last month", getRange: () => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const end = new Date(now.getFullYear(), now.getMonth(), 0);
    return [fmt(start), fmt(end)];
  }},
  { label: "This quarter", getRange: () => {
    const now = new Date();
    const q = Math.floor(now.getMonth() / 3);
    const start = new Date(now.getFullYear(), q * 3, 1);
    return [fmt(start), fmt(now)];
  }},
  { label: "YTD (year to date)", getRange: () => {
    const now = new Date();
    return [fmt(new Date(now.getFullYear(), 0, 1)), fmt(now)];
  }},
] as const;

function fmt(d: Date): string {
  return d.toISOString().split("T")[0];
}

function parseDate(s: string): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function formatDisplay(dateFrom: string | null, dateTo: string | null): string {
  if (!dateFrom && !dateTo) return "Select dates";
  const fmtShort = (s: string) => {
    const d = parseDate(s);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };
  if (dateFrom && dateTo) return `${fmtShort(dateFrom)} - ${fmtShort(dateTo)}`;
  if (dateFrom) return `From ${fmtShort(dateFrom)}`;
  return `Until ${fmtShort(dateTo!)}`;
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

interface CalendarMonthProps {
  year: number;
  month: number;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  dateFrom: string | null;
  dateTo: string | null;
  onDayClick: (dateStr: string) => void;
  hoverDate: string | null;
  onDayHover: (dateStr: string | null) => void;
}

function CalendarMonth({ year, month, onPrevMonth, onNextMonth, dateFrom, dateTo, onDayClick, hoverDate, onDayHover }: CalendarMonthProps) {
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  const days: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) days.push(null);
  for (let i = 1; i <= daysInMonth; i++) days.push(i);

  const isInRange = (dateStr: string) => {
    if (!dateFrom) return false;
    const effectiveTo = dateTo || hoverDate;
    if (!effectiveTo) return dateStr === dateFrom;
    const [from, to] = dateFrom <= effectiveTo ? [dateFrom, effectiveTo] : [effectiveTo, dateFrom];
    return dateStr >= from && dateStr <= to;
  };

  const isStart = (dateStr: string) => dateStr === dateFrom;
  const isEnd = (dateStr: string) => dateStr === (dateTo || hoverDate);

  return (
    <div className="w-[252px]">
      <div className="flex items-center justify-between mb-3 px-1">
        <button onClick={onPrevMonth} className="rounded-lg p-1 hover:bg-white/10 transition-colors">
          <ChevronLeft className="h-4 w-4 text-muted-foreground" />
        </button>
        <span className="text-xs font-semibold text-foreground">{MONTH_NAMES[month]} {year}</span>
        <button onClick={onNextMonth} className="rounded-lg p-1 hover:bg-white/10 transition-colors">
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1">
        {DAYS_HEADER.map((d) => (
          <div key={d} className="flex h-8 w-8 items-center justify-center text-[10px] font-medium text-muted-foreground">{d}</div>
        ))}
        {days.map((day, i) => {
          if (day === null) return <div key={`empty-${i}`} className="h-8 w-8" />;
          const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const inRange = isInRange(dateStr);
          const start = isStart(dateStr);
          const end = isEnd(dateStr);
          const isToday = dateStr === fmt(new Date());

          return (
            <button
              key={dateStr}
              onClick={() => onDayClick(dateStr)}
              onMouseEnter={() => onDayHover(dateStr)}
              onMouseLeave={() => onDayHover(null)}
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-md text-xs font-medium transition-colors",
                inRange && !start && !end && "bg-primary/10",
                (start || end) && "bg-primary text-white font-bold",
                isToday && !start && !end && "ring-1 ring-primary/50",
                !inRange && !start && !end && "text-foreground hover:bg-white/5",
              )}
            >
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function DateRangePicker({ dateFrom, dateTo, onDateFromChange, onDateToChange }: DateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [hoverDate, setHoverDate] = useState<string | null>(null);
  const [selectingEnd, setSelectingEnd] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Left calendar month state
  const [leftYear, setLeftYear] = useState(() => {
    if (dateFrom) { const d = parseDate(dateFrom); return d.getFullYear(); }
    return new Date().getFullYear();
  });
  const [leftMonth, setLeftMonth] = useState(() => {
    if (dateFrom) { const d = parseDate(dateFrom); return d.getMonth(); }
    return new Date().getMonth();
  });

  // Right calendar is always one month ahead of left
  const rightYear = leftMonth === 11 ? leftYear + 1 : leftYear;
  const rightMonth = leftMonth === 11 ? 0 : leftMonth + 1;

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const handleDayClick = (dateStr: string) => {
    if (!selectingEnd || !dateFrom) {
      // First click: set start date
      onDateFromChange(dateStr);
      onDateToChange(null);
      setSelectingEnd(true);
    } else {
      // Second click: set end date
      if (dateStr < dateFrom) {
        onDateToChange(dateFrom);
        onDateFromChange(dateStr);
      } else {
        onDateToChange(dateStr);
      }
      setSelectingEnd(false);
    }
  };

  const handlePreset = (from: string, to: string) => {
    onDateFromChange(from);
    onDateToChange(to);
    setSelectingEnd(false);
    // Navigate left calendar to the from date's month
    const d = parseDate(from);
    setLeftYear(d.getFullYear());
    setLeftMonth(d.getMonth());
  };

  const navigateLeftPrev = () => {
    if (leftMonth === 0) { setLeftYear(leftYear - 1); setLeftMonth(11); }
    else setLeftMonth(leftMonth - 1);
  };

  const navigateLeftNext = () => {
    if (leftMonth === 11) { setLeftYear(leftYear + 1); setLeftMonth(0); }
    else setLeftMonth(leftMonth + 1);
  };

  const navigateRightPrev = () => navigateLeftPrev(); // move both back
  const navigateRightNext = () => navigateLeftNext(); // move both forward

  const hasValue = dateFrom || dateTo;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all",
          hasValue
            ? "border-primary/30 bg-primary/5 text-foreground"
            : "border-white/10 text-muted-foreground hover:border-white/20 hover:text-foreground"
        )}
      >
        <CalendarIcon className="h-3.5 w-3.5" />
        <span>{formatDisplay(dateFrom, dateTo)}</span>
        {hasValue && (
          <span
            onClick={(e) => {
              e.stopPropagation();
              onDateFromChange(null);
              onDateToChange(null);
            }}
            className="ml-1 rounded-full p-0.5 hover:bg-white/10 transition-colors"
          >
            <X className="h-3 w-3" />
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute left-0 top-full mt-1 z-50 flex rounded-xl border border-white/10 bg-gray-900 shadow-2xl">
          {/* Dual calendar */}
          <div className="p-4">
            {/* Display selected range */}
            {(dateFrom || dateTo) && (
              <div className="flex items-center justify-center gap-4 mb-4 text-xs text-foreground">
                <span className="font-medium">{dateFrom ? parseDate(dateFrom).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) : "Start"}</span>
                <span className="text-muted-foreground">&rarr;</span>
                <span className="font-medium">{dateTo ? parseDate(dateTo).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) : "End"}</span>
              </div>
            )}
            <div className="flex gap-8">
              <CalendarMonth
                year={leftYear}
                month={leftMonth}
                onPrevMonth={navigateLeftPrev}
                onNextMonth={navigateLeftNext}
                dateFrom={dateFrom}
                dateTo={dateTo}
                onDayClick={handleDayClick}
                hoverDate={selectingEnd ? hoverDate : null}
                onDayHover={setHoverDate}
              />
              <CalendarMonth
                year={rightYear}
                month={rightMonth}
                onPrevMonth={navigateRightPrev}
                onNextMonth={navigateRightNext}
                dateFrom={dateFrom}
                dateTo={dateTo}
                onDayClick={handleDayClick}
                hoverDate={selectingEnd ? hoverDate : null}
                onDayHover={setHoverDate}
              />
            </div>
          </div>

          {/* Presets sidebar */}
          <div className="border-l border-white/10 py-4 px-2 w-44">
            <div className="space-y-0.5">
              {PRESETS.map((preset) => (
                <button
                  key={preset.label}
                  onClick={() => {
                    const [from, to] = preset.getRange();
                    handlePreset(from, to);
                  }}
                  className="w-full rounded-lg px-3 py-2 text-left text-xs font-medium text-muted-foreground hover:bg-white/5 hover:text-foreground transition-colors"
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
