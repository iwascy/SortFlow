import React from 'react';
import type { FileItem } from '../../types';
import { isMediaFileName, formatSize } from '../../utils/media';
import { cn } from '../../utils/cn';

interface FileCardProps {
  file: FileItem;
  selected: boolean;
  onClick: (event: React.MouseEvent) => void;
  onDoubleClick: (event: React.MouseEvent) => void;
  animationDelay?: string;
}

export const FileCard: React.FC<FileCardProps> = ({ file, selected, onClick, onDoubleClick, animationDelay }) => {
  const isMedia = !file.isDir && isMediaFileName(file.name);

  // Use a softer color palette for file types
  const iconColorClass = file.isDir
    ? "text-amber-500 bg-amber-50"
    : isMedia
      ? "text-purple-600 bg-purple-50"
      : "text-slate-500 bg-slate-50";

  return (
    <div
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      style={{ animationDelay }}
      className={cn(
        "group relative flex flex-col p-4 rounded-2xl border transition-all duration-200 cursor-pointer animate-in zoom-in-95 fill-mode-both",
        selected
          ? "bg-primary/5 border-primary shadow-md ring-1 ring-primary/20"
          : "bg-white border-border hover:border-primary/30 hover:shadow-lg hover:-translate-y-1"
      )}
    >
      <div className="flex justify-between items-start mb-3">
        <div className={cn("size-12 rounded-xl flex items-center justify-center transition-colors", iconColorClass)}>
          <span className="material-symbols-outlined text-[28px] filled">
            {file.isDir ? 'folder' : isMedia ? 'image' : 'description'}
          </span>
        </div>

        {selected && (
          <div className="absolute top-3 right-3">
             <span className="material-symbols-outlined text-primary filled text-[20px]">check_circle</span>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-1 min-w-0">
        <h3 className={cn(
            "font-semibold text-sm truncate transition-colors",
            selected ? "text-primary-dark" : "text-text-primary group-hover:text-primary"
        )}>
            {file.name}
        </h3>
        <div className="flex items-center gap-2 text-[11px] text-text-secondary font-medium">
          <span>{file.isDir ? 'Folder' : formatSize(typeof file.size === 'number' ? file.size : 0)}</span>
          <span className="size-1 rounded-full bg-border" />
          <span className="truncate opacity-70">
            {new Date(file.mtime).toLocaleDateString()}
          </span>
        </div>
      </div>

      {/* Thumbnail Preview for Images (Mock) */}
      {isMedia && !file.isDir && (
         <div className="absolute inset-0 z-[-1] opacity-0 group-hover:opacity-5 transition-opacity bg-gradient-to-br from-primary to-transparent rounded-2xl" />
      )}
    </div>
  );
};
