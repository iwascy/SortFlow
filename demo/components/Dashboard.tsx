
import React, { useState, useMemo } from 'react';
import { INITIAL_FILES, PRESETS, TARGET_ROOTS } from '../constants';
import { FileItem, RenameOp } from '../types';

const Dashboard: React.FC = () => {
  const [files, setFiles] = useState<FileItem[]>(INITIAL_FILES);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set(['2']));
  const [activePresetId, setActivePresetId] = useState<string>('vacation');
  const [activeTargetId, setActiveTargetId] = useState<string>(TARGET_ROOTS[0].id);
  
  // Mixer Components
  const [usePrefix, setUsePrefix] = useState(true);
  const [useDate, setUseDate] = useState(true);
  const [selectedTokens, setSelectedTokens] = useState<string[]>([]);
  const [useOriginal, setUseOriginal] = useState(false);

  // Execution States
  const [isExecuting, setIsExecuting] = useState(false);
  const [execProgress, setExecProgress] = useState(0);
  const [execLog, setExecLog] = useState<string[]>([]);
  const [isDone, setIsDone] = useState(false);

  // Navigation
  const paths = useMemo(() => Array.from(new Set(files.map(f => f.path))), [files]);
  const [currentPath, setCurrentPath] = useState<string>(paths[0] || '/nas/upload/raw');

  const selectedFiles = files.filter(f => selectedIds.has(f.id));
  const activePreset = PRESETS.find(p => p.id === activePresetId) || PRESETS[0];
  const activeTarget = TARGET_ROOTS.find(t => t.id === activeTargetId) || TARGET_ROOTS[0];

  // Tokenization for first selected file
  const tokens = useMemo(() => {
    if (selectedFiles.length === 0) return [];
    const baseName = selectedFiles[0].name.split('.')[0];
    return baseName.split(/[-_\s]+/).filter(Boolean);
  }, [selectedFiles]);

  const toggleToken = (token: string) => {
    setSelectedTokens(prev => 
      prev.includes(token) ? prev.filter(t => t !== token) : [...prev, token]
    );
  };

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
    if (next.size === 0) setSelectedTokens([]);
  };

  const previewOps: RenameOp[] = selectedFiles.map((f, idx) => {
    const dateStr = new Date().toISOString().split('T')[0];
    let nameParts: string[] = [];

    if (usePrefix) nameParts.push(activePreset.defaultPrefix);
    if (useDate) nameParts.push(dateStr);
    
    if (useOriginal) {
      nameParts.push(f.name.split('.')[0]);
    } else if (selectedTokens.length > 0) {
      nameParts.push(...selectedTokens);
    } else {
      nameParts.push(activePreset.name.toUpperCase());
    }

    const baseName = nameParts.join('_').replace(/_{2,}/g, '_');
    const finalSuffix = selectedFiles.length > 1 ? `_${String(idx + 1).padStart(3, '0')}` : '';
    const extension = f.type === 'RAW' ? 'ARW' : f.type.toLowerCase();

    return {
      id: f.id,
      originalName: f.name,
      newName: `${baseName}${finalSuffix}.${extension}`,
      originalPath: f.path,
      newPath: `${activeTarget.path}/${activePreset.targetSubPath}/`,
      status: 'pending'
    };
  });

  const runExecution = () => {
    setIsExecuting(true);
    setExecProgress(0);
    setIsDone(false);
    setExecLog(["Syncing with storage provider...", "Allocating write buffer..."]);
    
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.floor(Math.random() * 10) + 5;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        setTimeout(() => {
          setIsDone(true);
          setFiles(prev => prev.filter(f => !selectedIds.has(f.id)));
          setSelectedIds(new Set());
        }, 500);
      }
      setExecProgress(progress);
      setExecLog(prev => [...prev, `Block ${Math.ceil(progress/10)} written to ${activeTarget.name}`].slice(-6));
    }, 300);
  };

  if (isExecuting) {
    return (
      <div className="flex flex-col items-center justify-center h-full w-full bg-[#0a1315] p-12">
        <div className="w-full max-w-2xl space-y-12 animate-in fade-in zoom-in-95 duration-500">
          <div className="text-center space-y-4">
            <div className="inline-flex size-24 rounded-full bg-primary/10 items-center justify-center ring-4 ring-primary/5 mb-6">
              <span className={`material-symbols-outlined text-5xl text-primary ${!isDone ? 'animate-spin' : ''}`}>
                {isDone ? 'done_all' : 'sync'}
              </span>
            </div>
            <h2 className="text-4xl font-black text-white tracking-tighter">{isDone ? 'Archive Sync Complete' : 'Organizing Data'}</h2>
            <p className="text-text-secondary font-medium">
              Relocating {selectedFiles.length} assets to <span className="text-white font-mono">{activeTarget.path}</span>
            </p>
          </div>
          <div className="space-y-4 bg-surface-dark/50 p-8 rounded-[2rem] border border-border-dark shadow-2xl">
             <div className="flex justify-between items-end mb-2">
                <span className="text-[11px] font-black text-primary uppercase tracking-[0.3em]">Processing Batch</span>
                <span className="text-4xl font-black text-white font-mono">{execProgress}%</span>
             </div>
             <div className="h-5 bg-black rounded-full p-1 border border-border-dark shadow-inner">
                <div className="h-full bg-gradient-to-r from-primary via-cyan-400 to-primary rounded-full transition-all duration-300 shadow-[0_0_15px_rgba(17,180,212,0.4)]" style={{ width: `${execProgress}%` }} />
             </div>
          </div>
          <div className="bg-black/30 rounded-3xl p-6 border border-border-dark font-mono text-[10px] h-40 overflow-hidden space-y-2 opacity-60">
             {execLog.map((log, i) => <div key={i} className="flex gap-4"><span className="text-primary/40">[{i.toString().padStart(2, '0')}]</span> {log}</div>)}
          </div>
          {isDone && (
            <button onClick={() => setIsExecuting(false)} className="w-full bg-primary text-slate-900 font-black py-5 rounded-[2rem] shadow-2xl shadow-primary/20 hover:scale-[1.02] transition-all">RETURN TO WORKSPACE</button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col lg:flex-row bg-background-light dark:bg-background-dark">
      {/* Sidebar: Explorer */}
      <aside className="w-full lg:w-64 border-r border-slate-200 dark:border-border-dark flex flex-col shrink-0 overflow-y-auto bg-white dark:bg-background-dark">
        <div className="p-8">
          <h3 className="text-[10px] font-black text-text-secondary uppercase tracking-[0.25em] mb-8 opacity-60">Source Watchers</h3>
          <nav className="space-y-3">
            {paths.map(path => (
              <button
                key={path}
                onClick={() => setCurrentPath(path)}
                className={`w-full flex items-center gap-4 px-5 py-4 rounded-3xl text-[11px] font-black transition-all group ${currentPath === path ? 'bg-primary text-slate-900 shadow-xl shadow-primary/20 scale-105' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-surface-dark'}`}
              >
                <span className={`material-symbols-outlined text-[20px] ${currentPath === path ? 'text-slate-900' : 'text-primary'}`}>{path.includes('nas') ? 'dns' : 'sd_card'}</span>
                <span className="truncate">{path.split('/').pop() || 'Storage'}</span>
                <span className={`ml-auto opacity-50 font-mono ${currentPath === path ? 'text-slate-900' : ''}`}>{files.filter(f => f.path === path).length}</span>
              </button>
            ))}
          </nav>
        </div>
      </aside>

      {/* Main Workspace */}
      <div className="flex-1 flex flex-col min-w-0 bg-gray-50 dark:bg-surface-dark/10">
        <header className="px-8 py-4 flex items-center justify-between bg-white dark:bg-background-dark border-b border-border-dark z-10">
           <div className="flex items-center gap-6">
              <div className="flex items-center gap-3">
                 <span className="material-symbols-outlined text-primary">folder_open</span>
                 <h2 className="text-xs font-black text-white tracking-widest uppercase truncate max-w-[300px]">{currentPath}</h2>
              </div>
           </div>
        </header>

        {/* Naming Mixer Panel (Now Full Width) */}
        <div className="shrink-0 bg-white dark:bg-background-dark border-b border-border-dark p-8 space-y-6 shadow-xl z-10">
           <div className="flex items-center justify-between">
              <div className="flex flex-col gap-1">
                 <h3 className="text-[10px] font-black text-primary uppercase tracking-[0.3em]">Pattern Mixer</h3>
                 <p className="text-[9px] text-text-secondary font-medium">Define rules for renaming batch assets</p>
              </div>
              <div className="flex items-center gap-6 bg-surface-dark/40 px-6 py-3 rounded-2xl border border-border-dark">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input type="checkbox" checked={usePrefix} onChange={e => setUsePrefix(e.target.checked)} className="form-checkbox size-4 rounded-md bg-background-dark border-border-dark text-primary focus:ring-primary focus:ring-offset-0" />
                  <span className="text-[10px] font-black text-white group-hover:text-primary transition-colors tracking-widest">PREFIX</span>
                </label>
                <div className="w-[1px] h-4 bg-border-dark" />
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input type="checkbox" checked={useDate} onChange={e => setUseDate(e.target.checked)} className="form-checkbox size-4 rounded-md bg-background-dark border-border-dark text-primary focus:ring-primary focus:ring-offset-0" />
                  <span className="text-[10px] font-black text-white group-hover:text-primary transition-colors tracking-widest">DATE</span>
                </label>
                <div className="w-[1px] h-4 bg-border-dark" />
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input type="checkbox" checked={useOriginal} onChange={e => {setUseOriginal(e.target.checked); if(e.target.checked) setSelectedTokens([])}} className="form-checkbox size-4 rounded-md bg-background-dark border-border-dark text-primary focus:ring-primary focus:ring-offset-0" />
                  <span className="text-[10px] font-black text-white group-hover:text-primary transition-colors tracking-widest">RAW_NAME</span>
                </label>
              </div>
           </div>

           {!useOriginal && tokens.length > 0 && (
             <div className="pt-6 border-t border-border-dark/50">
                <div className="flex flex-wrap gap-3">
                   {tokens.map((t, i) => (
                      <button 
                        key={i} 
                        onClick={() => toggleToken(t)} 
                        className={`px-4 py-2 rounded-xl text-[10px] font-mono font-black border transition-all ${selectedTokens.includes(t) ? 'bg-primary border-primary text-slate-900 shadow-[0_0_15px_rgba(17,180,212,0.3)]' : 'bg-surface-dark border-border-dark text-text-secondary hover:text-white'}`}
                      >
                        {t}
                      </button>
                   ))}
                </div>
             </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-10 pb-40">
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-10">
            {files.filter(f => f.path === currentPath).map(file => {
              const isSelected = selectedIds.has(file.id);
              return (
                <div 
                  key={file.id} 
                  onClick={() => toggleSelect(file.id)}
                  className={`group relative flex flex-col gap-4 p-4 rounded-[2rem] transition-all cursor-pointer border ${isSelected ? 'bg-primary/5 border-primary ring-1 ring-primary/20 shadow-2xl' : 'bg-white dark:bg-surface-dark border-slate-200 dark:border-border-dark hover:shadow-xl'}`}
                >
                  <div className="w-full aspect-square rounded-[1.5rem] overflow-hidden relative bg-slate-900 shadow-inner">
                    <img src={file.thumbnail} alt={file.alt} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                    <div className="absolute top-4 right-4 px-3 py-1 rounded-xl bg-black/60 backdrop-blur-xl text-[9px] font-black text-white border border-white/10">{file.type}</div>
                    {isSelected && <div className="absolute top-4 left-4 bg-primary text-slate-900 p-2 rounded-2xl shadow-xl animate-in zoom-in-50"><span className="material-symbols-outlined text-[16px] font-black">check</span></div>}
                  </div>
                  <div className="px-2 min-w-0">
                    <p className={`text-[12px] font-black truncate mb-1 ${isSelected ? 'text-primary' : 'text-white'}`}>{file.name}</p>
                    <div className="flex justify-between text-[10px] font-bold text-text-secondary/40">
                       <span className="font-mono">{file.size}</span>
                       <span className="uppercase tracking-widest">{file.type}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Cockpit Sidebar: Routing & Execution */}
      <aside className="w-full lg:w-[420px] bg-white dark:bg-background-dark border-l border-border-dark flex flex-col shrink-0 shadow-[0_-20px_50px_rgba(0,0,0,0.5)] z-20">
        <div className="p-8 border-b border-border-dark bg-slate-50 dark:bg-surface-dark/40">
           <div className="flex justify-between items-center mb-6">
              <h3 className="text-sm font-black text-white uppercase tracking-[0.2em]">Transaction Desk</h3>
              <div className="flex flex-col items-end">
                <span className="text-4xl font-black text-primary leading-none tabular-nums">{selectedIds.size}</span>
                <span className="text-[10px] font-black text-text-secondary uppercase tracking-widest">Items Queued</span>
              </div>
           </div>
           
           {/* Target Root Selection */}
           <div className="space-y-4">
              <label className="text-[10px] font-black text-text-secondary uppercase tracking-widest flex items-center gap-2">
                <span className="material-symbols-outlined text-[16px]">storage</span> Destination Root
              </label>
              <div className="grid grid-cols-1 gap-2">
                 {TARGET_ROOTS.map(t => (
                   <button 
                     key={t.id}
                     onClick={() => setActiveTargetId(t.id)}
                     className={`flex items-center gap-4 px-5 py-4 rounded-2xl text-[11px] font-black border transition-all ${activeTargetId === t.id ? 'bg-primary border-primary text-slate-900 shadow-lg' : 'bg-surface-dark/60 border-border-dark text-text-secondary hover:bg-surface-dark'}`}
                   >
                     <span className="material-symbols-outlined text-[20px]">{t.icon}</span>
                     <div className="flex flex-col items-start min-w-0">
                        <span className="truncate">{t.name}</span>
                        <span className="text-[8px] opacity-60 font-mono truncate w-full">{t.path}</span>
                     </div>
                     {activeTargetId === t.id && <span className="material-symbols-outlined ml-auto text-slate-900">radio_button_checked</span>}
                   </button>
                 ))}
              </div>
           </div>
        </div>

        <div className="flex-1 overflow-y-auto p-8 space-y-8">
           {/* Workflow Class Selection */}
           <div className="space-y-4">
              <label className="text-[10px] font-black text-text-secondary uppercase tracking-widest flex items-center gap-2">
                <span className="material-symbols-outlined text-[16px]">category</span> Organizational Class
              </label>
              <div className="grid grid-cols-2 gap-3">
                 {PRESETS.map(p => (
                   <button 
                     key={p.id}
                     onClick={() => setActivePresetId(p.id)}
                     className={`flex flex-col items-center gap-3 p-4 rounded-2xl text-[10px] font-black border transition-all ${activePresetId === p.id ? 'bg-primary/10 border-primary text-primary shadow-xl shadow-primary/5' : 'bg-surface-dark/30 border-border-dark text-text-secondary'}`}
                   >
                     <span className="material-symbols-outlined text-[24px]">{p.icon}</span>
                     {p.name}
                   </button>
                 ))}
              </div>
           </div>

           {/* Live Path Preview */}
           <div className="p-6 bg-surface-dark/60 rounded-3xl border border-border-dark space-y-3">
              <span className="text-[9px] font-black text-text-secondary uppercase tracking-widest">Final Routing Path</span>
              <div className="flex items-center gap-3 text-white">
                 <span className="material-symbols-outlined text-primary text-[20px]">account_tree</span>
                 <p className="text-[11px] font-mono break-all leading-relaxed opacity-80 italic">
                    {activeTarget.path}/{activePreset.targetSubPath}/
                 </p>
              </div>
           </div>

           {/* Preview Operations */}
           <div className="space-y-3">
              <span className="text-[9px] font-black text-text-secondary uppercase tracking-widest">Queue Preview</span>
              <div className="space-y-3">
                 {selectedFiles.slice(0, 3).map((f, i) => (
                   <div key={f.id} className="flex items-center gap-4 text-[10px] text-text-secondary/60">
                      <span className="size-2 rounded-full bg-primary/40 shrink-0" />
                      <span className="truncate flex-1">{previewOps[i]?.newName}</span>
                   </div>
                 ))}
                 {selectedFiles.length > 3 && <p className="text-[9px] text-text-secondary/40 pl-6 italic">+ {selectedIds.size - 3} more items</p>}
              </div>
           </div>
        </div>

        <div className="p-10 border-t border-border-dark bg-surface-dark/40 space-y-6">
          <div className="flex justify-between items-center text-[11px] font-black text-text-secondary uppercase tracking-widest">
             <span>Estimated Load</span>
             <span className="text-white font-mono">{selectedIds.size * 22.4} MB</span>
          </div>
          <button 
            disabled={selectedIds.size === 0}
            onClick={runExecution}
            className="w-full bg-primary hover:bg-cyan-400 disabled:opacity-20 disabled:grayscale disabled:cursor-not-allowed text-slate-900 font-black py-6 rounded-[2.5rem] shadow-2xl shadow-primary/30 transition-all flex items-center justify-center gap-4 active:scale-95 group overflow-hidden"
          >
            <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 skew-x-12" />
            <span className="material-symbols-outlined font-black text-2xl">rocket_launch</span>
            COMMIT TO ARCHIVE
          </button>
        </div>
      </aside>
    </div>
  );
};

export default Dashboard;
