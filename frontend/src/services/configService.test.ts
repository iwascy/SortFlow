import { afterEach, describe, expect, it, vi } from 'vitest';
import * as api from './api';
import { configService } from './configService';

describe('configService', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('exportConfig calls export endpoint', async () => {
    const requestSpy = vi.spyOn(api, 'request').mockResolvedValue({} as any);

    await configService.exportConfig();

    expect(requestSpy).toHaveBeenCalledWith('/system/config/export');
  });

  it('importConfig posts payload to import endpoint', async () => {
    const requestSpy = vi.spyOn(api, 'request').mockResolvedValue(undefined as any);
    const payload = {
      version: 1,
      config: { watchers: [], targets: [], presets: [], keywords: [] },
    };

    await configService.importConfig(payload);

    expect(requestSpy).toHaveBeenCalledWith('/system/config/import', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  });
});
