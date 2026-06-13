import api from './api';

export const chatApi = {
  getHistory: () => api.get('/api/chat'),
  sendMessage: (message) => api.post('/api/chat', { message }),
  clearHistory: () => api.delete('/api/chat'),
};
