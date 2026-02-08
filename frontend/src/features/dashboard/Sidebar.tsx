import React from 'react';
import { useAppStore } from '../../store/useAppStore';
import { TreeItem } from './TreeItem';

export const Sidebar: React.FC = () => {
  const { config } = useAppStore();
  const paths = config.sourceWatchers || [];

  return (
    <div className="w-full bg-white rounded-3xl shadow-sm border border-border flex flex-col overflow-hidden animate-in fade-in slide-in-from-left duration-500">
      <div className="p-6 border-b border-border/50">
         <h3 className="text-lg font-bold text-text-primary tracking-tight">Source Watchers</h3>
         <p className="text-xs text-text-secondary mt-1">Monitored directories</p>
      </div>

      <nav className="flex-1 overflow-y-auto p-4 space-y-1">
        {paths.map((path) => (
          <TreeItem
            key={path}
            path={path}
            name={path.split('/').pop() || 'Storage'}
            depth={0}
          />
        ))}
        {paths.length === 0 && (
          <div className="px-4 py-8 text-center">
             <div className="w-12 h-12 bg-bg-muted rounded-full flex items-center justify-center mx-auto mb-3 text-text-muted">
                <span className="material-symbols-outlined">folder_off</span>
             </div>
             <p className="text-xs text-text-secondary font-medium">No watchers configured.</p>
          </div>
        )}
      </nav>

      <div className="p-4 border-t border-border/50 bg-bg-muted/30">
          <button className="w-full py-2.5 text-xs font-semibold text-primary hover:bg-primary/5 rounded-xl transition-colors border border-transparent hover:border-primary/10">
              Manage Sources
          </button>
      </div>
    </div>
  );
};
