import React from 'react';
import { useAppStore } from '../../store/useAppStore';
import { executeService } from '../../services/executeService';
import { usePolling } from '../../hooks/usePolling';

export const ExecutionView: React.FC = () => {
  const { executionState, setExecutionState, previewOps, selectedIds } = useAppStore();

  const handleStart = async () => {
    if (executionState.status !== 'IDLE' && executionState.status !== 'DONE' && executionState.status !== 'ERROR') return;

    setExecutionState({ status: 'EXECUTING', progress: 0, logs: [], processedFiles: 0, totalFiles: selectedIds.size });

    try {
        const { taskId } = await executeService.executeTask(Array.from(selectedIds), previewOps);
        setExecutionState({ taskId });
    } catch (e) {
        setExecutionState({ status: 'ERROR', error: 'Failed to start execution' });
    }
  };

  usePolling(async () => {
    if (executionState.status === 'EXECUTING' && executionState.taskId) {
        const state = await executeService.getTaskProgress(executionState.taskId);
        setExecutionState(state);
    }
  }, 1000, executionState.status === 'EXECUTING');

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
