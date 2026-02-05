import React, { useEffect, useMemo } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { cn } from '../../utils/cn';
import { buildPreviewOps, getTargetDir } from '../../utils/preview';

export const TransactionDesk: React.FC<{ onExecute: () => void }> = ({ onExecute }) => {
  const {
    selectedIds,
    mixerConfig,
    updateMixerConfig,
    files,
    isPreviewLoading,
    presets,
    targetRoots,
    setPreviewOps,
  } = useAppStore();

  const activeTargetId = mixerConfig.targetRootId || targetRoots[0]?.id;
  const activePresetId = mixerConfig.presetId || presets[0]?.id;

  const activeTarget = targetRoots.find(t => t.id === activeTargetId) || targetRoots[0];
  const activePreset = presets.find(p => p.id === activePresetId) || presets[0];

  const selectedFiles = useMemo(() => files.filter(f => selectedIds.has(f.id)), [files, selectedIds]);

  const previewOps = useMemo(() => {
    if (!activePreset || !activeTarget) return [];
    return buildPreviewOps(selectedFiles, mixerConfig, activePreset, activeTarget);
  }, [selectedFiles, mixerConfig, activePreset, activeTarget]);

  useEffect(() => {
    setPreviewOps(previewOps);
  }, [previewOps, setPreviewOps]);

  return (
    <aside className="w-full lg:w-[420px] bg-background-dark border-l border-border-dark flex flex-col shrink-0 shadow-[0_-20px_50px_rgba(0,0,0,0.5)] z-20 animate-in fade-in slide-in-from-right duration-700 fill-mode-both">
      <div className="p-8 border-b border-border-dark bg-surface-dark/40 animate-in fade-in slide-in-from-right duration-500 delay-100 fill-mode-both">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-sm font-black text-white uppercase tracking-[0.2em]">Transaction Desk</h3>
          <div className="flex flex-col items-end">
            <span className="text-4xl font-black text-primary leading-none tabular-nums">{previewOps.length}</span>
            <span className="text-[10px] font-black text-text-secondary uppercase tracking-widest">Items Queued</span>
          </div>
        </div>

        {/* Target Root Selection */}
        <div className="space-y-4">
          <label className="text-[10px] font-black text-text-secondary uppercase tracking-widest flex items-center gap-2">
            <span className="material-symbols-outlined text-[16px] filled">storage</span> Destination Root
          </label>
          <div className="grid grid-cols-1 gap-2">
            {targetRoots.map((t, idx) => (
              <button
                key={t.id}
                onClick={() => updateMixerConfig({ targetRootId: t.id })}
                style={{ animationDelay: `${idx * 100}ms` }}
                className={cn(
                  "flex items-center gap-4 px-5 py-4 rounded-2xl text-[11px] font-black border transition-all animate-in fade-in slide-in-from-right fill-mode-both",
                  activeTargetId === t.id
                    ? 'bg-primary border-primary text-slate-900 shadow-lg active-glow-primary scale-[1.02]'
                    : 'bg-surface-dark/60 border-border-dark text-text-secondary hover:bg-surface-dark hover:border-primary/30'
                )}
              >
                <span className={cn(
                  "material-symbols-outlined text-[20px]",
                  activeTargetId === t.id ? "filled" : ""
                )}>{t.icon}</span>
                <div className="flex flex-col items-start min-w-0">
                  <span className="truncate">{t.name}</span>
                  <span className="text-[8px] opacity-60 font-mono truncate w-full">{t.path}</span>
                </div>
                {activeTargetId === t.id && <span className="material-symbols-outlined ml-auto text-slate-900 filled">radio_button_checked</span>}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-8 space-y-8 animate-in fade-in duration-700 delay-300 fill-mode-both">
        {/* Workflow Class Selection */}
        <div className="space-y-4">
          <label className="text-[10px] font-black text-text-secondary uppercase tracking-widest flex items-center gap-2">
            <span className="material-symbols-outlined text-[16px] filled">category</span> Organizational Class
          </label>
          <div className="grid grid-cols-2 gap-3">
            {presets.map((p, idx) => (
              <button
                key={p.id}
                onClick={() => updateMixerConfig({ presetId: p.id })}
                style={{ animationDelay: `${idx * 50}ms` }}
                className={cn(
                  "flex flex-col items-center gap-3 p-4 rounded-2xl text-[10px] font-black border transition-all animate-in fade-in zoom-in-95 fill-mode-both",
                  activePresetId === p.id
                    ? 'bg-primary/10 border-primary text-primary shadow-xl shadow-primary/5 active-glow-soft scale-105'
                    : 'bg-surface-dark/30 border-border-dark text-text-secondary hover:border-primary/30 hover:scale-[1.02]'
                )}
              >
                <span className={cn(
                  "material-symbols-outlined text-[24px]",
                  activePresetId === p.id ? "filled" : ""
                )}>{p.icon}</span>
                {p.name}
              </button>
            ))}
          </div>
        </div>

        {/* Live Path Preview */}
        <div className="p-6 bg-surface-dark/60 rounded-3xl border border-border-dark space-y-3 animate-in fade-in slide-in-from-bottom duration-500">
          <span className="text-[9px] font-black text-text-secondary uppercase tracking-widest">Final Routing Path</span>
          <div className="flex items-center gap-3 text-white">
            <span className="material-symbols-outlined text-primary text-[20px] filled">account_tree</span>
            <p className="text-[11px] font-mono break-all leading-relaxed opacity-80 italic">
              {activeTarget && activePreset ? `${getTargetDir(activePreset, activeTarget)}/` : '--'}
            </p>
          </div>
        </div>

        {/* Preview Operations */}
        <div className="space-y-3 animate-in fade-in duration-500">
          <span className="text-[9px] font-black text-text-secondary uppercase tracking-widest">Queue Preview</span>
          <div className="space-y-3 max-h-56 overflow-y-auto pr-2">
            {previewOps.map((op, i) => (
              <div key={op.id} className="flex items-center gap-4 text-[10px] text-text-secondary/60 animate-in fade-in slide-in-from-right" style={{ animationDelay: `${Math.min(i, 10) * 80}ms` }}>
                <span className="size-2 rounded-full bg-primary/40 shrink-0" />
                <span className="truncate flex-1">{op.newName}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="p-10 border-t border-border-dark bg-surface-dark/40 space-y-6 animate-in fade-in slide-in-from-bottom duration-700 delay-500 fill-mode-both">
        <div className="flex justify-between items-center text-[11px] font-black text-text-secondary uppercase tracking-widest">
          <span>Estimated Load</span>
          <span className="text-white font-mono">{previewOps.length * 22.4} MB</span>
        </div>
        <button
          disabled={previewOps.length === 0 || isPreviewLoading}
          onClick={onExecute}
          className="w-full bg-primary hover:bg-cyan-400 disabled:opacity-20 disabled:grayscale disabled:cursor-not-allowed text-slate-900 font-black py-6 rounded-[2.5rem] shadow-2xl shadow-primary/30 transition-all flex items-center justify-center gap-4 active:scale-95 group overflow-hidden"
        >
          <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 skew-x-12" />
          <span className="material-symbols-outlined font-black text-2xl filled">rocket_launch</span>
          COMMIT TO ARCHIVE
        </button>
      </div>
    </aside>
  );
};
