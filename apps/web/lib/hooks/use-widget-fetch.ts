"use client";

import { useState, useEffect } from "react";
import { useTradeFilters } from "@/lib/stores/trade-filters";

export function useWidgetFetch<T>(url: string, defaultValue: T): { data: T; loading: boolean } {
  const [data, setData] = useState<T>(defaultValue);
  const [loading, setLoading] = useState(true);
  const filterQuery = useTradeFilters((s) => s.toQueryString());

  useEffect(() => {
    setLoading(true);
    const separator = url.includes("?") ? "&" : "?";
    const fullUrl = filterQuery ? `${url}${separator}${filterQuery}` : url;

    fetch(fullUrl)
      .then((r) => r.json())
      .then((d) => setData(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [url, filterQuery]);

  return { data, loading };
}
