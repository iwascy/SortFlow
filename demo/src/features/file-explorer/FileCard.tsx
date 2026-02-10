import React from 'react';
import type { FileItem } from '../../types';
import { cn } from '../../utils/cn';

interface FileCardProps {
  file: FileItem;
  selected?: boolean;
  onClick?: (e: React.MouseEvent) => void;
  onDoubleClick?: (e: React.MouseEvent) => void;
  animationDelay?: string;
}

export const FileCard: React.FC<FileCardProps> = ({
  file,
  selected,
  onClick,
  onDoubleClick,
  animationDelay,
}) => {
  return (
    <div
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      style={{ animationDelay }}
      className={cn(
        "group relative flex flex-col gap-4 p-4 rounded-[2rem] transition-all cursor-pointer border animate-in fade-in zoom-in-95 fill-mode-both",
        selected
          ? 'bg-primary/5 border-primary ring-1 ring-primary/20 shadow-2xl active-glow-soft'
          : 'bg-surface-dark border-border-dark hover:border-primary/50 hover:shadow-xl hover:scale-[1.02]'
      )}
    >
      <div className="w-full aspect-square rounded-[1.5rem] overflow-hidden relative bg-slate-900 shadow-inner">
        {file.thumbnail ? (
          <img
            src={file.thumbnail}
            alt={file.alt || file.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <span className="material-symbols-outlined text-gray-500 text-5xl">
              {file.type === 'dir' ? 'folder' : 'description'}
            </span>
          </div>
        )}
        <div className="absolute top-4 right-4 px-3 py-1 rounded-xl bg-black/60 backdrop-blur-xl text-[9px] font-black text-white border border-white/10">
            {file.type}
        </div>
        {selected && (
            <div className="absolute top-4 left-4 bg-primary text-slate-900 p-2 rounded-2xl shadow-xl animate-in zoom-in-50">
                <span className="material-symbols-outlined text-[16px] font-black filled">check</span>
            </div>
        )}
      </div>
      <div className="px-2 min-w-0">
        <p className={cn(
            "text-[12px] font-black truncate mb-1 transition-colors",
            selected ? 'text-primary' : 'text-white group-hover:text-primary'
        )}>
            {file.name}
        </p>
        <div className="flex justify-between text-[10px] font-bold text-text-secondary/40">
           <span className="font-mono">{file.size}</span>
           <span className="uppercase tracking-widest">{file.type}</span>
        </div>
      </div>
    </div>
  );
};
