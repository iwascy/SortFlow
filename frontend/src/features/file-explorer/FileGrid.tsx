import React from 'react';
import { useAppStore } from '../../store/useAppStore';
import { FileCard } from './FileCard';

export const FileGrid: React.FC = () => {
  const { files, currentPath, selectedIds, toggleSelection, setCurrentPath } = useAppStore();

  const currentFiles = files.filter(f => f.path === currentPath);

  return (
    <div className="flex-1 overflow-y-auto p-10 pb-40 animate-in fade-in duration-1000 delay-200 fill-mode-both">
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-10">
        {currentFiles.map((file, idx) => (
          <FileCard
            key={file.id}
            file={file}
            selected={selectedIds.has(file.id)}
            onClick={(e) => toggleSelection(file.id, e.ctrlKey || e.metaKey, e.shiftKey)}
            onDoubleClick={() => {
              if (file.isDir && file.sourcePath) {
                setCurrentPath(file.sourcePath);
              }
            }}
            animationDelay={`${(idx % 10) * 50}ms`}
          />
        ))}
      </div>
    </div>
  );
};
