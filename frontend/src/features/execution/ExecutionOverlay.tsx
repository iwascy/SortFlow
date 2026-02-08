import React, { useEffect, useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { cn } from '../../utils/cn';

interface ExecutionOverlayProps {
    onClose: () => void;
}

export const ExecutionOverlay: React.FC<ExecutionOverlayProps> = ({ onClose }) => {
    const { executionState } = useAppStore();
    const [history, setHistory] = useState<string[]>([]);

    useEffect(() => {
        if (executionState.logs) {
            setHistory(prev => [...prev, ...executionState.logs]);
        }
    }, [executionState.logs]);

    return (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-8 animate-in fade-in duration-300">
            <div className="w-full max-w-2xl space-y-8 relative">
                <button
                    onClick={onClose}
                    className="absolute -top-12 right-0 text-white/50 hover:text-white transition-colors"
                >
                    <span className="material-symbols-outlined text-4xl">close</span>
                </button>

                <div className="space-y-4 bg-white p-8 rounded-[2rem] border border-border shadow-2xl">
                   <div className="flex justify-between items-center">
                       <h2 className="text-2xl font-black text-text-primary">Executing Task</h2>
                       <span className={cn(
                           "px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest",
                           executionState.status === 'EXECUTING' ? "bg-primary/10 text-primary" :
                           executionState.status === 'DONE' ? "bg-emerald-100 text-emerald-600" :
                           "bg-red-100 text-red-600"
                       )}>
                           {executionState.status}
                       </span>
                   </div>

                   <div className="h-5 bg-bg-muted rounded-full p-1 border border-border shadow-inner overflow-hidden">
                       <div
                         className="h-full bg-primary rounded-full transition-all duration-300 ease-out relative overflow-hidden"
                         style={{ width: `${executionState.progress}%` }}
                       >
                           <div className="absolute inset-0 bg-white/20 animate-pulse" />
                       </div>
                   </div>

                   <div className="flex justify-between text-xs font-bold text-text-secondary uppercase tracking-widest">
                       <span>Processed: {executionState.processedFiles} / {executionState.totalFiles}</span>
                       <span>{executionState.progress}%</span>
                   </div>
                </div>

                <div className="bg-slate-900 rounded-3xl p-6 border border-slate-700 font-mono text-[10px] h-60 overflow-y-auto space-y-2 text-slate-300 shadow-xl">
                    {history.map((log, i) => (
                        <div key={i} className="border-b border-slate-800 pb-1 last:border-0 break-all">
                            <span className="text-slate-500 mr-2">[{new Date().toLocaleTimeString()}]</span>
                            {log}
                        </div>
                    ))}
                    {history.length === 0 && <span className="opacity-50">Initializing...</span>}
                </div>
            </div>
        </div>
    );
};
