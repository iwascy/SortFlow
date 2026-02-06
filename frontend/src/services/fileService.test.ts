import { describe, it, expect, vi, afterEach } from 'vitest';
import { fileService } from './fileService';
import * as api from './api';

describe('fileService', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('listFiles calls api correctly', async () => {
    const mockResponse = {
      files: [
        {
          id: '/some/path/file.jpg',
          name: 'file.jpg',
          path: '/some/path/file.jpg',
          size: 1024,
          modTime: new Date().toISOString(),
          isDir: false
        }
      ]
    };
    const requestSpy = vi.spyOn(api, 'request').mockResolvedValue(mockResponse as any);

    const result = await fileService.listFiles('/some/path');

    expect(requestSpy).toHaveBeenCalledWith('/files/list?path=%2Fsome%2Fpath');
    expect(result.files).toHaveLength(1);
    expect(result.files[0].name).toBe('file.jpg');
  });

  it('getThumbnailUrl returns correct url', () => {
    const url = fileService.getThumbnailUrl('/some/path/file.jpg');
    // We expect it to contain the endpoint. The base URL might vary but the suffix is constant.
    expect(url).toContain('/files/thumbnail?path=');
  });

  it('getFileContentUrl returns correct url', () => {
    const url = fileService.getFileContentUrl('/some/path/file.jpg');
    expect(url).toContain('/files/content?path=');
  });
});
