import api from './api';

// ═══════════════════════════════════════════
// Skill Logs API (Ngữ pháp, Phát âm, Dịch, Viết, Trắc nghiệm)
// ═══════════════════════════════════════════
export const skillLogsApi = {
  save: (data) => api.post('/api/skill-logs', data),
  getAll: (params) => api.get('/api/skill-logs', { params }),
  getStats: () => api.get('/api/skill-logs/stats'),
};

// ═══════════════════════════════════════════
// Grammar Progress API (Tiến độ ngữ pháp HSK)
// ═══════════════════════════════════════════
export const grammarProgressApi = {
  save: (data) => api.post('/api/grammar-progress', data),
  getAll: () => api.get('/api/grammar-progress'),
};

// ═══════════════════════════════════════════
// Game Records API (Kỷ lục Game Arcade)
// ═══════════════════════════════════════════
export const gameRecordsApi = {
  save: (data) => api.post('/api/game-records', data),
  getAll: (params) => api.get('/api/game-records', { params }),
  getBest: (gameType) => api.get('/api/game-records/best', { params: { gameType } }),
};

// ═══════════════════════════════════════════
// Weak Words API (Ngân hàng từ vựng yếu)
// ═══════════════════════════════════════════
export const weakWordsApi = {
  save: (data) => api.post('/api/weak-words', data),
  getAll: () => api.get('/api/weak-words'),
  remove: (id) => api.delete(`/api/weak-words/${id}`),
};
