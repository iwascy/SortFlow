import { describe, it, expect, vi, afterEach } from 'vitest';
import { executeService } from './executeService';
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
});
