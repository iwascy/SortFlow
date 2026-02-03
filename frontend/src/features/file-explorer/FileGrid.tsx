import React from 'react';
import { useAppStore } from '../../store/useAppStore';

export const FileGrid: React.FC = () => {
  const { files, currentPath, selectedIds, toggleSelection } = useAppStore();

  const currentFiles = files.filter(f => f.path === currentPath);

  return (
    <div className="flex-1 overflow-y-auto p-10 pb-40">
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-10">
        {currentFiles.map(file => {
          const isSelected = selectedIds.has(file.id);
          return (
            <div
              key={file.id}
              onClick={(e) => {
                  // Basic toggle for now, could add shift/ctrl support later
                  toggleSelection(file.id, e.ctrlKey || e.metaKey, e.shiftKey);
              }}
              className={`group relative flex flex-col gap-4 p-4 rounded-[2rem] transition-all cursor-pointer border ${isSelected ? 'bg-primary/5 border-primary ring-1 ring-primary/20 shadow-2xl' : 'bg-white dark:bg-surface-dark border-slate-200 dark:border-border-dark hover:shadow-xl'}`}
            >
              <div className="w-full aspect-square rounded-[1.5rem] overflow-hidden relative bg-slate-900 shadow-inner">
                <img src={file.thumbnailUrl} alt={file.alt || file.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                <div className="absolute top-4 right-4 px-3 py-1 rounded-xl bg-black/60 backdrop-blur-xl text-[9px] font-black text-white border border-white/10">{file.type}</div>
                {isSelected && <div className="absolute top-4 left-4 bg-primary text-slate-900 p-2 rounded-2xl shadow-xl animate-in zoom-in-50"><span className="material-symbols-outlined text-[16px] font-black">check</span></div>}
              </div>
              <div className="px-2 min-w-0">
                <p className={`text-[12px] font-black truncate mb-1 ${isSelected ? 'text-primary' : 'text-white'}`}>{file.name}</p>
                <div className="flex justify-between text-[10px] font-bold text-text-secondary/40">
                   <span className="font-mono">{file.size}</span>
                   <span className="uppercase tracking-widest">{file.type}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
