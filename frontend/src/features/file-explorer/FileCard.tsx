import React from 'react';
import { useAppStore } from '../../store/useAppStore';
import type { FileItem } from '../../types';
import { cn } from '../../utils/cn';

interface FileCardProps {
  file: FileItem;
  selected?: boolean;
  onClick?: (e: React.MouseEvent) => void;
  onDoubleClick?: (e: React.MouseEvent) => void;
  style?: React.CSSProperties;
}

export const FileCard: React.FC<FileCardProps> = ({
  file,
  selected,
  onClick,
  onDoubleClick,
  style,
}) => {
  return (
    <div
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      style={style}
      className={cn(
        "group relative flex flex-col p-3 rounded-2xl transition-all duration-200 cursor-pointer border animate-in fade-in zoom-in-95 fill-mode-both",
        selected
          ? 'bg-primary/5 border-primary ring-1 ring-primary/20 shadow-md scale-[1.02]'
          : 'bg-white border-gray-100 shadow-sm hover:border-primary/30 hover:shadow-lg hover:-translate-y-0.5'
      )}
    >
      <div className="w-full aspect-[4/3] rounded-xl overflow-hidden relative bg-gray-50 mb-3 border border-gray-100">
        {file.thumbnail ? (
          <img
            src={file.thumbnail}
            alt={file.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-300 group-hover:text-primary/50 transition-colors">
            <span className="material-symbols-outlined text-5xl">
              {file.isDir ? 'folder' : 'description'}
            </span>
          </div>
        )}

        {/* Type Badge */}
        <div className="absolute top-2 right-2 px-2 py-0.5 rounded-md bg-white/80 backdrop-blur-md text-[10px] font-bold text-text-secondary border border-gray-100 shadow-sm">
            {file.type || (file.isDir ? 'DIR' : 'FILE')}
        </div>

        {/* Selection Indicator */}
        {selected && (
            <div className="absolute top-2 left-2 bg-primary text-white p-1 rounded-full shadow-lg animate-in zoom-in-50">
                <span className="material-symbols-outlined text-[14px] font-black filled block">check</span>
            </div>
        )}
      </div>

      <div className="px-1 min-w-0 flex flex-col gap-0.5">
        <h4 className={cn(
            "text-sm font-semibold truncate transition-colors",
            selected ? 'text-primary' : 'text-text-primary group-hover:text-primary'
        )}>
            {file.name}
        </h4>
        <div className="flex justify-between items-center text-[10px] font-medium text-text-tertiary">
           <span className="font-mono">{file.size || (file.isDir ? '--' : '0 B')}</span>
           <span>{new Date().toLocaleDateString()}</span>
        </div>
      </div>
    </div>
  );
};
