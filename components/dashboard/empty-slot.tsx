"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { WidgetLibraryModal } from "./widget-library-modal";

interface EmptySlotProps {
  section?: "top" | "bottom";
}

export function EmptySlot({ section }: EmptySlotProps) {
  const [isOpen, setIsOpen] = useState(false);

  const isTop = section === "top";

  return (
    <>
      <div
        className="flex items-center justify-center rounded-xl border-2 border-dashed border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04] transition-all cursor-pointer"
        style={isTop ? { minHeight: "100px" } : { gridColumn: "span 4", gridRow: "span 2" }}
        onClick={() => setIsOpen(true)}
      >
        <div className="flex flex-col items-center gap-1.5 text-muted-foreground">
          <Plus className="h-6 w-6" />
          <span className="text-[10px] font-medium">{isTop ? "Add Stat" : "Add Widget"}</span>
        </div>
      </div>
      <WidgetLibraryModal isOpen={isOpen} onClose={() => setIsOpen(false)} section={section} />
    </>
  );
}
