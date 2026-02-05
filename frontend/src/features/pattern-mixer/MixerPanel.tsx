import React, { useMemo } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { cn } from '../../utils/cn';
import { tokenize } from '../../utils/tokenizer';

export const MixerPanel: React.FC = () => {
  const { mixerConfig, updateMixerConfig, files, selectedIds, keywords } = useAppStore();

  const selectedFiles = useMemo(() => files.filter(f => selectedIds.has(f.id) && !f.isDir), [files, selectedIds]);

  const tokens = useMemo(() => {
    if (selectedFiles.length === 0) return [];
    const seen = new Set<string>();
    const merged: string[] = [];
    selectedFiles.forEach(file => {
      tokenize(file.name).forEach(token => {
        if (seen.has(token)) return;
        seen.add(token);
        merged.push(token);
      });
    });
    return merged;
  }, [selectedFiles]);

  const toggleToken = (token: string) => {
    const prevTokens = mixerConfig.selectedTokens;
    const prevOrder = mixerConfig.selectedOrder;
    const isSelected = prevTokens.includes(token);
    const nextTokens = isSelected ? prevTokens.filter(t => t !== token) : [...prevTokens, token];
    const nextOrder = isSelected ? prevOrder.filter(t => t !== token) : [...prevOrder, token];
    updateMixerConfig({ selectedTokens: nextTokens, selectedOrder: nextOrder });
  };

  const toggleKeyword = (keyword: string) => {
    const prevKeywords = mixerConfig.selectedKeywords;
    const prevOrder = mixerConfig.selectedOrder;
    const isSelected = prevKeywords.includes(keyword);
    const nextKeywords = isSelected ? prevKeywords.filter(t => t !== keyword) : [...prevKeywords, keyword];
    const nextOrder = isSelected ? prevOrder.filter(t => t !== keyword) : [...prevOrder, keyword];
    updateMixerConfig({ selectedKeywords: nextKeywords, selectedOrder: nextOrder });
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
              checked={mixerConfig.usePrefix}
              onChange={e => updateMixerConfig({ usePrefix: e.target.checked })}
              className="form-checkbox size-4 rounded-md bg-background-dark border-border-dark text-primary focus:ring-primary focus:ring-offset-0 transition-all"
            />
            <span className={cn(
              "text-[10px] font-black transition-colors tracking-widest",
              mixerConfig.usePrefix ? "text-primary" : "text-white group-hover:text-primary"
            )}>PREFIX</span>
          </label>
          <div className="w-[1px] h-4 bg-border-dark" />
          <label className="flex items-center gap-3 cursor-pointer group">
            <input
              type="checkbox"
              checked={mixerConfig.useDate}
              onChange={e => updateMixerConfig({ useDate: e.target.checked })}
              className="form-checkbox size-4 rounded-md bg-background-dark border-border-dark text-primary focus:ring-primary focus:ring-offset-0 transition-all"
            />
            <span className={cn(
              "text-[10px] font-black transition-colors tracking-widest",
              mixerConfig.useDate ? "text-primary" : "text-white group-hover:text-primary"
            )}>DATE</span>
          </label>
          <div className="w-[1px] h-4 bg-border-dark" />
          <label className="flex items-center gap-3 cursor-pointer group">
            <input
              type="checkbox"
              checked={mixerConfig.useOriginal}
              onChange={e => {
                updateMixerConfig({
                  useOriginal: e.target.checked,
                  selectedTokens: e.target.checked ? [] : mixerConfig.selectedTokens,
                  selectedKeywords: e.target.checked ? [] : mixerConfig.selectedKeywords,
                  selectedOrder: e.target.checked ? [] : mixerConfig.selectedOrder,
                });
              }}
              className="form-checkbox size-4 rounded-md bg-background-dark border-border-dark text-primary focus:ring-primary focus:ring-offset-0 transition-all"
            />
            <span className={cn(
              "text-[10px] font-black transition-colors tracking-widest",
              mixerConfig.useOriginal ? "text-primary" : "text-white group-hover:text-primary"
            )}>RAW_NAME</span>
          </label>
        </div>
      </div>

      {!mixerConfig.useOriginal && tokens.length > 0 && (
        <div className="pt-6 border-t border-border-dark/50 animate-in fade-in slide-in-from-top duration-500">
          <div className="flex flex-wrap gap-3">
            {tokens.map((t, i) => (
              <button
                key={i}
                onClick={() => toggleToken(t)}
                style={{ animationDelay: `${i * 50}ms` }}
                className={cn(
                  "px-4 py-2 rounded-xl text-[10px] font-mono font-black border transition-all animate-in fade-in zoom-in-95 fill-mode-both",
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

      {!mixerConfig.useOriginal && keywords.length > 0 && (
        <div className="pt-6 border-t border-border-dark/50 animate-in fade-in slide-in-from-top duration-500">
          <div className="text-[9px] font-black text-text-secondary uppercase tracking-widest mb-3">
            Custom Keywords
          </div>
          <div className="flex flex-wrap gap-3">
            {keywords.map((keyword, i) => (
              <button
                key={keyword.id}
                onClick={() => toggleKeyword(keyword.name)}
                style={{ animationDelay: `${i * 50}ms` }}
                className={cn(
                  "px-4 py-2 rounded-xl text-[10px] font-mono font-black border transition-all animate-in fade-in zoom-in-95 fill-mode-both",
                  mixerConfig.selectedKeywords.includes(keyword.name)
                    ? 'bg-primary border-primary text-slate-900 shadow-[0_0_15px_rgba(17,180,212,0.3)] active-glow-primary'
                    : 'bg-surface-dark border-border-dark text-text-secondary hover:text-white hover:border-primary/50'
                )}
              >
                {keyword.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
