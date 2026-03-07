"use client";

interface DateRangePickerProps {
  dateFrom: string | null;
  dateTo: string | null;
  onDateFromChange: (val: string | null) => void;
  onDateToChange: (val: string | null) => void;
}

export function DateRangePicker({ dateFrom, dateTo, onDateFromChange, onDateToChange }: DateRangePickerProps) {
  return (
    <div className="flex items-center gap-2">
      <input
        type="date"
        value={dateFrom ?? ""}
        onChange={(e) => onDateFromChange(e.target.value || null)}
        className="rounded-lg border border-white/10 bg-gray-900 px-2.5 py-1.5 text-xs text-foreground outline-none focus:border-primary"
      />
      <span className="text-xs text-muted-foreground">to</span>
      <input
        type="date"
        value={dateTo ?? ""}
        onChange={(e) => onDateToChange(e.target.value || null)}
        className="rounded-lg border border-white/10 bg-gray-900 px-2.5 py-1.5 text-xs text-foreground outline-none focus:border-primary"
      />
    </div>
  );
}
