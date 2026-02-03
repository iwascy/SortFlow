import React, { useMemo } from 'react';
import { useAppStore } from '../../store/useAppStore';

export const MixerPanel: React.FC = () => {
  const { mixerConfig, updateMixerConfig, files, selectedIds } = useAppStore();

  const selectedFiles = useMemo(() => files.filter(f => selectedIds.has(f.id)), [files, selectedIds]);

  // Tokenization for first selected file
  const tokens = useMemo(() => {
    if (selectedFiles.length === 0) return [];
    const baseName = selectedFiles[0].name.split('.')[0];
    return baseName.split(/[-_\s]+/).filter(Boolean);
  }, [selectedFiles]);

  const toggleToken = (token: string) => {
    const prev = mixerConfig.selectedTokens;
    const next = prev.includes(token) ? prev.filter(t => t !== token) : [...prev, token];
    updateMixerConfig({ selectedTokens: next });
  };

  return (
    <div className="shrink-0 bg-white dark:bg-background-dark border-b border-border-dark p-8 space-y-6 shadow-xl z-10">
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
                className="form-checkbox size-4 rounded-md bg-background-dark border-border-dark text-primary focus:ring-primary focus:ring-offset-0"
              />
              <span className="text-[10px] font-black text-white group-hover:text-primary transition-colors tracking-widest">PREFIX</span>
            </label>
            <div className="w-[1px] h-4 bg-border-dark" />
            <label className="flex items-center gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={mixerConfig.useDate}
                onChange={e => updateMixerConfig({ useDate: e.target.checked })}
                className="form-checkbox size-4 rounded-md bg-background-dark border-border-dark text-primary focus:ring-primary focus:ring-offset-0"
              />
              <span className="text-[10px] font-black text-white group-hover:text-primary transition-colors tracking-widest">DATE</span>
            </label>
            <div className="w-[1px] h-4 bg-border-dark" />
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
                className="form-checkbox size-4 rounded-md bg-background-dark border-border-dark text-primary focus:ring-primary focus:ring-offset-0"
              />
              <span className="text-[10px] font-black text-white group-hover:text-primary transition-colors tracking-widest">RAW_NAME</span>
            </label>
          </div>
       </div>

       {!mixerConfig.useOriginal && tokens.length > 0 && (
         <div className="pt-6 border-t border-border-dark/50">
            <div className="flex flex-wrap gap-3">
               {tokens.map((t, i) => (
                  <button
                    key={i}
                    onClick={() => toggleToken(t)}
                    className={`px-4 py-2 rounded-xl text-[10px] font-mono font-black border transition-all ${mixerConfig.selectedTokens.includes(t) ? 'bg-primary border-primary text-slate-900 shadow-[0_0_15px_rgba(17,180,212,0.3)]' : 'bg-surface-dark border-border-dark text-text-secondary hover:text-white'}`}
                  >
                    {t}
                  </button>
               ))}
            </div>
         </div>
      )}
    </div>
  );
};
