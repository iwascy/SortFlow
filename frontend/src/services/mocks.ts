import { registerMock } from './api';
import type { FileItem } from '../types';

const MOCK_FILES: FileItem[] = Array.from({ length: 50 }).map((_, i) => {
  const type = ['jpg', 'png', 'mov', 'mp4', 'arw'][Math.floor(Math.random() * 5)];
  const sizeMB = (Math.random() * 50 + 1).toFixed(1);
  return {
    id: `file-${i}`,
    name: `DSC_${1000 + i}.${type}`,
    path: `/mock/source/DSC_${1000 + i}.${type}`,
    size: `${sizeMB}MB`,
    type,
    mtime: Date.now() - Math.floor(Math.random() * 10000000000),
    thumbnail: `https://picsum.photos/200/200?random=${i}`, // Use placeholder images
  };
});

export function setupMocks() {
  registerMock('/files/list', 'GET', async () => {
    return {
      files: MOCK_FILES,
      parentPath: '/mock/source'
    };
  });

  registerMock('/preview/calculate', 'POST', async (options) => {
    const body = JSON.parse(options?.body as string || '{}');
    const { fileIds, config } = body;

    return fileIds.map((id: string) => {
      const file = MOCK_FILES.find(f => f.id === id);
      if (!file) return null;

      let newName = file.name;
      if (config.renamePattern === 'PREFIX') {
        newName = `${config.customPrefix || 'PRE'}_${file.name}`;
      } else if (config.renamePattern === 'DATE') {
        newName = `2023-10-27_${file.name}`;
      }

      return {
        fileId: id,
        originalName: file.name,
        newName,
        status: 'ready',
        targetPath: '/mock/target/' + newName,
        originalPath: file.path,
        newPath: '/mock/target/' + newName
      };
    }).filter(Boolean);
  });

  registerMock('/execute/start', 'POST', async () => {
    return { taskId: 'task-123' };
  });

  registerMock('/execute/status/task-123', 'GET', async () => {
    // Random progress
    const progress = Math.min(100, Math.floor(Math.random() * 100));
    return {
      status: progress === 100 ? 'DONE' : 'EXECUTING',
      taskId: 'task-123',
      progress,
      totalFiles: 10,
      processedFiles: Math.floor(progress / 10),
      logs: ['Started task...', 'Processing file 1...', 'Processing file 2...']
    };
  });

  console.log('Mocks initialized');
}
