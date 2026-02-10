import React from 'react';
import { tokenize } from '../../utils/tokenizer';
import { useAppStore } from '../../store/useAppStore';

export const TokenSelector: React.FC = () => {
    const { mixerConfig, updateMixerConfig, files, selectedIds } = useAppStore();

    // For demo, just tokenize the first selected file
    const firstFileId = Array.from(selectedIds)[0];
    const firstFile = files.find(f => f.id === firstFileId);

    const tokens = firstFile ? tokenize(firstFile.name) : [];

    return (
        <div className="flex flex-wrap gap-2">
            {tokens.map((token, index) => (
                <button
                    key={index}
                    onClick={() => {
                        const newTokens = [...mixerConfig.tokens, token];
                        updateMixerConfig({ tokens: newTokens });
                    }}
                    className="px-2 py-1 bg-gray-100 border rounded hover:bg-gray-200 text-sm"
                >
                    {token}
                </button>
            ))}
            {tokens.length === 0 && <span className="text-gray-400 text-sm">Select a file to see tokens</span>}
        </div>
    );
};
