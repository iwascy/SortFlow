import React, { useMemo } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { cn } from '../../utils/cn';

export const MixerPanel: React.FC = () => {
  const { mixerConfig, updateMixerConfig, files, selectedIds, config } = useAppStore();

  const selectedFiles = useMemo(() => files.filter(f => selectedIds.has(f.id) && !f.isDir), [files, selectedIds]);

  const tokens = useMemo(() => {
    if (selectedFiles.length === 0) return [];
    const baseName = selectedFiles[0].name.split('.')[0];
    return baseName.split(/[-_\s]+/).filter(Boolean);
  }, [selectedFiles]);

  const keywordTokens = config.customKeywords || [];

  const toggleToken = (token: string) => {
    const prev = mixerConfig.selectedTokens;
    const next = prev.includes(token) ? prev.filter(t => t !== token) : [...prev, token];
    updateMixerConfig({ selectedTokens: next, useOriginal: false });
  };

  return (
    <div className="shrink-0 bg-background-dark border-b border-border-dark p-8 space-y-6 shadow-xl z-10 animate-in fade-in slide-in-from-top duration-700 delay-100 fill-mode-both">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h3 className="text-[10px] font-black text-primary uppercase tracking-[0.3em]">Pattern Mixer</h3>
          <p className="text-[9px] text-text-secondary font-medium">Define rules for renaming batch assets</p>
        </div>
        <div className="flex items-center gap-6 bg-surface-dark/40 px-6 py-3 rounded-2xl border border-border-dark">
          <label className="flex items-center gap-3 cursor-pointer group">
            <input
              type="checkbox"
              checked={mixerConfig.useOriginal}
              onChange={e => {
                updateMixerConfig({
                  useOriginal: e.target.checked,
                  selectedTokens: e.target.checked ? [] : mixerConfig.selectedTokens
                });
              }}
              className="form-checkbox size-4 rounded-md bg-background-dark border-border-dark text-primary focus:ring-primary focus:ring-offset-0 transition-all"
            />
            <span className={cn(
              'text-[10px] font-black transition-colors tracking-widest',
              mixerConfig.useOriginal ? 'text-primary' : 'text-white group-hover:text-primary'
            )}>RAW_NAME</span>
          </label>
        </div>
      </div>

      <div className="rounded-2xl border border-border-dark bg-surface-dark/40 px-5 py-4 space-y-2">
        <div className="text-[9px] uppercase tracking-widest text-text-secondary font-black">Temporary Keyword</div>
        <input
          value={mixerConfig.tempKeyword}
          onChange={(event) => updateMixerConfig({ tempKeyword: event.target.value })}
          placeholder="输入临时关键字，自动加到文件名"
          className="w-full rounded-xl border border-border-dark bg-black/30 px-4 py-3 text-[11px] text-white placeholder:text-text-secondary/60 focus:border-primary focus:outline-none"
        />
        <p className="text-[9px] text-text-secondary">发起迁移任务后会自动清空。</p>
      </div>

      {!mixerConfig.useOriginal && (
        <div className="pt-6 border-t border-border-dark/50 animate-in fade-in slide-in-from-top duration-500 space-y-4">
          {keywordTokens.length > 0 && (
            <div className="space-y-2">
              <div className="text-[9px] uppercase tracking-widest text-text-secondary font-black">Custom Keywords</div>
              <div className="flex flex-wrap gap-3">
                {keywordTokens.map((t, i) => (
                  <button
                    key={`keyword-${t}-${i}`}
                    onClick={() => toggleToken(t)}
                    className={cn(
                      'px-4 py-2 rounded-xl text-[10px] font-mono font-black border transition-all',
                      mixerConfig.selectedTokens.includes(t)
                        ? 'bg-primary border-primary text-slate-900 shadow-[0_0_15px_rgba(17,180,212,0.3)] active-glow-primary'
                        : 'bg-surface-dark border-border-dark text-text-secondary hover:text-white hover:border-primary/50'
                    )}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          )}

          {tokens.length > 0 && (
            <div className="space-y-2">
              <div className="text-[9px] uppercase tracking-widest text-text-secondary font-black">Filename Tokens</div>
              <div className="flex flex-wrap gap-3">
                {tokens.map((t, i) => (
                  <button
                    key={`file-token-${i}`}
                    onClick={() => toggleToken(t)}
                    className={cn(
                      'px-4 py-2 rounded-xl text-[10px] font-mono font-black border transition-all',
                      mixerConfig.selectedTokens.includes(t)
                        ? 'bg-primary border-primary text-slate-900 shadow-[0_0_15px_rgba(17,180,212,0.3)] active-glow-primary'
                        : 'bg-surface-dark border-border-dark text-text-secondary hover:text-white hover:border-primary/50'
                    )}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
