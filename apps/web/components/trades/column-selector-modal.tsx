"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { ALL_COLUMNS, DEFAULT_VISIBLE, useColumnConfig } from "@/lib/stores/column-config";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export function ColumnSelectorModal({ isOpen, onClose }: Props) {
  const { visibleKeys, setVisibleKeys } = useColumnConfig();
  const [draft, setDraft] = useState<string[]>(visibleKeys);

  // Sync draft when opening
  const handleOpen = () => setDraft(visibleKeys);

  if (!isOpen) return null;

  const selectableColumns = ALL_COLUMNS.filter((c) => c.key !== "checkbox");

  const toggle = (key: string) => {
    setDraft((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const selectAll = () => setDraft(["checkbox", ...selectableColumns.map((c) => c.key)]);
  const selectNone = () => setDraft(["checkbox"]);
  const selectDefault = () => setDraft(DEFAULT_VISIBLE);

  const handleUpdate = () => {
    setVisibleKeys(draft);
    onClose();
  };

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/60" onClick={onClose} />
      <div
        className="fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-white/10 bg-[#0e0e16] p-6 shadow-2xl"
        onAnimationStart={handleOpen}
      >
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-base font-semibold text-white">Configure Columns</h3>
          <button onClick={onClose} className="rounded-lg p-1.5 text-gray-400 hover:bg-white/5 hover:text-white transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Quick actions */}
        <div className="flex gap-2 mb-4">
          {[
            { label: "All", action: selectAll },
            { label: "None", action: selectNone },
            { label: "Default", action: selectDefault },
          ].map((btn) => (
            <button
              key={btn.label}
              onClick={btn.action}
              className="rounded-lg border border-white/10 px-3 py-1 text-xs text-gray-400 hover:bg-white/5 hover:text-white transition-colors"
            >
              {btn.label}
            </button>
          ))}
        </div>

        {/* Column grid */}
        <div className="grid grid-cols-3 gap-2 max-h-72 overflow-y-auto pr-1 scrollbar-thin">
          {selectableColumns.map((col) => {
            const checked = draft.includes(col.key);
            return (
              <label
                key={col.key}
                className={cn(
                  "flex items-center gap-2 rounded-lg px-3 py-2 text-sm cursor-pointer transition-colors",
                  checked ? "bg-white/5 text-white" : "text-gray-500 hover:bg-white/[0.02]"
                )}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggle(col.key)}
                  className="accent-primary h-3.5 w-3.5"
                />
                {col.label}
              </label>
            );
          })}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 mt-5 pt-4 border-t border-white/5">
          <button
            onClick={onClose}
            className="rounded-lg border border-white/10 px-4 py-2 text-sm text-gray-400 hover:bg-white/5 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleUpdate}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 transition-colors"
          >
            Update
          </button>
        </div>
      </div>
    </>
  );
}
