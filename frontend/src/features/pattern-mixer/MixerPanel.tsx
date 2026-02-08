import React, { useMemo } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { cn } from '../../utils/cn';
import { tokenize } from '../../utils/tokenizer';

export const MixerPanel: React.FC = () => {
  const { mixerConfig, updateMixerConfig, files, selectedIds, config, keywords } = useAppStore();

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
    <div className="bg-white rounded-2xl border border-border p-5 space-y-5 shadow-sm mb-6 animate-in fade-in slide-in-from-top duration-500">
      <div className="flex items-center justify-between">
        <div className="flex flex-col">
          <h3 className="text-sm font-bold text-text-primary flex items-center gap-2">
             <span className="material-symbols-outlined text-primary filled text-[18px]">tune</span>
             Pattern Mixer
          </h3>
          <p className="text-xs text-text-secondary">Rename batch assets with tokens</p>
        </div>

        <label className={cn(
            "flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-bold transition-all cursor-pointer select-none",
            mixerConfig.useOriginal
                ? "bg-primary text-white border-primary shadow-sm"
                : "bg-white text-text-secondary border-border hover:bg-bg-muted"
        )}>
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
              className="hidden"
            />
            <span>RAW_NAME</span>
        </label>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex-1 relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-text-muted text-[18px]">label</span>
            <input
              value={mixerConfig.tempKeyword}
              onChange={(event) => updateMixerConfig({ tempKeyword: event.target.value })}
              placeholder="Temporary keyword..."
              className="w-full bg-bg-muted border border-border rounded-xl pl-10 pr-4 py-2 text-sm text-text-primary focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all placeholder:text-text-muted"
            />
        </div>
      </div>

      {!mixerConfig.useOriginal && (
        <div className="space-y-4 pt-2">
          {keywordTokens.length > 0 && (
            <div className="space-y-2">
              <div className="text-[10px] uppercase tracking-widest text-text-secondary font-bold">Custom Keywords</div>
              <div className="flex flex-wrap gap-2">
                {keywordTokens.map((t, i) => (
                  <button
                    key={`keyword-${t}-${i}`}
                    onClick={() => toggleToken(t)}
                    className={cn(
                      'px-3 py-1.5 rounded-lg text-xs font-medium border transition-all shadow-sm',
                      mixerConfig.selectedTokens.includes(t)
                        ? 'bg-primary text-white border-primary'
                        : 'bg-white border-border text-text-secondary hover:text-primary hover:border-primary/50'
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
              <div className="text-[10px] uppercase tracking-widest text-text-secondary font-bold">Filename Tokens</div>
              <div className="flex flex-wrap gap-2">
                {tokens.map((t, i) => (
                  <button
                    key={`file-token-${i}`}
                    onClick={() => toggleToken(t)}
                    className={cn(
                      'px-3 py-1.5 rounded-lg text-xs font-medium border transition-all shadow-sm',
                      mixerConfig.selectedTokens.includes(t)
                        ? 'bg-primary text-white border-primary'
                        : 'bg-white border-border text-text-secondary hover:text-primary hover:border-primary/50'
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

      {!mixerConfig.useOriginal && keywords.length > 0 && (
        <div className="pt-2">
          <div className="text-[10px] uppercase tracking-widest text-text-secondary font-bold mb-2">
            Mixer Keywords
          </div>
          <div className="flex flex-wrap gap-2">
            {keywords.map((keyword, i) => (
              <button
                key={keyword.id}
                onClick={() => toggleKeyword(keyword.name)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-medium border transition-all shadow-sm",
                  mixerConfig.selectedKeywords.includes(keyword.name)
                    ? 'bg-primary text-white border-primary'
                    : 'bg-white border-border text-text-secondary hover:text-primary hover:border-primary/50'
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
