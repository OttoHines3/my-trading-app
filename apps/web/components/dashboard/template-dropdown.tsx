"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, Pencil, Trash2, Copy, Plus, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { useDashboardLayout } from "@/lib/stores/dashboard-layout";

export function TemplateDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const {
    templates,
    activeTemplateId,
    switchTemplate,
    createTemplate,
    deleteTemplate,
    renameTemplate,
    duplicateTemplate,
  } = useDashboardLayout();

  const activeTemplate = templates.find((t) => t.id === activeTemplateId) ?? templates[0];

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setEditingId(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (editingId && inputRef.current) inputRef.current.focus();
  }, [editingId]);

  const startRename = (id: string, name: string) => {
    setEditingId(id);
    setEditName(name);
  };

  const confirmRename = () => {
    if (editingId && editName.trim()) {
      renameTemplate(editingId, editName.trim());
    }
    setEditingId(null);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-lg border border-white/10 bg-gray-900 px-3 py-1.5 text-sm font-medium text-foreground hover:border-white/20 transition-colors"
      >
        {activeTemplate.name}
        <ChevronDown className={cn("h-3.5 w-3.5 text-muted-foreground transition-transform", isOpen && "rotate-180")} />
      </button>

      {isOpen && (
        <div className="absolute left-0 top-full z-50 mt-1 w-64 rounded-xl border border-white/10 bg-gray-900 p-1.5 shadow-2xl">
          {templates.map((template) => (
            <div
              key={template.id}
              className={cn(
                "group flex items-center justify-between rounded-lg px-3 py-2 transition-colors",
                template.id === activeTemplateId ? "bg-primary/10" : "hover:bg-white/5"
              )}
            >
              {editingId === template.id ? (
                <div className="flex items-center gap-1.5 flex-1">
                  <input
                    ref={inputRef}
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") confirmRename(); if (e.key === "Escape") setEditingId(null); }}
                    className="flex-1 rounded bg-gray-950 px-2 py-0.5 text-xs text-foreground outline-none border border-white/10 focus:border-primary"
                  />
                  <button onClick={confirmRename} className="rounded p-0.5 hover:bg-white/10">
                    <Check className="h-3 w-3 text-positive" />
                  </button>
                </div>
              ) : (
                <>
                  <button
                    onClick={() => { switchTemplate(template.id); setIsOpen(false); }}
                    className="flex-1 text-left text-xs font-medium text-foreground"
                  >
                    {template.name}
                  </button>
                  <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => startRename(template.id, template.name)} className="rounded p-1 hover:bg-white/10">
                      <Pencil className="h-3 w-3 text-muted-foreground" />
                    </button>
                    <button onClick={() => duplicateTemplate(template.id)} className="rounded p-1 hover:bg-white/10">
                      <Copy className="h-3 w-3 text-muted-foreground" />
                    </button>
                    {templates.length > 1 && (
                      <button onClick={() => deleteTemplate(template.id)} className="rounded p-1 hover:bg-white/10">
                        <Trash2 className="h-3 w-3 text-destructive" />
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          ))}
          <div className="mt-1 border-t border-white/10 pt-1">
            <button
              onClick={() => { createTemplate("New Template"); setIsOpen(false); }}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-muted-foreground hover:bg-white/5 hover:text-foreground transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              Create new template
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
