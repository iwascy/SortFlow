import { describe, it, expect, vi, afterEach } from 'vitest';
import { executeService } from './executeService';
import * as api from './api';

describe('executeService', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('executeTask sends correct payload', async () => {
    const requestSpy = vi.spyOn(api, 'request').mockResolvedValue({ taskId: 'task-1' });
    const fileIds = ['1', '2'];
    const previewOps = [{ id: '1' }];

    await executeService.executeTask(fileIds, previewOps);

    expect(requestSpy).toHaveBeenCalledWith('/execute/start', expect.objectContaining({
      method: 'POST',
      body: JSON.stringify({ fileIds, previewOps }),
    }));
  });

  it('getTaskProgress calls correct endpoint', async () => {
    const requestSpy = vi.spyOn(api, 'request').mockResolvedValue({});
    await executeService.getTaskProgress('task-1');
    expect(requestSpy).toHaveBeenCalledWith('/execute/status/task-1', expect.objectContaining({ method: 'GET' }));
  });
});
