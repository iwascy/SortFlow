import React from 'react';
import { useAppStore } from '../../store/useAppStore';
import { StatusIndicator } from '../../components/StatusIndicator';
import type { PreviewStatus } from '../../types';

export const PreviewList: React.FC = () => {
    const { previewOps, isPreviewLoading } = useAppStore();

    if (isPreviewLoading) return <div className="p-4 text-center text-gray-500">Calculating preview...</div>;

    if (previewOps.length === 0) return <div className="p-4 text-center text-gray-400">No preview available</div>;

    return (
        <div className="mt-4 border border-border-dark rounded-xl overflow-hidden bg-surface-dark/30">
            <table className="w-full text-xs text-left">
                <thead className="bg-background-dark/50 border-b border-border-dark">
                    <tr>
                        <th className="p-3 font-black text-text-secondary uppercase tracking-widest">Original</th>
                        <th className="p-3 font-black text-text-secondary uppercase tracking-widest">→</th>
                        <th className="p-3 font-black text-text-secondary uppercase tracking-widest">New Name</th>
                        <th className="p-3 font-black text-text-secondary uppercase tracking-widest">Status</th>
                    </tr>
                </thead>
                <tbody>
                    {previewOps.map(op => (
                        <tr key={op.fileId} className="border-b border-border-dark last:border-0 hover:bg-surface-dark/50 transition-colors">
                            <td className="p-3 truncate max-w-[150px] text-white font-medium">{op.originalName}</td>
                            <td className="p-3 text-primary">
                                <span className="material-symbols-outlined text-sm">trending_flat</span>
                            </td>
                            <td className="p-3 font-black text-primary truncate max-w-[150px]">{op.newName}</td>
                            <td className="p-3">
                                <StatusIndicator status={op.status as PreviewStatus} showLabel={false} />
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};
