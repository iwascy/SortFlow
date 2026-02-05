import React, { useCallback, useEffect, useRef, useState } from 'react';
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
    icon: '',
    color: '',
  });
  const [targetForm, setTargetForm] = useState({
    name: '',
    path: '',
    icon: '',
  });
  const watcherPickerRef = useRef<HTMLInputElement | null>(null);
  const targetPickerRef = useRef<HTMLInputElement | null>(null);
  const presetPickerRef = useRef<HTMLInputElement | null>(null);

  const prepareDirectoryInput = useCallback((input: HTMLInputElement | null) => {
    if (!input) return;
    input.setAttribute('webkitdirectory', '');
    input.setAttribute('directory', '');
    input.multiple = true;
  }, []);

  const resolveDirectoryPath = useCallback((files: FileList | null): string | null => {
    if (!files || files.length === 0) return null;
    const firstFile = files[0] as File & { path?: string; webkitRelativePath?: string };
    const fullPath = typeof firstFile.path === 'string' ? firstFile.path : '';
    const relativePath = firstFile.webkitRelativePath || '';
    if (!fullPath) return null;
    if (relativePath) {
      const normalizedRelative = relativePath.replace(/\\/g, '/');
      const rootName = normalizedRelative.split('/')[0] || '';
      const base = fullPath.slice(0, Math.max(0, fullPath.length - normalizedRelative.length));
      const candidate = `${base}${rootName}`;
      return candidate.replace(/\/+$/, '');
    }
    return fullPath.replace(/[/\\][^/\\]*$/, '');
  }, []);

  const handleDirectoryPick = useCallback((files: FileList | null, onResolved: (path: string) => void) => {
    const resolved = resolveDirectoryPath(files);
    if (!resolved) {
      setError('无法读取目录绝对路径，请确认在桌面环境运行。');
      return;
    }
    setError(null);
    onResolved(resolved);
  }, [resolveDirectoryPath]);

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

  useEffect(() => {
    prepareDirectoryInput(watcherPickerRef.current);
    prepareDirectoryInput(targetPickerRef.current);
    prepareDirectoryInput(presetPickerRef.current);
  }, [prepareDirectoryInput]);

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
        icon: presetForm.icon.trim(),
        color: presetForm.color.trim(),
      });
      setPresetForm({ name: '', targetSubPath: '', defaultPrefix: '', icon: '', color: '' });
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
              readOnly
              placeholder="选择目录"
              className="flex-1 bg-black/30 border border-border-dark rounded-xl px-4 py-3 text-xs font-mono text-white"
            />
            <button
              onClick={() => watcherPickerRef.current?.click()}
              className="px-4 py-3 text-xs font-black uppercase tracking-widest border border-border-dark rounded-xl hover:border-primary/40"
            >
              选择目录
            </button>
            <button
              onClick={handleAddWatcher}
              className="px-5 py-3 text-xs font-black uppercase tracking-widest bg-primary text-slate-900 rounded-xl shadow-lg"
            >
              Add
            </button>
            <input
              ref={watcherPickerRef}
              type="file"
              className="hidden"
              onChange={(event) => {
                handleDirectoryPick(event.target.files, setWatcherPath);
                event.currentTarget.value = '';
              }}
            />
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
            <div className="md:col-span-2 flex gap-2">
              <input
                value={targetForm.path}
                readOnly
                placeholder="选择目录"
                className="flex-1 bg-black/30 border border-border-dark rounded-xl px-4 py-3 text-xs font-mono text-white"
              />
              <button
                onClick={() => targetPickerRef.current?.click()}
                className="px-4 py-3 text-xs font-black uppercase tracking-widest border border-border-dark rounded-xl hover:border-primary/40"
              >
                选择
              </button>
            </div>
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
          <input
            ref={targetPickerRef}
            type="file"
            className="hidden"
            onChange={(event) => {
              handleDirectoryPick(event.target.files, (path) => setTargetForm(prev => ({ ...prev, path })));
              event.currentTarget.value = '';
            }}
          />
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
            <div className="md:col-span-2 flex gap-2">
              <input
                value={presetForm.targetSubPath}
                readOnly
                placeholder="选择目录"
                className="flex-1 bg-black/30 border border-border-dark rounded-xl px-4 py-3 text-xs text-white"
              />
              <button
                onClick={() => presetPickerRef.current?.click()}
                className="px-4 py-3 text-xs font-black uppercase tracking-widest border border-border-dark rounded-xl hover:border-primary/40"
              >
                选择
              </button>
            </div>
            <input
              value={presetForm.defaultPrefix}
              onChange={e => setPresetForm(prev => ({ ...prev, defaultPrefix: e.target.value }))}
              placeholder="Default Prefix"
              className="bg-black/30 border border-border-dark rounded-xl px-4 py-3 text-xs text-white"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input
              value={presetForm.icon}
              onChange={e => setPresetForm(prev => ({ ...prev, icon: e.target.value }))}
              placeholder="Icon"
              className="bg-black/30 border border-border-dark rounded-xl px-4 py-3 text-xs text-white"
            />
            <input
              value={presetForm.color}
              onChange={e => setPresetForm(prev => ({ ...prev, color: e.target.value }))}
              placeholder="Color"
              className="bg-black/30 border border-border-dark rounded-xl px-4 py-3 text-xs text-white"
            />
          </div>
          <button
            onClick={handleCreatePreset}
            className="px-5 py-3 text-xs font-black uppercase tracking-widest bg-primary text-slate-900 rounded-xl shadow-lg"
          >
            Create Preset
          </button>
          <input
            ref={presetPickerRef}
            type="file"
            className="hidden"
            onChange={(event) => {
              handleDirectoryPick(event.target.files, (path) => setPresetForm(prev => ({ ...prev, targetSubPath: path })));
              event.currentTarget.value = '';
            }}
          />
        </section>
      </div>
    </div>
  );
};
