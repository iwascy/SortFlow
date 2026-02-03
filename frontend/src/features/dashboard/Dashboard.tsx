import React, { useCallback, useEffect } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { Sidebar } from './Sidebar';
import { MixerPanel } from '../pattern-mixer/MixerPanel';
import { FileGrid } from '../file-explorer/FileGrid';
import { TransactionDesk } from '../execution/TransactionDesk';
import { ExecutionOverlay } from '../execution/ExecutionOverlay';
import { INITIAL_FILES, PRESETS, TARGET_ROOTS } from '../../constants';
import { fileService } from '../../services/fileService';
import { executeService } from '../../services/executeService';
import { usePolling } from '../../hooks/usePolling';

export const Dashboard: React.FC = () => {
  const {
    currentPath,
    setFiles,
    setCurrentPath,
    setPresets,
    setTargetRoots,
    setExecutionState,
    selectedIds,
    previewOps,
    executionState,
    clearSelection,
    setIsLoadingFiles
  } = useAppStore();

  const loadFiles = useCallback(async (fallbackToConstants: boolean) => {
    setIsLoadingFiles(true);
    try {
      const { files } = await fileService.listFiles();
      const normalizedFiles = files.map(file => (
        file.thumbnail ? file : { ...file, thumbnail: fileService.getThumbnailUrl(file.id) }
      ));
      setFiles(normalizedFiles);

      const paths = Array.from(new Set(normalizedFiles.map(f => f.path)));
      if (!currentPath || !paths.includes(currentPath)) {
        setCurrentPath(paths[0] || '/nas/upload/raw');
      }
    } catch (error) {
      console.error(error);
      if (fallbackToConstants) {
        setFiles(INITIAL_FILES);
        const paths = Array.from(new Set(INITIAL_FILES.map(f => f.path)));
        if (!currentPath || !paths.includes(currentPath)) {
          setCurrentPath(paths[0] || '/nas/upload/raw');
        }
      }
    } finally {
      setIsLoadingFiles(false);
    }
  }, [currentPath, setCurrentPath, setFiles, setIsLoadingFiles]);

  // Initialize data
  useEffect(() => {
    setPresets(PRESETS);
    setTargetRoots(TARGET_ROOTS);
    void loadFiles(true);
  }, [loadFiles, setPresets, setTargetRoots]);

  useEffect(() => {
    if (executionState.status === 'DONE') {
      clearSelection();
      void loadFiles(false);
    }
  }, [clearSelection, executionState.status, loadFiles]);

  usePolling(async () => {
    if (executionState.status !== 'EXECUTING' || !executionState.taskId) return;
    try {
      const state = await executeService.getTaskProgress(executionState.taskId);
      setExecutionState({ ...state, taskId: state.taskId ?? executionState.taskId });
    } catch (error) {
      console.error(error);
      setExecutionState({ status: 'ERROR', error: 'Failed to fetch execution progress' });
    }
  }, 1000, executionState.status === 'EXECUTING' && !!executionState.taskId);

  const handleExecute = async () => {
    if (selectedIds.size === 0) return;
    if (executionState.status !== 'IDLE' && executionState.status !== 'DONE' && executionState.status !== 'ERROR') return;

    setExecutionState({
      status: 'EXECUTING',
      progress: 0,
      logs: ['Initializing job...'],
      processedFiles: 0,
      totalFiles: selectedIds.size,
      error: undefined
    });

    try {
      const { taskId } = await executeService.executeTask(Array.from(selectedIds), previewOps);
      setExecutionState({ taskId });
    } catch (error) {
      console.error(error);
      setExecutionState({ status: 'ERROR', error: 'Failed to start execution' });
    }
  };

  return (
    <div className="flex h-screen flex-col lg:flex-row bg-background-dark relative animate-in fade-in overflow-hidden">
      <ExecutionOverlay />

      <Sidebar />

      {/* Main Workspace */}
      <div className="flex-1 flex flex-col min-w-0 bg-surface-dark/10 overflow-hidden">
        <header className="px-8 py-4 flex items-center justify-between bg-background-dark border-b border-border-dark z-10 animate-in fade-in slide-in-from-top duration-500">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-primary">folder_open</span>
              <h2 className="text-xs font-black text-white tracking-widest uppercase truncate max-w-[300px]">{currentPath}</h2>
            </div>
          </div>
        </header>

        <MixerPanel />
        <FileGrid />
      </div>

      <TransactionDesk onExecute={handleExecute} />
    </div>
  );
};
