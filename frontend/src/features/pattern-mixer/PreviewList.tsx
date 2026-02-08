import React from 'react';
import type { PreviewOperation } from '../../types';

interface PreviewListProps {
  ops: PreviewOperation[];
}

export const PreviewList: React.FC<PreviewListProps> = ({ ops }) => {
  if (ops.length === 0) return null;

  return (
    <div className="animate-in fade-in slide-in-from-top duration-500">
        <h4 className="text-[10px] uppercase font-black tracking-widest text-text-secondary mb-2">Renaming Preview</h4>
        <div className="mt-4 border border-border rounded-xl overflow-hidden bg-white shadow-sm">
            <table className="w-full text-left text-xs">
                <thead className="bg-bg-muted border-b border-border">
                    <tr>
                        <th className="px-4 py-3 font-bold text-text-secondary w-[45%]">Original Name</th>
                        <th className="px-4 py-3 font-bold text-text-secondary w-[10%] text-center">→</th>
                        <th className="px-4 py-3 font-bold text-primary w-[45%]">New Name</th>
                    </tr>
                </thead>
                <tbody>
                    {ops.map(op => (
                        <tr key={op.fileId} className="border-b border-border last:border-0 hover:bg-bg-muted transition-colors">
                            <td className="px-4 py-3 font-mono text-text-secondary truncate max-w-[200px]" title={op.originalName}>
                                {op.originalName}
                            </td>
                            <td className="px-4 py-3 text-center text-text-muted">
                                <span className="material-symbols-outlined text-[16px]">arrow_right_alt</span>
                            </td>
                            <td className="px-4 py-3 font-mono text-text-primary font-medium truncate max-w-[200px]" title={op.newName}>
                                {op.newName}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    </div>
  );
};
