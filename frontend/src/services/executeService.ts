import { request } from './api';
import type { ExecutionState } from '../types';

export const executeService = {
  executeTask: (fileIds: string[], previewOps: any[]) =>
    request<{ taskId: string }>('/execute/start', {
      method: 'POST',
      body: JSON.stringify({ fileIds, previewOps }),
    }),

  getTaskProgress: (taskId: string) =>
    request<ExecutionState>(`/execute/status/${taskId}`, {
      method: 'GET',
    }),
};
