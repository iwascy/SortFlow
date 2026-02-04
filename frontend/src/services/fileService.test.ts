import { describe, it, expect, vi, afterEach } from 'vitest';
import { fileService } from './fileService';
import * as api from './api';

describe('fileService', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('listFiles calls api correctly', async () => {
    const mockResponse = { files: [], parentPath: null };
    const requestSpy = vi.spyOn(api, 'request').mockResolvedValue(mockResponse);

    const result = await fileService.listFiles('/some/path');

    expect(requestSpy).toHaveBeenCalledWith('/files/list?path=%2Fsome%2Fpath');
    expect(result).toBe(mockResponse);
  });

  it('getThumbnailUrl returns correct url', () => {
    const url = fileService.getThumbnailUrl('123');
    // We expect it to contain the endpoint. The base URL might vary but the suffix is constant.
    expect(url).toContain('/files/thumbnail/123');
  });
});
