import { request } from './api';

export interface HistorySummary {
  id: string;
  timestamp: string;
  action: string;
  fileCount: number;
  status: string;
}

export interface HistoryListResponse {
  items: HistorySummary[];
  page: number;
  pageSize: number;
  total: number;
}

export const historyService = {
  listHistories: (page = 1, pageSize = 20, action?: string) => {
    const params = new URLSearchParams({
      page: String(page),
      pageSize: String(pageSize),
    });
    if (action) params.set('action', action);
    return request<HistoryListResponse>(`/history?${params.toString()}`);
  },

  undoHistory: (id: string) =>
    request<void>(`/history/${id}/undo`, {
      method: 'POST',
    }),
};
