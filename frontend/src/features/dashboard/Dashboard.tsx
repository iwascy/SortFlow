import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { Sidebar } from './Sidebar';
import { MixerPanel } from '../pattern-mixer/MixerPanel';
import { FileGrid } from '../file-explorer/FileGrid';
import { TransactionDesk } from '../execution/TransactionDesk';
import { INITIAL_FILES, PRESETS, TARGET_ROOTS } from '../../constants';
import { fileService } from '../../services/fileService';
import {
  executeService,
  toExecutionUpdate,
  type OrganizeActionPayload,
  type DuplicateConflict,
  type TaskResponse
} from '../../services/executeService';
import { configService } from '../../services/configService';
import { buildPreviewOps, getTargetDir } from '../../utils/preview';
import { Modal } from '../../components/Modal';
import { Button } from '../../components/Button';
import type { CategoryPreset, PreviewOperation, TargetRoot } from '../../types';

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
  const [duplicatePrompt, setDuplicatePrompt] = useState<{
    conflicts: DuplicateConflict[];
    actions: OrganizeActionPayload[];
    targetPath: string;
    preset: CategoryPreset;
    target: TargetRoot;
  } | null>(null);
  const [isCheckingDuplicates, setIsCheckingDuplicates] = useState(false);
  const [isConfirmingDuplicates, setIsConfirmingDuplicates] = useState(false);

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
        setConfig({ sourceWatchers: config.watchers || [], theme: 'dark', customKeywords: Array.isArray(savedKeywords) ? savedKeywords : [] });
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
        setConfig({ sourceWatchers: Array.from(new Set(INITIAL_FILES.map(file => file.path))), theme: 'dark', customKeywords: Array.isArray(savedKeywords) ? savedKeywords : [] });
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

  const startExecution = useCallback(async ({
    actions,
    targetPath,
    preset,
    target,
  }: {
    actions: OrganizeActionPayload[];
    targetPath: string;
    preset: CategoryPreset;
    target: TargetRoot;
  }) => {
    setExecutionState({
      status: 'EXECUTING',
      progress: 0,
      logs: ['Initializing job...'],
      processedFiles: 0,
      totalFiles: actions.length,
      error: undefined
    });

    try {
      const { taskId } = await executeService.executeTask({
        actions,
        action: 'move',
        presetId: preset.id,
        targetRootId: target.id,
        targetPath
      });
      setExecutionState({ taskId });
      updateMixerConfig({ tempKeyword: '' });
    } catch (error) {
      console.error(error);
      setExecutionState({ status: 'ERROR', error: 'Failed to start execution' });
    }
  }, [setExecutionState, updateMixerConfig]);

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

    const targetPath = getTargetDir(activePreset, activeTarget);
    setIsCheckingDuplicates(true);
    try {
      const { conflicts } = await executeService.checkDuplicates({
        targetPath,
        actions,
      });
      if (conflicts.length > 0) {
        setDuplicatePrompt({
          conflicts,
          actions,
          targetPath,
          preset: activePreset,
          target: activeTarget,
        });
        return;
      }
      await startExecution({ actions, targetPath, preset: activePreset, target: activeTarget });
    } catch (error) {
      console.error(error);
      setExecutionState({ status: 'ERROR', error: '无法完成重复检测，请稍后再试。' });
    } finally {
      setIsCheckingDuplicates(false);
    }
  };

  const handleSkipDuplicates = async () => {
    if (!duplicatePrompt) return;
    const skipSources = new Set(duplicatePrompt.conflicts.map(conflict => conflict.sourcePath));
    const remainingActions = duplicatePrompt.actions.filter(action => !skipSources.has(action.sourcePath));
    if (remainingActions.length === 0) {
      setDuplicatePrompt(null);
      setExecutionState({ status: 'ERROR', error: '所有重复文件均被跳过，未剩余可执行任务。' });
      return;
    }
    setIsConfirmingDuplicates(true);
    try {
      await startExecution({
        actions: remainingActions,
        targetPath: duplicatePrompt.targetPath,
        preset: duplicatePrompt.preset,
        target: duplicatePrompt.target,
      });
      setDuplicatePrompt(null);
    } finally {
      setIsConfirmingDuplicates(false);
    }
  };

  const handleOverwriteDuplicates = async () => {
    if (!duplicatePrompt) return;
    const overwriteSources = new Set(duplicatePrompt.conflicts.map(conflict => conflict.sourcePath));
    const updatedActions = duplicatePrompt.actions.map(action =>
      overwriteSources.has(action.sourcePath)
        ? { ...action, allowOverwrite: true }
        : action
    );
    setIsConfirmingDuplicates(true);
    try {
      await startExecution({
        actions: updatedActions,
        targetPath: duplicatePrompt.targetPath,
        preset: duplicatePrompt.preset,
        target: duplicatePrompt.target,
      });
      setDuplicatePrompt(null);
    } finally {
      setIsConfirmingDuplicates(false);
    }
  };

  const handleDismissDuplicatePrompt = () => {
    if (isConfirmingDuplicates) return;
    setDuplicatePrompt(null);
  };

  const duplicateListPreview = duplicatePrompt ? duplicatePrompt.conflicts.slice(0, 5) : [];
  const remainingConflictCount = duplicatePrompt ? duplicatePrompt.conflicts.length - duplicateListPreview.length : 0;

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

      <TransactionDesk onExecute={handleExecute} isCheckingDuplicates={isCheckingDuplicates} />

      {executionState.status !== 'IDLE' && (
        <div className="fixed bottom-6 right-6 lg:right-[440px] z-[80] w-[280px] rounded-2xl border border-border-dark bg-surface-dark/80 p-4 shadow-2xl backdrop-blur">
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
      {duplicatePrompt && (
        <Modal
          isOpen
          onClose={handleDismissDuplicatePrompt}
          title="检测到重复文件"
          footer={(
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
              <Button
                variant="secondary"
                onClick={handleSkipDuplicates}
                disabled={isConfirmingDuplicates}
              >
                跳过重复项
              </Button>
              <Button
                variant="danger"
                onClick={handleOverwriteDuplicates}
                isLoading={isConfirmingDuplicates}
              >
                覆盖重复项
              </Button>
            </div>
          )}
        >
          <div className="space-y-3 text-sm text-gray-600">
            <p>
              在 <span className="font-mono text-gray-900">{duplicatePrompt.targetPath}</span> 中发现 {duplicatePrompt.conflicts.length} 个内容一致的文件（通过 MD5 对比）。
            </p>
            <ul className="list-disc list-inside text-xs text-gray-700 space-y-1">
              {duplicateListPreview.map((conflict, index) => (
                <li key={`${conflict.existingPath}-${index}`}>
                  <span className="font-mono text-gray-900">{conflict.sourceName}</span>
                  <span className="text-gray-500"> ⇄ {conflict.existingName}</span>
                </li>
              ))}
            </ul>
            {remainingConflictCount > 0 && (
              <p className="text-xs text-amber-600">另有 {remainingConflictCount} 个重复文件未列出。</p>
            )}
            <p className="text-xs text-gray-500">
              选择“跳过”仅执行其余文件；选择“覆盖”则会删除重复文件后再写入新的副本。
            </p>
          </div>
        </Modal>
      )}
    </div>
  );
};
