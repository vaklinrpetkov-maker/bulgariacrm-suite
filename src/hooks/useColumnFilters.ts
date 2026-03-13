import { useState, useCallback, useMemo } from "react";

export type ColumnFilters = Record<string, Set<string>>;

export function useColumnFilters<T>(data: T[], columns: { key: string; getValue: (item: T) => string }[]) {
  const [filters, setFilters] = useState<ColumnFilters>({});

  const uniqueValues = useMemo(() => {
    const result: Record<string, string[]> = {};
    for (const col of columns) {
      const vals = new Set<string>();
      for (const item of data) {
        const v = col.getValue(item);
        if (v && v !== "—") vals.add(v);
      }
      result[col.key] = Array.from(vals).sort((a, b) => a.localeCompare(b, "bg"));
    }
    return result;
  }, [data, columns]);

  const toggleFilter = useCallback((columnKey: string, value: string) => {
    setFilters((prev) => {
      const current = new Set(prev[columnKey] || []);
      if (current.has(value)) current.delete(value);
      else current.add(value);
      const next = { ...prev };
      if (current.size === 0) delete next[columnKey];
      else next[columnKey] = current;
      return next;
    });
  }, []);

  const setColumnFilter = useCallback((columnKey: string, values: Set<string>) => {
    setFilters((prev) => {
      const next = { ...prev };
      if (values.size === 0) delete next[columnKey];
      else next[columnKey] = values;
      return next;
    });
  }, []);

  const clearFilter = useCallback((columnKey: string) => {
    setFilters((prev) => {
      const next = { ...prev };
      delete next[columnKey];
      return next;
    });
  }, []);

  const clearAll = useCallback(() => setFilters({}), []);

  const isActive = useCallback((columnKey: string) => {
    return filters[columnKey] && filters[columnKey].size > 0;
  }, [filters]);

  const filteredData = useMemo(() => {
    if (Object.keys(filters).length === 0) return data;
    return data.filter((item) => {
      for (const col of columns) {
        const filterSet = filters[col.key];
        if (!filterSet || filterSet.size === 0) continue;
        const val = col.getValue(item);
        if (!filterSet.has(val)) return false;
      }
      return true;
    });
  }, [data, filters, columns]);

  const activeCount = Object.keys(filters).length;

  return { filters, uniqueValues, toggleFilter, setColumnFilter, clearFilter, clearAll, isActive, filteredData, activeCount };
}
