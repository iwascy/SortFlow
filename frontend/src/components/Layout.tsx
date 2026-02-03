import React, { useState } from 'react';
import { MOCK_TASKS } from '../constants';
import type { TaskStatus } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: 'dashboard' | 'config' | 'history';
  onTabChange: (tab: 'dashboard' | 'config' | 'history') => void;
}

const Layout: React.FC<LayoutProps> = ({ children, activeTab, onTabChange }) => {
  const [showTasks, setShowTasks] = useState(false);
  const [tasks] = useState<TaskStatus[]>(MOCK_TASKS);

  const activeTasksCount = tasks.filter(t => t.status === 'active').length;

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background-dark text-white antialiased font-display">
      {/* Sidebar */}
      <aside className="hidden lg:flex w-64 shrink-0 flex-col border-r border-border-dark bg-background-dark">
        <div className="flex h-16 items-center px-6 gap-4">
          <div className="size-8 flex items-center justify-center bg-gradient-to-br from-primary to-cyan-700 rounded-lg text-white">
            <span className="material-symbols-outlined">sort</span>
          </div>
          <h1 className="text-lg font-bold tracking-tight text-white">SortFlow <span className="text-xs font-medium opacity-60">v2.0</span></h1>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          <button
            onClick={() => onTabChange('dashboard')}
            className={`w-full group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${activeTab === 'dashboard' ? 'bg-[#234248] text-white' : 'text-slate-300 hover:bg-white/5'}`}
          >
            <span className={`material-symbols-outlined ${activeTab === 'dashboard' ? 'filled' : ''}`}>grid_view</span>
            Dashboard
          </button>
          <button
            onClick={() => onTabChange('config')}
            className={`w-full group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${activeTab === 'config' ? 'bg-[#234248] text-white' : 'text-slate-300 hover:bg-white/5'}`}
          >
            <span className={`material-symbols-outlined ${activeTab === 'config' ? 'filled' : ''}`}>settings</span>
            Configuration
          </button>
          <button
            onClick={() => onTabChange('history')}
            className={`w-full group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${activeTab === 'history' ? 'bg-[#234248] text-white' : 'text-slate-300 hover:bg-white/5'}`}
          >
            <span className={`material-symbols-outlined ${activeTab === 'history' ? 'filled' : ''}`}>history</span>
            History Log
          </button>
        </nav>

        <div className="p-4 border-t border-border-dark">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-medium text-text-secondary">Storage (Local)</span>
            <span className="text-xs font-bold text-white">78%</span>
          </div>
          <div className="w-full bg-surface-dark rounded-full h-1.5 overflow-hidden">
            <div className="bg-primary h-1.5 rounded-full" style={{ width: '78%' }}></div>
          </div>
        </div>
      </aside>

      {/* Main Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="flex h-16 w-full border-b border-border-dark px-6 items-center justify-between bg-background-dark z-20">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-3 lg:hidden">
              <span className="material-symbols-outlined text-primary">sort</span>
              <span className="font-bold text-white">SortFlow</span>
            </div>
            {/* Search Bar */}
            <label className="hidden md:flex flex-col min-w-40 !h-10 w-96">
              <div className="flex w-full flex-1 items-stretch rounded-lg h-full group focus-within:ring-2 ring-primary/50 transition-all">
                <div className="text-text-secondary flex border-none bg-surface-dark items-center justify-center pl-4 rounded-l-lg border-r-0">
                  <span className="material-symbols-outlined text-[20px]">search</span>
                </div>
                <input className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg rounded-l-none border-none bg-surface-dark focus:ring-0 focus:outline-0 text-white placeholder:text-text-secondary px-4 pl-2 text-sm font-normal" placeholder="Search files, metadata..." />
              </div>
            </label>
          </div>

          <div className="flex items-center gap-4 relative">
            <div className="relative">
              <button
                onClick={() => setShowTasks(!showTasks)}
                className={`flex items-center justify-center size-10 rounded-full hover:bg-surface-dark transition-colors text-text-secondary relative ${activeTasksCount > 0 ? 'bg-primary/10 text-primary' : ''}`}
              >
                <span className="material-symbols-outlined">pending_actions</span>
                {activeTasksCount > 0 && (
                  <span className="absolute top-2.5 right-2.5 size-2 bg-amber-500 rounded-full border-2 border-background-dark"></span>
                )}
              </button>

              {/* Task Dropdown */}
              {showTasks && (
                <div className="absolute top-full right-0 mt-3 w-80 bg-[#162a2e] border border-[#234248] rounded-xl shadow-2xl z-50 overflow-hidden ring-1 ring-black/5">
                  <div className="px-4 py-3 border-b border-[#234248] bg-[#101f22]/50 backdrop-blur-sm flex justify-between items-center">
                    <h3 className="text-sm font-bold text-white">Task Status List</h3>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-primary bg-primary/10 px-2 py-0.5 rounded-full">Active</span>
                  </div>
                  <div className="max-h-[60vh] overflow-y-auto">
                    {tasks.map(task => (
                      <div key={task.id} className="p-4 border-b border-[#234248] bg-[#162a2e]">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex flex-col gap-0.5">
                            <span className="text-sm font-semibold text-white leading-tight">{task.name}</span>
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
                            <div className="w-full bg-[#101f22] rounded-full h-1.5 mt-2 overflow-hidden">
                              <div className="bg-primary h-1.5 rounded-full relative overflow-hidden" style={{ width: `${(task.progress / task.total) * 100}%` }}>
                                <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
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
                  <div className="p-2 bg-[#101f22]/80 border-t border-[#234248]">
                    <button className="w-full py-1.5 text-xs font-medium text-text-secondary hover:text-primary hover:bg-[#162a2e] rounded-lg transition-all">View Full History</button>
                  </div>
                </div>
              )}
            </div>

            <button className="flex items-center justify-center size-10 rounded-full hover:bg-surface-dark transition-colors text-text-secondary">
              <span className="material-symbols-outlined">notifications</span>
            </button>
            <div className="bg-center bg-no-repeat bg-cover rounded-full size-10 border-2 border-primary" style={{ backgroundImage: 'linear-gradient(135deg, #11b4d4 0%, #0f172a 100%)' }}></div>
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
