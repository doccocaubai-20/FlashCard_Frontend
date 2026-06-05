import api from './api';

export const dictionaryHistoryApi = {
  getHistory: () => api.get('/api/dictionary-history'),
  getTodayCount: () => api.get('/api/dictionary-history/today-count'),
  addHistory: (data) => api.post('/api/dictionary-history', data),
  clearHistory: () => api.delete('/api/dictionary-history'),
  explain: (data) => api.post('/api/dictionary-history/explain', data),
};
