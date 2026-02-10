import { useCallback } from 'react';
import { useAppStore } from '../store/useAppStore';

export function useFileSelection() {
  const { toggleSelection, selectAll, clearSelection, selectedIds } = useAppStore();

  const handleSelection = useCallback((id: string, event: React.MouseEvent) => {
    const isMulti = event.ctrlKey || event.metaKey;
    const isRange = event.shiftKey;

    toggleSelection(id, isMulti, isRange);
  }, [toggleSelection]);

  return {
    selectedIds,
    handleSelection,
    selectAll,
    clearSelection
  };
}
