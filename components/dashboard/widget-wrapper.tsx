"use client";

import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface WidgetWrapperProps {
  title: string;
  isEditMode: boolean;
  isDragOver?: boolean;
  onRemove: () => void;
  children: React.ReactNode;
}

export function WidgetWrapper({ title, isEditMode, isDragOver, onRemove, children }: WidgetWrapperProps) {
  return (
    <div
      className={cn(
        "relative h-full transition-colors",
        isEditMode && "cursor-grab rounded-xl border-2 border-dashed border-white/20 active:cursor-grabbing",
        isDragOver && "border-blue-500 border-solid bg-blue-500/10"
      )}
    >
      {isEditMode && (
        <button
          onClick={onRemove}
          className="absolute -top-2 -right-2 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-destructive text-white shadow-lg hover:bg-destructive/80 transition-colors"
          aria-label={`Remove ${title}`}
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
      {children}
    </div>
  );
}
