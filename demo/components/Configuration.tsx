
import React, { useState } from 'react';
import { PRESETS, TARGET_ROOTS } from '../constants';
import { TargetRoot } from '../types';

const Configuration: React.FC = () => {
  const [targets, setTargets] = useState<TargetRoot[]>(TARGET_ROOTS);

  return (
    <div className="h-full overflow-y-auto bg-background-light dark:bg-background-dark">
      <div className="mx-auto max-w-5xl px-10 py-10 pb-32 space-y-16">
        {/* Page Heading */}
        <div className="flex items-end justify-between">
          <div>
            <h2 className="text-4xl font-black tracking-tighter text-slate-900 dark:text-white uppercase">Configuration</h2>
            <p className="mt-2 text-text-secondary font-medium">System architecture and routing definitions.</p>
          </div>
          <button className="flex items-center gap-3 rounded-2xl bg-primary px-6 py-3 text-sm font-black text-slate-900 shadow-xl shadow-primary/20 hover:scale-[1.02] transition-all">
            <span className="material-symbols-outlined text-[20px]">cloud_sync</span>
            SYNC RULES
          </button>
        </div>

        {/* Target Roots Section */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-black text-white uppercase tracking-widest border-l-4 border-primary pl-4">Archive Targets</h3>
            <button className="text-xs font-black text-primary hover:text-white transition-colors uppercase tracking-widest flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">add_circle</span> Define New Root
            </button>
          </div>
          <div className="grid gap-4">
            {targets.map(t => (
              <div key={t.id} className="group flex items-center justify-between p-6 rounded-3xl bg-surface-dark border border-border-dark hover:border-primary/40 transition-all shadow-sm">
                <div className="flex items-center gap-6">
                   <div className="size-14 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20 text-primary">
                      <span className="material-symbols-outlined text-3xl">{t.icon}</span>
                   </div>
                   <div className="space-y-1">
                      <p className="text-sm font-black text-white uppercase tracking-widest">{t.name}</p>
                      <p className="text-[11px] font-mono text-text-secondary opacity-60 italic">{t.path}</p>
                   </div>
                </div>
                <div className="flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                   <button className="size-10 rounded-xl bg-white/5 flex items-center justify-center text-slate-400 hover:text-white"><span className="material-symbols-outlined text-[20px]">edit</span></button>
                   <button className="size-10 rounded-xl bg-white/5 flex items-center justify-center text-slate-400 hover:text-red-500"><span className="material-symbols-outlined text-[20px]">delete</span></button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Source Directories Section */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-black text-white uppercase tracking-widest border-l-4 border-primary pl-4">Source Watchers</h3>
          </div>
          <div className="rounded-[2rem] border border-border-dark bg-surface-dark overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-border-dark flex items-center justify-between bg-white/5">
              <div className="flex items-center gap-4">
                <span className="material-symbols-outlined text-primary">dns</span>
                <span className="text-[11px] font-mono font-black text-white">/nas/upload/raw</span>
              </div>
              <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full text-[9px] font-black uppercase tracking-widest">Active Scan</span>
            </div>
            <div className="p-6 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="material-symbols-outlined text-text-secondary">sd_card</span>
                <span className="text-[11px] font-mono font-black text-white">/mnt/sdcard/dcim</span>
              </div>
              <span className="px-3 py-1 bg-white/5 text-text-secondary/40 border border-white/5 rounded-full text-[9px] font-black uppercase tracking-widest">Idle</span>
            </div>
          </div>
        </section>

        {/* Category Presets Section */}
        <section className="space-y-6">
          <h3 className="text-xl font-black text-white uppercase tracking-widest border-l-4 border-primary pl-4">Workflow Definitions</h3>
          <div className="overflow-hidden rounded-[2rem] border border-border-dark bg-surface-dark shadow-2xl">
            <table className="min-w-full">
              <thead className="bg-white/5 border-b border-border-dark">
                <tr>
                  <th className="px-8 py-5 text-left text-[10px] font-black uppercase tracking-[0.2em] text-text-secondary">Class Name</th>
                  <th className="px-8 py-5 text-left text-[10px] font-black uppercase tracking-[0.2em] text-text-secondary">Sub-path Target</th>
                  <th className="px-8 py-5 text-left text-[10px] font-black uppercase tracking-[0.2em] text-text-secondary">Prefix Map</th>
                  <th className="px-8 py-5 text-right text-[10px] font-black uppercase tracking-[0.2em] text-text-secondary">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-dark/50">
                {PRESETS.map(preset => (
                  <tr key={preset.id} className="group hover:bg-white/5 transition-all">
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-4">
                        <div className="size-10 rounded-xl bg-surface-dark border border-border-dark flex items-center justify-center text-primary">
                          <span className="material-symbols-outlined text-xl">{preset.icon}</span>
                        </div>
                        <span className="text-xs font-black text-white uppercase tracking-widest">{preset.name}</span>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <code className="text-[10px] font-mono text-text-secondary/60">/{preset.targetSubPath}</code>
                    </td>
                    <td className="px-8 py-5">
                      <span className="px-3 py-1 bg-background-dark rounded-lg text-[10px] font-mono font-black text-primary border border-primary/20">{preset.defaultPrefix}</span>
                    </td>
                    <td className="px-8 py-5 text-right">
                       <button className="text-slate-400 hover:text-white transition-colors"><span className="material-symbols-outlined text-[18px]">more_vert</span></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Configuration;
