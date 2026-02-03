import React from 'react';
import { useAppStore } from '../../store/useAppStore';
import { StatusIndicator } from '../../components/StatusIndicator';

export const PreviewList: React.FC = () => {
    const { previewOps, isPreviewLoading } = useAppStore();

    if (isPreviewLoading) return <div className="p-4 text-center text-gray-500">Calculating preview...</div>;

    if (previewOps.length === 0) return <div className="p-4 text-center text-gray-400">No preview available</div>;

    return (
        <div className="mt-4 border rounded overflow-hidden">
            <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 border-b">
                    <tr>
                        <th className="p-2">Original</th>
                        <th className="p-2">Arrow</th>
                        <th className="p-2">New Name</th>
                        <th className="p-2">Status</th>
                    </tr>
                </thead>
                <tbody>
                    {previewOps.map(op => (
                        <tr key={op.fileId} className="border-b last:border-0 hover:bg-gray-50">
                            <td className="p-2 truncate max-w-[150px]">{op.originalName}</td>
                            <td className="p-2 text-gray-400">→</td>
                            <td className="p-2 font-medium truncate max-w-[150px]">{op.newName}</td>
                            <td className="p-2">
                                <StatusIndicator status={op.status} showLabel={false} />
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};
