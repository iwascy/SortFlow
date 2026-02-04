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

  createTarget: (payload: CreateTargetRequest) =>
    request<TargetRoot>('/system/targets', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
};
