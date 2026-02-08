import React, { useState, useEffect, useMemo } from 'react';
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
    <aside className="w-full lg:w-[400px] bg-white border-l border-border-light flex flex-col shrink-0 shadow-xl z-20 animate-in fade-in slide-in-from-right duration-500">
      <div className="p-8 border-b border-border-light bg-white/50 backdrop-blur-sm">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-bold text-text-primary tracking-tight">Transaction Desk</h3>
          <div className="flex items-center gap-2 bg-primary/10 px-3 py-1.5 rounded-full">
            <span className="text-lg font-bold text-primary tabular-nums">{previewOps.length}</span>
            <span className="text-[10px] font-bold text-primary uppercase tracking-wider">Queued</span>
          </div>
        </div>

        {/* Target Root Selection */}
        <div className="space-y-4">
          <label className="text-xs font-bold text-text-tertiary uppercase tracking-wider flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">storage</span> Destination
          </label>
          <div className="grid grid-cols-1 gap-2">
            {targetRoots.map((t, idx) => (
              <button
                key={t.id}
                onClick={() => updateMixerConfig({ targetRootId: t.id })}
                className={cn(
                  "flex items-center gap-4 px-4 py-3 rounded-xl text-sm font-medium border transition-all duration-200 text-left",
                  activeTargetId === t.id
                    ? 'bg-primary/5 border-primary text-primary shadow-sm ring-1 ring-primary/20'
                    : 'bg-white border-gray-200 text-text-secondary hover:border-gray-300 hover:bg-gray-50'
                )}
              >
                <span className={cn(
                  "material-symbols-outlined text-[20px]",
                  activeTargetId === t.id ? "filled" : ""
                )}>{t.icon}</span>
                <div className="flex flex-col items-start min-w-0">
                  <span className="truncate font-semibold">{t.name}</span>
                  <span className="text-[10px] opacity-70 font-mono truncate w-full">{t.path}</span>
                </div>
                {activeTargetId === t.id && <span className="material-symbols-outlined ml-auto text-primary filled text-[18px]">check_circle</span>}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-8 space-y-8 bg-gray-50/50">
        {/* Workflow Class Selection */}
        <div className="space-y-4">
          <label className="text-xs font-bold text-text-tertiary uppercase tracking-wider flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">category</span> Class
          </label>
          <div className="grid grid-cols-2 gap-3">
            {presets.map((p, idx) => (
              <button
                key={p.id}
                onClick={() => updateMixerConfig({ presetId: p.id })}
                className={cn(
                  "flex flex-col items-center gap-3 p-4 rounded-xl text-xs font-bold border transition-all duration-200 text-center shadow-sm",
                  activePresetId === p.id
                    ? 'bg-white border-primary text-primary shadow-md shadow-primary/10 scale-[1.02]'
                    : 'bg-white border-gray-200 text-text-secondary hover:border-gray-300 hover:text-text-primary'
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
        <div className="p-5 bg-white rounded-2xl border border-gray-200 space-y-2 shadow-sm">
          <span className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider block mb-1">Target Path</span>
          <div className="flex items-start gap-3 text-text-primary">
            <span className="material-symbols-outlined text-primary text-[20px] filled mt-0.5">account_tree</span>
            <p className="text-xs font-mono break-all leading-relaxed text-text-secondary bg-gray-50 p-2 rounded-lg w-full border border-gray-100">
              {activeTarget && activePreset ? `${getTargetDir(activePreset, activeTarget)}/` : '--'}
            </p>
          </div>
        </div>

        {/* Preview Operations */}
        {previewOps.length > 0 && (
          <div className="space-y-3">
            <span className="text-xs font-bold text-text-tertiary uppercase tracking-wider">Queue Preview</span>
            <div className="space-y-2 max-h-56 overflow-y-auto pr-2 custom-scrollbar">
              {previewOps.map((op, i) => (
                <div key={op.id} className="flex items-center gap-3 text-[11px] bg-white p-2 rounded-lg border border-gray-100 shadow-sm">
                  <span className="size-1.5 rounded-full bg-primary shrink-0" />
                  <div className="min-w-0 flex-1 flex flex-col gap-0.5">
                    <span className="truncate text-text-primary font-medium">{op.originalName}</span>
                    <div className="flex items-center gap-1 text-text-tertiary">
                       <span className="material-symbols-outlined text-[10px]">arrow_forward</span>
                       <span className="truncate">{op.newName}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="p-8 border-t border-border-light bg-white space-y-6">
        <div className="flex justify-between items-center text-xs font-bold text-text-secondary uppercase tracking-wider">
          <span>Estimated Size</span>
          <span className="text-text-primary font-mono bg-gray-100 px-2 py-1 rounded">{Math.round(previewOps.length * 2.4 * 10) / 10} MB</span>
        </div>
        <button
          disabled={previewOps.length === 0 || isPreviewLoading}
          onClick={onExecute}
          className="w-full bg-primary hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl shadow-lg shadow-primary/20 transition-all flex items-center justify-center gap-3 active:scale-95 group overflow-hidden relative"
        >
          <span className="material-symbols-outlined font-bold text-xl filled group-hover:animate-bounce">rocket_launch</span>
          Execute Task
        </button>
      </div>
    </aside>
  );
};
