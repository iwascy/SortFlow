import React, { useEffect, useState } from 'react';
import { historyService } from '../../services/historyService';
import type { HistorySummary } from '../../services/historyService';

const formatTimestamp = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
};

export const HistoryPage: React.FC = () => {
  const [items, setItems] = useState<HistorySummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadHistory = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await historyService.listHistories(1, 50);
      setItems(response.items || []);
    } catch (err) {
      console.error(err);
      setError('Failed to load history.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadHistory();
  }, []);

  return (
    <div className="flex h-full w-full flex-col overflow-y-auto bg-background-dark text-white">
      <div className="px-10 py-8 border-b border-border-dark flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black tracking-tight">History Log</h2>
          <p className="text-xs text-text-secondary">Track completed operations and status.</p>
        </div>
        <button
          onClick={loadHistory}
          className="px-4 py-2 text-xs font-black uppercase tracking-widest bg-surface-dark/60 border border-border-dark rounded-xl hover:border-primary/40"
        >
          Refresh
        </button>
      </div>

      <div className="p-10 space-y-4">
        {error && (
          <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-200 text-sm">
            {error}
          </div>
        )}
        {loading && <div className="text-xs text-text-secondary">Loading...</div>}

        {items.length === 0 && !loading ? (
          <div className="text-center text-text-secondary py-20">
            <span className="material-symbols-outlined text-6xl opacity-20 mb-4 block">history</span>
            <p className="text-lg font-medium">History Log is empty.</p>
            <p className="text-sm opacity-60">Operations you perform will appear here.</p>
          </div>
        ) : (
          <div className="grid gap-3">
            {items.map(item => (
              <div key={item.id} className="flex items-center gap-4 bg-surface-dark/60 border border-border-dark rounded-2xl px-4 py-4">
                <span className="material-symbols-outlined text-primary filled">
                  {item.status === 'completed' ? 'done_all' : item.status === 'failed' ? 'error' : 'history'}
                </span>
                <div className="flex-1">
                  <div className="text-xs font-black uppercase tracking-widest">{item.action || 'operation'}</div>
                  <div className="text-[10px] text-text-secondary font-mono">
                    {formatTimestamp(item.timestamp)} · {item.fileCount} files
                  </div>
                </div>
                <div className="text-[10px] font-black uppercase tracking-widest text-text-secondary">
                  {item.status}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
