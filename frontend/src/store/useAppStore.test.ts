import { describe, it, expect, beforeEach } from 'vitest';
import { useAppStore } from './useAppStore';
import type { FileItem } from '../types';

const mockFiles: FileItem[] = [
  { id: '1', name: 'f1', path: '/root', type: 'file', size: '1MB', ctime: 0, mtime: 0 },
  { id: '2', name: 'f2', path: '/root', type: 'file', size: '2MB', ctime: 0, mtime: 0 },
  { id: '3', name: 'f3', path: '/root', type: 'file', size: '3MB', ctime: 0, mtime: 0 },
];

describe('useAppStore Selection', () => {
  beforeEach(() => {
    useAppStore.setState({
      files: mockFiles,
      selectedIds: new Set(),
      lastSelectedId: null,
      currentPath: '/root',
    });
  });

  it('single selection selects item and clears others', () => {
    const { toggleSelection, setSelectedIds } = useAppStore.getState();

    // Setup initial selection
    setSelectedIds(new Set(['2']));

    toggleSelection('1', false, false);
    expect(useAppStore.getState().selectedIds.has('1')).toBe(true);
    expect(useAppStore.getState().selectedIds.has('2')).toBe(false);
    expect(useAppStore.getState().selectedIds.size).toBe(1);

    // Clicking again should toggle it off
    toggleSelection('1', false, false);
    expect(useAppStore.getState().selectedIds.has('1')).toBe(false);
  });

  it('multi selection adds to selection', () => {
    const { toggleSelection } = useAppStore.getState();

    toggleSelection('1', false, false);
    toggleSelection('2', true, false); // Ctrl click

    const selected = useAppStore.getState().selectedIds;
    expect(selected.has('1')).toBe(true);
    expect(selected.has('2')).toBe(true);
    expect(selected.size).toBe(2);
  });

  it('multi selection toggles existing', () => {
    const { toggleSelection } = useAppStore.getState();

    toggleSelection('1', false, false);
    toggleSelection('2', true, false);
    toggleSelection('1', true, false); // Deselect 1

    const selected = useAppStore.getState().selectedIds;
    expect(selected.has('1')).toBe(false);
    expect(selected.has('2')).toBe(true);
  });

  it('range selection works', () => {
    const { toggleSelection } = useAppStore.getState();

    toggleSelection('1', false, false); // Select first
    toggleSelection('3', false, true); // Shift click third

    const selected = useAppStore.getState().selectedIds;
    expect(selected.has('1')).toBe(true);
    expect(selected.has('2')).toBe(true);
    expect(selected.has('3')).toBe(true);
  });

  it('selectAll selects all', () => {
      const { selectAll } = useAppStore.getState();
      selectAll();
      expect(useAppStore.getState().selectedIds.size).toBe(3);
  });
});

describe('useAppStore Execution', () => {
    it('updates execution state', () => {
      const { setExecutionState } = useAppStore.getState();

      setExecutionState({ status: 'EXECUTING', progress: 10 });
      expect(useAppStore.getState().executionState.status).toBe('EXECUTING');
      expect(useAppStore.getState().executionState.progress).toBe(10);

      setExecutionState({ logs: ['start'] });
      expect(useAppStore.getState().executionState.logs).toEqual(['start']);
      expect(useAppStore.getState().executionState.status).toBe('EXECUTING');
    });
});
