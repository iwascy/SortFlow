import React, { useMemo, useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { cn } from '../../utils/cn';
import { tokenize } from '../../utils/tokenizer';

export const MixerPanel: React.FC = () => {
  const { mixerConfig, updateMixerConfig, files, selectedIds, config, keywords } = useAppStore();
  const [isExpanded, setIsExpanded] = useState(false);

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

  const keywordTokens = config.customKeywords || [];

  const toggleToken = (token: string) => {
    const prevTokens = mixerConfig.selectedTokens;
    const prevOrder = mixerConfig.selectedOrder;
    const isSelected = prevTokens.includes(token);
    const nextTokens = isSelected ? prevTokens.filter(t => t !== token) : [...prevTokens, token];
    const nextOrder = isSelected ? prevOrder.filter(t => t !== token) : [...prevOrder, token];
    updateMixerConfig({ selectedTokens: nextTokens, selectedOrder: nextOrder, useOriginal: false });
  };

  const toggleKeyword = (keyword: string) => {
    const prevKeywords = mixerConfig.selectedKeywords;
    const prevOrder = mixerConfig.selectedOrder;
    const isSelected = prevKeywords.includes(keyword);
    const nextKeywords = isSelected ? prevKeywords.filter(t => t !== keyword) : [...prevKeywords, keyword];
    const nextOrder = isSelected ? prevOrder.filter(t => t !== keyword) : [...prevOrder, keyword];
    updateMixerConfig({ selectedKeywords: nextKeywords, selectedOrder: nextOrder, useOriginal: false });
  };

  return (
    <div className="shrink-0 bg-white border-b border-gray-200 px-8 py-6 shadow-sm z-10 animate-in fade-in slide-in-from-top duration-500">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10 text-primary">
            <span className="material-symbols-outlined text-[24px]">tune</span>
          </div>
          <div className="flex flex-col">
            <h3 className="text-sm font-bold text-text-primary">Pattern Mixer</h3>
            <p className="text-xs text-text-secondary">Renaming rules & metadata extraction</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
           <label className="flex items-center gap-2 cursor-pointer group select-none">
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
              className="form-checkbox size-4 rounded bg-white border-gray-300 text-primary focus:ring-primary focus:ring-offset-0 transition-all"
            />
            <span className={cn(
              'text-xs font-bold transition-colors',
              mixerConfig.useOriginal ? 'text-primary' : 'text-text-secondary group-hover:text-text-primary'
            )}>Use Original Name</span>
          </label>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-2 rounded-lg hover:bg-gray-100 text-text-secondary transition-colors"
          >
             <span className="material-symbols-outlined text-[20px]">{isExpanded ? 'expand_less' : 'expand_more'}</span>
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="space-y-6 animate-in fade-in slide-in-from-top duration-300">
            <div className="p-4 rounded-xl border border-gray-100 bg-gray-50/50 space-y-2">
                <label className="text-xs font-bold text-text-tertiary uppercase tracking-wider block">Temporary Keyword</label>
                <input
                value={mixerConfig.tempKeyword}
                onChange={(event) => updateMixerConfig({ tempKeyword: event.target.value })}
                placeholder="Add temporary keyword..."
                className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm text-text-primary placeholder:text-text-tertiary focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all"
                />
                <p className="text-[10px] text-text-tertiary">Will be cleared after execution.</p>
            </div>

            {!mixerConfig.useOriginal && (
                <div className="pt-4 border-t border-gray-100 space-y-4">
                {(keywordTokens.length > 0 || tokens.length > 0) && (
                    <div className="space-y-3">
                    <div className="text-xs font-bold text-text-tertiary uppercase tracking-wider">Available Tokens</div>
                    <div className="flex flex-wrap gap-2">
                        {keywordTokens.map((t, i) => (
                        <button
                            key={`keyword-${t}-${i}`}
                            onClick={() => toggleToken(t)}
                            className={cn(
                            'px-3 py-1.5 rounded-lg text-xs font-mono font-medium border transition-all shadow-sm',
                            mixerConfig.selectedTokens.includes(t)
                                ? 'bg-primary text-white border-primary shadow-primary/20'
                                : 'bg-white border-gray-200 text-text-secondary hover:bg-gray-50 hover:text-text-primary'
                            )}
                        >
                            {t}
                        </button>
                        ))}
                        {tokens.map((t, i) => (
                        <button
                            key={`file-token-${i}`}
                            onClick={() => toggleToken(t)}
                            className={cn(
                            'px-3 py-1.5 rounded-lg text-xs font-mono font-medium border transition-all shadow-sm',
                            mixerConfig.selectedTokens.includes(t)
                                ? 'bg-primary text-white border-primary shadow-primary/20'
                                : 'bg-white border-gray-200 text-text-secondary hover:bg-gray-50 hover:text-text-primary'
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
      )}
    </div>
  );
};
