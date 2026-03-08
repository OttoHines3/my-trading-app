"use client";

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

  return (
    <div
      className="grid gap-4"
      style={{ gridTemplateColumns: "repeat(12, 1fr)" }}
    >
      {layout.map((item) => {
        const widget = getWidget(item.widgetId);
        if (!widget) return null;
        const Component = widget.component;

        return (
          <div
            key={item.order}
            style={{
              gridColumn: `span ${item.colSpan}`,
              gridRow: `span ${item.rowSpan}`,
            }}
          >
            <WidgetWrapper
              title={widget.name}
              isEditMode={isEditMode}
              onRemove={() => removeWidget(item.order)}
            >
              <Component />
            </WidgetWrapper>
          </div>
        );
      })}
      {isEditMode && <EmptySlot />}
    </div>
  );
}
