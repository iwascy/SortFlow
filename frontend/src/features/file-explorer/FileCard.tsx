import React from 'react';
import type { FileItem } from '../../types';
import { cn } from '../../utils/cn';

interface FileCardProps {
  file: FileItem;
  selected?: boolean;
  onClick?: (e: React.MouseEvent) => void;
  onDoubleClick?: (e: React.MouseEvent) => void;
}

export const FileCard: React.FC<FileCardProps> = ({
  file,
  selected,
  onClick,
  onDoubleClick,
}) => {
  return (
    <div
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      className={cn(
        "group relative flex flex-col p-2 rounded-lg border transition-all cursor-pointer select-none",
        selected
          ? "bg-indigo-50 border-indigo-500 ring-2 ring-indigo-500 ring-opacity-50"
          : "bg-white border-gray-200 hover:border-indigo-300 hover:shadow-md"
      )}
    >
      <div className="aspect-square bg-gray-100 rounded-md overflow-hidden relative mb-2">
        {file.thumbnailUrl ? (
          <img
            src={file.thumbnailUrl}
            alt={file.name}
            className="w-full h-full object-cover transition-transform group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <span className="material-symbols-outlined text-gray-300 text-5xl">
              {file.type === 'dir' ? 'folder' : 'description'}
            </span>
          </div>
        )}

        {/* Selection Checkmark Overlay */}
        {selected && (
            <div className="absolute top-2 right-2 bg-indigo-600 rounded-full p-0.5 text-white shadow-sm">
                <span className="material-symbols-outlined text-sm font-bold block" style={{ fontSize: '16px' }}>check</span>
            </div>
        )}
      </div>

      <div className="flex flex-col min-w-0">
        <span className="truncate text-sm font-medium text-gray-900 group-hover:text-indigo-700" title={file.name}>
          {file.name}
        </span>
        <div className="flex items-center justify-between text-xs text-gray-500 mt-1">
          <span>{file.type.toUpperCase()}</span>
          <span>{(file.size / 1024 / 1024).toFixed(1)} MB</span>
        </div>
      </div>
    </div>
  );
};
