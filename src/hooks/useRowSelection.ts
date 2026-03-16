import { useState, useCallback, useMemo } from "react";

export function useRowSelection<T extends { id: string }>(data: T[]) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const toggle = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleAll = useCallback(() => {
    setSelectedIds((prev) => {
      if (prev.size === data.length && data.every((d) => prev.has(d.id))) {
        return new Set();
      }
      return new Set(data.map((d) => d.id));
    });
  }, [data]);

  const clearSelection = useCallback(() => setSelectedIds(new Set()), []);

  const isSelected = useCallback((id: string) => selectedIds.has(id), [selectedIds]);

  const allSelected = useMemo(
    () => data.length > 0 && data.every((d) => selectedIds.has(d.id)),
    [data, selectedIds]
  );

  const someSelected = useMemo(
    () => data.some((d) => selectedIds.has(d.id)) && !allSelected,
    [data, selectedIds, allSelected]
  );

  const selectedCount = useMemo(
    () => data.filter((d) => selectedIds.has(d.id)).length,
    [data, selectedIds]
  );

  return {
    selectedIds,
    toggle,
    toggleAll,
    clearSelection,
    isSelected,
    allSelected,
    someSelected,
    selectedCount,
  };
}
