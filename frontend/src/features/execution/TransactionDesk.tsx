import React, { useEffect, useMemo } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { cn } from '../../utils/cn';
import { buildPreviewOps } from '../../utils/preview';

const shortenName = (name: string, max = 22) => {
  if (name.length <= max) return name;
  const head = Math.max(8, Math.floor((max - 1) * 0.6));
  const tail = Math.max(5, max - head - 1);
  return `${name.slice(0, head)}…${name.slice(-tail)}`;
};

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
    previewOps
  } = useAppStore();

  const activeTargetId = mixerConfig.targetRootId || targetRoots[0]?.id;
  const activePresetId = mixerConfig.presetId || presets[0]?.id;

  const activeTarget = targetRoots.find(t => t.id === activeTargetId) || targetRoots[0];
  const activePreset = presets.find(p => p.id === activePresetId) || presets[0];

  const selectedFiles = useMemo(() => files.filter(f => selectedIds.has(f.id)), [files, selectedIds]);

  const nextPreviewOps = useMemo(() => {
    if (!activePreset || !activeTarget) return [];
    return buildPreviewOps(selectedFiles, mixerConfig, activePreset, activeTarget);
  }, [selectedFiles, mixerConfig, activePreset, activeTarget]);

  useEffect(() => {
    setPreviewOps(nextPreviewOps);
  }, [nextPreviewOps, setPreviewOps]);

  // Calculate total size for display
  const totalSize = useMemo(() => {
      return selectedFiles.reduce((acc, f) => acc + (typeof f.size === 'number' ? f.size : 0), 0);
  }, [selectedFiles]);

  const formattedTotalSize = useMemo(() => {
      if (totalSize < 1024) return `${totalSize} B`;
      if (totalSize < 1024*1024) return `${(totalSize/1024).toFixed(1)} KB`;
      return `${(totalSize/(1024*1024)).toFixed(1)} MB`;
  }, [totalSize]);


  return (
    <div className="flex flex-col gap-6 h-full p-1 animate-in slide-in-from-right duration-500">

      {/* 1. Storage Usage Card (Visual Placeholder + Real Queue Stats) */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-border flex flex-col gap-4">
         <div className="flex justify-between items-center">
             <h3 className="text-lg font-bold text-text-primary">Storage Usage</h3>
             <button className="text-primary hover:bg-primary/5 p-1 rounded-lg transition-colors">
                 <span className="material-symbols-outlined">more_horiz</span>
             </button>
         </div>

         {/* Donut Chart Simulation */}
         <div className="relative flex items-center justify-center py-4">
             <div className="size-40 rounded-full border-[12px] border-bg-muted relative flex items-center justify-center">
                 <div className="absolute inset-0 rounded-full border-[12px] border-primary border-t-transparent -rotate-45" />
                 <div className="flex flex-col items-center">
                     <span className="text-2xl font-bold text-text-primary">--</span>
                     <span className="text-xs text-text-secondary">Used</span>
                 </div>
             </div>
         </div>

         <div className="space-y-3">
             <div className="flex justify-between text-sm">
                 <span className="flex items-center gap-2 text-text-secondary">
                     <span className="size-2 rounded-full bg-primary"/> Queue Size
                 </span>
                 <span className="font-bold text-text-primary">{formattedTotalSize}</span>
             </div>
             <div className="flex justify-between text-sm">
                 <span className="flex items-center gap-2 text-text-secondary">
                     <span className="size-2 rounded-full bg-bg-muted"/> Available
                 </span>
                 <span className="font-bold text-text-primary">--</span>
             </div>
         </div>
      </div>

      {/* 2. Transaction Controls (Replacing the old dark panel) */}
      <div className="flex-1 bg-white rounded-3xl shadow-sm border border-border flex flex-col overflow-hidden">
          <div className="p-6 border-b border-border/50">
              <h3 className="text-lg font-bold text-text-primary">Execution</h3>
              <p className="text-xs text-text-secondary mt-1">Configure and run tasks</p>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-6">

              {/* Target Selection */}
              <div className="space-y-3">
                  <label className="text-xs font-bold text-text-muted uppercase tracking-wider">Destination</label>
                  <div className="grid grid-cols-1 gap-2">
                    {targetRoots.map((t) => (
                      <button
                        key={t.id}
                        onClick={() => updateMixerConfig({ targetRootId: t.id })}
                        className={cn(
                          "flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-medium transition-all text-left",
                          activeTargetId === t.id
                            ? 'bg-primary/5 border-primary text-primary shadow-sm'
                            : 'bg-white border-border text-text-secondary hover:bg-bg-muted'
                        )}
                      >
                        <span className={cn("material-symbols-outlined text-[20px]", activeTargetId === t.id ? "filled" : "")}>{t.icon}</span>
                        <span className="truncate flex-1">{t.name}</span>
                        {activeTargetId === t.id && <span className="material-symbols-outlined text-[18px] filled">check_circle</span>}
                      </button>
                    ))}
                  </div>
              </div>

              {/* Preset Selection */}
              <div className="space-y-3">
                  <label className="text-xs font-bold text-text-muted uppercase tracking-wider">Preset</label>
                  <div className="grid grid-cols-2 gap-2">
                    {presets.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => updateMixerConfig({ presetId: p.id })}
                        className={cn(
                          "flex flex-col items-center gap-2 p-3 rounded-xl border text-xs font-medium transition-all text-center",
                          activePresetId === p.id
                            ? 'bg-primary/5 border-primary text-primary shadow-sm'
                            : 'bg-white border-border text-text-secondary hover:bg-bg-muted'
                        )}
                      >
                        <span className={cn("material-symbols-outlined text-[24px]", activePresetId === p.id ? "filled" : "")}>{p.icon}</span>
                        <span>{p.name}</span>
                      </button>
                    ))}
                  </div>
              </div>

              {/* Queue Preview List */}
              <div className="space-y-3">
                  <div className="flex justify-between items-center">
                     <label className="text-xs font-bold text-text-muted uppercase tracking-wider">Queue ({previewOps.length})</label>
                  </div>
                  <div className="bg-bg-muted/50 rounded-xl p-3 max-h-40 overflow-y-auto space-y-2 border border-border/50">
                    {previewOps.length === 0 && <div className="text-center text-xs text-text-muted py-4">No items selected</div>}
                    {previewOps.map((op) => (
                      <div key={op.id} className="flex items-center gap-2 text-xs">
                        <span className="material-symbols-outlined text-[14px] text-text-muted">arrow_forward</span>
                        <div className="flex-1 min-w-0 truncate">
                            <span className="text-text-secondary">{shortenName(op.originalName)}</span>
                            <span className="mx-1 text-text-muted">→</span>
                            <span className="text-text-primary font-medium">{shortenName(op.newName)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
              </div>

          </div>

          <div className="p-6 border-t border-border/50 bg-bg-muted/30">
              <button
                disabled={previewOps.length === 0 || isPreviewLoading}
                onClick={onExecute}
                className="w-full bg-gradient-to-r from-primary to-primary-dark hover:shadow-lg hover:shadow-primary/30 disabled:opacity-50 disabled:shadow-none text-white font-bold py-4 rounded-2xl transition-all flex items-center justify-center gap-2 group"
              >
                  <span className="material-symbols-outlined filled group-hover:scale-110 transition-transform">rocket_launch</span>
                  Execute Transfer
              </button>
          </div>
      </div>

      {/* 3. Upgrade Promo Card (Static) */}
      <div className="bg-gradient-to-br from-primary/10 to-blue-500/10 rounded-3xl p-6 border border-primary/20 relative overflow-hidden group">
          <div className="absolute -right-6 -top-6 size-24 bg-primary/20 rounded-full blur-2xl group-hover:bg-primary/30 transition-colors" />
          <h3 className="text-lg font-bold text-text-primary relative z-10">Get more space</h3>
          <p className="text-xs text-text-secondary mt-2 mb-4 relative z-10">Upgrade to Pro for 2TB storage and advanced AI sorting.</p>
          <button className="w-full py-3 bg-white border border-border hover:border-primary/50 text-primary font-bold rounded-xl text-sm shadow-sm transition-all relative z-10">
              Upgrade to Pro
          </button>
      </div>

    </div>
  );
};
