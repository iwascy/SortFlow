import { registerMock } from './api';
import type { FileItem } from '../types';

const MOCK_FILES: FileItem[] = Array.from({ length: 50 }).map((_, i) => {
  const type = ['jpg', 'png', 'mov', 'mp4', 'arw'][Math.floor(Math.random() * 5)];
  return {
    id: `file-${i}`,
    name: `DSC_${1000 + i}.${type}`,
    path: `/mock/source/DSC_${1000 + i}.${type}`,
    size: Math.floor(Math.random() * 10000000) + 100000,
    type,
    mtime: Date.now() - Math.floor(Math.random() * 10000000000),
    thumbnailUrl: `https://picsum.photos/200/200?random=${i}`, // Use placeholder images
  };
});

export function setupMocks() {
  registerMock('/files/list', 'GET', async () => {
    return {
      files: MOCK_FILES,
      parentPath: '/mock/source'
    };
  });

  console.log('Mocks initialized');
}
