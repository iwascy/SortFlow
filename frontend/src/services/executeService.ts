import { request } from './api';
import type { ExecutionState } from '../types';

export interface OrganizeActionPayload {
  sourcePath: string;
  targetPath: string;
  operation: 'move' | 'copy';
}

export interface ExecutePayload {
  actions: OrganizeActionPayload[];
  action: 'move' | 'copy';
  presetId?: string;
  targetRootId?: string;
  targetPath: string;
}

export interface TaskResponse {
  id: string;
  status: 'running' | 'completed' | 'failed' | 'cancelled';
  progress: number;
  logs: string;
}

type TaskPayload = Partial<TaskResponse> & {
  ID?: string;
  Status?: TaskResponse['status'];
  Progress?: number;
  Logs?: string;
};

const mapTaskStatus = (status?: string): ExecutionState['status'] => {
  const normalized = (status || '').toLowerCase();
  if (normalized === 'running') return 'EXECUTING';
  if (normalized === 'completed') return 'DONE';
  return 'ERROR';
};

export const toExecutionUpdate = (task: TaskPayload): Partial<ExecutionState> => {
  const status = task.status ?? task.Status;
  const progressRaw = task.progress ?? task.Progress ?? 0;
  const logsRaw = task.logs ?? task.Logs ?? '';
  const normalizedStatus = (status || '').toLowerCase();
  const progress = Math.max(0, Math.min(100, Math.round(progressRaw * 100)));
  const logs = logsRaw ? logsRaw.split('\n').filter(Boolean) : [];
  return {
    status: mapTaskStatus(status),
    progress,
    logs,
    error: normalizedStatus === 'failed' ? 'Task failed' : normalizedStatus === 'cancelled' ? 'Task cancelled' : undefined,
  };
};

export const executeService = {
  executeTask: (payload: ExecutePayload) =>
    request<{ taskId: string }>('/organize/execute', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  getTaskProgress: async (taskId: string): Promise<Partial<ExecutionState>> => {
    const task = await request<TaskPayload>(`/tasks/${taskId}`, { method: 'GET' });
    return toExecutionUpdate(task);
  },
};
