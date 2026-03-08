"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  page: number;
  perPage: number;
  total: number;
  onPageChange: (page: number) => void;
  onPerPageChange: (perPage: number) => void;
}

const PER_PAGE_OPTIONS = [10, 25, 50, 100];

export function TradePagination({ page, perPage, total, onPageChange, onPerPageChange }: Props) {
  const totalPages = Math.max(1, Math.ceil(total / perPage));
  const from = total === 0 ? 0 : (page - 1) * perPage + 1;
  const to = Math.min(page * perPage, total);

  return (
    <div className="flex items-center justify-between border-t border-white/5 pt-3">
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground">Rows per page</span>
        <select
          value={perPage}
          onChange={(e) => { onPerPageChange(Number(e.target.value)); onPageChange(1); }}
          className="rounded-lg border border-white/10 bg-gray-900 px-2 py-1 text-xs text-foreground outline-none"
        >
          {PER_PAGE_OPTIONS.map((n) => (
            <option key={n} value={n}>{n}</option>
          ))}
        </select>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-xs text-muted-foreground">
          {from}–{to} of {total}
        </span>
        <div className="flex gap-1">
          <button
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
            className={cn("rounded-lg border border-white/10 p-1.5 transition-colors", page <= 1 ? "opacity-30" : "hover:bg-white/5")}
          >
            <ChevronLeft className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
          <button
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages}
            className={cn("rounded-lg border border-white/10 p-1.5 transition-colors", page >= totalPages ? "opacity-30" : "hover:bg-white/5")}
          >
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
        </div>
      </div>
    </div>
  );
}
