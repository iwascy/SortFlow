import React, { useEffect, useState } from 'react';
import { useAppStore } from '../../store/useAppStore';

export const ExecutionOverlay: React.FC = () => {
  const { executionState, setExecutionState, files, setFiles, selectedIds, setSelectedIds } = useAppStore();
  const [isDone, setIsDone] = useState(false);

  // Simulate execution progress when active
  useEffect(() => {
    if (executionState.status === 'EXECUTING') {
      let progress = 0;
      const interval = setInterval(() => {
        progress += Math.floor(Math.random() * 10) + 5;

        let newLog = `Processing block ${Math.ceil(progress/10)}...`;

        if (progress >= 100) {
          progress = 100;
          clearInterval(interval);
          setIsDone(true);

          // Remove processed files
          setFiles(files.filter(f => !selectedIds.has(f.id)));
          setSelectedIds(new Set());

          setExecutionState({ status: 'DONE', progress: 100, logs: [...executionState.logs, "Execution Complete."] });
        } else {
            setExecutionState({ progress, logs: [...executionState.logs, newLog].slice(-6) });
        }
      }, 300);
      return () => clearInterval(interval);
    }
  }, [executionState.status]);

  if (executionState.status !== 'EXECUTING' && executionState.status !== 'DONE') {
      return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center h-full w-full bg-[#0a1315] p-12">
      <div className="w-full max-w-2xl space-y-12 animate-in fade-in zoom-in-95 duration-500">
        <div className="text-center space-y-4">
          <div className="inline-flex size-24 rounded-full bg-primary/10 items-center justify-center ring-4 ring-primary/5 mb-6">
            <span className={`material-symbols-outlined text-5xl text-primary ${!isDone ? 'animate-spin' : ''}`}>
              {isDone ? 'done_all' : 'sync'}
            </span>
          </div>
          <h2 className="text-4xl font-black text-white tracking-tighter">{isDone ? 'Archive Sync Complete' : 'Organizing Data'}</h2>
          <p className="text-text-secondary font-medium">
             <span className="text-white font-mono">Processing assets...</span>
          </p>
        </div>
        <div className="space-y-4 bg-surface-dark/50 p-8 rounded-[2rem] border border-border-dark shadow-2xl">
           <div className="flex justify-between items-end mb-2">
              <span className="text-[11px] font-black text-primary uppercase tracking-[0.3em]">Processing Batch</span>
              <span className="text-4xl font-black text-white font-mono">{executionState.progress}%</span>
           </div>
           <div className="h-5 bg-black rounded-full p-1 border border-border-dark shadow-inner">
              <div className="h-full bg-gradient-to-r from-primary via-cyan-400 to-primary rounded-full transition-all duration-300 shadow-[0_0_15px_rgba(17,180,212,0.4)]" style={{ width: `${executionState.progress}%` }} />
           </div>
        </div>
        <div className="bg-black/30 rounded-3xl p-6 border border-border-dark font-mono text-[10px] h-40 overflow-hidden space-y-2 opacity-60">
           {executionState.logs.map((log, i) => <div key={i} className="flex gap-4"><span className="text-primary/40">[{i.toString().padStart(2, '0')}]</span> {log}</div>)}
        </div>
        {isDone && (
          <button onClick={() => setExecutionState({ status: 'IDLE', logs: [], progress: 0 })} className="w-full bg-primary text-slate-900 font-black py-5 rounded-[2rem] shadow-2xl shadow-primary/20 hover:scale-[1.02] transition-all">RETURN TO WORKSPACE</button>
        )}
      </div>
    </div>
  );
};
