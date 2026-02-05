import React, { useCallback, useEffect, useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { configService } from '../../services/configService';

export const ConfigurationPage: React.FC = () => {
  const { config, presets, targetRoots, setConfig, setPresets, setTargetRoots } = useAppStore();
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

  const loadConfig = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await configService.getConfig();
      setConfig({ sourceWatchers: response.watchers || [], theme: 'dark' });
      const sortedPresets = (response.presets || []).slice().sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
      setPresets(sortedPresets);
      setTargetRoots(response.targets || []);
    } catch (err) {
      console.error(err);
      setError('Failed to load configuration.');
    } finally {
      setLoading(false);
    }
  }, [setConfig, setPresets, setTargetRoots]);

  useEffect(() => {
    void loadConfig();
  }, [loadConfig]);

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
    <div className="flex h-full w-full flex-col overflow-y-auto bg-background-dark text-white">
      <div className="px-10 py-8 border-b border-border-dark flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black tracking-tight">Configuration</h2>
          <p className="text-xs text-text-secondary">Manage source watchers, target roots, and presets.</p>
        </div>
        <button
          onClick={loadConfig}
          className="px-4 py-2 text-xs font-black uppercase tracking-widest bg-surface-dark/60 border border-border-dark rounded-xl hover:border-primary/40"
        >
          Refresh
        </button>
      </div>

      <div className="p-10 space-y-10">
        {error && (
          <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-200 text-sm">
            {error}
          </div>
        )}
        {loading && <div className="text-xs text-text-secondary">Loading...</div>}

        <section className="space-y-4">
          <h3 className="text-sm font-black uppercase tracking-widest text-text-secondary">Display</h3>
          <label className="flex items-center gap-3 rounded-2xl border border-border-dark bg-surface-dark/60 px-4 py-3 text-xs">
            <input
              type="checkbox"
              checked={config.hideNonMedia}
              onChange={(event) => setConfig({ hideNonMedia: event.target.checked })}
              className="h-4 w-4 accent-primary"
            />
            <span>仅显示媒体文件（图片/视频），隐藏非媒体文件</span>
          </label>
        </section>

        <section className="space-y-4">
          <h3 className="text-sm font-black uppercase tracking-widest text-text-secondary">Source Watchers</h3>
          <div className="grid gap-3">
            {config.sourceWatchers.map(path => (
              <div key={path} className="flex items-center gap-4 bg-surface-dark/60 border border-border-dark rounded-2xl px-4 py-3">
                <span className="material-symbols-outlined text-primary filled">folder</span>
                <span className="flex-1 text-xs font-mono">{path}</span>
                <button
                  onClick={() => handleRemoveWatcher(path)}
                  className="text-xs font-black uppercase tracking-widest text-red-300 hover:text-red-200"
                >
                  Remove
                </button>
              </div>
            ))}
            {config.sourceWatchers.length === 0 && (
              <div className="text-xs text-text-secondary">No watchers configured.</div>
            )}
          </div>
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <input
              value={watcherPath}
              onChange={(event) => setWatcherPath(event.target.value)}
              placeholder="输入目录路径"
              className="flex-1 bg-black/30 border border-border-dark rounded-xl px-4 py-3 text-xs font-mono text-white"
            />
            <button
              onClick={handleAddWatcher}
              className="px-5 py-3 text-xs font-black uppercase tracking-widest bg-primary text-slate-900 rounded-xl shadow-lg"
            >
              Add
            </button>
          </div>
        </section>

        <section className="space-y-4">
          <h3 className="text-sm font-black uppercase tracking-widest text-text-secondary">Target Roots</h3>
          <div className="grid gap-3">
            {targetRoots.map(target => (
              <div key={target.id} className="flex items-center gap-4 bg-surface-dark/60 border border-border-dark rounded-2xl px-4 py-3">
                <span className="material-symbols-outlined text-primary filled">{target.icon || 'storage'}</span>
                <div className="flex-1">
                  <div className="text-xs font-black">{target.name}</div>
                  <div className="text-[10px] font-mono text-text-secondary">{target.path}</div>
                </div>
                <button
                  onClick={() => handleRemoveTarget(target.id)}
                  className="text-xs font-black uppercase tracking-widest text-red-300 hover:text-red-200"
                >
                  Remove
                </button>
              </div>
            ))}
            {targetRoots.length === 0 && (
              <div className="text-xs text-text-secondary">No target roots configured.</div>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <input
              value={targetForm.name}
              onChange={e => setTargetForm(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Name"
              className="bg-black/30 border border-border-dark rounded-xl px-4 py-3 text-xs text-white"
            />
            <input
              value={targetForm.path}
              onChange={e => setTargetForm(prev => ({ ...prev, path: e.target.value }))}
              placeholder="输入目录路径"
              className="md:col-span-2 bg-black/30 border border-border-dark rounded-xl px-4 py-3 text-xs font-mono text-white"
            />
            <input
              value={targetForm.icon}
              onChange={e => setTargetForm(prev => ({ ...prev, icon: e.target.value }))}
              placeholder="Icon"
              className="bg-black/30 border border-border-dark rounded-xl px-4 py-3 text-xs text-white"
            />
          </div>
          <button
            onClick={handleCreateTarget}
            className="px-5 py-3 text-xs font-black uppercase tracking-widest bg-primary text-slate-900 rounded-xl shadow-lg"
          >
            Create Target
          </button>
        </section>

        <section className="space-y-4">
          <h3 className="text-sm font-black uppercase tracking-widest text-text-secondary">Presets</h3>
          <div className="grid gap-3">
            {presets.map(preset => (
              <div key={preset.id} className="flex items-center gap-4 bg-surface-dark/60 border border-border-dark rounded-2xl px-4 py-3">
                <span className="material-symbols-outlined text-primary filled">{preset.icon || 'category'}</span>
                <div className="flex-1">
                  <div className="text-xs font-black">{preset.name}</div>
                  <div className="text-[10px] font-mono text-text-secondary">
                    {preset.targetSubPath} · {preset.defaultPrefix}
                  </div>
                </div>
                <button
                  onClick={() => handleRemovePreset(preset.id)}
                  className="text-xs font-black uppercase tracking-widest text-red-300 hover:text-red-200"
                >
                  Remove
                </button>
              </div>
            ))}
            {presets.length === 0 && (
              <div className="text-xs text-text-secondary">No presets configured.</div>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <input
              value={presetForm.name}
              onChange={e => setPresetForm(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Preset Name"
              className="bg-black/30 border border-border-dark rounded-xl px-4 py-3 text-xs text-white"
            />
            <input
              value={presetForm.targetSubPath}
              onChange={e => setPresetForm(prev => ({ ...prev, targetSubPath: e.target.value }))}
              placeholder="输入子路径"
              className="md:col-span-2 bg-black/30 border border-border-dark rounded-xl px-4 py-3 text-xs text-white"
            />
            <input
              value={presetForm.defaultPrefix}
              onChange={e => setPresetForm(prev => ({ ...prev, defaultPrefix: e.target.value }))}
              placeholder="Default Prefix"
              className="bg-black/30 border border-border-dark rounded-xl px-4 py-3 text-xs text-white"
            />
          </div>
          <button
            onClick={handleCreatePreset}
            className="px-5 py-3 text-xs font-black uppercase tracking-widest bg-primary text-slate-900 rounded-xl shadow-lg"
          >
            Create Preset
          </button>
        </section>
      </div>
    </div>
  );
};
