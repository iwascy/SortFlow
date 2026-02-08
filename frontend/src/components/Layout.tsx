import React, { useState } from 'react';
import { MOCK_TASKS } from '../constants';
import type { TaskStatus } from '../types';
import { cn } from '../utils/cn';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: 'dashboard' | 'config' | 'history';
  onTabChange: (tab: 'dashboard' | 'config' | 'history') => void;
}

const Layout: React.FC<LayoutProps> = ({ children, activeTab, onTabChange }) => {
  const [showTasks, setShowTasks] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [tasks] = useState<TaskStatus[]>(MOCK_TASKS);

  const activeTasksCount = tasks.filter(t => t.status === 'active').length;

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[var(--color-bg-page)] text-[var(--color-text-primary)] antialiased font-display">
      {/* Sidebar - Light Theme */}
      <aside className={cn(
        "hidden lg:flex shrink-0 flex-col border-r border-border bg-bg-sidebar transition-all duration-300 ease-in-out relative z-30",
        isCollapsed ? "w-20" : "w-72"
      )}>
        <div className={cn(
          "flex h-20 items-center gap-4 transition-all duration-300",
          isCollapsed ? "px-6 justify-center" : "px-8"
        )}>
          <div className="size-9 shrink-0 flex items-center justify-center bg-gradient-to-br from-primary to-primary-dark rounded-xl text-white shadow-lg shadow-primary/20">
            <span className="material-symbols-outlined text-[20px]">sort</span>
          </div>
          {!isCollapsed && (
            <h1 className="text-xl font-bold tracking-tight text-text-primary animate-in fade-in duration-300">
              SortFlow
            </h1>
          )}
        </div>

        <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-2">
            <div className={cn(
              "text-xs font-semibold text-text-muted uppercase tracking-wider mb-4 px-4 transition-opacity duration-300",
               isCollapsed ? "opacity-0 h-0 overflow-hidden mb-0" : "opacity-100"
            )}>
              Menu
            </div>
          <button
            onClick={() => onTabChange('dashboard')}
            title={isCollapsed ? "Dashboard" : undefined}
            className={cn(
              "w-full group flex items-center gap-4 rounded-xl py-3 text-sm font-medium transition-all duration-200 relative overflow-hidden",
              isCollapsed ? "justify-center px-0" : "px-4",
              activeTab === 'dashboard'
                ? 'bg-primary/10 text-primary-dark shadow-sm'
                : 'text-text-secondary hover:bg-bg-muted hover:text-text-primary'
            )}
          >
            <span className={cn(
              "material-symbols-outlined shrink-0 transition-transform duration-200 group-hover:scale-110",
              activeTab === 'dashboard' ? 'filled' : ''
            )}>grid_view</span>
            {!isCollapsed && <span className="animate-in fade-in duration-300">Dashboard</span>}
            {activeTab === 'dashboard' && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary rounded-r-full" />}
          </button>
          <button
            onClick={() => onTabChange('history')}
            title={isCollapsed ? "History" : undefined}
            className={cn(
              "w-full group flex items-center gap-4 rounded-xl py-3 text-sm font-medium transition-all duration-200 relative overflow-hidden",
              isCollapsed ? "justify-center px-0" : "px-4",
              activeTab === 'history'
                ? 'bg-primary/10 text-primary-dark shadow-sm'
                : 'text-text-secondary hover:bg-bg-muted hover:text-text-primary'
            )}
          >
            <span className={cn(
              "material-symbols-outlined shrink-0 transition-transform duration-200 group-hover:scale-110",
              activeTab === 'history' ? 'filled' : ''
            )}>history</span>
            {!isCollapsed && <span className="animate-in fade-in duration-300">History Log</span>}
             {activeTab === 'history' && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary rounded-r-full" />}
          </button>
          <button
            onClick={() => onTabChange('config')}
            title={isCollapsed ? "Settings" : undefined}
            className={cn(
              "w-full group flex items-center gap-4 rounded-xl py-3 text-sm font-medium transition-all duration-200 relative overflow-hidden",
              isCollapsed ? "justify-center px-0" : "px-4",
              activeTab === 'config'
                ? 'bg-primary/10 text-primary-dark shadow-sm'
                : 'text-text-secondary hover:bg-bg-muted hover:text-text-primary'
            )}
          >
            <span className={cn(
              "material-symbols-outlined shrink-0 transition-transform duration-200 group-hover:scale-110",
              activeTab === 'config' ? 'filled' : ''
            )}>settings</span>
            {!isCollapsed && <span className="animate-in fade-in duration-300">Configuration</span>}
             {activeTab === 'config' && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary rounded-r-full" />}
          </button>
        </nav>

        {/* Collapse Toggle Button */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute -right-3 top-24 size-6 bg-white border border-border shadow-md rounded-full flex items-center justify-center text-text-secondary hover:text-primary hover:scale-110 transition-all z-40"
        >
          <span className="material-symbols-outlined text-[16px]">
            {isCollapsed ? 'chevron_right' : 'chevron_left'}
          </span>
        </button>
      </aside>

      {/* Main Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-[var(--color-bg-page)]">
        {/* Header - Light Theme */}
        <header className="flex h-20 w-full px-8 items-center justify-between bg-[var(--color-bg-page)] z-20">
           {/* Mobile Menu Toggle */}
           <div className="flex items-center gap-3 lg:hidden mr-4">
              <span className="material-symbols-outlined text-primary text-3xl">sort</span>
            </div>

          <div className="flex items-center gap-8 flex-1 max-w-4xl">
            {/* Search Bar - Restyled */}
            <label className="hidden md:flex items-center w-full max-w-xl h-12 bg-white rounded-xl border border-border shadow-sm focus-within:ring-2 ring-primary/20 focus-within:border-primary transition-all overflow-hidden group">
                <div className="pl-4 pr-3 text-text-muted group-focus-within:text-primary transition-colors">
                  <span className="material-symbols-outlined text-[20px]">search</span>
                </div>
                <input
                  className="flex-1 h-full border-none bg-transparent focus:outline-none text-sm text-text-primary placeholder:text-text-muted/70 font-medium"
                  placeholder="Search files, metadata..."
                />
            </label>
          </div>

          <div className="flex items-center gap-4">
             {/* Upload Button */}
             <button className="hidden sm:flex items-center gap-2 px-5 py-2.5 bg-white border border-border rounded-xl text-sm font-semibold text-text-primary hover:bg-bg-muted hover:border-primary/30 transition-all shadow-sm">
                <span className="material-symbols-outlined text-[20px] text-primary">cloud_upload</span>
                Upload
             </button>

             {/* Create Button */}
             <button className="hidden sm:flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-primary to-primary-dark text-white rounded-xl text-sm font-semibold hover:shadow-lg hover:shadow-primary/25 hover:-translate-y-0.5 transition-all shadow-md">
                <span className="material-symbols-outlined text-[20px]">add</span>
                Create
             </button>

             <div className="w-px h-8 bg-border mx-2 hidden sm:block"></div>

            <div className="relative">
              <button
                onClick={() => setShowTasks(!showTasks)}
                className={`flex items-center justify-center size-11 rounded-xl bg-white border border-border hover:bg-bg-muted hover:border-primary/30 hover:text-primary transition-all shadow-sm text-text-secondary relative ${activeTasksCount > 0 ? 'text-primary border-primary/30' : ''}`}
              >
                <span className="material-symbols-outlined">pending_actions</span>
                {activeTasksCount > 0 && (
                  <span className="absolute top-2.5 right-3 size-2 bg-amber-500 rounded-full ring-2 ring-white"></span>
                )}
              </button>

              {/* Task Dropdown - Light Theme */}
              {showTasks && (
                <div className="absolute top-full right-0 mt-3 w-80 bg-white border border-border rounded-2xl shadow-xl z-50 overflow-hidden ring-1 ring-black/5 animate-in fade-in zoom-in-95 origin-top-right">
                  <div className="px-4 py-3 border-b border-border bg-bg-muted/50 flex justify-between items-center">
                    <h3 className="text-sm font-bold text-text-primary">Task Status List</h3>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-primary bg-primary/10 px-2 py-0.5 rounded-full border border-primary/20">Active</span>
                  </div>
                  <div className="max-h-[60vh] overflow-y-auto">
                    {tasks.map(task => (
                      <div key={task.id} className="p-4 border-b border-border/50 bg-white hover:bg-bg-muted/50 transition-colors">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex flex-col gap-0.5">
                            <span className="text-sm font-semibold text-text-primary leading-tight">{task.name}</span>
                            <span className="text-xs text-text-secondary">Processing {task.progress} of {task.total} files</span>
                          </div>
                          {task.status === 'active' ? (
                            <span className="material-symbols-outlined text-primary animate-spin text-[20px]">progress_activity</span>
                          ) : (
                            <span className="material-symbols-outlined text-emerald-500 text-[20px]">check_circle</span>
                          )}
                        </div>
                        {task.status === 'active' && (
                          <>
                            <div className="w-full bg-bg-muted rounded-full h-1.5 mt-2 overflow-hidden border border-border/50">
                              <div className="bg-primary h-1.5 rounded-full relative overflow-hidden" style={{ width: `${(task.progress / task.total) * 100}%` }}>
                                <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                              </div>
                            </div>
                            <div className="flex justify-between items-center mt-2 text-[10px] text-text-muted font-mono">
                              <span>{Math.round((task.progress / task.total) * 100)}%</span>
                              <span>{task.timeRemaining}</span>
                            </div>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                  <div className="p-2 bg-bg-muted/30 border-t border-border">
                    <button className="w-full py-2 text-xs font-semibold text-text-secondary hover:text-primary hover:bg-white rounded-lg transition-all border border-transparent hover:border-border hover:shadow-sm">View Full History</button>
                  </div>
                </div>
              )}
            </div>

            <button className="flex items-center justify-center size-11 rounded-xl bg-white border border-border hover:bg-bg-muted hover:border-primary/30 hover:text-primary transition-all shadow-sm text-text-secondary relative">
              <span className="material-symbols-outlined">notifications</span>
              <span className="absolute top-2.5 right-3 size-2 bg-red-500 rounded-full ring-2 ring-white"></span>
            </button>

            <button className="size-11 rounded-full overflow-hidden border-2 border-white shadow-md hover:scale-105 transition-transform">
               <img src="https://ui-avatars.com/api/?name=Admin+User&background=8b5cf6&color=fff" alt="User" className="w-full h-full object-cover" />
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-hidden relative">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
