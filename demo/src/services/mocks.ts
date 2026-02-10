import { registerMock } from './api';
const MOCK_FILES = Array.from({ length: 50 }).map((_, i) => {
  const type = ['jpg', 'png', 'mov', 'mp4', 'arw'][Math.floor(Math.random() * 5)];
  const sizeBytes = Math.floor((Math.random() * 50 + 1) * 1024 * 1024);
  const fileName = `DSC_${1000 + i}.${type}`;
  const fullPath = `/mock/source/${fileName}`;
  return {
    id: fullPath,
    name: fileName,
    path: fullPath,
    size: sizeBytes,
    modTime: new Date(Date.now() - Math.floor(Math.random() * 10000000000)).toISOString(),
    isDir: false,
  };
});

export function setupMocks() {
  registerMock('/files/list', 'GET', async () => {
    return {
      files: MOCK_FILES,
      parentPath: '/mock/source'
    };
  });

  registerMock('/system/config', 'GET', async () => {
    return {
      watchers: ['/mock/source'],
      targets: [
        { id: 'mock-target', name: 'Mock Target', path: '/mock/target', icon: 'dns' }
      ],
      presets: [
        { id: 'mock-preset', name: 'Mock Preset', icon: 'category', color: 'primary', targetSubPath: 'Archive', defaultPrefix: 'MOCK_', order: 0 }
      ]
    };
  });

  registerMock('/history', 'GET', async () => {
    return {
      items: [],
      page: 1,
      pageSize: 20,
      total: 0
    };
  });

  registerMock('/preview', 'POST', async (options) => {
    const body = JSON.parse(options?.body as string || '{}');
    const { files, rules, targetPath } = body;

    return {
      results: (files || []).map((file: any) => {
        const match = MOCK_FILES.find(f => f.id === file.id);
        if (!match) return null;
        const base = rules?.useOriginal ? match.name : `${rules?.prefix || ''}${match.name}${rules?.suffix || ''}`;
        return {
          fileId: match.id,
          newName: base,
          status: 'ready',
          targetPath,
        };
      }).filter(Boolean)
    };
  });

  registerMock('/organize/execute', 'POST', async () => {
    return { taskId: 'task-123' };
  });

  registerMock('/tasks/task-123', 'GET', async () => {
    const progress = Math.min(1, Math.random());
    return {
      id: 'task-123',
      status: progress >= 1 ? 'completed' : 'running',
      progress,
      logs: 'Started task...\nProcessing file 1...\nProcessing file 2...'
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

  console.log('Mocks initialized');
}
