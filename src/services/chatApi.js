import api from './api';

export const chatApi = {
  // Quota & Tokens
  getQuota: () => api.get('/api/chat/quota'),
  refillQuota: () => api.post('/api/chat/refill-quota'),

  // Multi-Sessions
  getSessions: () => api.get('/api/chat/sessions'),
  createSession: (data) => api.post('/api/chat/sessions', data || {}),
  updateSession: (sessionId, data) => api.patch(`/api/chat/sessions/${sessionId}`, data),
  deleteSession: (sessionId) => api.delete(`/api/chat/sessions/${sessionId}`),
  getSessionMessages: (sessionId) => api.get(`/api/chat/sessions/${sessionId}/messages`),

  // Messaging
  sendMessage: (message, sessionId, persona, deckId) =>
    api.post('/api/chat', { message, sessionId, persona, deckId }),

  // Backward compatibility
  getHistory: () => api.get('/api/chat'),
  clearHistory: () => api.delete('/api/chat'),
};
