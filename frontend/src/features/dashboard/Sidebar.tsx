import React, { useMemo } from 'react';
import { useAppStore } from '../../store/useAppStore';

export const Sidebar: React.FC = () => {
  const { files, currentPath, setCurrentPath } = useAppStore();

  const paths = useMemo(() => Array.from(new Set(files.map(f => f.path))), [files]);

  return (
    <aside className="w-full lg:w-64 border-r border-slate-200 dark:border-border-dark flex flex-col shrink-0 overflow-y-auto bg-white dark:bg-background-dark">
      <div className="p-8">
        <h3 className="text-[10px] font-black text-text-secondary uppercase tracking-[0.25em] mb-8 opacity-60">Source Watchers</h3>
        <nav className="space-y-3">
          {paths.map(path => (
            <button
              key={path}
              onClick={() => setCurrentPath(path)}
              className={`w-full flex items-center gap-4 px-5 py-4 rounded-3xl text-[11px] font-black transition-all group ${currentPath === path ? 'bg-primary text-slate-900 shadow-xl shadow-primary/20 scale-105' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-surface-dark'}`}
            >
              <span className={`material-symbols-outlined text-[20px] ${currentPath === path ? 'text-slate-900' : 'text-primary'}`}>{path.includes('nas') ? 'dns' : 'sd_card'}</span>
              <span className="truncate">{path.split('/').pop() || 'Storage'}</span>
              <span className={`ml-auto opacity-50 font-mono ${currentPath === path ? 'text-slate-900' : ''}`}>{files.filter(f => f.path === path).length}</span>
            </button>
          ))}
        </nav>
      </div>
    </aside>
  );
};
