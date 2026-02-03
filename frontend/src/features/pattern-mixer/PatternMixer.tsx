import React, { useEffect } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { useDebounce } from '../../hooks/useDebounce';
import { previewService } from '../../services/previewService';
import { TokenSelector } from './TokenSelector';
import { PreviewList } from './PreviewList';

export const PatternMixer: React.FC = () => {
  const { mixerConfig, updateMixerConfig, selectedIds, setPreviewOps, setIsPreviewLoading } = useAppStore();

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
            const ops = await previewService.calculatePreview(Array.from(selectedIds), debouncedConfig);
            setPreviewOps(ops);
        } catch (error) {
            console.error(error);
        } finally {
            setIsPreviewLoading(false);
        }
    };

    fetchPreview();
  }, [debouncedConfig, selectedIds, setPreviewOps, setIsPreviewLoading]);

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
