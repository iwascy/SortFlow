import React, { useCallback, useEffect, useRef } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { Sidebar } from './Sidebar';
import { MixerPanel } from '../pattern-mixer/MixerPanel';
import { FileGrid } from '../file-explorer/FileGrid';
import { TransactionDesk } from '../execution/TransactionDesk';
import { INITIAL_FILES, PRESETS, TARGET_ROOTS } from '../../constants';
import { fileService } from '../../services/fileService';
import { executeService, toExecutionUpdate, type TaskResponse } from '../../services/executeService';
import { configService } from '../../services/configService';
import { buildPreviewOps, getTargetDir } from '../../utils/preview';

export const Dashboard: React.FC = () => {
  const {
    currentPath,
    setFiles,
    setCurrentPath,
    setPresets,
    setTargetRoots,
    setKeywords,
    setExecutionState,
    selectedIds,
    previewOps,
    executionState,
    clearSelection,
    setIsLoadingFiles,
    setConfig,
    updateMixerConfig,
    mixerConfig,
    presets,
    targetRoots,
    files
  } = useAppStore();

  const wsRef = useRef<WebSocket | null>(null);
  const wsTaskIdRef = useRef<string | null>(null);

  const normalizePath = useCallback((value: string) => {
    if (!value) return '';
    const normalized = value.replace(/\\/g, '/');
    return normalized.endsWith('/') && normalized.length > 1 ? normalized.slice(0, -1) : normalized;
  }, []);

  const isWithinWatcher = useCallback((path: string, watchers: string[]) => {
    const normalizedPath = normalizePath(path);
    return watchers.some((watcher) => {
      const normalizedWatcher = normalizePath(watcher);
      return normalizedPath === normalizedWatcher || normalizedPath.startsWith(`${normalizedWatcher}/`);
    });
  }, [normalizePath]);

  const loadFiles = useCallback(async (path: string, fallbackToConstants: boolean) => {
    setIsLoadingFiles(true);
    try {
      const { files } = await fileService.listFiles(path);
      setFiles(files);
    } catch (error) {
      console.error(error);
      if (fallbackToConstants) {
        const fallbackFiles = INITIAL_FILES.filter(file => file.path === path);
        if (fallbackFiles.length) {
          setFiles(fallbackFiles);
        } else {
          setFiles(INITIAL_FILES);
          if (INITIAL_FILES.length && path !== INITIAL_FILES[0].path) {
            setCurrentPath(INITIAL_FILES[0].path);
          }
        }
      }
    } finally {
      setIsLoadingFiles(false);
    }
  }, [setCurrentPath, setFiles, setIsLoadingFiles]);

  // Initialize data
  useEffect(() => {
    const loadConfig = async () => {
      try {
        const config = await configService.getConfig();
        const savedKeywords = JSON.parse(localStorage.getItem('sortflow.customKeywords') || '[]');
        setConfig({ sourceWatchers: config.watchers || [], theme: 'light', customKeywords: Array.isArray(savedKeywords) ? savedKeywords : [] });
        const sortedPresets = (config.presets || []).slice().sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
        setPresets(sortedPresets.length ? sortedPresets : PRESETS);
        setTargetRoots((config.targets || []).length ? config.targets : TARGET_ROOTS);
        setKeywords(config.keywords || []);
        if (config.watchers?.length) {
          const nextPath = currentPath && isWithinWatcher(currentPath, config.watchers)
            ? currentPath
            : config.watchers[0];
          if (nextPath && nextPath !== currentPath) {
            setCurrentPath(nextPath);
          }
        }
      } catch (error) {
        console.error(error);
        const savedKeywords = JSON.parse(localStorage.getItem('sortflow.customKeywords') || '[]');
        setConfig({ sourceWatchers: Array.from(new Set(INITIAL_FILES.map(file => file.path))), theme: 'light', customKeywords: Array.isArray(savedKeywords) ? savedKeywords : [] });
        setPresets(PRESETS);
        setTargetRoots(TARGET_ROOTS);
        setKeywords([]);
        if (!currentPath) {
          setCurrentPath(INITIAL_FILES[0]?.path || '/nas/upload/raw');
        }
      }
    };

    void loadConfig();
  }, [currentPath, setConfig, setCurrentPath, setPresets, setTargetRoots]);

  useEffect(() => {
    if (!currentPath) return;
    clearSelection();
    void loadFiles(currentPath, true);
  }, [clearSelection, currentPath, loadFiles]);

  useEffect(() => {
    const isTerminal = executionState.status === 'DONE' || executionState.status === 'ERROR';
    if (!isTerminal) return;
    clearSelection();
    if (currentPath) {
      void loadFiles(currentPath, false);
    }
  }, [clearSelection, currentPath, executionState.status, loadFiles]);

  useEffect(() => {
    if (executionState.status !== 'EXECUTING' || !executionState.taskId) {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
        wsTaskIdRef.current = null;
      }
      return;
    }

    if (wsRef.current && wsTaskIdRef.current === executionState.taskId) {
      return;
    }

    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
      wsTaskIdRef.current = null;
    }

    const baseUrl = import.meta.env.VITE_API_BASE_URL || '';
    const wsUrl = baseUrl.replace(/^http/, 'ws') + `/ws/tasks/${executionState.taskId}`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;
    wsTaskIdRef.current = executionState.taskId;

    ws.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data) as TaskResponse | { error: string };
        if ('error' in payload) {
          setExecutionState({ status: 'ERROR', error: payload.error });
          return;
        }
        const update = toExecutionUpdate(payload);
        setExecutionState({ ...update, taskId: executionState.taskId });
        if (update.status === 'DONE' || update.status === 'ERROR') {
          ws.close();
        }
      } catch (err) {
        console.error(err);
      }
    };

    ws.onerror = (err) => {
      console.error('WebSocket error', err);
    };

    ws.onclose = () => {
      if (wsRef.current === ws) {
        wsRef.current = null;
        wsTaskIdRef.current = null;
      }
    };

    return () => {
      ws.close();
    };
  }, [executionState.status, executionState.taskId, setExecutionState]);

  const handleExecute = async () => {
    if (selectedIds.size === 0) return;
    if (executionState.status !== 'IDLE' && executionState.status !== 'DONE' && executionState.status !== 'ERROR') return;

    const activeTargetId = mixerConfig.targetRootId || targetRoots[0]?.id;
    const activePresetId = mixerConfig.presetId || presets[0]?.id;
    const activeTarget = targetRoots.find(t => t.id === activeTargetId) || targetRoots[0];
    const activePreset = presets.find(p => p.id === activePresetId) || presets[0];

    if (!activeTarget || !activePreset) {
      setExecutionState({ status: 'ERROR', error: 'Missing target or preset configuration.' });
      return;
    }

    const computedPreviewOps = previewOps.length
      ? previewOps
      : buildPreviewOps(files.filter(f => selectedIds.has(f.id)), mixerConfig, activePreset, activeTarget);
    const actions = computedPreviewOps
      .filter(op => op.originalPath && op.newPath)
      .map(op => ({
        sourcePath: op.originalPath,
        targetPath: op.newPath,
        operation: 'move' as const,
      }));

    if (actions.length === 0) {
      setExecutionState({ status: 'ERROR', error: 'No valid items queued for execution.' });
      return;
    }

    setExecutionState({
      status: 'EXECUTING',
      progress: 0,
      logs: ['Initializing job...'],
      processedFiles: 0,
      totalFiles: actions.length,
      error: undefined
    });

    try {
      const targetPath = getTargetDir(activePreset, activeTarget);
      const { taskId } = await executeService.executeTask({
        actions,
        action: 'move',
        presetId: activePreset.id,
        targetRootId: activeTarget.id,
        targetPath
      });
      setExecutionState({ taskId });
      updateMixerConfig({ tempKeyword: '' });
    } catch (error) {
      console.error(error);
      setExecutionState({ status: 'ERROR', error: 'Failed to start execution' });
    }
  };

  return (
    <div className="flex h-screen flex-col lg:flex-row bg-[var(--color-bg-page)] relative animate-in fade-in overflow-hidden gap-6 p-6">

      {/* LEFT COLUMN: Source Watchers (Local Sidebar) - Now styled as a Card */}
      <div className="hidden lg:flex flex-col w-64 shrink-0 gap-6">
          <Sidebar />
          {/* We can put other small widgets here if needed, e.g. recent activity summary */}
      </div>

      {/* MIDDLE COLUMN: Main Workspace (Files) */}
      <div className="flex-1 flex flex-col min-w-0 bg-[var(--color-bg-surface)] rounded-3xl shadow-sm border border-border overflow-hidden relative">
        <header className="px-8 py-6 flex items-center justify-between bg-white border-b border-border z-10">
          <div className="flex flex-col gap-1">
             <h2 className="text-2xl font-bold text-text-primary tracking-tight">All Files</h2>
             <div className="flex items-center gap-2 text-text-secondary text-sm">
                <span className="material-symbols-outlined text-[18px] text-text-muted">folder_open</span>
                <span className="truncate max-w-[400px] font-medium opacity-80">{currentPath}</span>
             </div>
          </div>
        </header>

        {/* This panel can be collapsible or integrated better */}
        <div className="px-6 pt-4">
             <MixerPanel />
        </div>

        <FileGrid />
      </div>

      {/* RIGHT COLUMN: Transaction Desk & Stats */}
      <div className="w-full lg:w-[400px] xl:w-[420px] flex flex-col gap-6 shrink-0 overflow-hidden">
          <TransactionDesk onExecute={handleExecute} />
      </div>

      {/* Floating Status Notification */}
      {executionState.status !== 'IDLE' && (
        <div className="fixed bottom-8 right-8 z-[100] w-[320px] rounded-2xl border border-border bg-white p-5 shadow-2xl animate-in slide-in-from-bottom duration-300">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1.5 flex-1">
              <div className="text-[10px] font-bold uppercase tracking-wider text-text-muted">
                Background Task
              </div>
              <div className="text-base font-bold text-text-primary flex items-center gap-2">
                {executionState.status === 'EXECUTING' && <span className="w-2 h-2 rounded-full bg-primary animate-pulse"/>}
                {executionState.status === 'EXECUTING' && 'Processing Files...'}
                {executionState.status === 'DONE' && 'Task Completed'}
                {executionState.status === 'ERROR' && 'Task Failed'}
              </div>
              <div className="text-xs text-text-secondary font-medium">
                {executionState.status === 'EXECUTING' && `Progress: ${executionState.progress}%`}
                {executionState.status === 'DONE' && `Successfully processed ${executionState.totalFiles} items.`}
                {executionState.status === 'ERROR' && (executionState.error || 'Please check logs.')}
              </div>
            </div>
            {(executionState.status === 'DONE' || executionState.status === 'ERROR') && (
              <button
                onClick={() => setExecutionState({ status: 'IDLE', logs: [], progress: 0, error: undefined })}
                className="p-1.5 rounded-full hover:bg-bg-muted text-text-muted hover:text-text-primary transition-colors"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            )}
          </div>
          {executionState.status === 'EXECUTING' && (
            <div className="mt-4 h-1.5 rounded-full bg-bg-muted overflow-hidden">
              <div
                className="h-full rounded-full bg-primary transition-all duration-300 ease-out"
                style={{ width: `${executionState.progress}%` }}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};
