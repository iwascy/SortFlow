import React, { useCallback, useEffect, useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { configService } from '../../services/configService';
import { cn } from '../../utils/cn';

export const ConfigurationPage: React.FC = () => {
  const { config, presets, targetRoots, keywords, setConfig, setPresets, setTargetRoots, setKeywords } = useAppStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [watcherPath, setWatcherPath] = useState('');
  const [presetForm, setPresetForm] = useState({
    name: '',
    targetSubPath: '',
    defaultPrefix: '',
  });
  const [targetForm, setTargetForm] = useState({
    name: '',
    path: '',
    icon: '',
  });
  const [keywordForm, setKeywordForm] = useState({ name: '' });
  const [keywordEdits, setKeywordEdits] = useState<Record<string, string>>({});
  const [coverResult, setCoverResult] = useState<string | null>(null);
  const [keywordInput, setKeywordInput] = useState('');

  const loadConfig = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await configService.getConfig();
      const savedKeywords = JSON.parse(localStorage.getItem('sortflow.customKeywords') || '[]');
      setConfig({ sourceWatchers: response.watchers || [], theme: 'light', customKeywords: Array.isArray(savedKeywords) ? savedKeywords : [] });
      const sortedPresets = (response.presets || []).slice().sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
      setPresets(sortedPresets);
      setTargetRoots(response.targets || []);
      setKeywords(response.keywords || []);
    } catch (err) {
      console.error(err);
      setError('Failed to load configuration.');
    } finally {
      setLoading(false);
    }
  }, [setConfig, setPresets, setTargetRoots, setKeywords]);

  useEffect(() => {
    void loadConfig();
  }, [loadConfig]);

  useEffect(() => {
    const nextEdits: Record<string, string> = {};
    keywords.forEach(keyword => {
      nextEdits[keyword.id] = keyword.name;
    });
    setKeywordEdits(nextEdits);
  }, [keywords]);

  const handleAddWatcher = async () => {
    if (!watcherPath.trim()) return;
    setLoading(true);
    setError(null);
    try {
      await configService.addWatcher(watcherPath.trim());
      setWatcherPath('');
      await loadConfig();
    } catch (err) {
      console.error(err);
      setError('Failed to add watcher.');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveWatcher = async (path: string) => {
    setLoading(true);
    setError(null);
    try {
      await configService.removeWatcher(path);
      await loadConfig();
    } catch (err) {
      console.error(err);
      setError('Failed to remove watcher.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePreset = async () => {
    if (!presetForm.name.trim()) return;
    setLoading(true);
    setError(null);
    try {
      await configService.createPreset({
        name: presetForm.name.trim(),
        targetSubPath: presetForm.targetSubPath.trim(),
        defaultPrefix: presetForm.defaultPrefix.trim(),
      });
      setPresetForm({ name: '', targetSubPath: '', defaultPrefix: '' });
      await loadConfig();
    } catch (err) {
      console.error(err);
      setError('Failed to create preset.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTarget = async () => {
    if (!targetForm.name.trim() || !targetForm.path.trim()) return;
    setLoading(true);
    setError(null);
    try {
      await configService.createTarget({
        name: targetForm.name.trim(),
        path: targetForm.path.trim(),
        icon: targetForm.icon.trim(),
      });
      setTargetForm({ name: '', path: '', icon: '' });
      await loadConfig();
    } catch (err) {
      console.error(err);
      setError('Failed to create target.');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveTarget = async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      await configService.deleteTarget(id);
      await loadConfig();
    } catch (err) {
      console.error(err);
      setError('Failed to remove target.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateKeyword = async () => {
    if (!keywordForm.name.trim()) return;
    setLoading(true);
    setError(null);
    try {
      await configService.createKeyword({ name: keywordForm.name.trim() });
      setKeywordForm({ name: '' });
      await loadConfig();
    } catch (err) {
      console.error(err);
      setError('Failed to create keyword.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateKeyword = async (id: string) => {
    const name = (keywordEdits[id] || '').trim();
    if (!name) return;
    setLoading(true);
    setError(null);
    try {
      await configService.updateKeyword(id, { name });
      await loadConfig();
    } catch (err) {
      console.error(err);
      setError('Failed to update keyword.');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateVideoCovers = async () => {
    setLoading(true);
    setError(null);
    setCoverResult(null);
    try {
      const result = await configService.generateVideoCovers();
      setCoverResult(`Scanned ${result.total}, Generated ${result.generated}, Failed ${result.failed}`);
    } catch (err) {
      console.error(err);
      setError('Failed to generate video covers.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteKeyword = async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      await configService.deleteKeyword(id);
      await loadConfig();
    } catch (err) {
      console.error(err);
      setError('Failed to delete keyword.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddKeyword = () => {
    const value = keywordInput.trim();
    if (!value) return;
    const next = Array.from(new Set([...(config.customKeywords || []), value]));
    setConfig({ customKeywords: next });
    localStorage.setItem('sortflow.customKeywords', JSON.stringify(next));
    setKeywordInput('');
  };

  const handleRemoveKeyword = (keyword: string) => {
    const next = (config.customKeywords || []).filter(item => item !== keyword);
    setConfig({ customKeywords: next });
    localStorage.setItem('sortflow.customKeywords', JSON.stringify(next));
  };

  const handleRemovePreset = async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      await configService.deletePreset(id);
      await loadConfig();
    } catch (err) {
      console.error(err);
      setError('Failed to remove preset.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 h-full overflow-y-auto bg-[var(--color-bg-page)] p-8 animate-in fade-in duration-500">
      <div className="max-w-5xl mx-auto space-y-8">

        {/* Header */}
        <div className="flex flex-col gap-2 mb-8">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-text-primary tracking-tight">Configuration</h1>
                <button
                    onClick={() => void loadConfig()}
                    className="px-4 py-2 text-xs font-bold uppercase tracking-widest bg-white border border-border rounded-xl hover:border-primary/40 text-text-secondary hover:text-primary transition-colors shadow-sm"
                >
                    Refresh
                </button>
            </div>
            <p className="text-text-secondary text-sm">Manage system settings, keywords, and automation rules.</p>
        </div>

        {error && (
          <div className="p-4 rounded-2xl bg-red-50 text-red-600 border border-red-200 text-sm flex items-center gap-2">
            <span className="material-symbols-outlined filled text-[20px]">error</span>
            {error}
          </div>
        )}
        {loading && <div className="text-xs text-text-secondary animate-pulse">Loading configuration...</div>}

        {/* Section: Appearance */}
        <div className="bg-white rounded-3xl p-8 shadow-sm border border-border">
          <div className="flex items-center gap-4 mb-6">
             <div className="size-10 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center">
                <span className="material-symbols-outlined filled">palette</span>
             </div>
             <div>
                <h2 className="text-lg font-bold text-text-primary">Appearance</h2>
                <p className="text-xs text-text-secondary">Customize the interface look and feel.</p>
             </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <div className="space-y-3">
                <label className="text-sm font-semibold text-text-primary">Theme</label>
                <div className="flex gap-4">
                   <button
                      onClick={() => setConfig({ theme: 'light' })}
                      className={cn("flex-1 py-3 rounded-xl border font-medium transition-all text-sm", config.theme === 'light' ? "bg-primary/5 border-primary text-primary shadow-sm" : "bg-bg-muted border-border text-text-secondary")}
                   >
                      Light
                   </button>
                   <button
                      onClick={() => setConfig({ theme: 'dark' })}
                      className={cn("flex-1 py-3 rounded-xl border font-medium transition-all text-sm", config.theme === 'dark' ? "bg-slate-800 border-slate-700 text-white shadow-sm" : "bg-bg-muted border-border text-text-secondary")}
                   >
                      Dark
                   </button>
                </div>
             </div>

             <div className="space-y-3">
                <label className="text-sm font-semibold text-text-primary">Display Options</label>
                <div className="flex items-center justify-between p-4 rounded-xl border border-border bg-bg-muted/30">
                   <span className="text-sm text-text-primary">Hide Non-Media Files</span>
                   <button
                      onClick={() => setConfig({ hideNonMedia: !config.hideNonMedia })}
                      className={cn("w-12 h-6 rounded-full transition-colors relative", config.hideNonMedia ? "bg-primary" : "bg-slate-300")}
                   >
                      <span className={cn("absolute top-1 left-1 size-4 bg-white rounded-full transition-transform shadow-sm", config.hideNonMedia ? "translate-x-6" : "")} />
                   </button>
                </div>
             </div>
          </div>
        </div>

        {/* Section: Custom Keywords */}
        <div className="bg-white rounded-3xl p-8 shadow-sm border border-border">
           <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="size-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
                    <span className="material-symbols-outlined filled">label</span>
                </div>
                <div>
                    <h2 className="text-lg font-bold text-text-primary">Custom Keywords</h2>
                    <p className="text-xs text-text-secondary">Manage tags for file organization.</p>
                </div>
              </div>
           </div>

           <div className="flex flex-wrap gap-3 mb-6">
              {(config.customKeywords || []).map((k) => (
                 <div key={k} className="group flex items-center gap-2 pl-4 pr-2 py-2 rounded-full border border-border bg-bg-muted/50 hover:bg-white hover:border-primary/30 transition-all text-sm text-text-secondary hover:text-text-primary hover:shadow-sm">
                    <span>{k}</span>
                    <button
                        onClick={() => handleRemoveKeyword(k)}
                        className="size-6 rounded-full hover:bg-red-50 text-text-muted hover:text-red-500 flex items-center justify-center transition-colors"
                    >
                       <span className="material-symbols-outlined text-[14px]">close</span>
                    </button>
                 </div>
              ))}
              {(config.customKeywords || []).length === 0 && <p className="text-sm text-text-muted italic">No custom keywords defined.</p>}
           </div>

           <div className="flex gap-3">
                <input
                    value={keywordInput}
                    onChange={(e) => setKeywordInput(e.target.value)}
                    placeholder="Enter new keyword..."
                    className="flex-1 bg-white border border-border rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                    onKeyDown={(e) => e.key === 'Enter' && handleAddKeyword()}
                />
                <button
                    onClick={handleAddKeyword}
                    disabled={!keywordInput.trim()}
                    className="flex items-center gap-2 px-6 py-2 bg-primary text-white rounded-xl text-sm font-bold hover:bg-primary-dark transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <span className="material-symbols-outlined text-[18px]">add</span> Add
                </button>
           </div>
        </div>

        {/* Section: Mixer Keywords (Advanced) */}
        <div className="bg-white rounded-3xl p-8 shadow-sm border border-border">
           <div className="flex items-center gap-4 mb-6">
                <div className="size-10 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center">
                    <span className="material-symbols-outlined filled">settings_suggest</span>
                </div>
                <div>
                    <h2 className="text-lg font-bold text-text-primary">Mixer Keywords</h2>
                    <p className="text-xs text-text-secondary">Manage advanced pattern mixer keywords.</p>
                </div>
           </div>

           <div className="space-y-3 mb-6">
              {keywords.map((keyword) => {
                 const draftValue = keywordEdits[keyword.id] ?? '';
                 const isDirty = draftValue.trim() !== keyword.name.trim();
                 return (
                    <div key={keyword.id} className="flex items-center gap-3 p-3 rounded-xl border border-border bg-bg-muted/20 hover:bg-white hover:shadow-sm transition-all group">
                       <input
                          value={draftValue}
                          onChange={(e) => setKeywordEdits(prev => ({ ...prev, [keyword.id]: e.target.value }))}
                          className="flex-1 bg-transparent border-none focus:outline-none text-sm font-medium"
                       />
                       <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                           <button
                               onClick={() => void handleUpdateKeyword(keyword.id)}
                               disabled={!isDirty}
                               className="p-1.5 rounded-lg hover:bg-primary/10 text-primary disabled:opacity-30 disabled:cursor-not-allowed"
                           >
                               <span className="material-symbols-outlined text-[18px]">save</span>
                           </button>
                           <button
                               onClick={() => void handleDeleteKeyword(keyword.id)}
                               className="p-1.5 rounded-lg hover:bg-red-50 text-red-400 hover:text-red-500"
                           >
                               <span className="material-symbols-outlined text-[18px]">delete</span>
                           </button>
                       </div>
                    </div>
                 );
              })}
              {keywords.length === 0 && <p className="text-sm text-text-muted italic">No mixer keywords found.</p>}
           </div>

           <div className="flex gap-3">
                <input
                    value={keywordForm.name}
                    onChange={(e) => setKeywordForm({ name: e.target.value })}
                    placeholder="New mixer keyword..."
                    className="flex-1 bg-white border border-border rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                />
                <button
                    onClick={() => void handleCreateKeyword()}
                    disabled={!keywordForm.name.trim()}
                    className="px-6 py-2 bg-primary text-white rounded-xl text-sm font-bold hover:bg-primary-dark transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Add
                </button>
           </div>
        </div>

        {/* Section: Utilities */}
        <div className="bg-white rounded-3xl p-8 shadow-sm border border-border">
           <div className="flex items-center gap-4 mb-6">
                <div className="size-10 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center">
                    <span className="material-symbols-outlined filled">build</span>
                </div>
                <div>
                    <h2 className="text-lg font-bold text-text-primary">Utilities</h2>
                    <p className="text-xs text-text-secondary">System maintenance tools.</p>
                </div>
           </div>

           <div className="flex items-center justify-between p-4 rounded-xl border border-border bg-bg-muted/20">
               <div>
                   <h4 className="text-sm font-bold text-text-primary">Generate Video Covers</h4>
                   <p className="text-xs text-text-muted">Scan monitored folders and generate thumbnails for video files.</p>
                   {coverResult && <p className="text-xs text-emerald-600 mt-1 font-medium">{coverResult}</p>}
               </div>
               <button
                   onClick={() => void handleGenerateVideoCovers()}
                   className="px-4 py-2 bg-white border border-border rounded-xl text-xs font-bold hover:border-primary/40 text-text-secondary hover:text-primary transition-colors shadow-sm"
               >
                   Start Scan
               </button>
           </div>
        </div>

        {/* Section: Source Watchers */}
        <div className="bg-white rounded-3xl p-8 shadow-sm border border-border">
           <div className="flex items-center gap-4 mb-6">
                <div className="size-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center">
                    <span className="material-symbols-outlined filled">folder</span>
                </div>
                <div>
                    <h2 className="text-lg font-bold text-text-primary">Source Watchers</h2>
                    <p className="text-xs text-text-secondary">Monitored directories for incoming files.</p>
                </div>
           </div>

           <div className="space-y-3 mb-6">
              {config.sourceWatchers.map((path) => (
                 <div key={path} className="flex items-center gap-4 p-4 rounded-xl border border-border bg-bg-muted/20 hover:bg-white hover:shadow-sm transition-all group">
                    <div className="size-8 rounded-lg bg-amber-50 text-amber-500 flex items-center justify-center shrink-0">
                       <span className="material-symbols-outlined text-[18px] filled">folder</span>
                    </div>
                    <div className="flex-1 min-w-0">
                       <p className="text-sm font-mono text-text-primary truncate">{path}</p>
                    </div>
                    <button
                        onClick={() => void handleRemoveWatcher(path)}
                        className="p-2 rounded-lg hover:bg-red-50 text-text-secondary hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                    >
                        <span className="material-symbols-outlined">delete</span>
                    </button>
                 </div>
              ))}
           </div>

           <div className="flex gap-3">
                <input
                    value={watcherPath}
                    onChange={(e) => setWatcherPath(e.target.value)}
                    placeholder="/path/to/watch"
                    className="flex-1 bg-white border border-border rounded-xl px-4 py-2 text-sm font-mono focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                />
                <button
                    onClick={() => void handleAddWatcher()}
                    className="px-6 py-2 bg-primary text-white rounded-xl text-sm font-bold hover:bg-primary-dark transition-colors shadow-sm"
                >
                    Add Watcher
                </button>
           </div>
        </div>

        {/* Section: Target Roots */}
        <div className="bg-white rounded-3xl p-8 shadow-sm border border-border">
           <div className="flex items-center gap-4 mb-6">
                <div className="size-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
                    <span className="material-symbols-outlined filled">folder_special</span>
                </div>
                <div>
                    <h2 className="text-lg font-bold text-text-primary">Target Roots</h2>
                    <p className="text-xs text-text-secondary">Destination directories for sorted files.</p>
                </div>
           </div>

           <div className="space-y-3 mb-6">
              {targetRoots.map((root) => (
                 <div key={root.id} className="flex items-center gap-4 p-4 rounded-xl border border-border bg-bg-muted/20 hover:bg-white hover:shadow-sm transition-all group">
                    <div className="size-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                       <span className="material-symbols-outlined filled">{root.icon || 'storage'}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                       <h4 className="text-sm font-bold text-text-primary">{root.name}</h4>
                       <p className="text-xs text-text-muted font-mono truncate">{root.path}</p>
                    </div>
                    <button
                        onClick={() => void handleRemoveTarget(root.id)}
                        className="p-2 rounded-lg hover:bg-red-50 text-text-secondary hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                    >
                        <span className="material-symbols-outlined">delete</span>
                    </button>
                 </div>
              ))}
           </div>

           <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <input
                    value={targetForm.name}
                    onChange={(e) => setTargetForm(p => ({...p, name: e.target.value}))}
                    placeholder="Name"
                    className="bg-white border border-border rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                />
                <input
                    value={targetForm.path}
                    onChange={(e) => setTargetForm(p => ({...p, path: e.target.value}))}
                    placeholder="/target/path"
                    className="md:col-span-2 bg-white border border-border rounded-xl px-4 py-2 text-sm font-mono focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                />
                <div className="flex gap-3">
                    <input
                        value={targetForm.icon}
                        onChange={(e) => setTargetForm(p => ({...p, icon: e.target.value}))}
                        placeholder="Icon (optional)"
                        className="flex-1 bg-white border border-border rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                    />
                    <button
                        onClick={() => void handleCreateTarget()}
                        className="px-4 py-2 bg-primary text-white rounded-xl text-sm font-bold hover:bg-primary-dark transition-colors shadow-sm"
                    >
                        Add
                    </button>
                </div>
           </div>
        </div>

        {/* Section: Presets */}
        <div className="bg-white rounded-3xl p-8 shadow-sm border border-border">
           <div className="flex items-center gap-4 mb-6">
                <div className="size-10 rounded-xl bg-cyan-100 text-cyan-600 flex items-center justify-center">
                    <span className="material-symbols-outlined filled">category</span>
                </div>
                <div>
                    <h2 className="text-lg font-bold text-text-primary">Presets</h2>
                    <p className="text-xs text-text-secondary">Automation rules for file sorting.</p>
                </div>
           </div>

           <div className="space-y-3 mb-6">
              {presets.map((preset) => (
                 <div key={preset.id} className="flex items-center gap-4 p-4 rounded-xl border border-border bg-bg-muted/20 hover:bg-white hover:shadow-sm transition-all group">
                    <div className="size-10 rounded-lg bg-cyan-50 text-cyan-600 flex items-center justify-center shrink-0">
                       <span className="material-symbols-outlined filled">{preset.icon || 'folder_open'}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                       <h4 className="text-sm font-bold text-text-primary">{preset.name}</h4>
                       <p className="text-xs text-text-muted font-mono truncate">{preset.targetSubPath || '/'} · {preset.defaultPrefix || 'No prefix'}</p>
                    </div>
                    <button
                        onClick={() => void handleRemovePreset(preset.id)}
                        className="p-2 rounded-lg hover:bg-red-50 text-text-secondary hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                    >
                        <span className="material-symbols-outlined">delete</span>
                    </button>
                 </div>
              ))}
           </div>

           <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <input
                    value={presetForm.name}
                    onChange={(e) => setPresetForm(p => ({...p, name: e.target.value}))}
                    placeholder="Preset Name"
                    className="bg-white border border-border rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                />
                <input
                    value={presetForm.targetSubPath}
                    onChange={(e) => setPresetForm(p => ({...p, targetSubPath: e.target.value}))}
                    placeholder="Subpath (e.g. /Images)"
                    className="md:col-span-1 bg-white border border-border rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                />
                <input
                    value={presetForm.defaultPrefix}
                    onChange={(e) => setPresetForm(p => ({...p, defaultPrefix: e.target.value}))}
                    placeholder="Prefix (optional)"
                    className="md:col-span-1 bg-white border border-border rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                />
                <button
                    onClick={() => void handleCreatePreset()}
                    className="px-4 py-2 bg-primary text-white rounded-xl text-sm font-bold hover:bg-primary-dark transition-colors shadow-sm"
                >
                    Create
                </button>
           </div>
        </div>

      </div>
    </div>
  );
};
