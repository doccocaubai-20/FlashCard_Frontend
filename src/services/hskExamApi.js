import api from './api';

export const hskExamApi = {
  // 1. Get 6 levels with counts
  getLevels: async () => {
    try {
      const res = await api.get('/api/hsk-exams/levels');
      return res.data;
    } catch (e) {
      console.warn('API getLevels failed, using fallback:', e);
      return [
        { level: 1, count: 9 },
        { level: 2, count: 7 },
        { level: 3, count: 16 },
        { level: 4, count: 6 },
        { level: 5, count: 19 },
        { level: 6, count: 20 },
      ];
    }
  },

  // 2. Get tests by level (1 to 6)
  getExamsByLevel: async (level) => {
    const res = await api.get(`/api/hsk-exams/levels/${level}`);
    return res.data;
  },

  // 3. Get full details of an exam
  getExamDetail: async (testId) => {
    const res = await api.get(`/api/hsk-exams/detail/${testId}`);
    return res.data;
  },

  // 4. Grade user exam answers
  gradeExam: async (testId, answers) => {
    const res = await api.post(`/api/hsk-exams/${testId}/grade`, { answers });
    return res.data;
  },

  // 5. Submit result and save to DB
  submitResult: (data) => api.post('/api/hsk-exams/submit', data),

  // 6. Get user's exam results history
  getResults: () => api.get('/api/hsk-exams/results'),

  // Backward compatibility
  getExams: () => api.get('/api/hsk-exams'),
};
