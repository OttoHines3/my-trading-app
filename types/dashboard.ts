import type { ComponentType } from "react";

export interface WidgetComponentProps {
  className?: string;
}

export type WidgetCategory = "stats" | "charts" | "composite" | "calendar" | "market";

export interface WidgetDefinition {
  id: string;
  name: string;
  description: string;
  category: WidgetCategory;
  defaultColSpan: number;
  defaultRowSpan: number;
  component: ComponentType<WidgetComponentProps>;
}

export interface LayoutItem {
  widgetId: string;
  colSpan: number;
  rowSpan: number;
  order: number;
}
