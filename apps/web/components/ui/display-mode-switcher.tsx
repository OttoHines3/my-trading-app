"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronUp, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { useDisplayMode, type DisplayMode } from "@/lib/stores/display-mode";

interface ModeOption {
  value: DisplayMode;
  icon: string;
  label: string;
  description?: string;
}

const MODE_OPTIONS: ModeOption[] = [
  { value: "dollar", icon: "$", label: "Dollar" },
  { value: "percentage", icon: "%", label: "Percentage" },
  { value: "privacy", icon: "\uD83D\uDD12", label: "Privacy" },
  {
    value: "r-multiple",
    icon: "R",
    label: "R-Multiple",
    description: "It is shown for trades with entered initial risk only",
  },
  {
    value: "ticks",
    icon: "T",
    label: "Ticks",
    description: "It is shown for futures trades only",
  },
  {
    value: "pips",
    icon: "PP",
    label: "Pips",
    description: "It is shown for forex trades only",
  },
  {
    value: "points",
    icon: "P",
    label: "Points",
    description: "It is shown for futures trades only",
  },
];

function getIconForMode(mode: DisplayMode): string {
  return MODE_OPTIONS.find((o) => o.value === mode)?.icon ?? "$";
}

export function DisplayModeSwitcher() {
  const { mode, setMode } = useDisplayMode();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Close on Escape
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, []);

  return (
    <div ref={ref} className="relative">
      {/* Trigger button */}
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={cn(
          "flex items-center gap-1.5 rounded-full border border-white/10 bg-card px-3 py-1.5",
          "text-xs font-medium text-foreground transition-colors",
          "hover:border-white/20 hover:bg-white/5"
        )}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/10 text-[10px] font-bold">
          {getIconForMode(mode)}
        </span>
        <ChevronUp
          className={cn(
            "h-3 w-3 text-muted-foreground transition-transform",
            !open && "rotate-180"
          )}
        />
      </button>

      {/* Dropdown */}
      {open && (
        <div
          className={cn(
            "absolute right-0 bottom-full mb-2 z-50 w-64",
            "rounded-xl border border-white/5 bg-gray-900 p-1.5 shadow-xl",
            "sm:bottom-auto sm:top-full sm:mt-2 sm:mb-0"
          )}
          role="listbox"
          aria-label="Display mode"
        >
          {MODE_OPTIONS.map((option) => {
            const isActive = mode === option.value;
            return (
              <button
                key={option.value}
                type="button"
                role="option"
                aria-selected={isActive}
                onClick={() => {
                  setMode(option.value);
                  setOpen(false);
                }}
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left",
                  "transition-colors hover:bg-white/5",
                  isActive && "bg-white/5"
                )}
              >
                {/* Icon badge */}
                <span
                  className={cn(
                    "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                    isActive
                      ? "bg-blue-500/20 text-blue-400"
                      : "bg-white/10 text-muted-foreground"
                  )}
                >
                  {option.icon}
                </span>

                {/* Label + description */}
                <div className="flex-1 min-w-0">
                  <span
                    className={cn(
                      "block text-sm font-medium",
                      isActive ? "text-foreground" : "text-muted-foreground"
                    )}
                  >
                    {option.label}
                  </span>
                  {option.description && (
                    <span className="block text-[11px] leading-tight text-muted-foreground/60">
                      {option.description}
                    </span>
                  )}
                </div>

                {/* Checkmark */}
                {isActive && (
                  <Check className="h-4 w-4 shrink-0 text-blue-400" />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
