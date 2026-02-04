import React, { useEffect } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { useDebounce } from '../../hooks/useDebounce';
import { previewService } from '../../services/previewService';
import { TokenSelector } from './TokenSelector';
import { PreviewList } from './PreviewList';
import { getTargetDir } from '../../utils/preview';

export const PatternMixer: React.FC = () => {
  const {
    mixerConfig,
    updateMixerConfig,
    selectedIds,
    setPreviewOps,
    setIsPreviewLoading,
    files,
    presets,
    targetRoots
  } = useAppStore();

  const debouncedConfig = useDebounce(mixerConfig, 500);

  useEffect(() => {
    // Only calculate preview if files are selected
    if (selectedIds.size === 0) {
        setPreviewOps([]);
        setIsPreviewLoading(false);
        return;
    }

    const fetchPreview = async () => {
        setIsPreviewLoading(true);
        try {
            const selectedFiles = files.filter(file => selectedIds.has(file.id));
            const activeTargetId = mixerConfig.targetRootId || targetRoots[0]?.id;
            const activePresetId = mixerConfig.presetId || presets[0]?.id;
            const activeTarget = targetRoots.find(t => t.id === activeTargetId) || targetRoots[0];
            const activePreset = presets.find(p => p.id === activePresetId) || presets[0];
            if (!activeTarget || !activePreset) {
              setPreviewOps([]);
              return;
            }

            const dateStr = new Date().toISOString().split('T')[0];
            const rules = {
              prefix: debouncedConfig.renamePattern === 'DATE'
                ? `${dateStr}_`
                : debouncedConfig.renamePattern === 'PREFIX'
                  ? debouncedConfig.customPrefix || ''
                  : '',
              suffix: '',
              useOriginal: debouncedConfig.renamePattern === 'RAW_NAME'
            };

            const targetPath = getTargetDir(activePreset, activeTarget);
            const ops = await previewService.calculatePreview(selectedFiles, rules, targetPath);
            setPreviewOps(ops);
        } catch (error) {
            console.error(error);
        } finally {
            setIsPreviewLoading(false);
        }
    };

    fetchPreview();
  }, [debouncedConfig, selectedIds, setPreviewOps, setIsPreviewLoading, files, mixerConfig, presets, targetRoots]);

  return (
    <div className="p-4 border rounded bg-white">
      <h3 className="text-lg font-bold mb-4">Pattern Mixer</h3>

      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">Rename Pattern</label>
        <select
            value={mixerConfig.renamePattern}
            onChange={(e) => updateMixerConfig({ renamePattern: e.target.value as any })}
            className="w-full border rounded p-2"
        >
            <option value="PREFIX">Add Prefix</option>
            <option value="DATE">Date Based</option>
            <option value="RAW_NAME">Original Name</option>
        </select>
      </div>

      {mixerConfig.renamePattern === 'PREFIX' && (
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Custom Prefix</label>
            <input
                type="text"
                value={mixerConfig.customPrefix}
                onChange={(e) => updateMixerConfig({ customPrefix: e.target.value })}
                className="w-full border rounded p-2"
            />
          </div>
      )}

      {/* Token Selector */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">Tokens</label>
        <TokenSelector />
      </div>

      <PreviewList />
    </div>
  );
};
