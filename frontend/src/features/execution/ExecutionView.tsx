import React from 'react';
import { useAppStore } from '../../store/useAppStore';
import { executeService, toExecutionUpdate, type TaskResponse } from '../../services/executeService';
import { buildPreviewOps, getTargetDir } from '../../utils/preview';

export const ExecutionView: React.FC = () => {
  const {
    executionState,
    setExecutionState,
    previewOps,
    selectedIds,
    files,
    mixerConfig,
    presets,
    targetRoots
  } = useAppStore();

  const handleStart = async () => {
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

    setExecutionState({ status: 'EXECUTING', progress: 0, logs: [], processedFiles: 0, totalFiles: actions.length });

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
    } catch (e) {
        setExecutionState({ status: 'ERROR', error: 'Failed to start execution' });
    }
  };

  // Optional websocket stream to keep progress in sync
  React.useEffect(() => {
    if (executionState.status !== 'EXECUTING' || !executionState.taskId) return;
    const baseUrl = import.meta.env.VITE_API_BASE_URL || '';
    const wsUrl = baseUrl.replace(/^http/, 'ws') + `/ws/tasks/${executionState.taskId}`;
    const ws = new WebSocket(wsUrl);
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
    return () => ws.close();
  }, [executionState.status, executionState.taskId, setExecutionState]);

  if (executionState.status === 'IDLE') {
      return (
          <div className="p-4 border-t">
              <button
                onClick={handleStart}
                disabled={selectedIds.size === 0}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded disabled:bg-gray-300"
              >
                  Start Execution
              </button>
          </div>
      );
  }

  return (
    <div className="p-4 border-t bg-gray-50">
      <div className="flex justify-between mb-2">
          <span className="font-medium">Status: {executionState.status}</span>
          <span>{executionState.progress}%</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4">
        <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${executionState.progress}%` }}></div>
      </div>

      <div className="h-32 overflow-y-auto bg-black text-green-400 p-2 font-mono text-xs rounded">
        {executionState.logs.map((log, i) => (
            <div key={i}>{log}</div>
        ))}
      </div>

      {executionState.status === 'DONE' && (
          <button
            onClick={() => setExecutionState({ status: 'IDLE' })}
            className="mt-2 text-blue-600 hover:underline text-sm"
          >
              Close
          </button>
      )}
    </div>
  );
};
