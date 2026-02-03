import React, { useMemo } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { cn } from '../../utils/cn';

export const Sidebar: React.FC = () => {
  const { files, currentPath, setCurrentPath } = useAppStore();

  const paths = useMemo(() => Array.from(new Set(files.map(f => f.path))), [files]);

  return (
    <aside className="w-full lg:w-64 border-r border-border-dark flex flex-col shrink-0 overflow-y-auto bg-background-dark animate-in fade-in slide-in-from-left duration-700">
      <div className="p-8">
        <h3 className="text-[10px] font-black text-text-secondary uppercase tracking-[0.25em] mb-8 opacity-60">Source Watchers</h3>
        <nav className="space-y-3">
          {paths.map((path, idx) => (
            <button
              key={path}
              onClick={() => setCurrentPath(path)}
              style={{ animationDelay: `${idx * 100}ms` }}
              className={cn(
                "w-full flex items-center gap-4 px-5 py-4 rounded-3xl text-[11px] font-black transition-all group animate-in fade-in slide-in-from-left fill-mode-both",
                currentPath === path
                  ? 'bg-primary text-slate-900 shadow-xl shadow-primary/20 scale-105 active-glow-primary'
                  : 'text-slate-500 hover:bg-surface-dark hover:text-white'
              )}
            >
              <span className={cn(
                "material-symbols-outlined text-[20px]",
                currentPath === path ? 'text-slate-900 filled' : 'text-primary'
              )}>
                {path.includes('nas') ? 'dns' : 'sd_card'}
              </span>
              <span className="truncate">{path.split('/').pop() || 'Storage'}</span>
              <span className={cn(
                "ml-auto opacity-50 font-mono",
                currentPath === path ? 'text-slate-900' : ''
              )}>
                {files.filter(f => f.path === path).length}
              </span>
            </button>
          ))}
        </nav>
      </div>
    </aside>
  );
};
