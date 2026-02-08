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
    <div className="flex h-screen w-full overflow-hidden bg-background-light text-text-primary antialiased font-display">
      {/* Sidebar */}
      <aside className={cn(
        "hidden lg:flex shrink-0 flex-col border-r border-border-light bg-surface-light transition-all duration-300 ease-in-out relative",
        isCollapsed ? "w-20" : "w-64"
      )}>
        <div className={cn(
          "flex h-20 items-center gap-3 transition-all duration-300",
          isCollapsed ? "px-0 justify-center" : "px-6"
        )}>
          {/* Logo */}
          <div className="size-10 shrink-0 flex items-center justify-center rounded-xl bg-primary/10 text-primary">
            <span className="material-symbols-outlined filled text-[24px]">topic</span>
          </div>
          {!isCollapsed && (
            <h1 className="text-xl font-bold tracking-tight text-text-primary animate-in fade-in duration-300">
              DocuVault
            </h1>
          )}
        </div>

        <div className="px-6 py-4">
          {!isCollapsed && <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2 px-3">Menu</h3>}
          <nav className="space-y-1">
            <button
              onClick={() => onTabChange('dashboard')}
              title={isCollapsed ? "Dashboard" : undefined}
              className={cn(
                "w-full group flex items-center gap-3 rounded-xl py-3 text-sm font-medium transition-all duration-200",
                isCollapsed ? "justify-center px-0" : "px-3",
                activeTab === 'dashboard'
                  ? 'bg-primary text-white shadow-lg shadow-primary/30'
                  : 'text-text-secondary hover:bg-gray-100 hover:text-text-primary'
              )}
            >
              <span className={cn(
                "material-symbols-outlined shrink-0 text-[20px]",
                activeTab === 'dashboard' ? 'filled' : ''
              )}>grid_view</span>
              {!isCollapsed && <span className="animate-in fade-in duration-300">Dashboard</span>}
            </button>
            <button
              onClick={() => onTabChange('config')}
              title={isCollapsed ? "Configuration" : undefined}
              className={cn(
                "w-full group flex items-center gap-3 rounded-xl py-3 text-sm font-medium transition-all duration-200",
                isCollapsed ? "justify-center px-0" : "px-3",
                activeTab === 'config'
                  ? 'bg-primary text-white shadow-lg shadow-primary/30'
                  : 'text-text-secondary hover:bg-gray-100 hover:text-text-primary'
              )}
            >
              <span className={cn(
                "material-symbols-outlined shrink-0 text-[20px]",
                activeTab === 'config' ? 'filled' : ''
              )}>settings</span>
              {!isCollapsed && <span className="animate-in fade-in duration-300">Configuration</span>}
            </button>
            <button
              onClick={() => onTabChange('history')}
              title={isCollapsed ? "History Log" : undefined}
              className={cn(
                "w-full group flex items-center gap-3 rounded-xl py-3 text-sm font-medium transition-all duration-200",
                isCollapsed ? "justify-center px-0" : "px-3",
                activeTab === 'history'
                  ? 'bg-primary text-white shadow-lg shadow-primary/30'
                  : 'text-text-secondary hover:bg-gray-100 hover:text-text-primary'
              )}
            >
              <span className={cn(
                "material-symbols-outlined shrink-0 text-[20px]",
                activeTab === 'history' ? 'filled' : ''
              )}>history</span>
              {!isCollapsed && <span className="animate-in fade-in duration-300">History Log</span>}
            </button>
          </nav>
        </div>

        <div className="mt-auto px-6 py-6 border-t border-border-light">
           {!isCollapsed && <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2 px-3">Other</h3>}
           <nav className="space-y-1">
            <button
              className={cn(
                "w-full group flex items-center gap-3 rounded-xl py-3 text-sm font-medium transition-all duration-200 text-text-secondary hover:bg-gray-100 hover:text-text-primary",
                isCollapsed ? "justify-center px-0" : "px-3"
              )}
            >
               <span className="material-symbols-outlined shrink-0 text-[20px]">help</span>
               {!isCollapsed && <span>Help Center</span>}
            </button>
           </nav>
        </div>

        {/* Collapse Toggle Button */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute -right-3 top-20 size-6 bg-surface-light border border-border-light rounded-full flex items-center justify-center text-text-secondary hover:text-primary hover:border-primary transition-colors z-30 shadow-sm"
        >
          <span className="material-symbols-outlined text-[16px]">
            {isCollapsed ? 'chevron_right' : 'chevron_left'}
          </span>
        </button>
      </aside>

      {/* Main Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-background-light">
        <header className="flex h-20 w-full border-b border-border-light px-8 items-center justify-between bg-surface-light z-20 shadow-sm/50">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-3 lg:hidden">
              <span className="material-symbols-outlined text-primary filled">topic</span>
              <span className="font-bold text-text-primary text-lg">DocuVault</span>
            </div>
            {/* Search Bar */}
            <label className="hidden md:flex flex-col min-w-40 !h-11 w-96 relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="material-symbols-outlined text-text-tertiary text-[20px] group-focus-within:text-primary transition-colors">search</span>
              </div>
              <input
                className="block w-full h-full rounded-xl border border-gray-200 bg-gray-50/50 pl-10 pr-4 text-sm text-text-primary placeholder:text-text-tertiary focus:border-primary/50 focus:bg-white focus:ring-4 focus:ring-primary/10 transition-all outline-none"
                placeholder="Search files, metadata..."
              />
            </label>
          </div>

          <div className="flex items-center gap-4 relative">
            <div className="relative">
              <button
                onClick={() => setShowTasks(!showTasks)}
                className={`flex items-center justify-center size-10 rounded-full hover:bg-gray-100 transition-colors text-text-secondary relative ${activeTasksCount > 0 ? 'bg-primary/10 text-primary' : ''}`}
              >
                <span className="material-symbols-outlined">pending_actions</span>
                {activeTasksCount > 0 && (
                  <span className="absolute top-2.5 right-2.5 size-2 bg-amber-500 rounded-full border-2 border-white"></span>
                )}
              </button>

              {/* Task Dropdown - Updated for Light Theme */}
              {showTasks && (
                <div className="absolute top-full right-0 mt-3 w-80 bg-white border border-gray-200 rounded-2xl shadow-xl z-50 overflow-hidden ring-1 ring-black/5 animate-in fade-in zoom-in-95 duration-200">
                  <div className="px-4 py-3 border-b border-gray-100 bg-gray-50/50 backdrop-blur-sm flex justify-between items-center">
                    <h3 className="text-sm font-bold text-text-primary">Task Status List</h3>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-primary bg-primary/10 px-2 py-0.5 rounded-full">Active</span>
                  </div>
                  <div className="max-h-[60vh] overflow-y-auto">
                    {tasks.map(task => (
                      <div key={task.id} className="p-4 border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
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
                            <div className="w-full bg-gray-100 rounded-full h-1.5 mt-2 overflow-hidden">
                              <div className="bg-primary h-1.5 rounded-full relative overflow-hidden" style={{ width: `${(task.progress / task.total) * 100}%` }}>
                                <div className="absolute inset-0 bg-white/30 animate-pulse"></div>
                              </div>
                            </div>
                            <div className="flex justify-between items-center mt-2 text-[10px] text-text-secondary font-mono">
                              <span>{Math.round((task.progress / task.total) * 100)}%</span>
                              <span>{task.timeRemaining}</span>
                            </div>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                  <div className="p-2 bg-gray-50 border-t border-gray-100">
                    <button className="w-full py-2 text-xs font-medium text-text-secondary hover:text-primary hover:bg-white rounded-lg transition-all shadow-sm">View Full History</button>
                  </div>
                </div>
              )}
            </div>

            <button className="flex items-center justify-center size-10 rounded-full hover:bg-gray-100 transition-colors text-text-secondary relative">
              <span className="material-symbols-outlined">notifications</span>
               <span className="absolute top-2.5 right-2.5 size-2 bg-red-500 rounded-full border-2 border-white"></span>
            </button>

            <div className="h-8 w-px bg-gray-200 mx-1"></div>

            <button className="flex items-center gap-2 hover:bg-gray-100 p-1.5 pl-2 pr-3 rounded-full transition-colors">
                <img src="https://ui-avatars.com/api/?name=Robert+Fox&background=random" alt="User" className="size-7 rounded-full" />
                <span className="text-sm font-medium text-text-primary hidden md:block">Robert Fox</span>
                <span className="material-symbols-outlined text-text-tertiary text-[18px]">expand_more</span>
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
