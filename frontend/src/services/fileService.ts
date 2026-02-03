import { request } from './api';
import type { FileItem } from '../types';

export interface ListFilesResponse {
  files: FileItem[];
  parentPath: string | null;
}

export const fileService = {
  listFiles: async (path?: string): Promise<ListFilesResponse> => {
    const query = path ? `?path=${encodeURIComponent(path)}` : '';
    return request<ListFilesResponse>(`/files/list${query}`);
  },

  getThumbnailUrl: (fileId: string) => {
    // In a real app, this might return a URL to an image endpoint
    // We can just construct the URL directly if we know the pattern
    const baseUrl = import.meta.env.VITE_API_BASE_URL || '/api/v1';
    return `${baseUrl}/files/thumbnail/${fileId}`;
  }
};
