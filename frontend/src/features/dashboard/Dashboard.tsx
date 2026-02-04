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
    setExecutionState,
    selectedIds,
    previewOps,
    executionState,
    clearSelection,
    setIsLoadingFiles,
    setConfig,
    mixerConfig,
    presets,
    targetRoots,
    files
  } = useAppStore();

  const wsRef = useRef<WebSocket | null>(null);
  const wsTaskIdRef = useRef<string | null>(null);

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
        setConfig({ sourceWatchers: config.watchers || [], theme: 'dark' });
        const sortedPresets = (config.presets || []).slice().sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
        setPresets(sortedPresets.length ? sortedPresets : PRESETS);
        setTargetRoots((config.targets || []).length ? config.targets : TARGET_ROOTS);
        if (config.watchers?.length) {
          if (!currentPath || !config.watchers.includes(currentPath)) {
            setCurrentPath(config.watchers[0]);
          }
        }
      } catch (error) {
        console.error(error);
        setConfig({ sourceWatchers: Array.from(new Set(INITIAL_FILES.map(file => file.path))), theme: 'dark' });
        setPresets(PRESETS);
        setTargetRoots(TARGET_ROOTS);
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
    if (executionState.status === 'DONE') {
      clearSelection();
      if (currentPath) {
        void loadFiles(currentPath, false);
      }
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
    } catch (error) {
      console.error(error);
      setExecutionState({ status: 'ERROR', error: 'Failed to start execution' });
    }
  };

  return (
    <div className="flex h-screen flex-col lg:flex-row bg-background-dark relative animate-in fade-in overflow-hidden">
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

      {executionState.status !== 'IDLE' && (
        <div className="fixed bottom-6 right-6 z-50 w-[280px] rounded-2xl border border-border-dark bg-surface-dark/80 p-4 shadow-2xl backdrop-blur">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <div className="text-[11px] font-black uppercase tracking-widest text-text-secondary">
                后台任务
              </div>
              <div className="text-sm font-black text-white">
                {executionState.status === 'EXECUTING' && '正在执行'}
                {executionState.status === 'DONE' && '已完成'}
                {executionState.status === 'ERROR' && '执行失败'}
              </div>
              <div className="text-[10px] text-text-secondary">
                {executionState.status === 'EXECUTING' && `进度 ${executionState.progress}%`}
                {executionState.status === 'DONE' && `已处理 ${executionState.totalFiles} 项`}
                {executionState.status === 'ERROR' && (executionState.error || '请检查日志或重试')}
              </div>
            </div>
            {(executionState.status === 'DONE' || executionState.status === 'ERROR') && (
              <button
                onClick={() => setExecutionState({ status: 'IDLE', logs: [], progress: 0, error: undefined })}
                className="text-[10px] font-black uppercase tracking-widest text-text-secondary hover:text-white"
              >
                关闭
              </button>
            )}
          </div>
          {executionState.status === 'EXECUTING' && (
            <div className="mt-3 h-2 rounded-full bg-black/40">
              <div
                className="h-full rounded-full bg-gradient-to-r from-primary via-cyan-400 to-primary transition-all duration-300"
                style={{ width: `${executionState.progress}%` }}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};
