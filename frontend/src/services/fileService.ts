import { request } from './api';
import type { FileItem } from '../types';

export interface ListFilesResponse {
  files: FileItem[];
  parentPath: string | null;
}

interface BackendFileInfo {
  id: string;
  name: string;
  path: string;
  size: number;
  modTime: string;
  isDir: boolean;
}

const IMAGE_EXTENSIONS = new Set(['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'tiff', 'tif', 'heic', 'avif']);

const formatBytes = (bytes: number): string => {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let index = 0;
  let value = bytes;
  while (value >= 1024 && index < units.length - 1) {
    value /= 1024;
    index += 1;
  }
  const precision = value >= 10 || index === 0 ? 0 : 1;
  return `${value.toFixed(precision)}${units[index]}`;
};

const getFileExtension = (name: string): string => {
  const idx = name.lastIndexOf('.');
  if (idx === -1 || idx === name.length - 1) return '';
  return name.slice(idx + 1).toLowerCase();
};

const getThumbnailUrl = (filePath: string) => {
  const baseUrl = import.meta.env.VITE_API_BASE_URL || '/api/v1';
  return `${baseUrl}/files/thumbnail?path=${encodeURIComponent(filePath)}`;
};

const normalizeFile = (file: BackendFileInfo): FileItem => {
  const ext = getFileExtension(file.name);
  const type = file.isDir ? 'dir' : (ext ? ext.toUpperCase() : 'FILE');
  const parentPath = file.path.includes('/') ? file.path.slice(0, file.path.lastIndexOf('/')) || '/' : file.path;
  const isImage = !file.isDir && IMAGE_EXTENSIONS.has(ext);
  return {
    id: file.id || file.path,
    name: file.name,
    path: parentPath,
    sourcePath: file.path,
    size: file.isDir ? '-' : formatBytes(file.size),
    type,
    mtime: Date.parse(file.modTime) || Date.now(),
    isDir: file.isDir,
    thumbnail: isImage ? getThumbnailUrl(file.path) : undefined,
  };
};

export const fileService = {
  listFiles: async (path: string): Promise<ListFilesResponse> => {
    const query = `?path=${encodeURIComponent(path)}`;
    const response = await request<{ files: BackendFileInfo[] }>(`/files/list${query}`);
    return {
      files: response.files.map(normalizeFile),
      parentPath: path || null
    };
  },

  getThumbnailUrl,
};
