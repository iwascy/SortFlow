import { request } from './api';
import type { MixerConfig, PreviewOperation } from '../types';

export const previewService = {
  calculatePreview: (fileIds: string[], config: MixerConfig) =>
    request<PreviewOperation[]>('/preview/calculate', {
      method: 'POST',
      body: JSON.stringify({ fileIds, config }),
    }),
};
