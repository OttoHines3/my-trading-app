"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { WidgetLibraryModal } from "./widget-library-modal";

export function EmptySlot() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <div
        className="flex min-h-[120px] items-center justify-center rounded-xl border-2 border-dashed border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04] transition-all cursor-pointer"
        style={{ gridColumn: "span 3" }}
        onClick={() => setIsOpen(true)}
      >
        <div className="flex flex-col items-center gap-2 text-muted-foreground">
          <Plus className="h-8 w-8" />
          <span className="text-xs font-medium">Add Widget</span>
        </div>
      </div>
      <WidgetLibraryModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}
