import React, { useEffect } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { Sidebar } from './Sidebar';
import { MixerPanel } from '../pattern-mixer/MixerPanel';
import { FileGrid } from '../file-explorer/FileGrid';
import { TransactionDesk } from '../execution/TransactionDesk';
import { ExecutionOverlay } from '../execution/ExecutionOverlay';
import { INITIAL_FILES, PRESETS, TARGET_ROOTS } from '../../constants';

export const Dashboard: React.FC = () => {
  const {
    currentPath,
    setFiles,
    setCurrentPath,
    setPresets,
    setTargetRoots,
    setExecutionState
  } = useAppStore();

  // Initialize data
  useEffect(() => {
    setFiles(INITIAL_FILES);
    setPresets(PRESETS);
    setTargetRoots(TARGET_ROOTS);
    if (!currentPath) {
        // Find unique paths
        const paths = Array.from(new Set(INITIAL_FILES.map(f => f.path)));
        setCurrentPath(paths[0] || '/nas/upload/raw');
    }
  }, []);

  const handleExecute = () => {
    setExecutionState({ status: 'EXECUTING', progress: 0, logs: ["Initializing job..."] });
  };

  return (
    <div className="flex h-full flex-col lg:flex-row bg-background-light dark:bg-background-dark relative">
      <ExecutionOverlay />

      <Sidebar />

      {/* Main Workspace */}
      <div className="flex-1 flex flex-col min-w-0 bg-gray-50 dark:bg-surface-dark/10">
        <header className="px-8 py-4 flex items-center justify-between bg-white dark:bg-background-dark border-b border-border-dark z-10">
           <div className="flex items-center gap-6">
              <div className="flex items-center gap-3">
                 <span className="material-symbols-outlined text-primary">folder_open</span>
                 <h2 className="text-xs font-black text-white tracking-widest uppercase truncate max-w-[300px]">{currentPath}</h2>
              </div>
           </div>
        </header>

        <MixerPanel />
        <FileGrid />
      </div>

      <TransactionDesk onExecute={handleExecute} />
    </div>
  );
};
