import { request } from './api';
import type { FileItem, PreviewOperation } from '../types';

export interface PreviewRules {
  prefix: string;
  suffix: string;
  useOriginal: boolean;
}

interface PreviewResponse {
  results: Array<{
    fileId: string;
    newName: string;
    status: string;
    statusReason?: string;
  }>;
}

const toFileInfoPayload = (file: FileItem) => ({
  id: file.id,
  name: file.name,
  path: file.sourcePath || `${file.path}/${file.name}`,
  size: 0,
  modTime: new Date(file.mtime || Date.now()).toISOString(),
  isDir: !!file.isDir,
});

export const previewService = {
  calculatePreview: async (files: FileItem[], rules: PreviewRules, targetPath: string) => {
    const response = await request<PreviewResponse>('/preview', {
      method: 'POST',
      body: JSON.stringify({
        files: files.map(toFileInfoPayload),
        rules,
        targetPath,
      }),
    });

    return response.results.map(result => ({
      id: result.fileId,
      fileId: result.fileId,
      originalName: files.find(f => f.id === result.fileId)?.name || result.fileId,
      newName: result.newName,
      status: result.status as PreviewOperation['status'],
      statusReason: result.statusReason,
      targetPath,
      originalPath: files.find(f => f.id === result.fileId)?.sourcePath || '',
      newPath: `${targetPath}/${result.newName}`,
    }));
  },
};
