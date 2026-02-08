import React, { useEffect, useState } from 'react';
import { historyService } from '../../services/historyService';
import type { HistoryListResponse } from '../../services/historyService';

export const HistoryPage: React.FC = () => {
  const [history, setHistory] = useState<HistoryListResponse['items']>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadHistory = async () => {
      setIsLoading(true);
      try {
          const data = await historyService.listHistories();
          setHistory(data.items);
      } catch (error) {
          console.error(error);
      } finally {
          setIsLoading(false);
      }
  };

  useEffect(() => {
      void loadHistory();
  }, []);

  return (
    <div className="flex-1 h-full overflow-y-auto bg-[var(--color-bg-page)] p-8 animate-in fade-in duration-500">
      <div className="px-10 py-8 border-b border-border flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-text-primary">Task History</h2>
          <p className="text-xs text-text-secondary">View logs of past file operations.</p>
        </div>
        <button
          onClick={() => void loadHistory()}
          className="px-4 py-2 text-xs font-bold uppercase tracking-widest bg-white border border-border rounded-xl hover:border-primary/40 text-text-secondary hover:text-primary transition-colors shadow-sm"
        >
          Refresh
        </button>
      </div>

      <div className="p-10 space-y-4">
          {isLoading && <div className="text-text-secondary">Loading history...</div>}

          {history.map(item => (
              <div key={item.id} className="flex items-center gap-4 bg-white border border-border rounded-2xl px-6 py-4 shadow-sm hover:shadow-md transition-all">
                  <div className={`size-12 rounded-xl flex items-center justify-center ${item.status === 'SUCCESS' ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
                      <span className="material-symbols-outlined filled">{item.status === 'SUCCESS' ? 'check_circle' : 'error'}</span>
                  </div>
                  <div className="flex-1">
                      <h4 className="text-sm font-bold text-text-primary">{item.action}</h4>
                      <p className="text-xs text-text-secondary font-mono">{new Date(item.timestamp).toLocaleString()} · {item.fileCount} items</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${item.status === 'SUCCESS' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                      {item.status}
                  </span>
              </div>
          ))}

          {history.length === 0 && !isLoading && (
              <div className="text-center py-20 text-text-muted">
                  <span className="material-symbols-outlined text-4xl mb-4 opacity-50">history</span>
                  <p>No history records found.</p>
              </div>
          )}
      </div>
    </div>
  );
};
