import { request } from './api';
import type { ExecutionState } from '../types';

export interface OrganizeActionPayload {
  sourcePath: string;
  targetPath: string;
  operation: 'move' | 'copy';
  allowOverwrite?: boolean;
}

export interface ExecutePayload {
  actions: OrganizeActionPayload[];
  action: 'move' | 'copy';
  presetId?: string;
  targetRootId?: string;
  targetPath: string;
}

export interface DuplicateCheckPayload {
  targetPath: string;
  actions: OrganizeActionPayload[];
}

export interface DuplicateConflict {
  sourcePath: string;
  sourceName: string;
  targetPath: string;
  existingPath: string;
  existingName: string;
}

export interface TaskResponse {
  id: string;
  status: 'running' | 'completed' | 'failed' | 'cancelled';
  progress: number;
  logs: string;
}

const mapTaskStatus = (status: TaskResponse['status']): ExecutionState['status'] => {
  if (status === 'running') return 'EXECUTING';
  if (status === 'completed') return 'DONE';
  return 'ERROR';
};

export const toExecutionUpdate = (task: TaskResponse): Partial<ExecutionState> => {
  const progress = Math.max(0, Math.min(100, Math.round((task.progress || 0) * 100)));
  const logs = task.logs ? task.logs.split('\n').filter(Boolean) : [];
  return {
    status: mapTaskStatus(task.status),
    progress,
    logs,
    error: task.status === 'failed' ? 'Task failed' : task.status === 'cancelled' ? 'Task cancelled' : undefined,
  };
};

export const executeService = {
  executeTask: (payload: ExecutePayload) =>
    request<{ taskId: string }>('/organize/execute', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  checkDuplicates: (payload: DuplicateCheckPayload) =>
    request<{ conflicts: DuplicateConflict[] }>('/organize/duplicates', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  getTaskProgress: async (taskId: string): Promise<Partial<ExecutionState>> => {
    const task = await request<TaskResponse>(`/tasks/${taskId}`, { method: 'GET' });
    return toExecutionUpdate(task);
  },
};
