"use client";

import { useState } from "react";
import { useDashboardLayout } from "@/lib/stores/dashboard-layout";
import { getWidget } from "@/lib/widgets/registry";
import { WidgetWrapper } from "./widget-wrapper";
import { EmptySlot } from "./empty-slot";

export function DashboardGrid() {
  const layout = useDashboardLayout((s) => {
    const template = s.templates.find((t) => t.id === s.activeTemplateId) ?? s.templates[0];
    return template?.layout ?? [];
  });
  const isEditMode = useDashboardLayout((s) => s.isEditMode);
  const removeWidget = useDashboardLayout((s) => s.removeWidget);
  const reorderWidgets = useDashboardLayout((s) => s.reorderWidgets);

  const [draggedOrder, setDraggedOrder] = useState<number | null>(null);
  const [dragOverOrder, setDragOverOrder] = useState<number | null>(null);

  function handleDragStart(order: number) {
    setDraggedOrder(order);
  }

  function handleDragOver(e: React.DragEvent, order: number) {
    e.preventDefault();
    if (draggedOrder !== null && draggedOrder !== order) {
      setDragOverOrder(order);
    }
  }

  function handleDragLeave() {
    setDragOverOrder(null);
  }

  function handleDrop(e: React.DragEvent, toOrder: number) {
    e.preventDefault();
    if (draggedOrder !== null && draggedOrder !== toOrder) {
      reorderWidgets(draggedOrder, toOrder);
    }
    setDraggedOrder(null);
    setDragOverOrder(null);
  }

  function handleDragEnd() {
    setDraggedOrder(null);
    setDragOverOrder(null);
  }

  // Split layout into top stats row and bottom widgets section
  const topItems = layout
    .filter((item) => {
      const widget = getWidget(item.widgetId);
      return widget?.category === "stats";
    })
    .sort((a, b) => a.order - b.order);

  const bottomItems = layout
    .filter((item) => {
      const widget = getWidget(item.widgetId);
      return widget?.category !== "stats";
    })
    .sort((a, b) => a.order - b.order);

  function renderWidget(item: typeof layout[0]) {
    const widget = getWidget(item.widgetId);
    if (!widget) return null;
    const Component = widget.component;
    const isDragging = draggedOrder === item.order;
    const isDragOver = dragOverOrder === item.order;

    return (
      <div
        key={item.order}
        draggable={isEditMode}
        onDragStart={() => handleDragStart(item.order)}
        onDragOver={(e) => handleDragOver(e, item.order)}
        onDragLeave={handleDragLeave}
        onDrop={(e) => handleDrop(e, item.order)}
        onDragEnd={handleDragEnd}
        className={isEditMode ? (isDragging ? "opacity-40" : "transition-opacity") : undefined}
        style={{
          gridColumn: `span ${item.colSpan}`,
          gridRow: `span ${item.rowSpan}`,
        }}
      >
        <WidgetWrapper
          title={widget.name}
          isEditMode={isEditMode}
          isDragOver={isDragOver}
          onRemove={() => removeWidget(item.order)}
        >
          <Component />
        </WidgetWrapper>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* ── Top Section: Stat Cards ────────────────────────────── */}
      {(topItems.length > 0 || isEditMode) && (
        <div
          className="grid gap-4"
          style={{ gridTemplateColumns: `repeat(${Math.max(topItems.length, 5)}, 1fr)` }}
        >
          {topItems.map(renderWidget)}
          {isEditMode && <EmptySlot section="top" />}
        </div>
      )}

      {/* ── Section Divider ────────────────────────────────────── */}
      {(topItems.length > 0 || isEditMode) && (bottomItems.length > 0 || isEditMode) && (
        <div className="border-t-2 border-dashed border-white/10" />
      )}

      {/* ── Bottom Section: Medium Widgets ─────────────────────── */}
      {(bottomItems.length > 0 || isEditMode) && (
        <div
          className="grid gap-4"
          style={{ gridTemplateColumns: "repeat(12, 1fr)", gridAutoRows: "minmax(140px, auto)" }}
        >
          {bottomItems.map(renderWidget)}
          {isEditMode && <EmptySlot section="bottom" />}
        </div>
      )}
    </div>
  );
}
