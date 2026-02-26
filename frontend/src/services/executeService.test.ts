import { describe, it, expect, vi, afterEach } from 'vitest';
import { executeService, toExecutionUpdate } from './executeService';
import * as api from './api';

describe('executeService', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('executeTask sends correct payload', async () => {
    const requestSpy = vi.spyOn(api, 'request').mockResolvedValue({ taskId: 'task-1' });
    const payload = {
      actions: [
        { sourcePath: '/src/a.jpg', targetPath: '/dst/a.jpg', operation: 'move' as const },
      ],
      action: 'move' as const,
      presetId: 'preset-1',
      targetRootId: 'target-1',
      targetPath: '/dst'
    };

    await executeService.executeTask(payload);

    expect(requestSpy).toHaveBeenCalledWith('/organize/execute', expect.objectContaining({
      method: 'POST',
      body: JSON.stringify(payload),
    }));
  });

  it('getTaskProgress calls correct endpoint', async () => {
    const requestSpy = vi.spyOn(api, 'request').mockResolvedValue({
      id: 'task-1',
      status: 'running',
      progress: 0.4,
      logs: ''
    });
    await executeService.getTaskProgress('task-1');
    expect(requestSpy).toHaveBeenCalledWith('/tasks/task-1', expect.objectContaining({ method: 'GET' }));
  });

  it('toExecutionUpdate supports legacy uppercase task payload', () => {
    const update = toExecutionUpdate({
      ID: 'task-1',
      Status: 'completed',
      Progress: 1,
      Logs: 'line 1\nline 2\n',
    });

    expect(update.status).toBe('DONE');
    expect(update.progress).toBe(100);
    expect(update.logs).toEqual(['line 1', 'line 2']);
    expect(update.error).toBeUndefined();
  });
});
