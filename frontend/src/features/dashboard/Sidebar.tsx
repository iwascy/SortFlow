import React from 'react';
import { useAppStore } from '../../store/useAppStore';
import { TreeItem } from './TreeItem';

export const Sidebar: React.FC = () => {
  const { config } = useAppStore();
  const paths = config.sourceWatchers || [];

  return (
    <aside className="w-full lg:w-64 border-r border-border-dark flex flex-col shrink-0 overflow-y-auto bg-background-dark animate-in fade-in slide-in-from-left duration-700">
      <div className="p-6">
        <h3 className="text-[10px] font-black text-text-secondary uppercase tracking-[0.25em] mb-6 opacity-60 px-2">Source Watchers</h3>
        <nav className="space-y-1">
          {paths.map((path) => (
            <TreeItem
              key={path}
              path={path}
              name={path.split('/').pop() || 'Storage'}
              depth={0}
            />
          ))}
          {paths.length === 0 && (
            <div className="px-2 text-xs text-slate-500">No watchers configured.</div>
          )}
        </nav>
      </div>
    </aside>
  );
};
