import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { request, ApiError } from './api';

describe('api service', () => {
  const mockFetch = vi.fn();

  beforeEach(() => {
    mockFetch.mockClear();
    vi.stubGlobal('fetch', mockFetch);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should return json data on success', async () => {
    const mockData = { id: 1, name: 'test' };
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      headers: { get: () => 'application/json' },
      json: () => Promise.resolve(mockData),
    });

    const result = await request('/test');
    expect(result).toEqual(mockData);

    const [url, options] = mockFetch.mock.lastCall;
    expect(url).toContain('/test');
    // api.ts does not explicitly set method: GET if not provided, relies on fetch default
    expect(options.method).toBeUndefined();
  });

  it('should throw ApiError on failure', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 400,
      statusText: 'Bad Request',
      text: () => Promise.resolve('Error details'),
    });

    await expect(request('/error')).rejects.toThrow(ApiError);
    await expect(request('/error')).rejects.toThrow('Error details');
  });

  it('should set default content-type header for string body', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      headers: { get: () => 'application/json' },
      json: () => Promise.resolve({}),
    });

    await request('/post', { method: 'POST', body: JSON.stringify({ a: 1 }) });

    const [url, options] = mockFetch.mock.lastCall;
    expect(url).toContain('/post');
    expect(options.method).toBe('POST');

    // Check Headers object
    const headers = options.headers as Headers;
    expect(headers).toBeInstanceOf(Headers);
    expect(headers.get('Content-Type')).toBe('application/json');
  });

  it('should handle 204 No Content', async () => {
     mockFetch.mockResolvedValue({
      ok: true,
      status: 204,
      headers: { get: () => '' },
      text: () => Promise.resolve(''),
    });

    const result = await request('/void');
    expect(result).toBeUndefined();
  });
});
