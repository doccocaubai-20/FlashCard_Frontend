import api from './api';

export const dictionaryHistoryApi = {
  getHistory: () => api.get('/api/dictionary-history'),
  addHistory: (data) => api.post('/api/dictionary-history', data),
  clearHistory: () => api.delete('/api/dictionary-history'),
  explain: (data) => api.post('/api/dictionary-history/explain', data),
};
