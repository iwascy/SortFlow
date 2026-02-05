import { request } from './api';
import type { CategoryPreset, TargetRoot } from '../types';

export interface SystemConfigResponse {
  watchers: string[];
  targets: TargetRoot[];
  presets: CategoryPreset[];
}

export interface CreatePresetRequest {
  name: string;
  icon?: string;
  color?: string;
  targetSubPath?: string;
  defaultPrefix?: string;
  order?: number;
}

export interface CreateTargetRequest {
  name: string;
  path: string;
  icon?: string;
}

export interface GenerateVideoCoversResponse {
  total: number;
  generated: number;
  failed: number;
}

export const configService = {
  getConfig: () => request<SystemConfigResponse>('/system/config'),

  addWatcher: (path: string) =>
    request<void>('/system/watchers', {
      method: 'POST',
      body: JSON.stringify({ path }),
    }),

  removeWatcher: (path: string) =>
    request<void>(`/system/watchers?path=${encodeURIComponent(path)}`, {
      method: 'DELETE',
    }),

  createPreset: (payload: CreatePresetRequest) =>
    request<CategoryPreset>('/system/presets', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  deletePreset: (id: string) =>
    request<void>(`/system/presets/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    }),

  createTarget: (payload: CreateTargetRequest) =>
    request<TargetRoot>('/system/targets', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  deleteTarget: (id: string) =>
    request<void>(`/system/targets/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    }),

  generateVideoCovers: () =>
    request<GenerateVideoCoversResponse>('/system/video-covers/generate', {
      method: 'POST',
    }),
};
