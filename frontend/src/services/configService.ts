import { request } from './api';
import type { CategoryPreset, Keyword, TargetRoot } from '../types';

export interface SystemConfigResponse {
  watchers: string[];
  targets: TargetRoot[];
  presets: CategoryPreset[];
  keywords: Keyword[];
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

export interface CreateKeywordRequest {
  name: string;
  order?: number;
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

  createKeyword: (payload: CreateKeywordRequest) =>
    request<Keyword>('/system/keywords', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  updateKeyword: (id: string, payload: CreateKeywordRequest) =>
    request<Keyword>(`/system/keywords/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),

  deleteKeyword: (id: string) =>
    request<void>(`/system/keywords/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    }),
};
